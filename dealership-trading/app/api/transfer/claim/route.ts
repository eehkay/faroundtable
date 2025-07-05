import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { writeClient } from '@/lib/sanity';
import { canClaimVehicle } from '@/lib/permissions';
import { sendTransferRequestedNotification } from '@/lib/email/service';
import { groq } from 'next-sanity';
import type { DealershipLocation } from '@/types/vehicle';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !canClaimVehicle(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { 
      vehicleId, 
      reason, 
      customerWaiting, 
      priority, 
      expectedPickupDate,
      transferNotes,
      moneyOffer,
      requestedByDate
    } = await request.json();
    
    // Get vehicle details
    const vehicle = await writeClient.fetch(groq`
      *[_type == "vehicle" && _id == $id][0]{
        _id,
        status,
        vin,
        year,
        make,
        model,
        stockNumber,
        price,
        images,
        location->{_id, name, code, email},
        activeTransferRequests[]->{
          _id,
          status,
          toLocation->{_id, name}
        }
      }
    `, { id: vehicleId });
    
    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }
    
    // Check if vehicle is available or has pending requests only
    if (vehicle.status !== 'available' && vehicle.status !== 'claimed') {
      return NextResponse.json({ error: 'Vehicle is not available for transfer' }, { status: 400 });
    }
    
    // Check if user has a location assigned
    if (!session.user.location?._id) {
      return NextResponse.json({ error: 'User does not have a location assigned' }, { status: 400 });
    }
    
    // Count existing pending requests
    const pendingRequests = vehicle.activeTransferRequests?.filter(
      (req: any) => req.status === 'requested'
    ) || [];
    const competingRequestsCount = pendingRequests.length;
    
    // Create transfer record
    const transfer = await writeClient.create({
      _type: 'transfer',
      vehicle: { _type: 'reference', _ref: vehicleId },
      fromStore: { _type: 'reference', _ref: vehicle.location._id },
      toStore: { _type: 'reference', _ref: session.user.location._id },
      requestedBy: { _type: 'reference', _ref: session.user.id },
      status: 'requested',
      reason,
      transferNotes: transferNotes || reason, // Use transferNotes if provided, fallback to reason
      moneyOffer,
      requestedByDate: requestedByDate || expectedPickupDate,
      customerWaiting: customerWaiting || false,
      priority: priority || 'normal',
      expectedPickupDate,
      competingRequestsCount,
      createdAt: new Date().toISOString()
    });
    
    // Update vehicle with new transfer request (keep status as available)
    const currentRequests = vehicle.activeTransferRequests?.map((req: any) => ({ 
      _type: 'reference', 
      _ref: req._id 
    })) || [];
    
    await writeClient
      .patch(vehicleId)
      .set({ 
        activeTransferRequests: [...currentRequests, { 
          _type: 'reference', 
          _ref: transfer._id 
        }]
      })
      .commit();
    
    // Create activity log
    await writeClient.create({
      _type: 'activity',
      vehicle: { _type: 'reference', _ref: vehicleId },
      user: { _type: 'reference', _ref: session.user.id },
      action: 'claimed',
      details: `Transfer requested from ${vehicle.location.name} to ${session.user.location.name}${moneyOffer ? ` with offer of $${moneyOffer}` : ''}`,
      metadata: {
        fromStore: vehicle.location.name,
        toStore: session.user.location.name,
        reason,
        moneyOffer,
        competingRequests: competingRequestsCount
      },
      createdAt: new Date().toISOString()
    });
    
    // Send email notification
    try {
      await sendTransferRequestedNotification({
        transfer: {
          _id: transfer._id,
          _type: 'transfer' as const,
          status: 'requested',
          fromStore: vehicle.location,
          toStore: {
            ...session.user.location,
            _type: 'dealershipLocation' as const,
            active: true
          } as DealershipLocation,
          requestedBy: { _ref: session.user.id },
          vehicle: vehicle,
          customerWaiting: customerWaiting || false,
          priority: priority === 'urgent',
          createdAt: transfer.createdAt
        },
        vehicle: vehicle,
        requester: {
          name: session.user.name || session.user.email || 'Unknown',
          email: session.user.email || ''
        }
      });
    } catch (emailError) {
      console.error('Failed to send transfer request notification:', emailError);
      // Don't fail the request if email fails
    }
    
    return NextResponse.json({ success: true, transferId: transfer._id });
  } catch (error) {
    console.error('Error claiming vehicle:', error);
    // Return more detailed error in development
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json({ 
        error: 'Failed to claim vehicle', 
        details: error instanceof Error ? error.message : String(error) 
      }, { status: 500 });
    }
    return NextResponse.json({ error: 'Failed to claim vehicle' }, { status: 500 });
  }
}