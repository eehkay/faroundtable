import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { canManageDealerships } from '@/lib/permissions';
import { supabaseAdmin } from '@/lib/supabase-server';

interface DryRunOptions {
  stores?: string;
  enrichment?: boolean;
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!canManageDealerships(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const options: DryRunOptions = await request.json();
    
    // Fetch active dealerships
    const { data: dealerships, error: dealershipError } = await supabaseAdmin
      .from('dealership_locations')
      .select('*')
      .eq('active', true);

    if (dealershipError) {
      throw new Error(`Failed to fetch dealerships: ${dealershipError.message}`);
    }

    // Filter dealerships based on stores option
    let targetDealerships = dealerships || [];
    if (options.stores && options.stores !== 'all') {
      const storeCodes = options.stores.split(',').map(s => s.trim());
      targetDealerships = targetDealerships.filter(d => storeCodes.includes(d.code));
    }

    // For now, return a mock dry run result
    // NOTE: Actual dry run with SFTP should be implemented server-side only
    // to avoid webpack build issues with native Node.js modules
    // The GitHub Actions workflow handles the real SFTP connection
    const result = {
      success: true,
      stores: {} as Record<string, any>,
      totals: {
        created: 0,
        updated: 0,
        deleted: 0,
        softDeleted: 0,
        restored: 0,
        errors: 0
      }
    };

    // Add mock data for each selected dealership
    for (const dealership of targetDealerships) {
      result.stores[dealership.code] = {
        storeCode: dealership.code,
        storeName: dealership.name,
        success: true,
        created: 0,
        updated: 0,
        deleted: 0,
        softDeleted: 0,
        restored: 0,
        errors: [],
        details: {
          toCreate: [],
          toUpdate: [],
          toSoftDelete: [],
          toPermanentlyDelete: [],
          toRestore: []
        }
      };
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Dry run failed:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Dry run failed',
      success: false 
    }, { status: 500 });
  }
}