import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: dealerships, error } = await supabaseAdmin
      .from('dealership_locations')
      .select('id, name, code, address, phone, email, email_domains')
      .order('name', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    // Transform to match existing format
    const transformedDealerships = dealerships?.map(dealership => ({
      _id: dealership.id,
      name: dealership.name,
      code: dealership.code,
      address: dealership.address,
      phone: dealership.phone,
      email: dealership.email,
      emailDomains: dealership.email_domains
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