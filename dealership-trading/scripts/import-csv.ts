import { createClient } from '@sanity/client';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { parseInventoryCSV, validateVehicle } from '../netlify/functions/utils/csv-parser';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Initialize Sanity client
const sanityClient = createClient({
  projectId: process.env.SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.SANITY_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN || process.env.SANITY_WRITE_TOKEN!,
  apiVersion: '2023-01-01',
  useCdn: false
});

// Store configurations - map store codes to Sanity location IDs
const storeConfigs = [
  { storeCode: 'MP1568', name: 'United Nissan Las Vegas', locationId: 'location-mp1568' },
  { storeCode: 'MP22171', name: 'United Nissan Reno', locationId: 'location-mp22171' },
  { storeCode: 'MP18527', name: 'United Nissan Imperial', locationId: 'location-mp18527' },
  { storeCode: 'MP23003', name: 'United Kia Imperial', locationId: 'location-mp23003' },
  { storeCode: 'MP22968', name: 'United Toyota Imperial', locationId: 'location-mp22968' }
];

async function ensureLocations() {
  console.log('🏢 Ensuring dealership locations exist in Sanity...');
  
  for (const store of storeConfigs) {
    try {
      // Check if location exists
      const existing = await sanityClient.fetch(
        `*[_type == "dealershipLocation" && code == $code][0]`,
        { code: store.storeCode }
      );
      
      if (!existing) {
        console.log(`  Creating location: ${store.name} (${store.storeCode})`);
        await sanityClient.create({
          _id: store.locationId,
          _type: 'dealershipLocation',
          name: store.name,
          code: store.storeCode,
          active: true,
          csvFileName: `${store.storeCode}.csv`
        });
      } else {
        console.log(`  ✓ Location exists: ${store.name} (${store.storeCode})`);
      }
    } catch (error) {
      console.error(`  ✗ Error with location ${store.storeCode}:`, error);
    }
  }
}

async function importCSV(filePath: string) {
  console.log('📁 Reading CSV file:', filePath);
  
  // Read CSV file
  let csvContent: string;
  try {
    csvContent = readFileSync(resolve(filePath), 'utf-8');
    console.log('  ✓ File read successfully');
  } catch (error) {
    console.error('  ✗ Error reading file:', error);
    process.exit(1);
  }

  // Detect store code from filename or use first one as default
  const fileName = filePath.split('/').pop() || '';
  const storeCodeMatch = fileName.match(/MP\d{5}/);
  const storeCode = storeCodeMatch ? storeCodeMatch[0] : 'MP18527';
  console.log('🏪 Store code:', storeCode);

  // Parse CSV - pass empty string to accept all store codes
  console.log('📊 Parsing CSV data...');
  const vehicles = parseInventoryCSV(csvContent, '');
  console.log(`  ✓ Found ${vehicles.length} vehicles`);

  // Import vehicles
  console.log('🚗 Importing vehicles to Sanity...');
  const results = {
    created: 0,
    updated: 0,
    failed: 0,
    errors: [] as any[]
  };

  for (let i = 0; i < vehicles.length; i++) {
    const vehicle = vehicles[i];
    const progress = `[${i + 1}/${vehicles.length}]`;
    
    // Validate vehicle
    const validation = validateVehicle(vehicle);
    if (!validation.isValid) {
      console.log(`  ${progress} ✗ Invalid: ${vehicle.stockNumber} - ${validation.errors.join(', ')}`);
      results.errors.push({ vehicle: vehicle.stockNumber, errors: validation.errors });
      results.failed++;
      continue;
    }

    // Get location reference for this specific vehicle
    const location = await sanityClient.fetch(
      `*[_type == "dealershipLocation" && code == $code][0]._id`,
      { code: vehicle.storeCode }
    );

    if (!location) {
      console.log(`  ${progress} ✗ Location not found for store code: ${vehicle.storeCode} (${vehicle.stockNumber})`);
      results.failed++;
      continue;
    }

    try {
      // Check if vehicle exists
      const existing = await sanityClient.fetch(
        `*[_type == "vehicle" && stockNumber == $stockNumber && storeCode == $storeCode][0]`,
        { stockNumber: vehicle.stockNumber, storeCode: vehicle.storeCode }
      );

      if (existing) {
        // Update existing vehicle
        await sanityClient
          .patch(existing._id)
          .set({
            ...vehicle,
            location: { _type: 'reference', _ref: location },
            originalLocation: { _type: 'reference', _ref: location },
            lastSeenInFeed: new Date().toISOString()
          })
          .commit();
        console.log(`  ${progress} ↻ Updated: ${vehicle.year} ${vehicle.make} ${vehicle.model} (#${vehicle.stockNumber})`);
        results.updated++;
      } else {
        // Create new vehicle
        await sanityClient.create({
          _type: 'vehicle',
          ...vehicle,
          location: { _type: 'reference', _ref: location },
          originalLocation: { _type: 'reference', _ref: location },
          importedAt: new Date().toISOString(),
          status: 'available',
          daysOnLot: 0
        });
        console.log(`  ${progress} ✓ Created: ${vehicle.year} ${vehicle.make} ${vehicle.model} (#${vehicle.stockNumber})`);
        results.created++;
      }
    } catch (error) {
      console.error(`  ${progress} ✗ Error: ${vehicle.stockNumber}`, error);
      results.failed++;
    }
  }

  // Summary
  console.log('\n📋 Import Summary:');
  console.log(`  ✓ Created: ${results.created} vehicles`);
  console.log(`  ↻ Updated: ${results.updated} vehicles`);
  console.log(`  ✗ Failed: ${results.failed} vehicles`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ Validation Errors:');
    results.errors.slice(0, 10).forEach(err => {
      console.log(`  - ${err.vehicle}: ${err.errors.join(', ')}`);
    });
    if (results.errors.length > 10) {
      console.log(`  ... and ${results.errors.length - 10} more errors`);
    }
  }

  console.log('\n✅ Import complete!');
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: npm run import-csv -- <path-to-csv-file>');
    console.log('Example: npm run import-csv -- ./data/MP18527.csv');
    process.exit(1);
  }

  console.log('🚀 Starting CSV import process...\n');

  // Ensure locations exist first
  await ensureLocations();
  
  console.log('');
  
  // Import CSV
  await importCSV(args[0]);
}

// Run the script
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});