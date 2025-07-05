#!/usr/bin/env tsx

import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function testVehicleQuery() {
  console.log('🔍 Testing vehicle detail query for A12578A...\n')

  // First check if vehicle exists
  const { data: basicVehicle, error: basicError } = await supabaseAdmin
    .from('vehicles')
    .select('*')
    .eq('stock_number', 'A12578A')
    .single()

  if (basicError) {
    console.error('❌ Error fetching basic vehicle:', basicError)
    return
  }

  if (!basicVehicle) {
    console.error('❌ Vehicle not found')
    return
  }

  console.log('✅ Basic vehicle found:')
  console.log('- ID:', basicVehicle.id)
  console.log('- Stock:', basicVehicle.stock_number)
  console.log('- Location ID:', basicVehicle.location_id)
  console.log('- Current Transfer ID:', basicVehicle.current_transfer_id)

  // Test location join
  console.log('\n📍 Testing location join...')
  const { data: withLocation, error: locationError } = await supabaseAdmin
    .from('vehicles')
    .select(`
      stock_number,
      location:location_id(*)
    `)
    .eq('stock_number', 'A12578A')
    .single()

  if (locationError) {
    console.error('❌ Location join error:', locationError)
  } else {
    console.log('✅ Location:', withLocation?.location)
  }

  // Test transfers separately
  console.log('\n🚚 Testing transfers for this vehicle...')
  const { data: transfers, error: transferError } = await supabaseAdmin
    .from('transfers')
    .select('*')
    .eq('vehicle_id', basicVehicle.id)

  console.log('Transfers found:', transfers?.length || 0)
  if (transferError) {
    console.error('❌ Transfer query error:', transferError)
  }
}

testVehicleQuery().catch(console.error)