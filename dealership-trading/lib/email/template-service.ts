import { Resend } from 'resend';
import { supabaseAdmin } from '@/lib/supabase-server';
import { processTemplate } from '@/lib/notifications/template-processor';
import { getPreviewData } from '@/lib/notifications/preview-data';
import type { Vehicle, DealershipLocation } from '@/types/vehicle';
import type { Transfer } from '@/types/transfer';
import type { NotificationTemplate } from '@/types/notifications';

// Initialize Resend only if API key is available
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Cache for email config
let emailConfigCache: any = null;
let emailConfigCacheTime: number = 0;
const EMAIL_CONFIG_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

/**
 * Get cached email config or fetch from database
 */
async function getEmailConfig() {
  const now = Date.now();
  
  // Return cached config if still valid
  if (emailConfigCache && (now - emailConfigCacheTime) < EMAIL_CONFIG_CACHE_TTL) {
    return emailConfigCache;
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('email_config')
      .select('*')
      .eq('id', '00000000-0000-0000-0000-000000000001')
      .single();

    if (error) {
      return null;
    }

    // Update cache
    emailConfigCache = data;
    emailConfigCacheTime = now;
    
    return data;
  } catch (error) {
    return null;
  }
}

/**
 * Send an email using Resend with global settings
 */
export async function sendEmail(options: SendEmailOptions) {
  if (!resend) {
    console.warn('Email service not configured - RESEND_API_KEY is missing');
    return;
  }

  const { to, subject, html, text, from } = options;
  
  // Get global email config
  const config = await getEmailConfig();
  
  // Apply test mode if enabled
  let recipients = Array.isArray(to) ? to : [to];
  if (config?.test_mode_enabled && config.test_email_address) {
    recipients = [config.test_email_address];
  }
  
  // Add BCC if configured
  if (config?.bcc_email && !recipients.includes(config.bcc_email)) {
    recipients.push(config.bcc_email);
  }

  // Build from address
  const fromAddress = from || (config ? `${config.from_name} <${config.from_email}>` : 
    process.env.RESEND_FROM_EMAIL || 'Round Table <notifications@roundtable.app>');

  // Add footer if configured
  let finalHtml = html;
  let finalText = text || '';
  
  if (config?.footer_html) {
    finalHtml = `${html}<hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">${config.footer_html}`;
  }
  
  if (config?.footer_text) {
    finalText = `${finalText}\n\n---\n${config.footer_text}`;
  }

  try {
    const emailData: any = {
      from: fromAddress,
      to: recipients,
      subject,
      html: finalHtml,
      text: finalText
    };
    
    // Add reply-to if configured
    if (config?.reply_to_email) {
      emailData.reply_to = config.reply_to_email;
    }
    
    // Add custom headers if configured
    if (config?.custom_headers && Object.keys(config.custom_headers).length > 0) {
      emailData.headers = config.custom_headers;
    }
    
    const result = await resend.emails.send(emailData);

    return result;
  } catch (error) {
    throw error;
  }
}

/**
 * Get email template from database
 */
async function getEmailTemplate(templateName: string): Promise<NotificationTemplate | null> {
    
  const { data, error } = await supabaseAdmin
    .from('notification_templates')
    .select('*')
    .eq('name', templateName)
    .eq('active', true)
    .single();

  if (error) {
    return null;
  }

  return data;
}


/**
 * Get recipients based on roles and location
 */
async function getRecipients(
  locationId: string,
  roles: string[] = ['manager', 'admin']
): Promise<string[]> {
    
  const { data: users, error } = await supabaseAdmin
    .from('users')
    .select('email')
    .eq('location_id', locationId)
    .in('role', roles)
    .eq('active', true);

  if (error) {
    return [];
  }

  return (users || []).map(u => u.email).filter(Boolean);
}

/**
 * Send transfer notification email using the new template system
 */
export async function sendTransferNotificationEmail(
  notificationType: string,
  transfer: Transfer & {
    vehicle?: Vehicle;
    from_location?: DealershipLocation;
    to_location?: DealershipLocation;
    requested_by?: { name: string; email: string };
    approved_by?: { name: string; email: string };
  },
  additionalData?: Record<string, any>
) {
  if (!resend) {
    console.warn('Email service not configured - RESEND_API_KEY is missing');
    return;
  }

  try {
    // Try to get template from new system first
    const template = await getEmailTemplate(notificationType);
    
    if (!template || !template.channels.email?.enabled) {
      return;
    }

    // Prepare template data
        const templateData = await getPreviewData(supabaseAdmin, {
      useRealData: true,
      vehicleId: (transfer as any).vehicle_id || transfer.vehicle?._id,
      transferId: (transfer as any).id || transfer._id,
      userId: additionalData?.userId
    });

    // Add any additional data passed in
    if (additionalData) {
      Object.assign(templateData, additionalData);
    }

    // Process the template
    const subject = processTemplate(template.channels.email.subject, templateData);
    const bodyHtml = processTemplate(template.channels.email.bodyHtml, templateData);
    const bodyText = processTemplate(template.channels.email.bodyText, templateData);

    // Determine recipients based on notification type
    let recipients: string[] = [];
    const defaultRoles = ['manager', 'admin'];
    
    // For now, use default recipient logic until rules system is fully integrated
    // TODO: Use notification rules to determine recipients
    
    // Always notify managers and admins at both locations
    const fromLocationId = (transfer as any).from_location_id || transfer.from_location?._id;
    if (fromLocationId) {
      const fromRecipients = await getRecipients(fromLocationId, defaultRoles);
      recipients.push(...fromRecipients);
    }
    
    const toLocationId = (transfer as any).to_location_id || transfer.to_location?._id;
    if (toLocationId) {
      const toRecipients = await getRecipients(toLocationId, defaultRoles);
      recipients.push(...toRecipients);
    }
    
    // For approval notifications, also notify the requester
    if (notificationType === 'transfer_approved' && transfer.requested_by?.email) {
      recipients.push(transfer.requested_by.email);
    }

    // Remove duplicates
    recipients = [...new Set(recipients)];

    if (recipients.length === 0) {
      console.warn(`No recipients found for ${notificationType} notification`);
      return;
    }

    // Send the email
    const result = await sendEmail({
      to: recipients,
      subject,
      html: bodyHtml,
      text: bodyText
    });

    // Log the notification
    await supabaseAdmin
      .from('notification_activity')
      .insert({
        template_id: template.id,
        event: notificationType,
        channel: 'email',
        status: 'sent',
        recipients,
        transfer_id: (transfer as any).id || transfer._id,
        metadata: {
          recipients,
          transferId: (transfer as any).id || transfer._id
        }
      });

    return result;
  } catch (error) {
    
    // Log the failure
        await supabaseAdmin
      .from('notification_activity')
      .insert({
        event: notificationType,
        channel: 'email',
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        transfer_id: (transfer as any).id || transfer._id,
        metadata: {
          transferId: (transfer as any).id || transfer._id
        }
      });

    throw error;
  }
}