import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin permission
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('role, location_id')
      .eq('id', session.user.id)
      .single();

    if (!user || !['admin', 'manager'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;
    const channel = searchParams.get('channel');
    const status = searchParams.get('status');
    const templateId = searchParams.get('templateId');

    // Build query
    let query = supabaseAdmin
      .from('notification_activity')
      .select(`
        *,
        notification_templates!template_id (
          name,
          category
        ),
        vehicles!vehicle_id (
          year,
          make,
          model,
          stock_number
        ),
        transfers!transfer_id (
          id,
          from_location:dealership_locations!from_location_id(name),
          to_location:dealership_locations!to_location_id(name)
        ),
        users!user_id (
          name,
          email
        ),
        dealership_locations!location_id (
          name
        )
      `, { count: 'exact' });

    // Apply filters
    if (channel) {
      query = query.eq('channel', channel);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (templateId) {
      query = query.eq('template_id', templateId);
    }

    // Managers can only see their location's activity
    if (user.role === 'manager') {
      query = query.eq('location_id', user.location_id);
    }

    // Execute query
    const { data: activities, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Format the response
    const formattedActivities = activities?.map(activity => ({
      id: activity.id,
      template: activity.notification_templates?.name || 'Manual',
      category: activity.notification_templates?.category || 'general',
      event: activity.event,
      channel: activity.channel,
      status: activity.status,
      recipients: activity.recipients,
      subject: activity.subject,
      error_message: activity.error_message,
      retry_count: activity.retry_count,
      created_at: activity.created_at,
      sent_at: activity.sent_at,
      delivered_at: activity.delivered_at,
      opened_at: activity.opened_at,
      clicked_at: activity.clicked_at,
      failed_at: activity.failed_at,
      vehicle: activity.vehicles ? {
        description: `${activity.vehicles.year} ${activity.vehicles.make} ${activity.vehicles.model}`,
        stock_number: activity.vehicles.stock_number
      } : null,
      transfer: activity.transfers ? {
        id: activity.transfers.id,
        route: `${activity.transfers.from_location.name} → ${activity.transfers.to_location.name}`
      } : null,
      user: activity.users ? {
        name: activity.users.name || activity.users.email,
        email: activity.users.email
      } : null,
      location: activity.dealership_locations?.name
    }));

    return NextResponse.json({
      activities: formattedActivities,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching notification activity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity data' },
      { status: 500 }
    );
  }
}