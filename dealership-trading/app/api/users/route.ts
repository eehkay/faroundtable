import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-server';
import { canManageUsers } from '@/lib/permissions';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !canManageUsers(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const role = searchParams.get('role');
    
    // Build the query
    let query = supabaseAdmin
      .from('users')
      .select(`
        id,
        email,
        name,
        image_url,
        domain,
        role,
        active,
        last_login,
        location:location_id(
          id,
          name,
          code
        )
      `)
      .order('name', { ascending: true });

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }
    
    if (role) {
      query = query.eq('role', role);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch users:', error);
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }

    // Transform to match existing format
    const users = data?.map((user: any) => ({
      _id: user.id,
      email: user.email,
      name: user.name,
      image: user.image_url,
      domain: user.domain,
      role: user.role,
      active: user.active,
      lastLogin: user.last_login,
      location: user.location ? {
        _id: user.location.id,
        name: user.location.name,
        code: user.location.code
      } : undefined
    })) || [];
    
    return NextResponse.json(users);
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !canManageUsers(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const data = await request.json();
    const { email, name, role, locationId, active = true } = data;

    // Validate required fields
    if (!email || !name || !role) {
      return NextResponse.json(
        { error: 'Email, name, and role are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Create new user
    const { data: newUser, error } = await supabaseAdmin
      .from('users')
      .insert({
        email,
        name,
        role,
        active,
        domain: email.split('@')[1],
        location_id: locationId || null
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create user:', error);
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // Transform to match existing format
    const transformedUser = {
      _id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      active: newUser.active,
      domain: newUser.domain
    };

    return NextResponse.json(transformedUser, { status: 201 });
  } catch (error) {
    console.error('Failed to create user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}