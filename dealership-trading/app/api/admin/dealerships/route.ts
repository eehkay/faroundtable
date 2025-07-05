import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-server';
import { canManageDealerships } from '@/lib/permissions';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !canManageDealerships(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: dealerships, error } = await supabaseAdmin
      .from('dealership_locations')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    // Transform to match frontend format
    const transformedDealerships = dealerships?.map(dealership => ({
      _id: dealership.id,
      name: dealership.name,
      storeId: dealership.code,
      address: dealership.address,
      city: dealership.city,
      state: dealership.state,
      zip: dealership.zip,
      phone: dealership.phone,
      email: dealership.email,
      csvFileName: dealership.csv_file_name,
      active: dealership.active,
      createdAt: dealership.created_at,
      updatedAt: dealership.updated_at
    })) || [];

    return NextResponse.json(transformedDealerships);
  } catch (error) {
    console.error('Error fetching dealerships:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dealerships' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !canManageDealerships(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, storeId, address, city, state, zip, phone, email, csvFileName, active } = body;

    // Validate required fields
    if (!name || !storeId) {
      return NextResponse.json(
        { error: 'Name and store code are required' },
        { status: 400 }
      );
    }

    // Check if store code already exists
    const { data: existing, error: checkError } = await supabaseAdmin
      .from('dealership_locations')
      .select('id')
      .eq('code', storeId)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Store code already exists' },
        { status: 400 }
      );
    }

    // Create new dealership
    const { data: newDealership, error } = await supabaseAdmin
      .from('dealership_locations')
      .insert({
        name,
        code: storeId,
        address: address || null,
        city: city || null,
        state: state || null,
        zip: zip || null,
        phone: phone || null,
        email: email || null,
        csv_file_name: csvFileName || null,
        active: active !== undefined ? active : true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating dealership:', error);
      throw error;
    }

    // Transform response
    const transformedDealership = {
      _id: newDealership.id,
      name: newDealership.name,
      storeId: newDealership.code,
      address: newDealership.address,
      city: newDealership.city,
      state: newDealership.state,
      zip: newDealership.zip,
      phone: newDealership.phone,
      email: newDealership.email,
      csvFileName: newDealership.csv_file_name,
      active: newDealership.active,
      createdAt: newDealership.created_at,
      updatedAt: newDealership.updated_at
    };

    return NextResponse.json(transformedDealership, { status: 201 });
  } catch (error) {
    console.error('Error creating dealership:', error);
    return NextResponse.json(
      { error: 'Failed to create dealership' },
      { status: 500 }
    );
  }
}