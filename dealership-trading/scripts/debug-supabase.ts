#!/usr/bin/env tsx

import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function debugDatabase() {
  console.log('🔍 Debugging Supabase Database...\n')

  // Check tables exist
  console.log('1. Checking tables:')
  const tables = [
    'dealership_locations',
    'users', 
    'vehicles',
    'transfers',
    'activities',
    'comments'
  ]

  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
    
    if (error) {
      console.log(`   ❌ ${table}: ${error.message}`)
    } else {
      console.log(`   ✅ ${table}: ${count} records`)
    }
  }

  // Check if there are any vehicles
  console.log('\n2. Sample vehicle data:')
  const { data: vehicles, error: vehicleError } = await supabase
    .from('vehicles')
    .select('id, stock_number, vin, make, model, year, location_id')
    .limit(3)

  if (vehicleError) {
    console.log('   ❌ Error fetching vehicles:', vehicleError)
  } else if (vehicles && vehicles.length > 0) {
    console.log('   ✅ Found vehicles:')
    vehicles.forEach(v => {
      console.log(`      - ${v.stock_number}: ${v.year} ${v.make} ${v.model}`)
    })
  } else {
    console.log('   ⚠️  No vehicles found')
  }

  // Check locations
  console.log('\n3. Dealership locations:')
  const { data: locations, error: locError } = await supabase
    .from('dealership_locations')
    .select('id, name, code')

  if (locError) {
    console.log('   ❌ Error fetching locations:', locError)
  } else if (locations) {
    locations.forEach(l => {
      console.log(`   - ${l.name} (${l.code}): ${l.id}`)
    })
  }

  // Test vehicle query with joins
  console.log('\n4. Testing vehicle query with joins:')
  const { data: vehicleWithJoins, error: joinError } = await supabase
    .from('vehicles')
    .select(`
      id,
      stock_number,
      location:dealership_locations!vehicles_location_id_fkey(
        id,
        name,
        code
      )
    `)
    .limit(1)

  if (joinError) {
    console.log('   ❌ Error with joins:', joinError)
  } else {
    console.log('   ✅ Join query successful:', JSON.stringify(vehicleWithJoins, null, 2))
  }

  // Check for null location_ids
  console.log('\n5. Checking for vehicles with null location_id:')
  const { count: nullLocationCount, error: nullError } = await supabase
    .from('vehicles')
    .select('*', { count: 'exact', head: true })
    .is('location_id', null)

  if (nullError) {
    console.log('   ❌ Error checking null locations:', nullError)
  } else {
    console.log(`   ${nullLocationCount} vehicles have null location_id`)
  }

  // Check days_on_lot calculation
  console.log('\n6. Testing days_on_lot calculation:')
  const { data: daysTest, error: daysError } = await supabase
    .from('vehicles')
    .select('stock_number, imported_at, days_on_lot')
    .limit(3)

  if (daysError) {
    console.log('   ❌ Error fetching days_on_lot:', daysError)
  } else if (daysTest) {
    daysTest.forEach(v => {
      console.log(`   - ${v.stock_number}: imported ${v.imported_at}, days_on_lot: ${v.days_on_lot}`)
    })
  }
}

debugDatabase().catch(console.error)