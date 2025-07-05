import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { writeClient } from '@/lib/sanity';
import { canApproveTransfer } from '@/lib/permissions';
import { groq } from 'next-sanity';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !canApproveTransfer(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Await the params to get the id
    const { id } = await params;
    
    const { rejectionReason } = await request.json();
    
    if (!rejectionReason) {
      return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
    }
    
    // Get transfer details
    const transfer = await writeClient.fetch(groq`
      *[_type == "transfer" && _id == $id][0]{
        _id,
        status,
        vehicle->{
          _id,
          year,
          make,
          model,
          location->{_id, name},
          activeTransferRequests[]->{ _id }
        },
        toLocation->{_id, name},
        requestedBy->{_id, name, email}
      }
    `, { id });
    
    if (!transfer) {
      return NextResponse.json({ error: 'Transfer not found' }, { status: 404 });
    }
    
    if (transfer.status !== 'requested') {
      return NextResponse.json({ error: 'Only requested transfers can be rejected' }, { status: 400 });
    }
    
    // Update transfer status to rejected
    await writeClient
      .patch(id)
      .set({ 
        status: 'rejected',
        rejectedAt: new Date().toISOString(),
        rejectedBy: { _type: 'reference', _ref: session.user.id },
        rejectionReason
      })
      .commit();
    
    // Remove this transfer from vehicle's activeTransferRequests
    const updatedActiveRequests = transfer.vehicle.activeTransferRequests
      ?.filter((req: any) => req._id !== id)
      .map((req: any) => ({ _type: 'reference', _ref: req._id })) || [];
    
    await writeClient
      .patch(transfer.vehicle._id)
      .set({ 
        activeTransferRequests: updatedActiveRequests
      })
      .commit();
    
    // Create activity log
    await writeClient.create({
      _type: 'activity',
      vehicle: { _type: 'reference', _ref: transfer.vehicle._id },
      user: { _type: 'reference', _ref: session.user.id },
      action: 'transfer_rejected',
      details: `Transfer request from ${transfer.toLocation.name} rejected: ${rejectionReason}`,
      metadata: {
        transferId: id,
        rejectionReason,
        rejectedBy: session.user.name || session.user.email
      },
      createdAt: new Date().toISOString()
    });
    
    // TODO: Send rejection notification email
    
    return NextResponse.json({ 
      success: true, 
      message: 'Transfer request rejected successfully' 
    });
  } catch (error) {
    console.error('Error rejecting transfer:', error);
    return NextResponse.json({ error: 'Failed to reject transfer' }, { status: 500 });
  }
}