import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-server';
import { processTemplate } from '@/lib/notifications/template-processor';
import { getPreviewData } from '@/lib/notifications/preview-data';
import { sendEmail } from '@/lib/email/template-service';

// POST /api/admin/notification-templates/[id]/test - Send test notification
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      testEmail = session.user.email, 
      testPhone,
      useRealData = false, 
      vehicleId, 
      transferId 
    } = body;

        
    // Fetch the template
    const { data: template, error: templateError } = await supabaseAdmin
      .from('notification_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (templateError || !template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Get preview data
    const previewData = await getPreviewData(supabaseAdmin, {
      useRealData,
      vehicleId,
      transferId,
      userId: session.user.id
    });

    const results: any = {};

    // Send test email if email channel is enabled
    if (template.channels.email?.enabled && testEmail) {
      try {
        const subject = processTemplate(template.channels.email.subject, previewData);
        const bodyHtml = processTemplate(template.channels.email.bodyHtml, previewData);
        const bodyText = processTemplate(template.channels.email.bodyText, previewData);

        // Add test mode banner to email
        const testBanner = `
          <div style="background-color: #fbbf24; color: #000; padding: 10px; text-align: center; font-weight: bold;">
            TEST EMAIL - This is a test of the ${template.name} template
          </div>
        `;
        
        await sendEmail({
          to: testEmail,
          subject: `[TEST] ${subject}`,
          html: testBanner + bodyHtml,
          text: `[TEST EMAIL]\n\n${bodyText}`
        });

        results.email = {
          success: true,
          sentTo: testEmail,
          subject
        };
      } catch (emailError: any) {
        results.email = {
          success: false,
          error: emailError.message || 'Failed to send test email'
        };
      }
    }

    // Send test SMS if SMS channel is enabled (placeholder for now)
    if (template.channels.sms?.enabled && testPhone) {
      // TODO: Implement SMS sending when Twilio is integrated
      results.sms = {
        success: false,
        error: 'SMS sending not yet implemented'
      };
    }

    // Log the test
    await supabaseAdmin
      .from('notification_activity')
      .insert({
        template_id: id,
        event: 'test',
        recipient_id: session.user.id,
        channel: 'email',
        status: results.email?.success ? 'sent' : 'failed',
        error_message: results.email?.error,
        recipients: [testEmail],
        metadata: {
          test: true,
          sentTo: testEmail,
          previewData: useRealData ? { vehicleId, transferId } : 'sample'
        }
      });

    return NextResponse.json({
      success: true,
      results,
      template: {
        name: template.name,
        description: template.description
      }
    });
  } catch (error) {
    console.error('Error in POST /api/admin/notification-templates/[id]/test:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}