import { supabaseAdmin } from '@/lib/supabase-server';
import { sendEmail } from '@/lib/email/template-service';
import { sendTemplatedSMS } from '@/lib/sms/service';
import { processTemplate } from './template-processor';
import { getPreviewData } from './preview-data';
import { evaluateRule } from './rule-evaluator';
import { resolveRecipients } from './recipient-resolver';
import type { NotificationRule, NotificationTemplate } from '@/types/notifications';

interface NotificationContext {
  event: string;
  vehicleId?: string;
  transferId?: string;
  userId?: string;
  additionalData?: Record<string, any>;
}

interface NotificationResult {
  ruleId: string;
  ruleName: string;
  sent: {
    email: string[];
    sms: string[];
  };
  failed: {
    email: Array<{ recipient: string; error: string }>;
    sms: Array<{ recipient: string; error: string }>;
  };
  subject?: string; // Store email subject for logging
}

/**
 * Send notifications based on rules for a given event
 */
export async function sendNotificationsByRules(
  context: NotificationContext
): Promise<NotificationResult[]> {
  const results: NotificationResult[] = [];

  try {
    // Fetch active rules for this event
    const { data: rules, error: rulesError } = await supabaseAdmin
      .from('notification_rules')
      .select('*')
      .eq('event', context.event)
      .eq('active', true)
      .order('priority', { ascending: false });

    if (rulesError || !rules) {
      return results;
    }

    // Process each rule
    for (const rule of rules) {
      const result = await processNotificationRule(rule, context);
      if (result) {
        results.push(result);
      }
    }

    return results;
  } catch (error) {
    return results;
  }
}

/**
 * Process a single notification rule
 */
async function processNotificationRule(
  rule: NotificationRule,
  context: NotificationContext
): Promise<NotificationResult | null> {
  const result: NotificationResult = {
    ruleId: rule.id,
    ruleName: rule.name,
    sent: { email: [], sms: [] },
    failed: { email: [], sms: [] }
  };

  try {
    // Build evaluation context
    const evalContext = await buildEvaluationContext(context);

    // Evaluate rule conditions
    const conditionsMet = await evaluateRule(rule, evalContext);
    if (!conditionsMet) {
      return null;
    }

    // Resolve recipients
    const recipients = await resolveRecipients(rule.recipients, evalContext);
    
    if (recipients.emails.length === 0 && recipients.phones.length === 0) {
      return null;
    }

    // Get template data
    const templateData = await getPreviewData(supabaseAdmin, {
      useRealData: true,
      vehicleId: context.vehicleId,
      transferId: context.transferId,
      userId: context.userId
    });

    // Add any additional data
    if (context.additionalData) {
      Object.assign(templateData, context.additionalData);
    }
    

    // Send via configured channels
    if (rule.channels.email?.enabled && rule.channels.email.templateId && recipients.emails.length > 0) {
      await sendEmailNotifications(
        rule.channels.email.templateId,
        recipients.emails,
        templateData,
        result
      );
    }

    if (rule.channels.sms?.enabled && rule.channels.sms.templateId && recipients.phones.length > 0) {
      await sendSMSNotifications(
        rule.channels.sms.templateId,
        recipients.phones,
        templateData,
        result
      );
    }

    // Log the notification
    await logNotification(rule, context, result);

    return result;
  } catch (error) {
    return null;
  }
}

/**
 * Build evaluation context from notification context
 */
async function buildEvaluationContext(context: NotificationContext): Promise<Record<string, any>> {
  const evalContext: any = {
    event: context.event,
    ...context.additionalData
  };

  // Add vehicle data if available
  if (context.vehicleId) {
    const { data: vehicle } = await supabaseAdmin
      .from('vehicles')
      .select(`
        *,
        location:dealership_locations!location_id(*)
      `)
      .eq('id', context.vehicleId)
      .single();

    if (vehicle) {
      evalContext.vehicle = vehicle;
    }
  }

  // Add transfer data if available
  if (context.transferId) {
    const { data: transfer } = await supabaseAdmin
      .from('transfers')
      .select(`
        *,
        vehicle:vehicles!transfers_vehicle_id_fkey(*),
        from_location:dealership_locations!from_location_id(*),
        to_location:dealership_locations!to_location_id(*),
        requested_by:users!requested_by_id(*),
        approved_by:users!approved_by_id(*)
      `)
      .eq('id', context.transferId)
      .single();

    if (transfer) {
      evalContext.transfer = transfer;
    }
  }

  // Add user data if available
  if (context.userId) {
    const { data: user } = await supabaseAdmin
      .from('users')
      .select(`
        *,
        location:dealership_locations!location_id(*)
      `)
      .eq('id', context.userId)
      .single();

    if (user) {
      evalContext.user = user;
    }
  }

  return evalContext;
}

