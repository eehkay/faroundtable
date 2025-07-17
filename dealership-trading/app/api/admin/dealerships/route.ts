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
        throw error;
    }

    // Transform to match frontend format
    const transformedDealerships = dealerships?.map(dealership => ({
      _id: dealership.id,
      name: dealership.name,
      code: dealership.code,
      address: dealership.address,
      city: dealership.city,
      state: dealership.state,
      zip: dealership.zip,
      phone: dealership.phone,
      email: dealership.email,
      csvFileName: dealership.csv_file_name,
      emailDomains: dealership.email_domains,
      enableCsvImport: dealership.enable_csv_import,
      active: dealership.active,
      latitude: dealership.latitude,
      longitude: dealership.longitude,
      city_state: dealership.city_state,
      dataforseo_location_code: dealership.dataforseo_location_code,
      createdAt: dealership.created_at,
      updatedAt: dealership.updated_at
    })) || [];

    return NextResponse.json(transformedDealerships);
  } catch (error) {
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
    const { name, code, address, city, state, zip, phone, email, csvFileName, emailDomains, enableCsvImport, active, latitude, longitude, city_state } = body;

    // Validate required fields
    if (!name || !code) {
      return NextResponse.json(
        { error: 'Name and store code are required' },
        { status: 400 }
      );
    }

    // Check if store code already exists
    const { data: existing, error: checkError } = await supabaseAdmin
      .from('dealership_locations')
      .select('id')
      .eq('code', code)
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
        code: code,
        address: address || null,
        city: city || null,
        state: state || null,
        zip: zip || null,
        phone: phone || null,
        email: email || null,
        csv_file_name: csvFileName || null,
        email_domains: Array.isArray(emailDomains) ? emailDomains : [],
        enable_csv_import: enableCsvImport !== undefined ? enableCsvImport : true,
        active: active !== undefined ? active : true,
        latitude: latitude || null,
        longitude: longitude || null,
        city_state: city_state || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
        throw error;
    }

    // Transform response
    const transformedDealership = {
      _id: newDealership.id,
      name: newDealership.name,
      code: newDealership.code,
      address: newDealership.address,
      city: newDealership.city,
      state: newDealership.state,
      zip: newDealership.zip,
      phone: newDealership.phone,
      email: newDealership.email,
      csvFileName: newDealership.csv_file_name,
      emailDomains: newDealership.email_domains,
      enableCsvImport: newDealership.enable_csv_import,
      active: newDealership.active,
      latitude: newDealership.latitude,
      longitude: newDealership.longitude,
      city_state: newDealership.city_state,
      createdAt: newDealership.created_at,
      updatedAt: newDealership.updated_at
    };

    return NextResponse.json(transformedDealership, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create dealership' },
      { status: 500 }
    );
  }
}