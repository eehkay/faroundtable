import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-server';

// GET /api/admin/notification-rules/[id] - Get single rule
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from('notification_rules')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
      }
      console.error('Error fetching rule:', error);
      return NextResponse.json({ error: 'Failed to fetch rule' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET /api/admin/notification-rules/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/admin/notification-rules/[id] - Update rule
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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
      conditions,
      conditionLogic,
      recipients,
      channels,
      priority,
      active
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
      .update({
        name,
        description,
        event,
        conditions,
        condition_logic: conditionLogic,
        recipients,
        channels,
        priority,
        active,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
      }
      console.error('Error updating rule:', error);
      return NextResponse.json({ error: 'Failed to update rule' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in PUT /api/admin/notification-rules/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/notification-rules/[id] - Delete rule
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabaseAdmin
      .from('notification_rules')
      .delete()
      .eq('id', id);

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
      }
      console.error('Error deleting rule:', error);
      return NextResponse.json({ error: 'Failed to delete rule' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/admin/notification-rules/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}