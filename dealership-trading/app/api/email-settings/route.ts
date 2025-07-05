import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/permissions';
import { supabaseAdmin } from '@/lib/supabase-server';

// GET all email settings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !isAdmin(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from('email_settings')
      .select('*')
      .order('setting_key');

    if (error) {
      console.error('Error fetching email settings:', error);
      return NextResponse.json({ error: 'Failed to fetch email settings' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET email settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST/PUT upsert email settings
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !isAdmin(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { setting_key, enabled, recipients, template, subject, metadata } = body;

    if (!setting_key) {
      return NextResponse.json({ error: 'setting_key is required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('email_settings')
      .upsert({
        setting_key,
        enabled: enabled ?? true,
        recipients: recipients || [],
        template: template || null,
        subject: subject || null,
        metadata: metadata || {},
        updated_at: new Date().toISOString(),
        updated_by_id: session.user.id
      }, {
        onConflict: 'setting_key'
      })
      .select()
      .single();

    if (error) {
      console.error('Error upserting email settings:', error);
      return NextResponse.json({ error: 'Failed to save email settings' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in POST email settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}