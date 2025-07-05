#!/usr/bin/env tsx

import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load environment variables
dotenv.config({ path: '.env.local' })

// Test with both anon key and service role key
const supabaseAnon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function testRLS() {
  console.log('🔍 Testing RLS policies...\n')

  // Test with anon key
  console.log('1. Query with anon key (subject to RLS):')
  const { count: anonCount, error: anonError } = await supabaseAnon
    .from('vehicles')
    .select('*', { count: 'exact', head: true })

  console.log('Result:', { count: anonCount, error: anonError?.message })

  // Test with service role key
  console.log('\n2. Query with service role key (bypasses RLS):')
  const { count: adminCount, error: adminError } = await supabaseAdmin
    .from('vehicles')
    .select('*', { count: 'exact', head: true })

  console.log('Result:', { count: adminCount, error: adminError?.message })

  // Check if RLS is enabled
  console.log('\n3. Checking RLS status on vehicles table...')
  const { data: rlsStatus, error: rlsError } = await supabaseAdmin
    .from('pg_tables')
    .select('tablename, rowsecurity')
    .eq('schemaname', 'public')
    .eq('tablename', 'vehicles')
    .single()

  console.log('RLS enabled on vehicles table:', rlsStatus?.rowsecurity)

  // Check current RLS policies
  console.log('\n4. Current RLS policies on vehicles table:')
  const { data: policies, error: policiesError } = await supabaseAdmin
    .from('pg_policies')
    .select('policyname, permissive, roles, cmd, qual')
    .eq('schemaname', 'public')
    .eq('tablename', 'vehicles')

  if (policies && policies.length > 0) {
    policies.forEach(p => {
      console.log(`- ${p.policyname}: ${p.cmd} (${p.permissive ? 'PERMISSIVE' : 'RESTRICTIVE'})`)
      console.log(`  Roles: ${p.roles}`)
      console.log(`  Condition: ${p.qual}`)
    })
  } else {
    console.log('No policies found')
  }
}

testRLS().catch(console.error)