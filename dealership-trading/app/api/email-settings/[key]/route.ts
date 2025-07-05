import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/permissions';
import { supabaseAdmin } from '@/lib/supabase-server';

// GET specific email setting by key
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !isAdmin(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { key } = await params;

    const { data, error } = await supabaseAdmin
      .from('email_settings')
      .select('*')
      .eq('setting_key', key)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Email setting not found' }, { status: 404 });
      }
      console.error('Error fetching email setting:', error);
      return NextResponse.json({ error: 'Failed to fetch email setting' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET email setting:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE specific email setting
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !isAdmin(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { key } = await params;

    const { error } = await supabaseAdmin
      .from('email_settings')
      .delete()
      .eq('setting_key', key);

    if (error) {
      console.error('Error deleting email setting:', error);
      return NextResponse.json({ error: 'Failed to delete email setting' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE email setting:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}