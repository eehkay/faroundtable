#!/usr/bin/env tsx

import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkForeignKeys() {
  console.log('🔍 Checking Foreign Key Names...\n')

  // Query to get foreign key information
  const { data, error } = await supabase.rpc('get_foreign_keys', {
    table_name: 'vehicles'
  }).single()

  if (error) {
    // If the function doesn't exist, try a different approach
    console.log('Trying alternative method...')
    
    // Test the actual query that's failing
    const { data: testData, error: testError } = await supabase
      .from('vehicles')
      .select(`
        *,
        location:location_id(
          id,
          name,
          code
        ),
        original_location:original_location_id(
          id,  
          name,
          code
        )
      `)
      .limit(1)

    if (testError) {
      console.log('❌ Query with simple foreign key failed:', testError.message)
      
      // Try with explicit table names
      const { data: testData2, error: testError2 } = await supabase
        .from('vehicles')
        .select(`
          *,
          dealership_locations!location_id(
            id,
            name,
            code
          )
        `)
        .limit(1)

      if (testError2) {
        console.log('❌ Query with table name failed:', testError2.message)
      } else {
        console.log('✅ Query with table name succeeded')
        console.log('Data:', JSON.stringify(testData2, null, 2))
      }
    } else {
      console.log('✅ Simple foreign key query succeeded')
    }
  }
}

checkForeignKeys().catch(console.error)