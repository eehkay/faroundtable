#!/usr/bin/env tsx

import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

async function testVehiclesAPI() {
  console.log('🔍 Testing vehicles API...\n')

  try {
    // Test the API endpoint directly
    const response = await fetch('http://localhost:3001/api/vehicles', {
      headers: {
        'Cookie': 'next-auth.session-token=YOUR_SESSION_TOKEN' // You'll need to get this from browser
      }
    })

    console.log('Response status:', response.status)
    console.log('Response headers:', response.headers)

    const data = await response.json()
    console.log('\nResponse data:', JSON.stringify(data, null, 2))

    if (data.vehicles) {
      console.log(`\n✅ Found ${data.vehicles.length} vehicles`)
      if (data.vehicles.length > 0) {
        console.log('First vehicle:', data.vehicles[0])
      }
    } else if (data.error) {
      console.log('\n❌ API Error:', data.error)
    }
  } catch (error) {
    console.error('❌ Failed to test API:', error)
  }
}

// Also test the direct Supabase query
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function testDirectQuery() {
  console.log('\n🔍 Testing direct Supabase query...\n')

  const { data, error, count } = await supabase
    .from('vehicles')
    .select('*', { count: 'exact' })
    .limit(5)

  if (error) {
    console.error('❌ Supabase error:', error)
  } else {
    console.log(`✅ Direct query found ${count} vehicles`)
    console.log('Sample data:', data)
  }
}

async function main() {
  await testVehiclesAPI()
  await testDirectQuery()
}

main()