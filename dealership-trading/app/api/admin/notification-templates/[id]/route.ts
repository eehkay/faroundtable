import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-server';

// GET /api/admin/notification-templates/[id] - Get single template
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
      .from('notification_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Failed to fetch template' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/admin/notification-templates/[id] - Update template
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
    const { name, description, category, channels, active } = body;

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
      .update({
        name,
        description,
        category,
        channels,
        active,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 });
      }
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { error: 'A template with this name already exists' }, 
          { status: 400 }
        );
      }
      return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/notification-templates/[id] - Delete template
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

        
    // Check if template is in use
    const { data: emailSettings } = await supabaseAdmin
      .from('email_settings')
      .select('id')
      .eq('template_id', id)
      .limit(1);

    if (emailSettings && emailSettings.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete template that is currently in use' }, 
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('notification_templates')
      .delete()
      .eq('id', id);

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}