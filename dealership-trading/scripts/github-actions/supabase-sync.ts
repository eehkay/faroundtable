import { createClient } from '@supabase/supabase-js';
import type { DealershipLocation } from '@/types/vehicle';
import type { SyncResult } from './types/import';
import { validateVehicle } from '../../netlify/functions/utils/csv-parser';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function syncToSupabase(
  vehicles: any[],
  dealership: DealershipLocation
): Promise<SyncResult> {
  const result: SyncResult = {
    created: 0,
    updated: 0,
    deleted: 0,
    preserved: 0
  };

  const dryRun = process.env.DRY_RUN === 'true';
  
  if (dryRun) {
    console.log('    🔍 DRY RUN MODE - No changes will be made');
  }

  try {
    // 1. Validate all vehicles
    const validVehicles = [];
    const invalidCount = 0;

    for (const vehicle of vehicles) {
      const validation = validateVehicle(vehicle);
      if (validation.isValid) {
        validVehicles.push({
          ...vehicle,
          location_id: dealership.id,
          original_location_id: dealership.id
        });
      } else {
        console.warn(`    ⚠️  Invalid vehicle ${vehicle.stockNumber}:`, validation.errors.join(', '));
      }
    }

    console.log(`    ✅ ${validVehicles.length} valid vehicles, ${invalidCount} invalid`);

    // 2. Get existing vehicles for this dealership
    const { data: existingVehicles, error: fetchError } = await supabase
      .from('vehicles')
      .select('id, vin, stock_number, status, current_transfer_id, removed_from_feed_at')
      .eq('location_id', dealership.id);

    if (fetchError) {
      throw new Error(`Failed to fetch existing vehicles: ${fetchError.message}`);
    }

    // Create maps for quick lookup
    const existingByVin = new Map(existingVehicles?.map(v => [v.vin, v]) || []);
    const existingByStock = new Map(existingVehicles?.map(v => [v.stock_number, v]) || []);
    const incomingVins = new Set(validVehicles.map(v => v.vin));

    // 3. Separate vehicles into create/update lists
    const toCreate = [];
    const toUpdate = [];

    for (const vehicle of validVehicles) {
      const existing = existingByVin.get(vehicle.vin) || existingByStock.get(vehicle.stockNumber);
      
      if (existing) {
        // Skip vehicles with active transfers
        if (existing.current_transfer_id && ['claimed', 'in-transit'].includes(existing.status)) {
          console.log(`    🔒 Preserving vehicle ${vehicle.stockNumber} - active transfer`);
          result.preserved++;
          continue;
        }

        toUpdate.push({
          ...vehicle,
          id: existing.id,
          // Preserve certain fields during update
          status: existing.status === 'delivered' ? 'available' : existing.status,
          current_transfer_id: existing.current_transfer_id,
          removed_from_feed_at: null // Clear if it was previously removed
        });
      } else {
        toCreate.push(vehicle);
      }
    }

    // 4. Find vehicles to soft delete (not in feed and no active transfers)
    const toSoftDelete = existingVehicles?.filter(existing => {
      const stillInFeed = incomingVins.has(existing.vin);
      const hasActiveTransfer = existing.current_transfer_id && 
        ['claimed', 'in-transit'].includes(existing.status);
      
      // Don't soft delete if already removed or has active transfer
      return !stillInFeed && !hasActiveTransfer && existing.status !== 'removed';
    }) || [];

    // 5. Find vehicles that returned to feed (currently removed but now in feed)
    const toRestore = existingVehicles?.filter(existing => {
      const nowInFeed = incomingVins.has(existing.vin);
      return existing.status === 'removed' && nowInFeed;
    }) || [];

    // 6. Find vehicles to permanently delete (removed > 30 days ago)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const toPermanentlyDelete = existingVehicles?.filter(existing => {
      if (existing.status !== 'removed' || !existing.removed_from_feed_at) {
        return false;
      }
      const removedDate = new Date(existing.removed_from_feed_at);
      return removedDate < thirtyDaysAgo;
    }) || [];

    console.log(`    📊 Changes: ${toCreate.length} new, ${toUpdate.length} updates, ${toSoftDelete.length} to remove`);
    console.log(`    🔄 Restoring: ${toRestore.length}, Permanent delete: ${toPermanentlyDelete.length}`);

    if (dryRun) {
      result.created = toCreate.length;
      result.updated = toUpdate.length + toRestore.length;
      result.deleted = toSoftDelete.length + toPermanentlyDelete.length;
      return result;
    }

    // 5. Perform database operations
    // Create new vehicles
    if (toCreate.length > 0) {
      const { error: createError } = await supabase
        .from('vehicles')
        .insert(toCreate.map(transformVehicleForDB));

      if (createError) {
        throw new Error(`Failed to create vehicles: ${createError.message}`);
      }
      result.created = toCreate.length;
    }

    // Update existing vehicles
    if (toUpdate.length > 0) {
      // Batch updates by doing upserts
      const { error: updateError } = await supabase
        .from('vehicles')
        .upsert(toUpdate.map(transformVehicleForDB), {
          onConflict: 'vin',
          ignoreDuplicates: false
        });

      if (updateError) {
        throw new Error(`Failed to update vehicles: ${updateError.message}`);
      }
      result.updated = toUpdate.length;
    }

    // Soft delete vehicles (mark as removed)
    if (toSoftDelete.length > 0) {
      const { error: softDeleteError } = await supabase
        .from('vehicles')
        .update({ 
          status: 'removed',
          removed_from_feed_at: new Date().toISOString()
        })
        .in('id', toSoftDelete.map(v => v.id));

      if (softDeleteError) {
        throw new Error(`Failed to soft delete vehicles: ${softDeleteError.message}`);
      }
      result.deleted += toSoftDelete.length;
    }

    // Restore vehicles that returned to feed
    if (toRestore.length > 0) {
      const { error: restoreError } = await supabase
        .from('vehicles')
        .update({ 
          status: 'available',
          removed_from_feed_at: null
        })
        .in('id', toRestore.map(v => v.id));

      if (restoreError) {
        throw new Error(`Failed to restore vehicles: ${restoreError.message}`);
      }
      result.updated += toRestore.length;
      console.log(`    ♻️  Restored ${toRestore.length} vehicles that returned to feed`);
    }

    // Permanently delete old removed vehicles
    if (toPermanentlyDelete.length > 0) {
      const { error: permanentDeleteError } = await supabase
        .from('vehicles')
        .delete()
        .in('id', toPermanentlyDelete.map(v => v.id));

      if (permanentDeleteError) {
        throw new Error(`Failed to permanently delete vehicles: ${permanentDeleteError.message}`);
      }
      result.deleted += toPermanentlyDelete.length;
      console.log(`    🗑️  Permanently deleted ${toPermanentlyDelete.length} vehicles (removed > 30 days)`);
    }

    // 6. Clean up old delivered transfers (3+ days old)
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const { data: oldDeliveredTransfers } = await supabase
      .from('transfers')
      .select('id, vehicle_id')
      .eq('status', 'delivered')
      .eq('from_location_id', dealership.id)
      .lt('delivered_date', threeDaysAgo.toISOString());

    if (oldDeliveredTransfers && oldDeliveredTransfers.length > 0) {
      // Reset vehicles to available
      const vehicleIds = oldDeliveredTransfers.map(t => t.vehicle_id);
      await supabase
        .from('vehicles')
        .update({ 
          status: 'available', 
          current_transfer_id: null,
          location_id: dealership.id 
        })
        .in('id', vehicleIds);

      console.log(`    🧹 Reset ${oldDeliveredTransfers.length} delivered vehicles to available`);
    }

    // 7. Create activity log for the import
    await supabase
      .from('activities')
      .insert({
        vehicle_id: validVehicles[0]?.id || null, // Use first vehicle or null
        user_id: 'system', // You might want to create a system user
        action: 'import-completed',
        details: `Import completed for ${dealership.name}: ${result.created} created, ${result.updated} updated, ${result.deleted} deleted`,
        metadata: {
          dealership_id: dealership.id,
          created: result.created,
          updated: result.updated,
          deleted: result.deleted,
          preserved: result.preserved
        }
      });

    return result;

  } catch (error) {
    console.error(`    ❌ Sync failed for ${dealership.name}:`, error);
    throw error;
  }
}

