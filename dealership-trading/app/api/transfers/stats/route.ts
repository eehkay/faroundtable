import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { canViewTransfers } from '@/lib/permissions';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !canViewTransfers(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get filters from query params
    const searchParams = request.nextUrl.searchParams;
    const locationIds = searchParams.get('locations')?.split(',').filter(Boolean);
    const includeDelivered = searchParams.get('includeDelivered') === 'true';

    // Build base query
    let query = supabase
      .from('transfers')
      .select('status', { count: 'exact', head: true });

    // Apply location filter if provided
    if (locationIds && locationIds.length > 0) {
      query = query.or(
        locationIds.map(id => `from_location_id.eq.${id},to_location_id.eq.${id}`).join(',')
      );
    }

    // For sales role, only show their own requests or transfers involving their location
    if (session.user.role === 'sales' && session.user.location?.id) {
      query = query.or(
        `requested_by_id.eq.${session.user.id},from_location_id.eq.${session.user.location.id},to_location_id.eq.${session.user.location.id}`
      );
    }

    // Get counts for each status
    const statuses = ['requested', 'approved', 'in-transit', 'delivered', 'cancelled', 'rejected'];
    const statusCounts: Record<string, number> = {};

    // Fetch count for each status
    for (const status of statuses) {
      // Create a fresh query for each status
      let statusQuery = supabase
        .from('transfers')
        .select('status', { count: 'exact', head: true })
        .eq('status', status);

      // Apply location filter if provided
      if (locationIds && locationIds.length > 0) {
        statusQuery = statusQuery.or(
          locationIds.map(id => `from_location_id.eq.${id},to_location_id.eq.${id}`).join(',')
        );
      }

      // For sales role, only show their own requests or transfers involving their location
      if (session.user.role === 'sales' && session.user.location?.id) {
        statusQuery = statusQuery.or(
          `requested_by_id.eq.${session.user.id},from_location_id.eq.${session.user.location.id},to_location_id.eq.${session.user.location.id}`
        );
      }

      const { count, error } = await statusQuery;
      
      if (error) {
        console.error(`Error fetching count for status ${status}:`, error);
        statusCounts[status] = 0;
      } else {
        statusCounts[status] = count || 0;
      }
    }

    // Calculate total
    const total = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);

    return NextResponse.json({
      statusCounts,
      total,
      breakdown: {
        active: statusCounts['requested'] + statusCounts['approved'] + statusCounts['in-transit'],
        completed: statusCounts['delivered'],
        cancelled: statusCounts['cancelled'] + statusCounts['rejected']
      }
    });
  } catch (error) {
    console.error('Error fetching transfer stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transfer statistics' },
      { status: 500 }
    );
  }
}