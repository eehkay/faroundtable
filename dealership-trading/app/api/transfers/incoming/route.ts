import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-server';
import { canViewTransfers } from '@/lib/permissions';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions
    if (!canViewTransfers(session.user.role)) {
      return NextResponse.json(
        { error: 'You do not have permission to view transfers' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('location_id');

    if (!locationId) {
      return NextResponse.json(
        { error: 'Location ID is required' },
        { status: 400 }
      );
    }

    // Fetch pending transfers where the from_location matches the user's location
    // These are requests for vehicles that the user's dealership owns
    const { data: transfers, error } = await supabaseAdmin
      .from('transfers')
      .select(`
        id,
        status,
        reason,
        customer_waiting,
        priority,
        expected_pickup_date,
        created_at,
        from_location_id,
        vehicle:vehicle_id(
          id,
          vin,
          year,
          make,
          model,
          trim,
          stock_number,
          price,
          mileage,
          image_urls
        ),
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
          email
        )
      `)
      .eq('from_location_id', locationId)
      .eq('status', 'requested')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching incoming transfers:', error);
      return NextResponse.json(
        { error: 'Failed to fetch transfers' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      transfers: transfers || []
    });

  } catch (error) {
    console.error('Failed to fetch incoming transfers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch incoming transfers' },
      { status: 500 }
    );
  }
}