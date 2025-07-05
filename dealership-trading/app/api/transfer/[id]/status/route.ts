import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { writeClient } from '@/lib/sanity';
import { groq } from 'next-sanity';
import { canUpdateTransferStatus } from '@/lib/permissions';
import { sendTransferStatusUpdateNotification } from '@/lib/email/service';

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

    // Check permissions
    if (!canUpdateTransferStatus(session.user.role)) {
      return NextResponse.json(
        { error: 'You do not have permission to update transfer status' },
        { status: 403 }
      );
    }

    const transferId = params.id;
    const { status } = await request.json();

    // Validate status
    if (!['in-transit', 'delivered'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be either "in-transit" or "delivered"' },
        { status: 400 }
      );
    }

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
          images
        },
        requestedBy->{
          _id,
          name,
          email
        },
        approvedBy->{
          _id,
          name,
          email
        }
      }
    `, { transferId });

    if (!transfer) {
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

    // Update the transfer status
    const updateData: any = {
      status,
      [`${status.replace('-', '')}At`]: new Date().toISOString(),
      [`${status.replace('-', '')}By`]: {
        _type: 'reference',
        _ref: session.user.id
      }
    };

    const updatedTransfer = await writeClient
      .patch(transferId)
      .set(updateData)
      .commit();

    // Update vehicle status when delivered
    if (status === 'delivered') {
      await writeClient
        .patch(transfer.vehicle._id)
        .set({ 
          status: 'available',
          location: {
            _type: 'reference',
            _ref: transfer.toLocation._id
          }
        })
        .commit();
    }

    // Create activity log
    await writeClient.create({
      _type: 'activity',
      action: `transfer_${status.replace('-', '_')}`,
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
        status
      },
      timestamp: new Date().toISOString()
    });

    // Send email notification
    try {
      await sendTransferStatusUpdateNotification({
        transfer: {
          ...transfer,
          status: status as 'in-transit' | 'delivered'
        },
        vehicle: transfer.vehicle,
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