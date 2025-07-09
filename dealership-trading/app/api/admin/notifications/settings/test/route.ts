import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-server';
import { sendEmail } from '@/lib/email/template-service';

const SINGLETON_ID = '00000000-0000-0000-0000-000000000001';

// POST send test email
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin permission
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('role, email')
      .eq('id', session.user.id)
      .single();

    if (user?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { test_email } = await request.json();
    
    if (!test_email) {
      return NextResponse.json({ error: 'Test email address is required' }, { status: 400 });
    }

    // Get current email settings
    const { data: settings } = await supabaseAdmin
      .from('email_config')
      .select('*')
      .eq('id', SINGLETON_ID)
      .single();

    if (!settings) {
      return NextResponse.json({ error: 'Email settings not configured' }, { status: 400 });
    }

    // Prepare test email content
    const subject = `Test Email from ${settings.from_name || 'Round Table'}`;
    
    let htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Test Email</h2>
        <p>This is a test email from your Round Table notification system.</p>
        
        <h3>Current Email Settings:</h3>
        <ul>
          <li><strong>From Name:</strong> ${settings.from_name}</li>
          <li><strong>From Email:</strong> ${settings.from_email}</li>
          <li><strong>Reply-To:</strong> ${settings.reply_to_email || 'Not set'}</li>
          <li><strong>BCC:</strong> ${settings.bcc_email || 'Not set'}</li>
          <li><strong>Test Mode:</strong> ${settings.test_mode_enabled ? 'Enabled' : 'Disabled'}</li>
          <li><strong>Tracking:</strong> ${settings.tracking_enabled ? 'Enabled' : 'Disabled'}</li>
        </ul>
        
        <p style="color: #666; font-size: 14px; margin-top: 20px;">
          Sent by ${user.email} on ${new Date().toLocaleString()}
        </p>
    `;

    // Add footer if configured
    if (settings.footer_html) {
      htmlContent += `
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
        ${settings.footer_html}
      `;
    }

    htmlContent += '</div>';

    const textContent = `Test Email from ${settings.from_name || 'Round Table'}

This is a test email from your Round Table notification system.

Current Email Settings:
- From Name: ${settings.from_name}
- From Email: ${settings.from_email}
- Reply-To: ${settings.reply_to_email || 'Not set'}
- BCC: ${settings.bcc_email || 'Not set'}
- Test Mode: ${settings.test_mode_enabled ? 'Enabled' : 'Disabled'}
- Tracking: ${settings.tracking_enabled ? 'Enabled' : 'Disabled'}

${settings.footer_text || ''}

Sent by ${user.email} on ${new Date().toLocaleString()}`;

    // Build recipient list
    const recipients = [test_email];
    if (settings.bcc_email && settings.bcc_email !== test_email) {
      recipients.push(settings.bcc_email);
    }

    // Send the test email using current settings
    await sendEmail({
      to: recipients,
      subject,
      html: htmlContent,
      text: textContent,
      from: `${settings.from_name} <${settings.from_email}>`
    });

    // Log the test
    await supabaseAdmin
      .from('notification_activity')
      .insert({
        event: 'test_email',
        channel: 'email',
        status: 'sent',
        recipients: [test_email],
        subject,
        metadata: {
          sent_by: user.email,
          settings_snapshot: {
            from_name: settings.from_name,
            from_email: settings.from_email,
            reply_to_email: settings.reply_to_email,
            test_mode_enabled: settings.test_mode_enabled
          }
        }
      });

    return NextResponse.json({ 
      success: true, 
      message: `Test email sent to ${test_email}`
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to send test email' 
    }, { status: 500 });
  }
}