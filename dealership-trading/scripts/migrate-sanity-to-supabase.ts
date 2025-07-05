#!/usr/bin/env tsx

/**
 * Migration script to move data from Sanity to Supabase
 * Run this after setting up your Supabase database with the schema
 */

import dotenv from 'dotenv'
import { createClient } from '@sanity/client'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Load environment variables
dotenv.config({ path: '.env.local' })

// Sanity client
const sanityClient = createClient({
  projectId: process.env.SANITY_PROJECT_ID!,
  dataset: process.env.SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN!,
  apiVersion: '2023-01-01',
  useCdn: false,
})

// Supabase admin client
const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function migrateLocations() {
  console.log('🏢 Migrating dealership locations...')
  
  const locations = await sanityClient.fetch(
    `*[_type == "dealershipLocation"]{
      _id,
      name,
      code,
      address,
      city,
      state,
      zip,
      phone,
      email,
      csvFileName,
      active
    }`
  )
  
  for (const location of locations) {
    const { error } = await supabaseAdmin
      .from('dealership_locations')
      .upsert({
        name: location.name,
        code: location.code,
        address: location.address,
        city: location.city,
        state: location.state,
        zip: location.zip,
        phone: location.phone,
        email: location.email,
        csv_file_name: location.csvFileName,
        active: location.active ?? true,
        legacy_sanity_id: location._id
      }, {
        onConflict: 'code'
      })
    
    if (error) {
      console.error(`  ❌ Error migrating location ${location.name}:`, error)
    } else {
      console.log(`  ✅ Migrated location: ${location.name}`)
    }
  }
}

async function migrateUsers() {
  console.log('\n👥 Migrating users...')
  
  // First get all locations for mapping
  const { data: locations } = await supabaseAdmin
    .from('dealership_locations')
    .select('id, legacy_sanity_id')
  
  const locationMap = new Map(
    locations?.map(loc => [loc.legacy_sanity_id, loc.id]) || []
  )
  
  const users = await sanityClient.fetch(
    `*[_type == "user"]{
      _id,
      name,
      email,
      image,
      role,
      location->{_id},
      active,
      lastLogin
    }`
  )
  
  for (const user of users) {
    const domain = user.email?.split('@')[1] || ''
    const locationId = user.location?._id ? locationMap.get(user.location._id) : null
    
    const { error } = await supabaseAdmin
      .from('users')
      .upsert({
        email: user.email,
        name: user.name,
        image_url: user.image,
        domain: domain,
        role: user.role || 'sales',
        location_id: locationId,
        active: user.active ?? true,
        last_login: user.lastLogin,
        legacy_sanity_id: user._id
      }, {
        onConflict: 'email'
      })
    
    if (error) {
      console.error(`  ❌ Error migrating user ${user.email}:`, error)
    } else {
      console.log(`  ✅ Migrated user: ${user.email}`)
    }
  }
}

async function migrateVehicles() {
  console.log('\n🚗 Migrating vehicles...')
  
  // Get location mapping
  const { data: locations } = await supabaseAdmin
    .from('dealership_locations')
    .select('id, code')
  
  const locationCodeMap = new Map(
    locations?.map(loc => [loc.code, loc.id]) || []
  )
  
  const vehicles = await sanityClient.fetch(
    `*[_type == "vehicle"]{
      _id,
      stockNumber,
      vin,
      year,
      make,
      model,
      trim,
      title,
      price,
      salePrice,
      msrp,
      mileage,
      condition,
      exteriorColor,
      bodyStyle,
      fuelType,
      description,
      features,
      status,
      storeCode,
      address,
      imageUrls,
      importedAt,
      lastSeenInFeed,
      daysOnLot
    }`
  )
  
  let successCount = 0
  let errorCount = 0
  
  for (const vehicle of vehicles) {
    const locationId = locationCodeMap.get(vehicle.storeCode)
    
    const { error } = await supabaseAdmin
      .from('vehicles')
      .upsert({
        stock_number: vehicle.stockNumber,
        vin: vehicle.vin,
        year: parseInt(vehicle.year),
        make: vehicle.make,
        model: vehicle.model,
        trim: vehicle.trim,
        title: vehicle.title,
        price: parseInt(vehicle.price),
        sale_price: vehicle.salePrice ? parseInt(vehicle.salePrice) : null,
        msrp: vehicle.msrp ? parseInt(vehicle.msrp) : null,
        mileage: vehicle.mileage ? parseInt(vehicle.mileage) : null,
        condition: vehicle.condition,
        exterior_color: vehicle.exteriorColor,
        body_style: vehicle.bodyStyle,
        fuel_type: vehicle.fuelType,
        description: vehicle.description,
        features: vehicle.features || [],
        status: vehicle.status || 'available',
        store_code: vehicle.storeCode,
        address: vehicle.address,
        location_id: locationId,
        original_location_id: locationId,
        image_urls: vehicle.imageUrls || [],
        imported_at: vehicle.importedAt,
        last_seen_in_feed: vehicle.lastSeenInFeed,
        days_on_lot: vehicle.daysOnLot || 0,
        legacy_sanity_id: vehicle._id
      }, {
        onConflict: 'vin'
      })
    
    if (error) {
      console.error(`  ❌ Error migrating vehicle ${vehicle.vin}:`, error.message)
      errorCount++
    } else {
      successCount++
      if (successCount % 100 === 0) {
        console.log(`  ✅ Migrated ${successCount} vehicles...`)
      }
    }
  }
  
  console.log(`  ✅ Migration complete: ${successCount} vehicles migrated, ${errorCount} errors`)
}

