#!/usr/bin/env tsx

import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function testQueries() {
  console.log('🔍 Testing vehicle queries...\n')

  // Test 1: Simple query
  console.log('1. Simple query without joins:')
  const { data: simple, error: simpleError, count: simpleCount } = await supabase
    .from('vehicles')
    .select('*', { count: 'exact' })
    .limit(2)

  console.log('Result:', { count: simpleCount, error: simpleError?.message, dataLength: simple?.length })
  if (simple && simple.length > 0) {
    console.log('First vehicle:', {
      stock_number: simple[0].stock_number,
      location_id: simple[0].location_id
    })
  }

  // Test 2: Query with location join
  console.log('\n2. Query with location join:')
  const { data: withLocation, error: locationError } = await supabase
    .from('vehicles')
    .select(`
      stock_number,
      location:location_id(
        id,
        name,
        code
      )
    `)
    .limit(2)

  console.log('Result:', { error: locationError?.message, dataLength: withLocation?.length })
  if (withLocation && withLocation.length > 0) {
    console.log('First vehicle with location:', withLocation[0])
  }

  // Test 3: Test with explicit table name
  console.log('\n3. Query with explicit table name:')
  const { data: explicit, error: explicitError } = await supabase
    .from('vehicles')
    .select(`
      stock_number,
      dealership_locations!location_id(
        id,
        name,
        code
      )
    `)
    .limit(2)

  console.log('Result:', { error: explicitError?.message, dataLength: explicit?.length })
  if (explicit && explicit.length > 0) {
    console.log('First vehicle:', explicit[0])
  }

  // Test 4: Check for null transfers
  console.log('\n4. Testing current_transfer join:')
  const { data: withTransfer, error: transferError } = await supabase
    .from('vehicles')
    .select(`
      stock_number,
      current_transfer_id,
      current_transfer:current_transfer_id(
        id,
        status
      )
    `)
    .limit(2)

  console.log('Result:', { error: transferError?.message, dataLength: withTransfer?.length })
  if (withTransfer && withTransfer.length > 0) {
    console.log('First vehicle:', withTransfer[0])
  }
}

testQueries().catch(console.error)