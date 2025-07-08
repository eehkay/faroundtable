import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data: dealerships, error } = await supabaseAdmin
      .from('dealership_locations')
      .select('id, name, code, csv_file_name')
      .eq('active', true)
      .order('name');

    if (error) {
      console.error('Failed to fetch dealerships:', error);
      return NextResponse.json({ error: 'Failed to fetch dealerships' }, { status: 500 });
    }

    return NextResponse.json(dealerships || []);
  } catch (error) {
    console.error('Error in dealerships API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}