/**
 * Send email notifications
 */
async function sendEmailNotifications(
  templateId: string,
  recipients: string[],
  data: any,
  result: NotificationResult
): Promise<void> {
  // Fetch the template
  const { data: template, error } = await supabaseAdmin
    .from('notification_templates')
    .select('*')
    .eq('id', templateId)
    .eq('active', true)
    .single();

  if (error || !template || !template.channels.email?.enabled) {
    return;
  }

  // Process template
  const subject = processTemplate(template.channels.email.subject, data);
  const bodyHtml = processTemplate(template.channels.email.bodyHtml, data);
  const bodyText = processTemplate(template.channels.email.bodyText, data);

  // Store subject in result for logging
  result.subject = subject;

  // Send to each recipient
  for (const recipient of recipients) {
    try {
      await sendEmail({
        to: recipient,
        subject,
        html: bodyHtml,
        text: bodyText
      });
      result.sent.email.push(recipient);
    } catch (error: any) {
      result.failed.email.push({
        recipient,
        error: error.message || 'Failed to send email'
      });
    }
  }
}

/**
 * Send SMS notifications
 */
async function sendSMSNotifications(
  templateId: string,
  recipients: string[],
  data: any,
  result: NotificationResult
): Promise<void> {
  // Fetch the template
  const { data: template, error } = await supabaseAdmin
    .from('notification_templates')
    .select('*')
    .eq('id', templateId)
    .eq('active', true)
    .single();

  if (error || !template || !template.channels.sms?.enabled) {
    return;
  }

  // Send via SMS service
  const smsResults = await sendTemplatedSMS(
    template.channels.sms.message,
    recipients,
    data
  );

  // Process results
  for (const smsResult of smsResults) {
    if (smsResult.success && smsResult.to) {
      result.sent.sms.push(smsResult.to);
    } else if (smsResult.to) {
      result.failed.sms.push({
        recipient: smsResult.to,
        error: smsResult.error || 'Failed to send SMS'
      });
    }
  }
}

/**
 * Log notification activity
 */
async function logNotification(
  rule: NotificationRule,
  context: NotificationContext,
  result: NotificationResult
): Promise<void> {
  try {
    const logs = [];

    // Log email notifications
    for (const email of result.sent.email) {
      logs.push({
        rule_id: rule.id,
        template_id: rule.channels.email?.templateId,
        event: context.event,
        channel: 'email',
        status: 'sent',
        recipients: [email],
        subject: result.subject,
        vehicle_id: context.vehicleId,
        transfer_id: context.transferId,
        user_id: context.userId,
        sent_at: new Date().toISOString(),
        metadata: {
          recipient: email,
          vehicleId: context.vehicleId,
          transferId: context.transferId
        }
      });
    }

    // Log SMS notifications
    for (const phone of result.sent.sms) {
      logs.push({
        rule_id: rule.id,
        template_id: rule.channels.sms?.templateId,
        event: context.event,
        channel: 'sms',
        status: 'sent',
        recipients: [phone],
        vehicle_id: context.vehicleId,
        transfer_id: context.transferId,
        user_id: context.userId,
        sent_at: new Date().toISOString(),
        metadata: {
          recipient: phone,
          vehicleId: context.vehicleId,
          transferId: context.transferId
        }
      });
    }

    // Log failures
    for (const failure of result.failed.email) {
      logs.push({
        rule_id: rule.id,
        template_id: rule.channels.email?.templateId,
        event: context.event,
        channel: 'email',
        status: 'failed',
        error_message: failure.error,
        recipients: [failure.recipient],
        vehicle_id: context.vehicleId,
        transfer_id: context.transferId,
        user_id: context.userId,
        failed_at: new Date().toISOString(),
        metadata: {
          recipient: failure.recipient,
          vehicleId: context.vehicleId,
          transferId: context.transferId
        }
      });
    }

    for (const failure of result.failed.sms) {
      logs.push({
        rule_id: rule.id,
        template_id: rule.channels.sms?.templateId,
        event: context.event,
        channel: 'sms',
        status: 'failed',
        error_message: failure.error,
        recipients: [failure.recipient],
        vehicle_id: context.vehicleId,
        transfer_id: context.transferId,
        user_id: context.userId,
        failed_at: new Date().toISOString(),
        metadata: {
          recipient: failure.recipient,
          vehicleId: context.vehicleId,
          transferId: context.transferId
        }
      });
    }

    if (logs.length > 0) {
      await supabaseAdmin.from('notification_activity').insert(logs);
    }
  } catch (error) {
  }
}