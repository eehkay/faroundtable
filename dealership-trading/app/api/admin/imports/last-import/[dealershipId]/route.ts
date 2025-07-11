import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ dealershipId: string }> }
) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { dealershipId } = await params;

  try {
    // Get the most recent import log
    const { data: lastImport, error: importError } = await supabaseAdmin
      .from('import_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    if (importError && importError.code !== 'PGRST116') { // Not found is ok
      return NextResponse.json({ error: 'Failed to fetch import status' }, { status: 500 });
    }

    if (!lastImport) {
      return NextResponse.json({ lastImport: null });
    }

    // Parse details and find this dealership's results
    const details = typeof lastImport.details === 'string' 
      ? JSON.parse(lastImport.details) 
      : lastImport.details;

    // Get dealership code and import settings from ID
    const { data: dealership } = await supabaseAdmin
      .from('dealership_locations')
      .select('code, enable_csv_import')
      .eq('id', dealershipId)
      .single();

    if (!dealership) {
      return NextResponse.json({ lastImport: null });
    }

    // If CSV import is disabled for this dealership, return null
    if (!dealership.enable_csv_import) {
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}