import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-server';
import { processTemplate } from '@/lib/notifications/template-processor';
import { getPreviewData } from '@/lib/notifications/preview-data';

// POST /api/admin/notification-templates/[id]/preview - Preview template with sample data
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
    const { useRealData = false, vehicleId, transferId } = body;

        
    // Fetch the template
    const { data: template, error: templateError } = await supabaseAdmin
      .from('notification_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (templateError || !template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Get preview data (either real or sample)
    const previewData = await getPreviewData(supabaseAdmin, {
      useRealData,
      vehicleId,
      transferId,
      userId: session.user.id
    });

    // Process templates for each channel
    const processedChannels: any = {};

    if (template.channels.email?.enabled) {
      processedChannels.email = {
        subject: processTemplate(template.channels.email.subject, previewData),
        bodyHtml: processTemplate(template.channels.email.bodyHtml, previewData),
        bodyText: processTemplate(template.channels.email.bodyText, previewData)
      };
    }

    if (template.channels.sms?.enabled) {
      processedChannels.sms = {
        message: processTemplate(template.channels.sms.message, previewData),
        characterCount: processTemplate(template.channels.sms.message, previewData).length,
        segments: Math.ceil(processTemplate(template.channels.sms.message, previewData).length / 160)
      };
    }

    return NextResponse.json({
      template: {
        name: template.name,
        description: template.description,
        category: template.category
      },
      preview: processedChannels,
      data: previewData
    });
  } catch (error) {
    console.error('Error in POST /api/admin/notification-templates/[id]/preview:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}