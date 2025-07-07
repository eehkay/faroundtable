import { createClient } from '@supabase/supabase-js';
import { downloadInventoryFiles } from './sftp-client';
import { mapFilesToDealerships } from './dealership-mapper';
import { syncToSupabase } from './supabase-sync';
import { parseInventoryCSV } from '../../netlify/functions/utils/csv-parser';
import type { ImportResult, StoreImportResult, ImportLogEntry } from './types/import';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const startTime = Date.now();
  const results: ImportResult = {
    stores: {},
    totals: {
      created: 0,
      updated: 0,
      deleted: 0,
      errors: 0,
      enriched: 0
    },
    duration: 0,
    timestamp: new Date().toISOString()
  };

  // Create initial import log entry
  const { data: importLog, error: logError } = await supabase
    .from('import_logs')
    .insert({
      timestamp: new Date().toISOString(),
      success: false,
      vehicles_imported: 0,
      vehicles_updated: 0,
      vehicles_deleted: 0,
      errors: [],
      details: JSON.stringify({ status: 'started', stores_processed: [] })
    })
    .select()
    .single();

  if (logError || !importLog) {
    console.error('Failed to create import log:', logError);
    process.exit(1);
  }

  const importLogId = importLog.id;

  try {
    console.log('📋 Starting Round Table Vehicle Import');
    console.log(`Import ID: ${importLogId}`);
    console.log(`Timestamp: ${results.timestamp}`);
    console.log('');

    // 1. Download files from SFTP
    console.log('📥 Downloading inventory files from SFTP...');
    const files = await downloadInventoryFiles();
    console.log(`✅ Downloaded ${files.length} files`);

    // 2. Map files to dealerships
    console.log('\n🗺️  Mapping files to dealerships...');
    const mappedFiles = await mapFilesToDealerships(files);
    const validFiles = mappedFiles.filter(f => f.shouldProcess);
    
    console.log(`✅ Mapped ${validFiles.length} files to dealerships`);
    if (mappedFiles.length > validFiles.length) {
      console.log(`⚠️  Skipped ${mappedFiles.length - validFiles.length} unmapped files`);
    }

    // 3. Process each store
    console.log('\n🔄 Processing dealership inventories...');
    const storePromises = validFiles.map(async ({ filename, content, dealership }) => {
      const storeResult: StoreImportResult = {
        storeCode: dealership!.code,
        storeName: dealership!.name,
        success: false,
        created: 0,
        updated: 0,
        deleted: 0,
        errors: []
      };

      try {
        console.log(`\n  Processing ${dealership!.name} (${dealership!.code})...`);
        
        // Parse CSV
        const vehicles = parseInventoryCSV(content, dealership!.code);
        console.log(`    Parsed ${vehicles.length} vehicles`);

        // Sync to Supabase
        const syncResult = await syncToSupabase(vehicles, dealership!);
        
        storeResult.success = true;
        storeResult.created = syncResult.created;
        storeResult.updated = syncResult.updated;
        storeResult.deleted = syncResult.deleted;
        
        console.log(`    ✅ Created: ${syncResult.created}, Updated: ${syncResult.updated}, Deleted: ${syncResult.deleted}`);
      } catch (error) {
        storeResult.success = false;
        storeResult.errors.push({
          vehicle: null,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        console.error(`    ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      return storeResult;
    });

    const storeResults = await Promise.all(storePromises);

    // 4. Aggregate results
    storeResults.forEach(result => {
      results.stores[result.storeCode] = result;
      if (result.success) {
        results.totals.created += result.created;
        results.totals.updated += result.updated;
        results.totals.deleted += result.deleted;
      } else {
        results.totals.errors += result.errors.length;
      }
    });

    results.duration = Date.now() - startTime;

    // 5. Update import log with final results
    const allErrors = storeResults.flatMap(r => r.errors);
    const { error: updateError } = await supabase
      .from('import_logs')
      .update({
        success: results.totals.errors === 0,
        vehicles_imported: results.totals.created,
        vehicles_updated: results.totals.updated,
        vehicles_deleted: results.totals.deleted,
        errors: allErrors,
        details: JSON.stringify({
          duration_ms: results.duration,
          stores_processed: storeResults,
          enrichment_enabled: process.env.ENABLE_ADVANCED_ANALYTICS === 'true'
        })
      })
      .eq('id', importLogId);

    if (updateError) {
      console.error('Failed to update import log:', updateError);
    }

    // 6. Generate summary
    console.log('\n📊 Import Summary:');
    console.log(`Total Duration: ${(results.duration / 1000).toFixed(2)}s`);
    console.log(`Stores Processed: ${Object.keys(results.stores).length}`);
    console.log(`Vehicles Created: ${results.totals.created}`);
    console.log(`Vehicles Updated: ${results.totals.updated}`);
    console.log(`Vehicles Deleted: ${results.totals.deleted}`);
    console.log(`Errors: ${results.totals.errors}`);

    // 7. Write report files
    await writeReports(results);

    // 8. Set GitHub Actions outputs
    console.log('\n📤 Setting GitHub Actions outputs...');
    console.log(`::set-output name=created::${results.totals.created}`);
    console.log(`::set-output name=updated::${results.totals.updated}`);
    console.log(`::set-output name=deleted::${results.totals.deleted}`);
    console.log(`::set-output name=errors::${results.totals.errors}`);
    console.log(`::set-output name=duration::${(results.duration / 1000).toFixed(2)}s`);
    
    if (results.totals.errors > 0) {
      console.log(`::set-output name=critical_failure::false`);
      process.exit(1); // Exit with error code but not critical
    }

  } catch (error) {
    console.error('\n❌ Critical Import Failure:', error);
    
    // Update import log with critical failure
    await supabase
      .from('import_logs')
      .update({
        success: false,
        errors: [{
          vehicle: null,
          error: `Critical failure: ${error instanceof Error ? error.message : 'Unknown error'}`
        }],
        details: JSON.stringify({
          status: 'critical_failure',
          error: error instanceof Error ? error.message : 'Unknown error',
          duration_ms: Date.now() - startTime
        })
      })
      .eq('id', importLogId);

    console.log(`::set-output name=critical_failure::true`);
    console.log(`::set-output name=critical_error::${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}

async function writeReports(results: ImportResult) {
  const fs = await import('fs/promises');
  
  // Write JSON report
  await fs.writeFile(
    'import-report.json',
    JSON.stringify(results, null, 2)
  );

  // Write error log
  const errors: string[] = [];
  Object.entries(results.stores).forEach(([storeCode, store]) => {
    if (store.errors.length > 0) {
      errors.push(`\n=== ${store.storeName} (${storeCode}) ===`);
      store.errors.forEach(err => {
        errors.push(`${err.vehicle || 'General'}: ${err.error}`);
      });
    }
  });

  if (errors.length > 0) {
    await fs.writeFile('import-errors.log', errors.join('\n'));
  }

  console.log('✅ Reports written to import-report.json and import-errors.log');
}

// Run the import
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});