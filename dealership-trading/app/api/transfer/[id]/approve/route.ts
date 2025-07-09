import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-server';
import { canApproveTransfers, canApproveTransferForLocation } from '@/lib/permissions';
import { sendNotificationsByRules } from '@/lib/notifications/multi-channel-sender';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: transferId } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions
    if (!canApproveTransfers(session.user.role)) {
      return NextResponse.json(
        { error: 'You do not have permission to approve transfers' },
        { status: 403 }
      );
    }


    // Get the current transfer details with vehicle and location info
    const { data: transfer, error: transferError } = await supabaseAdmin
      .from('transfers')
      .select(`
        *,
        from_location:from_location_id(
          id,
          name,
          code,
          email
        ),
        to_location:to_location_id(
          id,
          name,
          code,
          email
        ),
        vehicle:vehicle_id(
          id,
          vin,
          year,
          make,
          model,
          stock_number,
          price,
          image_urls,
          condition,
          status,
          store_code
        ),
        requested_by:requested_by_id(
          id,
          name,
          email
        )
      `)
      .eq('id', transferId)
      .single();

    if (transferError || !transfer) {
      console.error('Transfer fetch error:', transferError);
      return NextResponse.json({ error: 'Transfer not found' }, { status: 404 });
    }

    if (transfer.status !== 'requested') {
      return NextResponse.json(
        { error: 'Only requested transfers can be approved' },
        { status: 400 }
      );
    }

    // Check dealer-specific approval permissions
    // Only managers from the dealership that owns the vehicle (or admins) can approve
    if (!canApproveTransferForLocation(
      session.user.role, 
      session.user.location?.id || null, 
      transfer.from_location_id
    )) {
      return NextResponse.json(
        { error: 'You can only approve transfers for vehicles from your own dealership' },
        { status: 403 }
      );
    }

    // Get all other pending transfers for this vehicle
    const { data: otherPendingTransfers } = await supabaseAdmin
      .from('transfers')
      .select('id, to_location:to_location_id(name)')
      .eq('vehicle_id', transfer.vehicle_id)
      .eq('status', 'requested')
      .neq('id', transferId);
    
    // Approve the transfer
    const { data: updatedTransfer, error: updateError } = await supabaseAdmin
      .from('transfers')
      .update({
        status: 'approved',
        approved_by_id: session.user.id,
        approved_at: new Date().toISOString()
      })
      .eq('id', transferId)
      .select()
      .single();

    if (updateError) {
      console.error('Transfer update error:', updateError);
      return NextResponse.json({ error: 'Failed to approve transfer' }, { status: 500 });
    }

    // Auto-reject all other pending transfers
    const rejectionTime = new Date().toISOString();
    if (otherPendingTransfers && otherPendingTransfers.length > 0) {
      await supabaseAdmin
        .from('transfers')
        .update({
          status: 'rejected',
          rejected_at: rejectionTime,
          rejected_by_id: session.user.id,
          rejection_reason: 'Another transfer request was approved for this vehicle'
        })
        .in('id', otherPendingTransfers.map(t => t.id));
        
      // Create activity logs for rejections
      const rejectionActivities = otherPendingTransfers.map(pendingTransfer => ({
        vehicle_id: transfer.vehicle_id,
        user_id: session.user.id,
        action: 'transfer_auto_rejected' as const,
        details: `Transfer request from ${pendingTransfer.to_location?.[0]?.name || 'unknown location'} auto-rejected - another request was approved`,
        metadata: {
          transferId: pendingTransfer.id,
          approvedTransferId: transferId
        }
      }));
      
      await supabaseAdmin
        .from('activities')
        .insert(rejectionActivities);
    }

    // Update vehicle status to claimed and set current transfer
    await supabaseAdmin
      .from('vehicles')
      .update({ 
        status: 'claimed',
        current_transfer_id: transferId
      })
      .eq('id', transfer.vehicle_id);

    // Create activity log
    await supabaseAdmin
      .from('activities')
      .insert({
        vehicle_id: transfer.vehicle_id,
        user_id: session.user.id,
        action: 'transfer-approved',
        details: `Transfer approved from ${transfer.from_location.name} to ${transfer.to_location.name}`,
        metadata: {
          vehicleDetails: `${transfer.vehicle.year} ${transfer.vehicle.make} ${transfer.vehicle.model}`,
          fromStore: transfer.from_location.name,
          toStore: transfer.to_location.name,
          autoRejectedCount: otherPendingTransfers?.length || 0
        }
      });

    // Send notification using the rules system
    try {
      await sendNotificationsByRules({
        event: 'transfer_approved',
        transferId: transferId,
        vehicleId: transfer.vehicle_id,
        userId: session.user.id,
        additionalData: {
          autoRejectedCount: otherPendingTransfers?.length || 0
        }
      });
    } catch (notificationError) {
      console.error('Failed to send approval notification:', notificationError);
      // Don't fail the request if notification fails
    }

    return NextResponse.json({
      success: true,
      transfer: updatedTransfer
    });

  } catch (error) {
    console.error('Failed to approve transfer:', error);
    return NextResponse.json(
      { error: 'Failed to approve transfer' },
      { status: 500 }
    );
  }
}