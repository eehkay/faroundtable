import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-server';
import { handleSMSOptIn, handleSMSOptOut, cleanPhoneNumber, isValidPhoneNumber } from '@/lib/sms/service';

// GET /api/user/sms - Get current SMS preferences
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('phone, phone_verified, sms_opt_in, sms_opt_in_date, sms_opt_out_date')
      .eq('id', session.user.id)
      .single();

    if (error) {
      console.error('Error fetching SMS preferences:', error);
      return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
    }

    return NextResponse.json({
      phone: user?.phone || null,
      phoneVerified: user?.phone_verified || false,
      smsOptIn: user?.sms_opt_in || false,
      smsOptInDate: user?.sms_opt_in_date || null,
      smsOptOutDate: user?.sms_opt_out_date || null
    });
  } catch (error) {
    console.error('Error in GET /api/user/sms:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/user/sms - Update SMS preferences
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { phone, optIn } = body;

    // Get client IP and user agent for consent logging
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    if (optIn && phone) {
      // Handle opt-in with phone number
      const cleanedPhone = cleanPhoneNumber(phone);
      
      if (!isValidPhoneNumber(cleanedPhone)) {
        return NextResponse.json(
          { error: 'Invalid phone number format' }, 
          { status: 400 }
        );
      }

      const result = await handleSMSOptIn(
        session.user.id,
        cleanedPhone,
        'web',
        ipAddress,
        userAgent
      );

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Failed to opt-in' }, 
          { status: 400 }
        );
      }

      return NextResponse.json({ 
        success: true,
        message: 'Successfully opted in to SMS notifications' 
      });
    } else if (!optIn) {
      // Handle opt-out
      const result = await handleSMSOptOut(
        session.user.id,
        'web',
        ipAddress,
        userAgent
      );

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Failed to opt-out' }, 
          { status: 400 }
        );
      }

      return NextResponse.json({ 
        success: true,
        message: 'Successfully opted out of SMS notifications' 
      });
    } else {
      return NextResponse.json(
        { error: 'Phone number required for opt-in' }, 
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error in POST /api/user/sms:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/user/sms - Update phone number only
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { phone } = body;

    if (!phone) {
      return NextResponse.json({ error: 'Phone number required' }, { status: 400 });
    }

    const cleanedPhone = cleanPhoneNumber(phone);
    
    if (!isValidPhoneNumber(cleanedPhone)) {
      return NextResponse.json(
        { error: 'Invalid phone number format' }, 
        { status: 400 }
      );
    }

    // Update phone number without changing opt-in status
    const { error } = await supabaseAdmin
      .from('users')
      .update({
        phone: cleanedPhone,
        phone_verified: false // Reset verification when phone changes
      })
      .eq('id', session.user.id);

    if (error) {
      console.error('Error updating phone number:', error);
      return NextResponse.json({ error: 'Failed to update phone number' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Phone number updated successfully',
      phone: cleanedPhone
    });
  } catch (error) {
    console.error('Error in PUT /api/user/sms:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}