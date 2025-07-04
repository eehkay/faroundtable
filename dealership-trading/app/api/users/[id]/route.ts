import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { client } from '@/lib/sanity';
import { userByIdQuery } from '@/lib/queries';
import { canManageUsers } from '@/lib/permissions';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Allow users to view their own profile or admins to view any profile
    if (session.user.id !== params.id && !canManageUsers(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const user = await client.fetch(userByIdQuery, { userId: params.id });
    
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

    const data = await request.json();
    const { name, role, locationId, active } = data;

    // Build update object
    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (role !== undefined) updates.role = role;
    if (active !== undefined) updates.active = active;
    
    if (locationId !== undefined) {
      if (locationId) {
        updates.location = {
          _type: 'reference',
          _ref: locationId
        };
      } else {
        updates.location = null;
      }
    }

    // Prevent self-demotion from admin
    if (session.user.id === params.id && role && role !== 'admin') {
      return NextResponse.json(
        { error: 'Cannot change your own admin role' },
        { status: 400 }
      );
    }

    const updatedUser = await client
      .patch(params.id)
      .set(updates)
      .commit();

    return NextResponse.json(updatedUser);
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

    // Users can only update their own profile
    if (session.user.id !== params.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const data = await request.json();
    const { name, image, location } = data;

    // Build update object - users can only update limited fields
    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (image !== undefined) updates.image = image;
    
    if (location !== undefined) {
      if (location) {
        updates.location = {
          _type: 'reference',
          _ref: location
        };
      } else {
        updates.location = null;
      }
    }

    const updatedUser = await client
      .patch(params.id)
      .set(updates)
      .commit();

    // Fetch the updated user with references populated
    const populatedUser = await client.fetch(userByIdQuery, { userId: params.id });

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

    // Prevent self-deletion
    if (session.user.id === params.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Instead of deleting, deactivate the user
    const deactivatedUser = await client
      .patch(params.id)
      .set({ active: false })
      .commit();

    return NextResponse.json(deactivatedUser);
  } catch (error) {
    console.error('Failed to deactivate user:', error);
    return NextResponse.json(
      { error: 'Failed to deactivate user' },
      { status: 500 }
    );
  }
}