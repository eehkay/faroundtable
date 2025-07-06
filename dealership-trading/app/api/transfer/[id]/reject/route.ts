import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-server';
import { canApproveTransfer, canRejectTransferForLocation } from '@/lib/permissions';

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
    const { data: transfer, error: transferError } = await supabaseAdmin
      .from('transfers')
      .select(`
        *,
        from_location:from_location_id(
          id,
          name
        ),
        vehicle:vehicle_id(
          id,
          year,
          make,
          model,
          location:location_id(
            id,
            name
          )
        ),
        to_location:to_location_id(
          id,
          name
        ),
        requested_by:requested_by_id(
          id,
          name,
          email
        )
      `)
      .eq('id', id)
      .single();
    
    if (transferError || !transfer) {
      console.error('Transfer fetch error:', transferError);
      return NextResponse.json({ error: 'Transfer not found' }, { status: 404 });
    }
    
    if (transfer.status !== 'requested') {
      return NextResponse.json({ error: 'Only requested transfers can be rejected' }, { status: 400 });
    }

    // Check dealer-specific rejection permissions
    // Only managers from the dealership that owns the vehicle (or admins) can reject
    if (!canRejectTransferForLocation(
      session.user.role, 
      session.user.location?.id || null, 
      transfer.from_location_id
    )) {
      return NextResponse.json(
        { error: 'You can only reject transfers for vehicles from your own dealership' },
        { status: 403 }
      );
    }
    
    // Update transfer status to rejected
    const { error: updateError } = await supabaseAdmin
      .from('transfers')
      .update({ 
        status: 'rejected',
        rejected_at: new Date().toISOString(),
        rejected_by_id: session.user.id,
        rejection_reason: rejectionReason
      })
      .eq('id', id);
    
    if (updateError) {
      console.error('Transfer update error:', updateError);
      return NextResponse.json({ error: 'Failed to update transfer' }, { status: 500 });
    }
    
    // Create activity log
    await supabaseAdmin
      .from('activities')
      .insert({
        vehicle_id: transfer.vehicle.id,
        user_id: session.user.id,
        action: 'transfer-rejected',
        details: `Transfer request from ${transfer.to_location.name} rejected: ${rejectionReason}`,
        metadata: {
          transferId: id,
          rejectionReason,
          rejectedBy: session.user.name || session.user.email
        }
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