import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-server';
import type { NotificationRule } from '@/types/notifications';

// GET /api/admin/notification-rules - List all rules
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const event = searchParams.get('event');
    const active = searchParams.get('active');

    let query = supabaseAdmin
      .from('notification_rules')
      .select('*')
      .order('priority', { ascending: false })
      .order('name', { ascending: true });

    if (event) {
      query = query.eq('event', event);
    }

    if (active !== null) {
      query = query.eq('active', active === 'true');
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching rules:', error);
      return NextResponse.json({ error: 'Failed to fetch rules' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET /api/admin/notification-rules:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/notification-rules - Create new rule
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      event,
      conditions = [],
      conditionLogic = 'AND',
      recipients,
      channels,
      priority = 0,
      active = true
    } = body;

    // Validate required fields
    if (!name || !event || !recipients || !channels) {
      return NextResponse.json(
        { error: 'Name, event, recipients, and channels are required' },
        { status: 400 }
      );
    }

    // Validate channels structure
    if (!channels.email && !channels.sms) {
      return NextResponse.json(
        { error: 'At least one channel must be configured' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('notification_rules')
      .insert({
        name,
        description,
        event,
        conditions,
        condition_logic: conditionLogic,
        recipients,
        channels,
        priority,
        active
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating rule:', error);
      return NextResponse.json({ error: 'Failed to create rule' }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/admin/notification-rules:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}