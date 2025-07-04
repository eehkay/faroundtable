import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { writeClient } from '@/lib/sanity';
import { groq } from 'next-sanity';
import { canApproveTransfers } from '@/lib/permissions';
import { sendTransferApprovedNotification } from '@/lib/email/service';

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
    if (!canApproveTransfers(session.user.role)) {
      return NextResponse.json(
        { error: 'You do not have permission to approve transfers' },
        { status: 403 }
      );
    }

    const transferId = params.id;

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
          images,
          activeTransferRequests[]->{
            _id,
            status,
            toLocation->{_id, name}
          }
        },
        requestedBy->{
          _id,
          name,
          email
        },
        requestedAt
      }
    `, { transferId });

    if (!transfer) {
      return NextResponse.json({ error: 'Transfer not found' }, { status: 404 });
    }

    if (transfer.status !== 'requested') {
      return NextResponse.json(
        { error: 'Only requested transfers can be approved' },
        { status: 400 }
      );
    }

    // Get all other pending transfers for this vehicle
    const otherPendingTransfers = transfer.vehicle.activeTransferRequests?.filter(
      (req: any) => req._id !== transferId && req.status === 'requested'
    ) || [];
    
    // Approve the transfer
    const updatedTransfer = await writeClient
      .patch(transferId)
      .set({
        status: 'approved',
        approvedBy: {
          _type: 'reference',
          _ref: session.user.id
        },
        approvedAt: new Date().toISOString(),
        approvedOver: otherPendingTransfers.map((req: any) => ({
          _type: 'reference',
          _ref: req._id
        }))
      })
      .commit();

    // Auto-reject all other pending transfers
    const rejectionTime = new Date().toISOString();
    for (const pendingTransfer of otherPendingTransfers) {
      await writeClient
        .patch(pendingTransfer._id)
        .set({
          status: 'rejected',
          rejectedAt: rejectionTime,
          rejectedBy: { _type: 'reference', _ref: session.user.id },
          rejectionReason: 'Another transfer request was approved for this vehicle'
        })
        .commit();
        
      // Create activity log for rejection
      await writeClient.create({
        _type: 'activity',
        vehicle: { _type: 'reference', _ref: transfer.vehicle._id },
        user: { _type: 'reference', _ref: session.user.id },
        action: 'transfer_auto_rejected',
        details: `Transfer request from ${pendingTransfer.toLocation.name} auto-rejected - another request was approved`,
        metadata: {
          transferId: pendingTransfer._id,
          approvedTransferId: transferId
        },
        createdAt: rejectionTime
      });
    }

    // Update vehicle status to claimed and set only the approved transfer
    await writeClient
      .patch(transfer.vehicle._id)
      .set({ 
        status: 'claimed',
        activeTransferRequests: [{
          _type: 'reference',
          _ref: transferId
        }]
      })
      .commit();

    // Create activity log
    await writeClient.create({
      _type: 'activity',
      action: 'transfer_approved',
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
        autoRejectedCount: otherPendingTransfers.length
      },
      timestamp: new Date().toISOString()
    });

    // Send email notification
    try {
      await sendTransferApprovedNotification({
        transfer: {
          ...transfer,
          status: 'approved'
        },
        vehicle: transfer.vehicle,
        approver: {
          name: session.user.name || session.user.email,
          email: session.user.email
        }
      });
    } catch (emailError) {
      console.error('Failed to send approval notification:', emailError);
      // Don't fail the request if email fails
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