import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-server';
import { canUpdateTransferStatus } from '@/lib/permissions';
import { sendTransferStatusUpdateNotification } from '@/lib/email/service';

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
    if (!canUpdateTransferStatus(session.user.role)) {
      return NextResponse.json(
        { error: 'You do not have permission to update transfer status' },
        { status: 403 }
      );
    }

    const { status } = await request.json();

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
      console.error('Transfer fetch error:', transferError);
      return NextResponse.json({ error: 'Transfer not found' }, { status: 404 });
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
      console.error('Transfer update error:', updateError);
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

    // Send email notification
    try {
      await sendTransferStatusUpdateNotification({
        transfer: {
          ...transfer,
          _id: transfer.id,
          status: status as 'in-transit' | 'delivered',
          fromStore: {
            _id: transfer.from_location.id,
            _type: 'dealershipLocation' as const,
            name: transfer.from_location.name,
            code: transfer.from_location.code,
            email: transfer.from_location.email,
            active: true
          },
          toStore: {
            _id: transfer.to_location.id,
            _type: 'dealershipLocation' as const,
            name: transfer.to_location.name,
            code: transfer.to_location.code,
            email: transfer.to_location.email,
            active: true
          }
        },
        vehicle: {
          _id: transfer.vehicle.id,
          vin: transfer.vehicle.vin,
          year: transfer.vehicle.year,
          make: transfer.vehicle.make,
          model: transfer.vehicle.model,
          stockNumber: transfer.vehicle.stock_number,
          price: transfer.vehicle.price,
          imageUrls: transfer.vehicle.image_urls || [],
          condition: transfer.vehicle.condition,
          status: transfer.vehicle.status,
          storeCode: transfer.vehicle.store_code
        },
        status: status as 'in-transit' | 'delivered',
        updater: {
          name: session.user.name || session.user.email || 'Unknown',
          email: session.user.email || ''
        }
      });
    } catch (emailError) {
      console.error('Failed to send status update notification:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      transfer: updatedTransfer
    });

  } catch (error) {
    console.error('Failed to update transfer status:', error);
    return NextResponse.json(
      { error: 'Failed to update transfer status' },
      { status: 500 }
    );
  }
}