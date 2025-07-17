import twilio from 'twilio';
import { supabaseAdmin } from '@/lib/supabase-server';

// Initialize Twilio client only if credentials are available
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

interface SendSMSOptions {
  to: string | string[];
  body: string;
  userId?: string;
}

interface SMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  to?: string;
}

/**
 * Send an SMS message using Twilio
 */
export async function sendSMS(options: SendSMSOptions): Promise<SMSResponse[]> {
  const { to, body, userId } = options;
  
  if (!twilioClient || !twilioPhoneNumber) {
    console.warn('SMS service not configured - Twilio credentials missing');
    return [{ success: false, error: 'SMS service not configured' }];
  }

  // Ensure 'to' is an array
  const recipients = Array.isArray(to) ? to : [to];
  const results: SMSResponse[] = [];

  for (const recipient of recipients) {
    try {
      // Clean and validate phone number
      const cleanPhone = cleanPhoneNumber(recipient);
      if (!isValidPhoneNumber(cleanPhone)) {
        results.push({
          success: false,
          to: recipient,
          error: 'Invalid phone number format'
        });
        continue;
      }

      // Check if user has opted in (if userId provided)
      if (userId) {
        const hasOptedIn = await checkSMSOptIn(userId, cleanPhone);
        if (!hasOptedIn) {
          results.push({
            success: false,
            to: recipient,
            error: 'User has not opted in to SMS notifications'
          });
          continue;
        }
      }

      // Send SMS via Twilio
      const message = await twilioClient.messages.create({
        body: body,
        from: twilioPhoneNumber,
        to: cleanPhone
      });

      results.push({
        success: true,
        messageId: message.sid,
        to: cleanPhone
      });

      // Log successful send
      if (userId) {
        await logSMSActivity(userId, cleanPhone, 'sent', message.sid);
      }
    } catch (error: any) {
      results.push({
        success: false,
        to: recipient,
        error: error.message || 'Failed to send SMS'
      });
    }
  }

  return results;
}

/**
 * Clean and format a phone number
 */
export function cleanPhoneNumber(phone: string): string {
  // Remove all non-numeric characters
  let cleaned = phone.replace(/\D/g, '');
  
  // If it's a 10-digit US number, add +1
  if (cleaned.length === 10) {
    cleaned = '1' + cleaned;
  }
  
  // Ensure it starts with +
  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }
  
  return cleaned;
}

/**
 * Validate phone number format
 */
export function isValidPhoneNumber(phone: string): boolean {
  // Basic validation for E.164 format
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phone);
}

/**
 * Check if a user has opted in to SMS notifications
 */
async function checkSMSOptIn(userId: string, phone: string): Promise<boolean> {
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('sms_opt_in, phone')
    .eq('id', userId)
    .single();

  if (error || !user) {
    return false;
  }

  // Check if the phone number matches and opt-in is true
  return user.sms_opt_in === true && cleanPhoneNumber(user.phone) === phone;
}

/**
 * Log SMS activity (for future analytics)
 */
async function logSMSActivity(
  userId: string,
  phone: string,
  action: string,
  messageId?: string
): Promise<void> {
  try {
    await supabaseAdmin
      .from('notification_activity')
      .insert({
        recipient_id: userId,
        channel: 'sms',
        status: action === 'sent' ? 'sent' : 'failed',
        metadata: {
          phone,
          messageId,
          action
        }
      });
  } catch (error) {
  }
}

/**
 * Handle SMS opt-in
 */
export async function handleSMSOptIn(
  userId: string,
  phone: string,
  source: string = 'web',
  ipAddress?: string,
  userAgent?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const cleanedPhone = cleanPhoneNumber(phone);
    
    if (!isValidPhoneNumber(cleanedPhone)) {
      return { success: false, error: 'Invalid phone number format' };
    }

    // Update user record
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        phone: cleanedPhone,
        sms_opt_in: true,
        sms_opt_in_date: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      throw updateError;
    }

    // Log consent
    await supabaseAdmin
      .from('sms_consent_log')
      .insert({
        user_id: userId,
        phone: cleanedPhone,
        action: 'opt_in',
        source,
        ip_address: ipAddress,
        user_agent: userAgent
      });

    // Send confirmation SMS
    await sendSMS({
      to: cleanedPhone,
      body: 'Welcome to Round Table SMS notifications! Reply STOP to unsubscribe at any time.',
      userId
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to opt-in' };
  }
}

/**
 * Handle SMS opt-out
 */
export async function handleSMSOptOut(
  userId: string,
  source: string = 'web',
  ipAddress?: string,
  userAgent?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get user's phone number
    const { data: user, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('phone')
      .eq('id', userId)
      .single();

    if (fetchError || !user?.phone) {
      return { success: false, error: 'User phone number not found' };
    }

    // Update user record
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        sms_opt_in: false,
        sms_opt_out_date: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      throw updateError;
    }

    // Log consent
    await supabaseAdmin
      .from('sms_consent_log')
      .insert({
        user_id: userId,
        phone: user.phone,
        action: 'opt_out',
        source,
        ip_address: ipAddress,
        user_agent: userAgent
      });

    // Send confirmation SMS
    await sendSMS({
      to: user.phone,
      body: 'You have been unsubscribed from Round Table SMS notifications.',
      userId
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to opt-out' };
  }
}

/**
 * Send SMS notification using a template
 */
export async function sendTemplatedSMS(
  template: string,
  to: string | string[],
  data: Record<string, any>,
  userId?: string
): Promise<SMSResponse[]> {
  // Process template with data (using the same template processor)
  const { processTemplate } = await import('@/lib/notifications/template-processor');
  const processedMessage = processTemplate(template, data);

  // Ensure message doesn't exceed SMS limits
  const truncatedMessage = truncateSMS(processedMessage);

  return sendSMS({
    to,
    body: truncatedMessage,
    userId
  });
}

/**
 * Truncate SMS to fit within limits
 */
function truncateSMS(message: string, maxLength: number = 160): string {
  if (message.length <= maxLength) {
    return message;
  }
  
  // Truncate and add ellipsis
  return message.substring(0, maxLength - 3) + '...';
}