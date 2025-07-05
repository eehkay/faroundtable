import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-server';
import { canManageDealerships } from '@/lib/permissions';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !canManageDealerships(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const { name, address, city, state, zip, phone, email, csvFileName, active } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // Check if dealership exists
    const { data: existing, error: checkError } = await supabaseAdmin
      .from('dealership_locations')
      .select('id')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: 'Dealership not found' },
        { status: 404 }
      );
    }

    // Update dealership
    const { data: updatedDealership, error } = await supabaseAdmin
      .from('dealership_locations')
      .update({
        name,
        address: address || null,
        city: city || null,
        state: state || null,
        zip: zip || null,
        phone: phone || null,
        email: email || null,
        csv_file_name: csvFileName || null,
        active: active !== undefined ? active : true,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating dealership:', error);
      throw error;
    }

    // Transform response
    const transformedDealership = {
      _id: updatedDealership.id,
      name: updatedDealership.name,
      storeId: updatedDealership.code,
      address: updatedDealership.address,
      city: updatedDealership.city,
      state: updatedDealership.state,
      zip: updatedDealership.zip,
      phone: updatedDealership.phone,
      email: updatedDealership.email,
      csvFileName: updatedDealership.csv_file_name,
      active: updatedDealership.active,
      createdAt: updatedDealership.created_at,
      updatedAt: updatedDealership.updated_at
    };

    return NextResponse.json(transformedDealership);
  } catch (error) {
    console.error('Error updating dealership:', error);
    return NextResponse.json(
      { error: 'Failed to update dealership' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !canManageDealerships(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Check if dealership has associated vehicles or users
    const { data: vehicles, error: vehicleError } = await supabaseAdmin
      .from('vehicles')
      .select('id')
      .eq('location_id', id)
      .limit(1);

    if (vehicles && vehicles.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete dealership with associated vehicles' },
        { status: 400 }
      );
    }

    const { data: users, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('location_id', id)
      .limit(1);

    if (users && users.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete dealership with associated users' },
        { status: 400 }
      );
    }

    // Soft delete - just set inactive
    const { data: updatedDealership, error } = await supabaseAdmin
      .from('dealership_locations')
      .update({
        active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error deactivating dealership:', error);
      throw error;
    }

    return NextResponse.json({ message: 'Dealership deactivated successfully' });
  } catch (error) {
    console.error('Error deactivating dealership:', error);
    return NextResponse.json(
      { error: 'Failed to deactivate dealership' },
      { status: 500 }
    );
  }
}