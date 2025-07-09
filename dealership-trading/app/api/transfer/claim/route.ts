import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-server';
import { canClaimVehicle } from '@/lib/permissions';
import { sendNotificationsByRules } from '@/lib/notifications/multi-channel-sender';
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
    
    // Get vehicle details with location and transfer info
    const { data: vehicle, error: vehicleError } = await supabaseAdmin
      .from('vehicles')
      .select(`
        *,
        location:location_id(
          id,
          name,
          code,
          email
        ),
        transfers!transfers_vehicle_id_fkey(
          id,
          status,
          to_location:to_location_id(
            id,
            name
          )
        )
      `)
      .eq('id', vehicleId)
      .single();

    if (vehicleError || !vehicle) {
      console.error('Vehicle fetch error:', vehicleError);
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }
    
    // Check if vehicle is available or has pending requests only
    if (vehicle.status !== 'available' && vehicle.status !== 'claimed') {
      return NextResponse.json({ error: 'Vehicle is not available for transfer' }, { status: 400 });
    }
    
    // Check if user has a location assigned
    if (!session.user.location?.id) {
      return NextResponse.json({ error: 'User does not have a location assigned' }, { status: 400 });
    }
    
    // Prevent self-transfers
    if (vehicle.location.id === session.user.location.id) {
      return NextResponse.json({ error: 'Cannot transfer vehicle to the same location' }, { status: 400 });
    }
    
    // Count existing pending requests
    const pendingRequests = vehicle.transfers?.filter(
      (req: any) => req.status === 'requested'
    ) || [];
    const competingRequestsCount = pendingRequests.length;
    
    // Create transfer record
    const { data: transfer, error: transferError } = await supabaseAdmin
      .from('transfers')
      .insert({
        vehicle_id: vehicleId,
        from_location_id: vehicle.location.id,
        to_location_id: session.user.location.id,
        requested_by_id: session.user.id,
        status: 'requested',
        reason,
        transfer_notes: transferNotes || reason, // Use transferNotes if provided, fallback to reason
        money_offer: moneyOffer,
        requested_by_date: requestedByDate || expectedPickupDate,
        customer_waiting: customerWaiting || false,
        priority: priority || 'normal',
        expected_pickup_date: expectedPickupDate,
        competing_requests_count: competingRequestsCount
      })
      .select()
      .single();

    if (transferError) {
      console.error('Transfer creation error:', transferError);
      return NextResponse.json({ error: 'Failed to create transfer' }, { status: 500 });
    }
    
    // No need to update vehicle's activeTransferRequests in Supabase - 
    // the transfers relationship handles this automatically
    
    // Create activity log
    await supabaseAdmin
      .from('activities')
      .insert({
        vehicle_id: vehicleId,
        user_id: session.user.id,
        action: 'claimed',
        details: `Transfer requested from ${vehicle.location.name} to ${session.user.location.name}${moneyOffer ? ` with offer of $${moneyOffer}` : ''}`,
        metadata: {
          fromStore: vehicle.location.name,
          toStore: session.user.location.name,
          reason,
          moneyOffer,
          competingRequests: competingRequestsCount
        }
      });
    
    // Send notification using the rules system
    try {
      await sendNotificationsByRules({
        event: 'transfer_requested',
        transferId: transfer.id,
        vehicleId: vehicleId,
        userId: session.user.id,
        additionalData: {
          reason,
          customerWaiting: customerWaiting || false,
          priority: priority || 'normal',
          moneyOffer,
          competingRequests: competingRequestsCount
        }
      });
    } catch (notificationError) {
      console.error('Failed to send transfer request notification:', notificationError);
      // Don't fail the request if notification fails
    }
    
    return NextResponse.json({ success: true, transferId: transfer.id });
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