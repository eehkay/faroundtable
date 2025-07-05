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

if (!projectId || !token) {
  console.error('Project ID and SANITY_API_TOKEN are required');
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  token,
  apiVersion: '2023-01-01',
  useCdn: false,
});

// Function to generate random number between min and max (inclusive)
function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function populateDaysOnLot() {
  try {
    console.log('Finding all vehicles...');
    
    // Find all vehicles
    const vehicles = await client.fetch(groq`
      *[_type == "vehicle"] {
        _id,
        stockNumber,
        daysOnLot
      }
    `);
    
    console.log(`Found ${vehicles.length} vehicles`);
    
    if (vehicles.length === 0) {
      console.log('No vehicles found');
      return;
    }
    
    // Update each vehicle with random days on lot
    let updated = 0;
    for (const vehicle of vehicles) {
      try {
        const randomDays = randomBetween(60, 180);
        
        await client
          .patch(vehicle._id)
          .set({ daysOnLot: randomDays })
          .commit();
        
        updated++;
        console.log(`Updated vehicle ${vehicle.stockNumber || vehicle._id} with ${randomDays} days on lot`);
      } catch (error) {
        console.error(`Failed to update vehicle ${vehicle._id}:`, error);
      }
    }
    
    console.log(`\nSuccessfully updated ${updated} vehicles with random days on lot (60-180 days)`);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the script
populateDaysOnLot();