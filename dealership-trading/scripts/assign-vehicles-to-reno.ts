import { config } from 'dotenv';
import { createClient } from '@sanity/client';
import groq from 'groq';
import path from 'path';

// Load environment variables from parent directory
config({ path: path.resolve(__dirname, '../.env.local') });

// Hardcode values if env vars are not available
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'bhik7rw7';
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
const token = process.env.SANITY_API_TOKEN;

if (!projectId) {
  console.error('Project ID is required');
  process.exit(1);
}

if (!token) {
  console.error('SANITY_API_TOKEN is required');
  console.error('Please set it in your .env.local file');
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  token,
  apiVersion: '2023-01-01',
  useCdn: false,
});

async function assignVehiclesToReno() {
  try {
    console.log('Finding United Nissan Reno location...');
    
    // First, find the United Nissan Reno location
    const renoLocation = await client.fetch(groq`
      *[_type == "dealershipLocation" && code == "MP22171TT"][0] {
        _id,
        name,
        code
      }
    `);
    
    if (!renoLocation) {
      console.error('United Nissan Reno location not found!');
      return;
    }
    
    console.log(`Found location: ${renoLocation.name} (${renoLocation.code})`);
    
    // Get all vehicles without a location or with a different location
    const vehicles = await client.fetch(groq`
      *[_type == "vehicle" && (!defined(location) || location._ref != $locationId)] {
        _id,
        stockNumber,
        title,
        location
      }
    `, { locationId: renoLocation._id });
    
    console.log(`Found ${vehicles.length} vehicles to update`);
    
    if (vehicles.length === 0) {
      console.log('All vehicles are already assigned to United Nissan Reno');
      return;
    }
    
    // Update each vehicle
    let updated = 0;
    for (const vehicle of vehicles) {
      try {
        await client
          .patch(vehicle._id)
          .set({ 
            location: {
              _type: 'reference',
              _ref: renoLocation._id
            },
            originalLocation: {
              _type: 'reference',
              _ref: renoLocation._id
            }
          })
          .commit();
        
        updated++;
        console.log(`Updated vehicle ${vehicle.stockNumber || vehicle._id}`);
      } catch (error) {
        console.error(`Failed to update vehicle ${vehicle._id}:`, error);
      }
    }
    
    console.log(`\nSuccessfully updated ${updated} vehicles to United Nissan Reno`);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the script
assignVehiclesToReno();