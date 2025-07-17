import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-server';
import { processTemplate } from '@/lib/notifications/template-processor';
import { getPreviewData } from '@/lib/notifications/preview-data';

// POST /api/admin/notifications/debug-template - Debug template processing
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { template, transferId, vehicleId } = body;


    // Get preview data
    const previewData = await getPreviewData(supabaseAdmin, {
      useRealData: true,
      vehicleId,
      transferId,
      userId: session.user.id
    });
    

    // Process the template
    const processed = processTemplate(template, previewData);

    return NextResponse.json({
      success: true,
      original: template,
      processed,
      data: {
        hasTransfer: !!previewData.transfer,
        transferData: previewData.transfer,
        hasVehicle: !!previewData.vehicle,
        vehicleData: previewData.vehicle,
        fullData: previewData
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}