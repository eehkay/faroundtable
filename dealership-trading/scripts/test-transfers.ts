import { supabaseAdmin } from '../lib/supabase-server';

async function testTransferQueries() {
  console.log('Testing transfer queries...\n');

  try {
    // Test 1: Fetch all transfers with related data
    console.log('1. Fetching all transfers with related data:');
    const { data: transfers, error: transferError } = await supabaseAdmin
      .from('transfers')
      .select(`
        *,
        vehicle:vehicle_id(
          id,
          vin,
          year,
          make,
          model,
          stock_number,
          price
        ),
        from_location:from_location_id(
          id,
          name,
          code
        ),
        to_location:to_location_id(
          id,
          name,
          code
        ),
        requested_by:requested_by_id(
          id,
          name,
          email
        ),
        approved_by:approved_by_id(
          id,
          name,
          email
        )
      `)
      .limit(5);

    if (transferError) {
      console.error('Error fetching transfers:', transferError);
    } else {
      console.log(`Found ${transfers?.length || 0} transfers`);
      transfers?.forEach(transfer => {
        console.log(`- Transfer ${transfer.id}: ${transfer.status} - ${transfer.vehicle?.year} ${transfer.vehicle?.make} ${transfer.vehicle?.model}`);
        console.log(`  From: ${transfer.from_location?.name} To: ${transfer.to_location?.name}`);
      });
    }

    // Test 2: Fetch pending transfers for a specific location
    console.log('\n2. Fetching pending transfers:');
    const { data: pendingTransfers, error: pendingError } = await supabaseAdmin
      .from('transfers')
      .select(`
        *,
        vehicle:vehicle_id(
          id,
          vin,
          year,
          make,
          model
        ),
        to_location:to_location_id(
          name
        )
      `)
      .eq('status', 'requested')
      .limit(5);

    if (pendingError) {
      console.error('Error fetching pending transfers:', pendingError);
    } else {
      console.log(`Found ${pendingTransfers?.length || 0} pending transfers`);
      pendingTransfers?.forEach(transfer => {
        console.log(`- Request to ${transfer.to_location?.name}: ${transfer.vehicle?.year} ${transfer.vehicle?.make} ${transfer.vehicle?.model}`);
      });
    }

    // Test 3: Fetch transfers for a specific vehicle
    console.log('\n3. Testing vehicle transfer history:');
    // First get a vehicle that has transfers
    const { data: vehicleWithTransfers } = await supabaseAdmin
      .from('vehicles')
      .select('id, year, make, model')
      .not('current_transfer_id', 'is', null)
      .limit(1)
      .single();

    if (vehicleWithTransfers) {
      const { data: vehicleTransfers, error: vehicleError } = await supabaseAdmin
        .from('transfers')
        .select(`
          *,
          from_location:from_location_id(name),
          to_location:to_location_id(name),
          requested_by:requested_by_id(name)
        `)
        .eq('vehicle_id', vehicleWithTransfers.id)
        .order('created_at', { ascending: false });

      if (vehicleError) {
        console.error('Error fetching vehicle transfers:', vehicleError);
      } else {
        console.log(`Transfer history for ${vehicleWithTransfers.year} ${vehicleWithTransfers.make} ${vehicleWithTransfers.model}:`);
        vehicleTransfers?.forEach(transfer => {
          console.log(`- ${transfer.status}: ${transfer.from_location?.name} → ${transfer.to_location?.name} (${new Date(transfer.created_at).toLocaleDateString()})`);
        });
      }
    }

    // Test 4: Count transfers by status
    console.log('\n4. Transfer counts by status:');
    const statuses = ['requested', 'approved', 'in-transit', 'delivered', 'rejected', 'cancelled'];
    
    for (const status of statuses) {
      const { count } = await supabaseAdmin
        .from('transfers')
        .select('*', { count: 'exact', head: true })
        .eq('status', status);
      
      console.log(`- ${status}: ${count || 0} transfers`);
    }

    // Test 5: Recent activities related to transfers
    console.log('\n5. Recent transfer-related activities:');
    const { data: activities, error: activityError } = await supabaseAdmin
      .from('activities')
      .select(`
        *,
        user:user_id(name),
        vehicle:vehicle_id(
          year,
          make,
          model
        )
      `)
      .in('action', ['claimed', 'transfer-approved', 'transfer-rejected', 'transfer-started', 'transfer-completed', 'transfer-cancelled'])
      .order('created_at', { ascending: false })
      .limit(10);

    if (activityError) {
      console.error('Error fetching activities:', activityError);
    } else {
      console.log(`Found ${activities?.length || 0} recent transfer activities`);
      activities?.forEach(activity => {
        console.log(`- ${activity.action}: ${activity.details} (by ${activity.user?.name})`);
      });
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the tests
testTransferQueries();