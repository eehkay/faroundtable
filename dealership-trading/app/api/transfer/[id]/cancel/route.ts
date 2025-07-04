import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { writeClient } from '@/lib/sanity';
import { groq } from 'next-sanity';
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
    const transfer = await writeClient.fetch(groq`
      *[_type == "transfer" && _id == $transferId][0] {
        _id,
        status,
        fromLocation->{_id, name, code, email},
        toLocation->{_id, name, code, email},
        vehicle->{
          _id,
          vin,
          year,
          make,
          model,
          stockNumber,
          price,
          status,
          images
        },
        requestedBy->{
          _id,
          name,
          email
        }
      }
    `, { transferId });

    if (!transfer) {
      return NextResponse.json({ error: 'Transfer not found' }, { status: 404 });
    }

    // Check if user can cancel this transfer
    // Users can cancel their own requests or managers/admins can cancel any
    const canCancel = 
      session.user.id === transfer.requestedBy._id ||
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
    const updatedTransfer = await writeClient
      .patch(transferId)
      .set({
        status: 'cancelled',
        cancelledBy: {
          _type: 'reference',
          _ref: session.user.id
        },
        cancelledAt: new Date().toISOString(),
        cancellationReason: reason
      })
      .commit();

    // Update vehicle status back to available if it was in-transfer
    if (transfer.vehicle.status === 'in-transfer') {
      await writeClient
        .patch(transfer.vehicle._id)
        .set({ status: 'available' })
        .commit();
    }

    // Create activity log
    await writeClient.create({
      _type: 'activity',
      action: 'transfer_cancelled',
      vehicle: {
        _type: 'reference',
        _ref: transfer.vehicle._id
      },
      transfer: {
        _type: 'reference',
        _ref: transferId
      },
      fromLocation: {
        _type: 'reference',
        _ref: transfer.fromLocation._id
      },
      toLocation: {
        _type: 'reference',
        _ref: transfer.toLocation._id
      },
      user: {
        _type: 'reference',
        _ref: session.user.id
      },
      metadata: {
        vehicleDetails: `${transfer.vehicle.year} ${transfer.vehicle.make} ${transfer.vehicle.model}`,
        fromStore: transfer.fromLocation.name,
        toStore: transfer.toLocation.name,
        reason
      },
      timestamp: new Date().toISOString()
    });

    // Send email notification
    try {
      await sendTransferCancelledNotification({
        transfer: {
          ...transfer,
          status: 'cancelled'
        },
        vehicle: transfer.vehicle,
        canceller: {
          name: session.user.name || session.user.email,
          email: session.user.email
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