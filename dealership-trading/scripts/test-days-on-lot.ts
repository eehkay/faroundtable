#!/usr/bin/env tsx
/**
 * Test script to verify Days on Lot field parsing from CSV
 */

import { readFileSync } from 'fs';
import { parseInventoryCSV } from '../netlify/functions/utils/csv-parser';

const csvPath = '/Users/andrewkellogg/Desktop/MP18527R.csv';
const storeCode = '2245918494807356746'; // Actual store code from CSV

console.log('🧪 Testing Days on Lot CSV Parsing');
console.log('==================================\n');

try {
  // Read CSV file
  console.log(`📄 Reading CSV file: ${csvPath}`);
  const csvContent = readFileSync(csvPath, 'utf-8');
  
  // Parse CSV
  console.log(`🔍 Parsing CSV for store: ${storeCode}`);
  const vehicles = parseInventoryCSV(csvContent, storeCode);
  
  console.log(`✅ Parsed ${vehicles.length} vehicles\n`);
  
  // Show first 5 vehicles with their Days on Lot values
  console.log('📊 Sample vehicles with Days on Lot:');
  console.log('Stock #  |  VIN               |  Days on Lot');
  console.log('---------|-------------------|-------------');
  
  vehicles.slice(0, 5).forEach(vehicle => {
    console.log(
      `${vehicle.stockNumber.padEnd(8)} | ${vehicle.vin.padEnd(17)} | ${
        vehicle.daysOnLot !== null ? vehicle.daysOnLot : 'N/A'
      }`
    );
  });
  
  // Statistics
  const vehiclesWithDaysOnLot = vehicles.filter(v => v.daysOnLot !== null && v.daysOnLot !== undefined);
  const daysOnLotValues = vehiclesWithDaysOnLot.map(v => v.daysOnLot as number);
  
  console.log('\n📈 Days on Lot Statistics:');
  console.log(`   Total vehicles: ${vehicles.length}`);
  console.log(`   With Days on Lot: ${vehiclesWithDaysOnLot.length}`);
  console.log(`   Without Days on Lot: ${vehicles.length - vehiclesWithDaysOnLot.length}`);
  
  if (daysOnLotValues.length > 0) {
    const min = Math.min(...daysOnLotValues);
    const max = Math.max(...daysOnLotValues);
    const avg = Math.round(daysOnLotValues.reduce((a, b) => a + b, 0) / daysOnLotValues.length);
    
    console.log(`   Min days: ${min}`);
    console.log(`   Max days: ${max}`);
    console.log(`   Average days: ${avg}`);
  }
  
  console.log('\n✅ Days on Lot field is being parsed successfully!');
  
} catch (error) {
  console.error('❌ Error:', error);
  process.exit(1);
}