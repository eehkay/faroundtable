import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { readClient } from '@/lib/sanity';
import { groq } from 'next-sanity';

export async function GET(
  request: NextRequest,
  { params }: { params: { vehicleId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Fetch all transfer requests for the vehicle
    const transfers = await readClient.fetch(groq`
      *[_type == "transfer" && vehicle._ref == $vehicleId] | order(createdAt desc) {
        _id,
        status,
        transferNotes,
        reason,
        moneyOffer,
        requestedByDate,
        customerWaiting,
        priority,
        expectedPickupDate,
        createdAt,
        requestedAt,
        approvedAt,
        rejectedAt,
        rejectionReason,
        competingRequestsCount,
        fromLocation->{
          _id,
          name,
          code
        },
        toLocation->{
          _id,
          name,
          code
        },
        requestedBy->{
          _id,
          name,
          email,
          location->{_id, name}
        },
        approvedBy->{
          _id,
          name,
          email
        },
        rejectedBy->{
          _id,
          name,
          email
        }
      }
    `, { vehicleId: params.vehicleId });
    
    // Separate transfers by status
    const pendingTransfers = transfers.filter((t: any) => t.status === 'requested');
    const approvedTransfers = transfers.filter((t: any) => t.status === 'approved');
    const rejectedTransfers = transfers.filter((t: any) => t.status === 'rejected');
    const otherTransfers = transfers.filter((t: any) => 
      !['requested', 'approved', 'rejected'].includes(t.status)
    );
    
    // Check if user has permission to see money offers
    const userLocation = session.user.location?._id;
    const canSeeAllOffers = ['admin', 'manager'].includes(session.user.role);
    
    // Filter money offers based on permissions
    const filteredTransfers = transfers.map((transfer: any) => {
      // Show money offer if:
      // 1. User is admin/manager
      // 2. User's location is involved in the transfer (from or to)
      // 3. User created the request
      const isInvolved = 
        canSeeAllOffers ||
        transfer.fromLocation._id === userLocation ||
        transfer.toLocation._id === userLocation ||
        transfer.requestedBy._id === session.user.id;
      
      if (!isInvolved && transfer.moneyOffer) {
        return { ...transfer, moneyOffer: null };
      }
      
      return transfer;
    });
    
    return NextResponse.json({
      transfers: filteredTransfers,
      summary: {
        total: transfers.length,
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