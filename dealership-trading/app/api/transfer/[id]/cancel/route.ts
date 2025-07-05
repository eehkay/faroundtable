import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-server';
import { sendTransferCancelledNotification } from '@/lib/email/service';

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: NextRequest, props: RouteParams) {
  const params = await props.params;
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const transferId = params.id;
    const { reason } = await request.json();

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
          status,
          image_urls
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

    // Check if user can cancel this transfer
    // Users can cancel their own requests or managers/admins can cancel any
    const canCancel = 
      session.user.id === transfer.requested_by_id ||
      session.user.role === 'admin' ||
      session.user.role === 'manager';

    if (!canCancel) {
      return NextResponse.json(
        { error: 'You do not have permission to cancel this transfer' },
        { status: 403 }
      );
    }

    // Only allow cancelling if not already delivered
    if (transfer.status === 'delivered') {
      return NextResponse.json(
        { error: 'Cannot cancel a delivered transfer' },
        { status: 400 }
      );
    }

    // Cancel the transfer
    const { data: updatedTransfer, error: updateError } = await supabaseAdmin
      .from('transfers')
      .update({
        status: 'cancelled',
        cancelled_by_id: session.user.id,
        cancelled_at: new Date().toISOString()
      })
      .eq('id', transferId)
      .select()
      .single();

    if (updateError) {
      console.error('Transfer update error:', updateError);
      return NextResponse.json({ error: 'Failed to cancel transfer' }, { status: 500 });
    }

    // Update vehicle status back to available if it was in-transfer
    if (transfer.vehicle.status === 'in-transfer' || transfer.vehicle.status === 'claimed') {
      await supabaseAdmin
        .from('vehicles')
        .update({ 
          status: 'available',
          current_transfer_id: null
        })
        .eq('id', transfer.vehicle_id);
    }

    // Create activity log
    await supabaseAdmin
      .from('activities')
      .insert({
        vehicle_id: transfer.vehicle_id,
        user_id: session.user.id,
        action: 'transfer-cancelled',
        details: `Transfer cancelled from ${transfer.from_location.name} to ${transfer.to_location.name}${reason ? `: ${reason}` : ''}`,
        metadata: {
          vehicleDetails: `${transfer.vehicle.year} ${transfer.vehicle.make} ${transfer.vehicle.model}`,
          fromStore: transfer.from_location.name,
          toStore: transfer.to_location.name,
          reason
        }
      });

    // Send email notification
    try {
      await sendTransferCancelledNotification({
        transfer: {
          ...transfer,
          _id: transfer.id,
          status: 'cancelled',
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
          images: transfer.vehicle.image_urls || []
        },
        canceller: {
          name: session.user.name || session.user.email || 'Unknown',
          email: session.user.email || ''
        },
        reason
      });
    } catch (emailError) {
      console.error('Failed to send cancellation notification:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      transfer: updatedTransfer
    });

  } catch (error) {
    console.error('Failed to cancel transfer:', error);
    return NextResponse.json(
      { error: 'Failed to cancel transfer' },
      { status: 500 }
    );
  }
}