async function migrateTransfers() {
  console.log('\n📦 Migrating transfers...')
  
  // Get mappings
  const { data: users } = await supabaseAdmin
    .from('users')
    .select('id, legacy_sanity_id')
  const userMap = new Map(users?.map(u => [u.legacy_sanity_id, u.id]) || [])
  
  const { data: vehicles } = await supabaseAdmin
    .from('vehicles')
    .select('id, legacy_sanity_id')
  const vehicleMap = new Map(vehicles?.map(v => [v.legacy_sanity_id, v.id]) || [])
  
  const { data: locations } = await supabaseAdmin
    .from('dealership_locations')
    .select('id, legacy_sanity_id')
  const locationMap = new Map(locations?.map(l => [l.legacy_sanity_id, l.id]) || [])
  
  const transfers = await sanityClient.fetch(
    `*[_type == "transfer"]{
      _id,
      vehicle->{_id},
      fromLocation->{_id},
      toLocation->{_id},
      requestedBy->{_id},
      status,
      reason,
      transferNotes,
      moneyOffer,
      requestedByDate,
      customerWaiting,
      priority,
      expectedPickupDate,
      actualPickupDate,
      deliveredDate,
      approvedBy->{_id},
      approvedAt,
      rejectedBy->{_id},
      rejectedAt,
      rejectionReason,
      cancelledBy->{_id},
      cancelledAt,
      transportNotes,
      competingRequestsCount,
      _createdAt,
      _updatedAt
    }`
  )
  
  for (const transfer of transfers) {
    const vehicleId = vehicleMap.get(transfer.vehicle?._id)
    const fromLocationId = locationMap.get(transfer.fromLocation?._id)
    const toLocationId = locationMap.get(transfer.toLocation?._id)
    const requestedById = userMap.get(transfer.requestedBy?._id)
    const approvedById = transfer.approvedBy?._id ? userMap.get(transfer.approvedBy._id) : null
    const rejectedById = transfer.rejectedBy?._id ? userMap.get(transfer.rejectedBy._id) : null
    const cancelledById = transfer.cancelledBy?._id ? userMap.get(transfer.cancelledBy._id) : null
    
    if (!vehicleId || !fromLocationId || !toLocationId || !requestedById) {
      console.error(`  ❌ Skipping transfer ${transfer._id} - missing required references`)
      continue
    }
    
    const { error } = await supabaseAdmin
      .from('transfers')
      .insert({
        vehicle_id: vehicleId,
        from_location_id: fromLocationId,
        to_location_id: toLocationId,
        requested_by_id: requestedById,
        status: transfer.status,
        reason: transfer.reason,
        transfer_notes: transfer.transferNotes,
        money_offer: transfer.moneyOffer,
        requested_by_date: transfer.requestedByDate,
        customer_waiting: transfer.customerWaiting || false,
        priority: transfer.priority || 'normal',
        expected_pickup_date: transfer.expectedPickupDate,
        actual_pickup_date: transfer.actualPickupDate,
        delivered_date: transfer.deliveredDate,
        approved_by_id: approvedById,
        approved_at: transfer.approvedAt,
        rejected_by_id: rejectedById,
        rejected_at: transfer.rejectedAt,
        rejection_reason: transfer.rejectionReason,
        cancelled_by_id: cancelledById,
        cancelled_at: transfer.cancelledAt,
        transport_notes: transfer.transportNotes,
        competing_requests_count: transfer.competingRequestsCount || 0,
        created_at: transfer._createdAt,
        updated_at: transfer._updatedAt,
        legacy_sanity_id: transfer._id
      })
    
    if (error) {
      console.error(`  ❌ Error migrating transfer:`, error)
    } else {
      console.log(`  ✅ Migrated transfer for vehicle ${vehicleId}`)
    }
  }
}

