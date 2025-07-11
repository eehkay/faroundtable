import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-server';
import type { NotificationTemplate } from '@/types/notifications';

// GET /api/admin/notification-templates - List all templates
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const active = searchParams.get('active');

    let query = supabaseAdmin
      .from('notification_templates')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (category) {
      query = query.eq('category', category);
    }

    if (active !== null) {
      query = query.eq('active', active === 'true');
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/notification-templates - Create new template
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, category, channels, active = true } = body;

    // Validate required fields
    if (!name || !category || !channels) {
      return NextResponse.json(
        { error: 'Name, category, and channels are required' }, 
        { status: 400 }
      );
    }

    // Validate channels structure
    if (!channels.email && !channels.sms) {
      return NextResponse.json(
        { error: 'At least one channel (email or SMS) must be configured' }, 
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('notification_templates')
      .insert({
        name,
        description,
        category,
        channels,
        active
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { error: 'A template with this name already exists' }, 
          { status: 400 }
        );
      }
      return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}