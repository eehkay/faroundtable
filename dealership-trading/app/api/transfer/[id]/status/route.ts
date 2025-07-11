import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-server';
import { canUpdateTransferStatus, canMarkTransferAsDelivered } from '@/lib/permissions';
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

    // Initial permission check
    if (!canUpdateTransferStatus(session.user.role)) {
      return NextResponse.json(
        { error: 'You do not have permission to update transfer status' },
        { status: 403 }
      );
    }

    let requestBody;
    try {
      requestBody = await request.json();
    } catch (jsonError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { status } = requestBody;

    // Validate status
    if (!['in-transit', 'delivered'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be either "in-transit" or "delivered"' },
        { status: 400 }
      );
    }

    // Get the current transfer details
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
          store_code,
          status
        ),
        requested_by:requested_by_id(
          id,
          name,
          email
        ),
        approved_by:approved_by_id(
          id,
          name,
          email
        )
      `)
      .eq('id', transferId)
      .single();

    if (transferError || !transfer) {
      return NextResponse.json({ error: 'Transfer not found' }, { status: 404 });
    }

    // Special permission check for delivery status
    if (status === 'delivered') {
      if (!canMarkTransferAsDelivered(
        session.user.role,
        session.user.location?.id || null,
        transfer.to_location_id
      )) {
        return NextResponse.json(
          { error: 'You do not have permission to mark this transfer as delivered' },
          { status: 403 }
        );
      }
    }

    // Validate status transition
    const validTransitions: Record<string, string[]> = {
      'approved': ['in-transit', 'delivered'],
      'in-transit': ['delivered']
    };

    if (!validTransitions[transfer.status]?.includes(status)) {
      return NextResponse.json(
        { error: `Cannot transition from ${transfer.status} to ${status}` },
        { status: 400 }
      );
    }

    // Prepare update data based on status
    const updateData: any = {
      status
    };

    if (status === 'in-transit') {
      updateData.actual_pickup_date = new Date().toISOString();
    } else if (status === 'delivered') {
      updateData.delivered_date = new Date().toISOString();
    }

    // Update the transfer status
    const { data: updatedTransfer, error: updateError } = await supabaseAdmin
      .from('transfers')
      .update(updateData)
      .eq('id', transferId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update transfer' }, { status: 500 });
    }

    // Update vehicle when delivered
    if (status === 'delivered') {
      await supabaseAdmin
        .from('vehicles')
        .update({ 
          status: 'available',
          location_id: transfer.to_location_id,
          current_transfer_id: null
        })
        .eq('id', transfer.vehicle_id);
    } else if (status === 'in-transit') {
      // Update vehicle status to in-transfer when transfer starts
      await supabaseAdmin
        .from('vehicles')
        .update({ 
          status: 'in-transfer'
        })
        .eq('id', transfer.vehicle_id);
    }

    // Create activity log
    await supabaseAdmin
      .from('activities')
      .insert({
        vehicle_id: transfer.vehicle_id,
        user_id: session.user.id,
        action: `transfer-${status === 'in-transit' ? 'started' : 'completed'}`,
        details: `Transfer ${status === 'in-transit' ? 'started' : 'completed'} from ${transfer.from_location.name} to ${transfer.to_location.name}`,
        metadata: {
          vehicleDetails: `${transfer.vehicle.year} ${transfer.vehicle.make} ${transfer.vehicle.model}`,
          fromStore: transfer.from_location.name,
          toStore: transfer.to_location.name,
          status
        }
      });

    // Send notification using the rules system
    try {
      const event = status === 'in-transit' ? 'transfer_in_transit' : 'transfer_delivered';
      await sendNotificationsByRules({
        event,
        transferId: transferId,
        vehicleId: transfer.vehicle_id,
        userId: session.user.id,
        additionalData: {
          previousStatus: transfer.status,
          newStatus: status
        }
      });
    } catch (notificationError) {
      // Don't fail the request if notification fails
    }

    return NextResponse.json({
      success: true,
      transfer: updatedTransfer
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update transfer status', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}