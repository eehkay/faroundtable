import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-server';

// GET /api/admin/notifications/check-transfer?id=xxx - Check if transfer exists
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const transferId = request.nextUrl.searchParams.get('id');
    if (!transferId) {
      return NextResponse.json({ error: 'Transfer ID required' }, { status: 400 });
    }

    // First, try simple query
    const { data: simpleTransfer, error: simpleError } = await supabaseAdmin
      .from('transfers')
      .select('*')
      .eq('id', transferId)
      .single();

    // Then try with relations (fixed)
    const { data: fullTransfer, error: fullError } = await supabaseAdmin
      .from('transfers')
      .select(`
        *,
        vehicle:vehicles!transfers_vehicle_id_fkey(*),
        from_location:dealership_locations!from_location_id(*),
        to_location:dealership_locations!to_location_id(*),
        requested_by:users!requested_by_id(*),
        approved_by:users!approved_by_id(*)
      `)
      .eq('id', transferId)
      .single();

    return NextResponse.json({
      transferId,
      simple: {
        found: !!simpleTransfer,
        data: simpleTransfer,
        error: simpleError
      },
      full: {
        found: !!fullTransfer,
        data: fullTransfer,
        error: fullError
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}