#!/usr/bin/env tsx

import dotenv from 'dotenv'
import { getVehicleByStockNumber } from '../lib/queries-supabase'

// Load environment variables
dotenv.config({ path: '.env.local' })

async function testVehicleDetail() {
  console.log('🔍 Testing vehicle detail query...\n')

  const stockNumber = 'A12578A'
  
  try {
    console.log(`Fetching vehicle with stock number: ${stockNumber}`)
    const vehicle = await getVehicleByStockNumber(stockNumber)
    
    if (vehicle) {
      console.log('\n✅ Vehicle found:')
      console.log('- Stock:', vehicle.stockNumber)
      console.log('- Make/Model:', `${vehicle.year} ${vehicle.make} ${vehicle.model}`)
      console.log('- Status:', vehicle.status)
      console.log('- Location:', vehicle.location?.name)
      console.log('- Transfer requests:', vehicle.activeTransferRequests?.length || 0)
    } else {
      console.log('\n❌ Vehicle not found')
    }
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

testVehicleDetail()