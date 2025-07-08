#!/usr/bin/env npx tsx

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface VehicleWithTransfer {
  id: string
  stock_number: string
  vin: string
  location_id: string
  current_transfer_id: string | null
  current_transfer?: {
    id: string
    status: string
    to_location_id: string
    from_location_id: string
    to_location?: {
      id: string
      name: string
    }
    from_location?: {
      id: string
      name: string
    }
  }
  location?: {
    id: string
    name: string
  }
}

async function fixVehicleLocations() {
  console.log('🔍 Checking for vehicles with location mismatches...')

  // Find all vehicles with delivered transfers
  const { data: vehicles, error } = await supabase
    .from('vehicles')
    .select<any, VehicleWithTransfer>(`
      id,
      stock_number,
      vin,
      location_id,
      current_transfer_id,
      current_transfer:current_transfer_id(
        id,
        status,
        to_location_id,
        from_location_id,
        to_location:to_location_id(
          id,
          name
        ),
        from_location:from_location_id(
          id,
          name
        )
      ),
      location:location_id(
        id,
        name
      )
    `)
    .not('current_transfer_id', 'is', null)

  if (error) {
    console.error('Error fetching vehicles:', error)
    return
  }

  const mismatched = vehicles?.filter(vehicle => {
    if (!vehicle.current_transfer) return false
    
    // Check if transfer is delivered and location doesn't match
    return vehicle.current_transfer.status === 'delivered' && 
           vehicle.location_id !== vehicle.current_transfer.to_location_id
  }) || []

  console.log(`\n📊 Found ${mismatched.length} vehicles with location mismatches`)

  if (mismatched.length === 0) {
    console.log('✅ All vehicles have correct locations!')
    return
  }

  // Display mismatched vehicles
  console.log('\n🚗 Vehicles to fix:')
  mismatched.forEach(vehicle => {
    console.log(`\n  Stock #${vehicle.stock_number} (${vehicle.vin})`)
    console.log(`    Current location: ${vehicle.location?.name || 'Unknown'} (${vehicle.location_id})`)
    console.log(`    Should be at: ${vehicle.current_transfer?.to_location?.name || 'Unknown'} (${vehicle.current_transfer?.to_location_id})`)
    console.log(`    Transfer status: ${vehicle.current_transfer?.status}`)
  })

  // Ask for confirmation
  console.log('\n⚠️  This will update the location_id for these vehicles.')
  console.log('Press Ctrl+C to cancel or any other key to continue...')
  
  await new Promise(resolve => {
    process.stdin.setRawMode(true)
    process.stdin.resume()
    process.stdin.once('data', () => {
      process.stdin.setRawMode(false)
      process.stdin.pause()
      resolve(true)
    })
  })

  console.log('\n🔧 Fixing vehicle locations...')

  // Update each vehicle
  for (const vehicle of mismatched) {
    const { error: updateError } = await supabase
      .from('vehicles')
      .update({ 
        location_id: vehicle.current_transfer!.to_location_id 
      })
      .eq('id', vehicle.id)

    if (updateError) {
      console.error(`❌ Failed to update vehicle ${vehicle.stock_number}:`, updateError)
    } else {
      console.log(`✅ Updated vehicle ${vehicle.stock_number} to ${vehicle.current_transfer!.to_location?.name}`)
    }
  }

  console.log('\n✨ Location fix complete!')
}

// Run the script
fixVehicleLocations()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Script failed:', error)
    process.exit(1)
  })