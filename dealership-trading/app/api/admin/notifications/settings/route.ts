import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-server';

const SINGLETON_ID = '00000000-0000-0000-0000-000000000001';

// GET email settings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin permission
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (user?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get email config
    const { data, error } = await supabaseAdmin
      .from('email_config')
      .select('*')
      .eq('id', SINGLETON_ID)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error fetching email config:', error);
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }

    // If no config exists, return defaults
    if (!data) {
      return NextResponse.json({
        id: SINGLETON_ID,
        from_name: 'Round Table',
        from_email: 'notifications@roundtable.app',
        reply_to_email: '',
        footer_text: '',
        footer_html: '',
        company_address: '',
        unsubscribe_text: 'Unsubscribe from these notifications',
        bcc_email: '',
        rate_limit_per_hour: 1000,
        rate_limit_per_day: 10000,
        quiet_hours_enabled: false,
        quiet_hours_start: '22:00:00',
        quiet_hours_end: '08:00:00',
        default_timezone: 'America/New_York',
        test_mode_enabled: false,
        test_email_address: '',
        tracking_enabled: true,
        bounce_email: '',
        email_domain: '',
        custom_headers: {}
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET email settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT update email settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin permission
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (user?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    
    // Validate email addresses
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (body.from_email && !emailRegex.test(body.from_email)) {
      return NextResponse.json({ error: 'Invalid from email address' }, { status: 400 });
    }
    
    if (body.reply_to_email && !emailRegex.test(body.reply_to_email)) {
      return NextResponse.json({ error: 'Invalid reply-to email address' }, { status: 400 });
    }
    
    if (body.bcc_email && !emailRegex.test(body.bcc_email)) {
      return NextResponse.json({ error: 'Invalid BCC email address' }, { status: 400 });
    }
    
    if (body.test_email_address && !emailRegex.test(body.test_email_address)) {
      return NextResponse.json({ error: 'Invalid test email address' }, { status: 400 });
    }
    
    if (body.bounce_email && !emailRegex.test(body.bounce_email)) {
      return NextResponse.json({ error: 'Invalid bounce email address' }, { status: 400 });
    }

    // Remove fields that shouldn't be updated
    delete body.id;
    delete body.created_at;
    
    // Add metadata
    body.updated_at = new Date().toISOString();
    body.updated_by = session.user.id;

    // Upsert the settings
    const { data, error } = await supabaseAdmin
      .from('email_config')
      .upsert({
        id: SINGLETON_ID,
        ...body
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating email config:', error);
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }

    // Log the update
    await supabaseAdmin
      .from('activities')
      .insert({
        type: 'settings_updated',
        description: 'Email settings updated',
        user_id: session.user.id,
        metadata: {
          changes: Object.keys(body).filter(k => !['updated_at', 'updated_by'].includes(k))
        }
      });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in PUT email settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}