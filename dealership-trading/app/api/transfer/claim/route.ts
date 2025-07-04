import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { writeClient } from '@/lib/sanity';
import { canClaimVehicle } from '@/lib/permissions';
import { sendTransferRequestedNotification } from '@/lib/email/service';
import { groq } from 'next-sanity';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !canClaimVehicle(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { vehicleId, reason, customerWaiting, priority, expectedPickupDate } = await request.json();
    
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
        location->{_id, name, code, email},
        currentTransfer
      }
    `, { id: vehicleId });
    
    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }
    
    if (vehicle.status !== 'available') {
      return NextResponse.json({ error: 'Vehicle is not available for transfer' }, { status: 400 });
    }
    
    // Create transfer record
    const transfer = await writeClient.create({
      _type: 'transfer',
      vehicle: { _type: 'reference', _ref: vehicleId },
      fromLocation: { _type: 'reference', _ref: vehicle.location._id },
      toLocation: { _type: 'reference', _ref: session.user.location._id },
      requestedBy: { _type: 'reference', _ref: session.user.id },
      status: 'requested',
      reason,
      customerWaiting: customerWaiting || false,
      priority: priority || false,
      expectedPickupDate,
      requestedAt: new Date().toISOString()
    });
    
    // Update vehicle status
    await writeClient
      .patch(vehicleId)
      .set({ 
        status: 'claimed',
        currentTransfer: { _ref: transfer._id }
      })
      .commit();
    
    // Create activity log
    await writeClient.create({
      _type: 'activity',
      vehicle: { _type: 'reference', _ref: vehicleId },
      transfer: { _type: 'reference', _ref: transfer._id },
      user: { _type: 'reference', _ref: session.user.id },
      action: 'transfer_requested',
      fromLocation: { _type: 'reference', _ref: vehicle.location._id },
      toLocation: { _type: 'reference', _ref: session.user.location._id },
      metadata: {
        vehicleDetails: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
        fromStore: vehicle.location.name,
        toStore: session.user.location.name,
        reason
      },
      timestamp: new Date().toISOString()
    });
    
    // Send email notification
    try {
      await sendTransferRequestedNotification({
        transfer: {
          _id: transfer._id,
          status: 'requested',
          fromLocation: vehicle.location,
          toLocation: session.user.location,
          requestedBy: session.user,
          vehicle: vehicle
        },
        vehicle: vehicle,
        requester: {
          name: session.user.name || session.user.email,
          email: session.user.email
        }
      });
    } catch (emailError) {
      console.error('Failed to send transfer request notification:', emailError);
      // Don't fail the request if email fails
    }
    
    return NextResponse.json({ success: true, transferId: transfer._id });
  } catch (error) {
    console.error('Error claiming vehicle:', error);
    return NextResponse.json({ error: 'Failed to claim vehicle' }, { status: 500 });
  }
}