import { createClient } from '@sanity/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Initialize Sanity client
const sanityClient = createClient({
  projectId: process.env.SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.SANITY_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN || process.env.SANITY_WRITE_TOKEN!,
  apiVersion: '2023-01-01',
  useCdn: false
});

// New United dealership configurations
const unitedDealerships = [
  { 
    _id: 'location-mp1568',
    code: 'MP1568', 
    name: 'United Nissan Las Vegas',
    csvFileName: 'MP1568.csv',
    active: true
  },
  { 
    _id: 'location-mp22171',
    code: 'MP22171', 
    name: 'United Nissan Reno',
    csvFileName: 'MP22171.csv',
    active: true
  },
  { 
    _id: 'location-mp18527',
    code: 'MP18527', 
    name: 'United Nissan Imperial',
    csvFileName: 'MP18527.csv',
    active: true
  },
  { 
    _id: 'location-mp23003',
    code: 'MP23003', 
    name: 'United Kia Imperial',
    csvFileName: 'MP23003.csv',
    active: true
  },
  { 
    _id: 'location-mp22968',
    code: 'MP22968', 
    name: 'United Toyota Imperial',
    csvFileName: 'MP22968.csv',
    active: true
  }
];

// Old dealership IDs to deactivate
const oldDealershipIds = [
  'location-mp18528', // Forman Mazda
  'location-mp18529', // Forman Lincoln
  'location-mp18530', // Forman Hyundai
  'location-mp18531', // Forman Genesis
  'location-mp22171tt', // Forman Nissan Reno (old code)
  'location-1',
  'location-2',
  'location-3',
  'location-4',
  'location-5'
];

async function migrateDealerships() {
  console.log('🚗 Starting United Dealerships Migration...\n');

  // Step 1: Deactivate old dealerships
  console.log('📍 Step 1: Deactivating old Forman dealerships...');
  for (const locationId of oldDealershipIds) {
    try {
      const existing = await sanityClient.fetch(
        `*[_type == "dealershipLocation" && _id == $id][0]`,
        { id: locationId }
      );
      
      if (existing) {
        await sanityClient
          .patch(locationId)
          .set({ active: false })
          .commit();
        console.log(`  ✓ Deactivated: ${existing.name || locationId}`);
      }
    } catch (error) {
      console.log(`  - Skipped ${locationId} (not found or error)`);
    }
  }

  // Step 2: Create or update United dealerships
  console.log('\n📍 Step 2: Creating/updating United dealerships...');
  for (const dealership of unitedDealerships) {
    try {
      // Check if exists by ID or code
      const existing = await sanityClient.fetch(
        `*[_type == "dealershipLocation" && (_id == $id || code == $code)][0]`,
        { id: dealership._id, code: dealership.code }
      );

      if (existing) {
        // Update existing
        await sanityClient
          .patch(existing._id)
          .set({
            name: dealership.name,
            code: dealership.code,
            csvFileName: dealership.csvFileName,
            active: dealership.active
          })
          .commit();
        console.log(`  ↻ Updated: ${dealership.name} (${dealership.code})`);
      } else {
        // Create new
        await sanityClient.create({
          _type: 'dealershipLocation',
          ...dealership
        });
        console.log(`  ✓ Created: ${dealership.name} (${dealership.code})`);
      }
    } catch (error) {
      console.error(`  ✗ Error with ${dealership.name}:`, error);
    }
  }

  // Step 3: Check for vehicles assigned to old locations
  console.log('\n📍 Step 3: Checking for vehicles assigned to old locations...');
  const oldLocationRefs = oldDealershipIds.map(id => ({ _ref: id }));
  
  const vehiclesWithOldLocations = await sanityClient.fetch(
    `count(*[_type == "vehicle" && location._ref in $refs])`,
    { refs: oldDealershipIds }
  );

  if (vehiclesWithOldLocations > 0) {
    console.log(`  ⚠️  Found ${vehiclesWithOldLocations} vehicles assigned to old locations`);
    console.log('  Note: These vehicles will need to be reassigned or removed');
  } else {
    console.log('  ✓ No vehicles found with old location assignments');
  }

  // Step 4: Check for active transfers
  console.log('\n📍 Step 4: Checking for active transfers...');
  const activeTransfers = await sanityClient.fetch(
    `count(*[_type == "transfer" && status in ["requested", "approved", "in-transit"]])`
  );

  if (activeTransfers > 0) {
    console.log(`  ⚠️  Found ${activeTransfers} active transfers`);
    console.log('  Note: Consider completing these transfers before full migration');
  } else {
    console.log('  ✓ No active transfers found');
  }

  console.log('\n✅ Migration complete!');
  console.log('\nNext steps:');
  console.log('1. Update SFTP to provide CSV files with new filenames (MP1568.csv, etc.)');
  console.log('2. Verify authentication domains if needed');
  console.log('3. Run the scheduled import to populate vehicles for new dealerships');
}

// Run the migration
migrateDealerships().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});