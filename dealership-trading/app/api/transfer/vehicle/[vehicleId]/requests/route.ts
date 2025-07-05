import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ vehicleId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Await the params to get the vehicleId
    const { vehicleId } = await params;
    
    // Fetch all transfer requests for the vehicle
    const { data: transfers, error } = await supabaseAdmin
      .from('transfers')
      .select(`
        *,
        from_location:from_location_id(
          id,
          name,
          code
        ),
        to_location:to_location_id(
          id,
          name,
          code
        ),
        requested_by:requested_by_id(
          id,
          name,
          email,
          location:location_id(
            id,
            name
          )
        ),
        approved_by:approved_by_id(
          id,
          name,
          email
        ),
        rejected_by:rejected_by_id(
          id,
          name,
          email
        )
      `)
      .eq('vehicle_id', vehicleId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching transfers:', error);
      return NextResponse.json(
        { error: 'Failed to fetch transfer requests' },
        { status: 500 }
      );
    }
    
    // Transform the data to match the existing format
    const transformedTransfers = transfers?.map(transfer => ({
      _id: transfer.id,
      status: transfer.status,
      transferNotes: transfer.transfer_notes,
      reason: transfer.reason,
      moneyOffer: transfer.money_offer,
      requestedByDate: transfer.requested_by_date,
      customerWaiting: transfer.customer_waiting,
      priority: transfer.priority,
      expectedPickupDate: transfer.expected_pickup_date,
      createdAt: transfer.created_at,
      requestedAt: transfer.created_at,
      approvedAt: transfer.approved_at,
      rejectedAt: transfer.rejected_at,
      rejectionReason: transfer.rejection_reason,
      competingRequestsCount: transfer.competing_requests_count,
      fromLocation: transfer.from_location ? {
        _id: transfer.from_location.id,
        name: transfer.from_location.name,
        code: transfer.from_location.code
      } : null,
      toLocation: transfer.to_location ? {
        _id: transfer.to_location.id,
        name: transfer.to_location.name,
        code: transfer.to_location.code
      } : null,
      requestedBy: transfer.requested_by ? {
        _id: transfer.requested_by.id,
        name: transfer.requested_by.name,
        email: transfer.requested_by.email,
        location: transfer.requested_by.location ? {
          _id: transfer.requested_by.location.id,
          name: transfer.requested_by.location.name
        } : null
      } : null,
      approvedBy: transfer.approved_by ? {
        _id: transfer.approved_by.id,
        name: transfer.approved_by.name,
        email: transfer.approved_by.email
      } : null,
      rejectedBy: transfer.rejected_by ? {
        _id: transfer.rejected_by.id,
        name: transfer.rejected_by.name,
        email: transfer.rejected_by.email
      } : null
    })) || [];
    
    // Separate transfers by status
    const pendingTransfers = transformedTransfers.filter((t: any) => t.status === 'requested');
    const approvedTransfers = transformedTransfers.filter((t: any) => t.status === 'approved');
    const rejectedTransfers = transformedTransfers.filter((t: any) => t.status === 'rejected');
    const otherTransfers = transformedTransfers.filter((t: any) => 
      !['requested', 'approved', 'rejected'].includes(t.status)
    );
    
    // Check if user has permission to see money offers
    const userLocation = session.user.location?.id;
    const canSeeAllOffers = ['admin', 'manager'].includes(session.user.role);
    
    // Filter money offers based on permissions
    const filteredTransfers = transformedTransfers.map((transfer: any) => {
      // Show money offer if:
      // 1. User is admin/manager
      // 2. User's location is involved in the transfer (from or to)
      // 3. User created the request
      const isInvolved = 
        canSeeAllOffers ||
        transfer.fromLocation?._id === userLocation ||
        transfer.toLocation?._id === userLocation ||
        transfer.requestedBy?._id === session.user.id;
      
      if (!isInvolved && transfer.moneyOffer) {
        return { ...transfer, moneyOffer: null };
      }
      
      return transfer;
    });
    
    return NextResponse.json({
      transfers: filteredTransfers,
      summary: {
        total: transformedTransfers.length,
        pending: pendingTransfers.length,
        approved: approvedTransfers.length,
        rejected: rejectedTransfers.length,
        other: otherTransfers.length
      }
    });
  } catch (error) {
    console.error('Error fetching transfer requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transfer requests' },
      { status: 500 }
    );
  }
}