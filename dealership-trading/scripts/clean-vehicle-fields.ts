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

async function cleanVehicleFields() {
  try {
    console.log('Finding vehicles with deprecated fields...');
    
    // Find vehicles with old fields
    const vehicles = await client.fetch(groq`
      *[_type == "vehicle" && (defined(address) || defined(dealershipName))] {
        _id,
        stockNumber,
        address,
        dealershipName
      }
    `);
    
    console.log(`Found ${vehicles.length} vehicles with deprecated fields`);
    
    if (vehicles.length === 0) {
      console.log('No vehicles need cleaning');
      return;
    }
    
    // Clean each vehicle
    let cleaned = 0;
    for (const vehicle of vehicles) {
      try {
        const patch = client.patch(vehicle._id);
        
        // Unset deprecated fields
        if (vehicle.address !== undefined) {
          patch.unset(['address']);
        }
        if (vehicle.dealershipName !== undefined) {
          patch.unset(['dealershipName']);
        }
        
        await patch.commit();
        
        cleaned++;
        console.log(`Cleaned vehicle ${vehicle.stockNumber || vehicle._id}`);
      } catch (error) {
        console.error(`Failed to clean vehicle ${vehicle._id}:`, error);
      }
    }
    
    console.log(`\nSuccessfully cleaned ${cleaned} vehicles`);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the script
cleanVehicleFields();