// Transform vehicle data for database
function transformVehicleForDB(vehicle: any) {
  return {
    id: vehicle.id, // Include if updating
    stock_number: vehicle.stockNumber,
    vin: vehicle.vin,
    year: vehicle.year,
    make: vehicle.make,
    model: vehicle.model,
    trim: vehicle.trim,
    title: vehicle.title,
    price: vehicle.price,
    sale_price: vehicle.salePrice,
    msrp: vehicle.msrp,
    mileage: vehicle.mileage,
    condition: vehicle.condition,
    exterior_color: vehicle.exteriorColor,
    body_style: vehicle.bodyStyle,
    fuel_type: vehicle.fuelType,
    description: vehicle.description,
    features: vehicle.features,
    status: vehicle.status || 'available',
    store_code: vehicle.storeCode,
    address: vehicle.address,
    location_id: vehicle.location_id,
    original_location_id: vehicle.original_location_id,
    current_transfer_id: vehicle.current_transfer_id,
    image_urls: vehicle.imageUrls,
    last_seen_in_feed: new Date().toISOString(),
    removed_from_feed_at: vehicle.removed_from_feed_at || null,
    days_on_lot: vehicle.daysOnLot || calculateDaysOnLot(vehicle.imported_at)
  };
}

function calculateDaysOnLot(importedAt?: string): number {
  if (!importedAt) return 0;
  const imported = new Date(importedAt);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - imported.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}