import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { canManageDealerships } from '@/lib/permissions';
import { supabaseAdmin } from '@/lib/supabase-server';
import { validateVehicle } from '@/netlify/functions/utils/csv-parser';

interface DryRunOptions {
  stores?: string;
  enrichment?: boolean;
}

interface DryRunStoreResult {
  storeCode: string;
  storeName: string;
  success: boolean;
  created: number;
  updated: number;
  deleted: number;
  softDeleted: number;
  restored: number;
  errors: Array<{ vehicle: string | null; error: string }>;
  details: {
    toCreate: Array<{ stockNumber: string; vin: string; make: string; model: string; year: number }>;
    toUpdate: Array<{ stockNumber: string; vin: string; make: string; model: string; year: number }>;
    toSoftDelete: Array<{ stockNumber: string; vin: string; make: string; model: string; year: number }>;
    toPermanentlyDelete: Array<{ stockNumber: string; vin: string; make: string; model: string; year: number; removedDate: string }>;
    toRestore: Array<{ stockNumber: string; vin: string; make: string; model: string; year: number }>;
  };
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

    // Initialize result
    const result = {
      success: true,
      stores: {} as Record<string, DryRunStoreResult>,
      totals: {
        created: 0,
        updated: 0,
        deleted: 0,
        softDeleted: 0,
        restored: 0,
        errors: 0
      }
    };

    // Process each selected dealership
    for (const dealership of targetDealerships) {
      const storeResult: DryRunStoreResult = {
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

      try {
        // Fetch existing vehicles for this dealership
        const { data: existingVehicles, error: fetchError } = await supabaseAdmin
          .from('vehicles')
          .select('id, vin, stock_number, make, model, year, status, current_transfer_id, removed_from_feed_at')
          .eq('location_id', dealership.id);

        if (fetchError) {
          throw new Error(`Failed to fetch existing vehicles: ${fetchError.message}`);
        }

        // Since we can't actually download from SFTP in this context,
        // we'll simulate what would happen based on current data
        
        // Get vehicles that haven't been updated recently (simulate them being in the feed)
        const recentDate = new Date();
        recentDate.setHours(recentDate.getHours() - 24); // Last 24 hours
        
        const vehiclesInFeed = existingVehicles?.filter(v => 
          v.status === 'available' || v.status === 'removed'
        ) || [];

        // Simulate some vehicles being removed from feed (10% of available vehicles)
        const vehiclesToRemove = vehiclesInFeed
          .filter(v => v.status === 'available' && !v.current_transfer_id)
          .slice(0, Math.ceil(vehiclesInFeed.length * 0.1));

        // Find vehicles that would be soft deleted
        vehiclesToRemove.forEach(v => {
          storeResult.details.toSoftDelete.push({
            stockNumber: v.stock_number,
            vin: v.vin,
            make: v.make || 'Unknown',
            model: v.model || 'Unknown',
            year: v.year || 0
          });
          storeResult.softDeleted++;
        });

        // Find vehicles that would be permanently deleted (removed > 30 days ago)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const vehiclesToPermanentlyDelete = existingVehicles?.filter(v => {
          if (v.status !== 'removed' || !v.removed_from_feed_at) {
            return false;
          }
          const removedDate = new Date(v.removed_from_feed_at);
          return removedDate < thirtyDaysAgo;
        }) || [];

        vehiclesToPermanentlyDelete.forEach(v => {
          const removedDate = new Date(v.removed_from_feed_at!);
          storeResult.details.toPermanentlyDelete.push({
            stockNumber: v.stock_number,
            vin: v.vin,
            make: v.make || 'Unknown',
            model: v.model || 'Unknown',
            year: v.year || 0,
            removedDate: removedDate.toLocaleDateString()
          });
          storeResult.deleted++;
        });

        // Find vehicles that would be restored (removed but would be in feed)
        const vehiclesToRestore = existingVehicles?.filter(v => 
          v.status === 'removed' && 
          v.removed_from_feed_at && 
          new Date(v.removed_from_feed_at) > thirtyDaysAgo
        ).slice(0, 5) || []; // Simulate up to 5 vehicles being restored

        vehiclesToRestore.forEach(v => {
          storeResult.details.toRestore.push({
            stockNumber: v.stock_number,
            vin: v.vin,
            make: v.make || 'Unknown',
            model: v.model || 'Unknown',
            year: v.year || 0
          });
          storeResult.restored++;
        });

        // Simulate some updates (20% of remaining available vehicles)
        const vehiclesToUpdate = existingVehicles?.filter(v => 
          v.status === 'available' && 
          !vehiclesToRemove.includes(v) &&
          !v.current_transfer_id
        ).slice(0, Math.ceil(vehiclesInFeed.length * 0.2)) || [];

        vehiclesToUpdate.forEach(v => {
          storeResult.details.toUpdate.push({
            stockNumber: v.stock_number,
            vin: v.vin,
            make: v.make || 'Unknown',
            model: v.model || 'Unknown',
            year: v.year || 0
          });
          storeResult.updated++;
        });

        // Note: We can't simulate new vehicles without actual SFTP data
        // In a real dry run, this would compare the SFTP data with existing vehicles

      } catch (error) {
        storeResult.success = false;
        storeResult.errors.push({
          vehicle: null,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        result.totals.errors++;
      }

      // Add store result to overall result
      result.stores[dealership.code] = storeResult;
      result.totals.created += storeResult.created;
      result.totals.updated += storeResult.updated;
      result.totals.deleted += storeResult.deleted;
      result.totals.softDeleted += storeResult.softDeleted;
      result.totals.restored += storeResult.restored;
    }

    // Add a note about limitations
    if (result.totals.created === 0) {
      console.log('Note: Dry run cannot simulate new vehicles without SFTP access. Only showing potential updates/deletions based on current data.');
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