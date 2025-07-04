import { schedule } from '@netlify/functions';
import Client from 'ssh2-sftp-client';
import { parseInventoryCSV, validateVehicle } from './utils/csv-parser';
import { createClient } from '@sanity/client';

const sanityClient = createClient({
  projectId: process.env.SANITY_PROJECT_ID!,
  dataset: process.env.SANITY_DATASET || 'production',
  token: process.env.SANITY_WRITE_TOKEN!,
  apiVersion: '2023-01-01',
  useCdn: false
});

const sftpConfig = {
  host: process.env.SFTP_HOST!,
  username: process.env.SFTP_USERNAME!,
  password: process.env.SFTP_PASSWORD!,
  port: parseInt(process.env.SFTP_PORT || '22')
};

// Store configurations - map store codes to location IDs
const storeConfigs = [
  { storeCode: 'MP1568', fileName: 'MP1568.csv', locationId: 'location-mp1568' },
  { storeCode: 'MP22171', fileName: 'MP22171.csv', locationId: 'location-mp22171' },
  { storeCode: 'MP18527', fileName: 'MP18527.csv', locationId: 'location-mp18527' },
  { storeCode: 'MP23003', fileName: 'MP23003.csv', locationId: 'location-mp23003' },
  { storeCode: 'MP22968', fileName: 'MP22968.csv', locationId: 'location-mp22968' }
];

const handler = schedule('0 2 * * *', async (event) => {
  console.log('Starting scheduled inventory import...');
  
  const sftp = new Client();
  const results = {
    success: 0,
    failed: 0,
    created: 0,
    updated: 0,
    deleted: 0,
    errors: [] as any[]
  };

  try {
    await sftp.connect(sftpConfig);
    
    // Get all current vehicles from Sanity (excluding transferred vehicles)
    const existingVehicles = await sanityClient.fetch(
      `*[_type == "vehicle" && status != "delivered"]{ 
        _id, 
        stockNumber, 
        storeCode,
        status,
        currentTransfer
      }`
    );
    
    const existingByStock = new Map(
      existingVehicles.map(v => [`${v.storeCode}-${v.stockNumber}`, v])
    );
    
    const seenVehicles = new Set<string>();
    
    // Process each store's CSV
    for (const store of storeConfigs) {
      try {
        console.log(`Processing ${store.fileName}...`);
        
        const csvPath = process.env.SFTP_PATH ? 
          `${process.env.SFTP_PATH}/${store.fileName}` : 
          `/inventory/${store.fileName}`;
          
        const csvContent = await sftp.get(csvPath);
        const vehicles = parseInventoryCSV(csvContent.toString(), store.storeCode);
        
        console.log(`Found ${vehicles.length} vehicles for ${store.storeCode}`);
        
        // Get location reference
        const location = await sanityClient.fetch(
          `*[_type == "dealershipLocation" && code == $code][0]._id`,
          { code: store.storeCode }
        );
        
        if (!location) {
          console.error(`Location not found for store code: ${store.storeCode}`);
          continue;
        }
        
        // Process each vehicle
        for (const vehicle of vehicles) {
          const key = `${vehicle.storeCode}-${vehicle.stockNumber}`;
          seenVehicles.add(key);
          
          const validation = validateVehicle(vehicle);
          if (!validation.isValid) {
            console.error(`Invalid vehicle ${key}:`, validation.errors);
            results.errors.push({ vehicle: key, errors: validation.errors });
            continue;
          }
          
          const existing = existingByStock.get(key);
          
          try {
            if (existing) {
              // Don't update if vehicle is currently being transferred
              if (existing.status === 'claimed' || existing.status === 'in-transit') {
                console.log(`Skipping update for ${key} - currently in transfer`);
                continue;
              }
              
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
              results.updated++;
            } else {
              // Create new vehicle
              await sanityClient.create({
                _type: 'vehicle',
                ...vehicle,
                location: { _type: 'reference', _ref: location },
                originalLocation: { _type: 'reference', _ref: location },
                importedAt: new Date().toISOString(),
                status: 'available'
              });
              results.created++;
            }
          } catch (error) {
            console.error(`Error processing vehicle ${key}:`, error);
            results.failed++;
          }
        }
        
        results.success++;
      } catch (error) {
        console.error(`Error processing ${store.fileName}:`, error);
        results.failed++;
      }
    }
    
    // Delete vehicles not in current feed based on status
    for (const [key, vehicle] of existingByStock) {
      if (!seenVehicles.has(key)) {
        try {
          if (vehicle.status === 'available') {
            // Delete available vehicles immediately if not in feed
            await sanityClient.delete(vehicle._id);
            results.deleted++;
          } else if (vehicle.status === 'delivered') {
            // For delivered vehicles, check if they've been delivered for more than 3 days
            const transfer = await sanityClient.fetch(
              `*[_type == "transfer" && _id == $id][0]{ deliveredDate }`,
              { id: vehicle.currentTransfer?._ref }
            );
            
            if (transfer?.deliveredDate) {
              const deliveredDate = new Date(transfer.deliveredDate);
              const daysSinceDelivered = (Date.now() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24);
              
              if (daysSinceDelivered > 3) {
                console.log(`Deleting vehicle ${key} - delivered ${Math.floor(daysSinceDelivered)} days ago`);
                await sanityClient.delete(vehicle._id);
                results.deleted++;
              } else {
                console.log(`Keeping vehicle ${key} - delivered ${Math.floor(daysSinceDelivered)} days ago`);
              }
            }
          }
          // Claimed and in-transit vehicles are always preserved
        } catch (error) {
          console.error(`Error processing vehicle ${key} for deletion:`, error);
        }
      }
    }
    
    await sftp.end();
    
    // Log import activity
    await sanityClient.create({
      _type: 'importLog',
      timestamp: new Date().toISOString(),
      results: results,
      success: results.failed === 0
    });
    
    console.log('Import completed:', results);
    
    return {
      statusCode: 200,
      body: JSON.stringify(results)
    };
  } catch (error: any) {
    console.error('Import failed:', error);
    await sftp.end();
    
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Import failed', details: error.message })
    };
  }
});

export { handler };