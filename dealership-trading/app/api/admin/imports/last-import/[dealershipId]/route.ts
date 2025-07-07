import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: { dealershipId: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get the most recent import log
    const { data: lastImport, error: importError } = await supabase
      .from('import_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    if (importError && importError.code !== 'PGRST116') { // Not found is ok
      console.error('Failed to fetch last import:', importError);
      return NextResponse.json({ error: 'Failed to fetch import status' }, { status: 500 });
    }

    if (!lastImport) {
      return NextResponse.json({ lastImport: null });
    }

    // Parse details and find this dealership's results
    const details = typeof lastImport.details === 'string' 
      ? JSON.parse(lastImport.details) 
      : lastImport.details;

    // Get dealership code from ID
    const { data: dealership } = await supabase
      .from('dealership_locations')
      .select('code')
      .eq('id', params.dealershipId)
      .single();

    if (!dealership) {
      return NextResponse.json({ lastImport: null });
    }

    // Find this store's results
    const storeResult = details.stores_processed?.find(
      (store: any) => store.storeCode === dealership.code
    );

    return NextResponse.json({
      lastImport: {
        timestamp: lastImport.timestamp,
        success: storeResult?.success || false,
        created: storeResult?.created || 0,
        updated: storeResult?.updated || 0,
        deleted: storeResult?.deleted || 0,
        errors: storeResult?.errors?.length || 0
      }
    });
  } catch (error) {
    console.error('Error fetching dealership import status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}