import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { client } from '@/lib/sanity';
import { allUsersQuery, searchUsersQuery } from '@/lib/queries';
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
    
    let query = allUsersQuery;
    let params = {};

    if (search) {
      query = searchUsersQuery;
      params = { search };
    } else if (role) {
      query = `*[_type == "user" && role == $role] | order(name asc) {
        _id,
        email,
        name,
        image,
        role,
        active,
        lastLogin,
        location->{_id, name, code}
      }`;
      params = { role };
    }

    const users = await client.fetch(query, params);
    
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
    const existingUser = await client.fetch(
      `*[_type == "user" && email == $email][0]`,
      { email }
    );

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Create new user
    const newUser = await client.create({
      _type: 'user',
      email,
      name,
      role,
      active,
      domain: email.split('@')[1],
      ...(locationId && {
        location: {
          _type: 'reference',
          _ref: locationId
        }
      })
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error('Failed to create user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}