async function migrateActivities() {
  console.log('\n📋 Migrating activities...')
  
  // Get mappings
  const { data: users } = await supabaseAdmin
    .from('users')
    .select('id, legacy_sanity_id')
  const userMap = new Map(users?.map(u => [u.legacy_sanity_id, u.id]) || [])
  
  const { data: vehicles } = await supabaseAdmin
    .from('vehicles')
    .select('id, legacy_sanity_id')
  const vehicleMap = new Map(vehicles?.map(v => [v.legacy_sanity_id, v.id]) || [])
  
  const activities = await sanityClient.fetch(
    `*[_type == "activity"]{
      _id,
      vehicle->{_id},
      user->{_id},
      action,
      details,
      metadata,
      _createdAt
    }`
  )
  
  let successCount = 0
  
  for (const activity of activities) {
    const vehicleId = vehicleMap.get(activity.vehicle?._id)
    const userId = userMap.get(activity.user?._id)
    
    if (!vehicleId || !userId) {
      continue
    }
    
    const { error } = await supabaseAdmin
      .from('activities')
      .insert({
        vehicle_id: vehicleId,
        user_id: userId,
        action: activity.action,
        details: activity.details,
        metadata: activity.metadata || {},
        created_at: activity._createdAt,
        legacy_sanity_id: activity._id
      })
    
    if (error) {
      console.error(`  ❌ Error migrating activity:`, error.message)
    } else {
      successCount++
      if (successCount % 100 === 0) {
        console.log(`  ✅ Migrated ${successCount} activities...`)
      }
    }
  }
  
  console.log(`  ✅ Migrated ${successCount} activities`)
}

async function migrateComments() {
  console.log('\n💬 Migrating comments...')
  
  // Get mappings
  const { data: users } = await supabaseAdmin
    .from('users')
    .select('id, legacy_sanity_id')
  const userMap = new Map(users?.map(u => [u.legacy_sanity_id, u.id]) || [])
  
  const { data: vehicles } = await supabaseAdmin
    .from('vehicles')
    .select('id, legacy_sanity_id')
  const vehicleMap = new Map(vehicles?.map(v => [v.legacy_sanity_id, v.id]) || [])
  
  const comments = await sanityClient.fetch(
    `*[_type == "comment"]{
      _id,
      vehicle->{_id},
      author->{_id},
      text,
      edited,
      editedAt,
      mentions[]->{_id},
      _createdAt
    }`
  )
  
  for (const comment of comments) {
    const vehicleId = vehicleMap.get(comment.vehicle?._id)
    const authorId = userMap.get(comment.author?._id)
    
    if (!vehicleId || !authorId) {
      continue
    }
    
    // Insert comment
    const { data: newComment, error } = await supabaseAdmin
      .from('comments')
      .insert({
        vehicle_id: vehicleId,
        author_id: authorId,
        text: comment.text,
        edited: comment.edited || false,
        edited_at: comment.editedAt,
        created_at: comment._createdAt,
        legacy_sanity_id: comment._id
      })
      .select()
      .single()
    
    if (error) {
      console.error(`  ❌ Error migrating comment:`, error)
    } else {
      // Migrate mentions
      if (comment.mentions && comment.mentions.length > 0 && newComment) {
        const mentions = comment.mentions
          .map(mention => ({
            comment_id: newComment.id,
            user_id: userMap.get(mention._id)
          }))
          .filter(m => m.user_id)
        
        if (mentions.length > 0) {
          const { error: mentionError } = await supabaseAdmin
            .from('comment_mentions')
            .insert(mentions)
          
          if (mentionError) {
            console.error(`  ❌ Error migrating mentions:`, mentionError)
          }
        }
      }
      
      console.log(`  ✅ Migrated comment`)
    }
  }
}

async function updateVehicleTransferReferences() {
  console.log('\n🔗 Updating vehicle transfer references...')
  
  // Get all transfers
  const { data: transfers } = await supabaseAdmin
    .from('transfers')
    .select('id, vehicle_id, status')
    .in('status', ['requested', 'approved', 'in-transit'])
  
  if (transfers) {
    for (const transfer of transfers) {
      const { error } = await supabaseAdmin
        .from('vehicles')
        .update({
          current_transfer_id: transfer.id,
          status: transfer.status === 'requested' ? 'claimed' : 'in-transit'
        })
        .eq('id', transfer.vehicle_id)
      
      if (error) {
        console.error(`  ❌ Error updating vehicle ${transfer.vehicle_id}:`, error)
      }
    }
    
    console.log(`  ✅ Updated ${transfers.length} vehicle transfer references`)
  }
}

async function main() {
  console.log('🚀 Starting Sanity to Supabase migration...\n')
  
  try {
    await migrateLocations()
    await migrateUsers()
    await migrateVehicles()
    await migrateTransfers()
    await migrateActivities()
    await migrateComments()
    await updateVehicleTransferReferences()
    
    console.log('\n✅ Migration completed successfully!')
    console.log('\n📝 Next steps:')
    console.log('1. Verify data in Supabase dashboard')
    console.log('2. Test authentication with a user account')
    console.log('3. Remove legacy_sanity_id columns when confident')
    console.log('4. Update RLS policies as needed')
  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
  }
}

main()