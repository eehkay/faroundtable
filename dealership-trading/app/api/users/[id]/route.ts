import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-server';
import { getUserById } from '@/lib/queries-supabase';
import { canManageUsers } from '@/lib/permissions';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Await the params to get the id
    const { id } = await params;

    // Allow users to view their own profile or admins to view any profile
    if (session.user.id !== id && !canManageUsers(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const user = await getUserById(id);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Failed to fetch user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !canManageUsers(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Await the params to get the id
    const { id } = await params;

    const data = await request.json();
    const { name, role, locationId, active } = data;

    // Build update object
    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (role !== undefined) updates.role = role;
    if (active !== undefined) updates.active = active;
    if (locationId !== undefined) updates.location_id = locationId || null;

    // Prevent self-demotion from admin
    if (session.user.id === id && role && role !== 'admin') {
      return NextResponse.json(
        { error: 'Cannot change your own admin role' },
        { status: 400 }
      );
    }

    const { data: updatedUser, error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Failed to update user:', error);
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      );
    }

    // Transform to match existing format
    const transformedUser = {
      _id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
      active: updatedUser.active
    };

    return NextResponse.json(transformedUser);
  } catch (error) {
    console.error('Failed to update user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Await the params to get the id
    const { id } = await params;

    // Users can only update their own profile
    if (session.user.id !== id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const data = await request.json();
    const { name, image, location } = data;

    // Build update object - users can only update limited fields
    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (image !== undefined) updates.image_url = image;
    if (location !== undefined) updates.location_id = location || null;

    const { data: updatedUser, error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Failed to update user profile:', error);
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    // Fetch the updated user with references populated
    const populatedUser = await getUserById(id);

    return NextResponse.json(populatedUser);
  } catch (error) {
    console.error('Failed to update user profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !canManageUsers(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Await the params to get the id
    const { id } = await params;

    // Prevent self-deletion
    if (session.user.id === id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Instead of deleting, deactivate the user
    const { data: deactivatedUser, error } = await supabaseAdmin
      .from('users')
      .update({ active: false })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Failed to deactivate user:', error);
      return NextResponse.json(
        { error: 'Failed to deactivate user' },
        { status: 500 }
      );
    }

    // Transform to match existing format
    const transformedUser = {
      _id: deactivatedUser.id,
      email: deactivatedUser.email,
      name: deactivatedUser.name,
      role: deactivatedUser.role,
      active: deactivatedUser.active
    };

    return NextResponse.json(transformedUser);
  } catch (error) {
    console.error('Failed to deactivate user:', error);
    return NextResponse.json(
      { error: 'Failed to deactivate user' },
      { status: 500 }
    );
  }
}