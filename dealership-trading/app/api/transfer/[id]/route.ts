import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase-server'
import { canEditTransportInfo } from '@/lib/permissions'
import { TransferWithRelations } from '@/types/supabase'

// GET /api/transfer/[id] - Get transfer details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { id } = await params
    const { data: transfer, error } = await supabaseAdmin
      .from('transfers')
      .select(`
        *,
        vehicle:vehicles!vehicle_id (
          *,
          location:dealership_locations!location_id (*),
          original_location:dealership_locations!original_location_id (*)
        ),
        from_location:dealership_locations!from_location_id (*),
        to_location:dealership_locations!to_location_id (*),
        requested_by:users!requested_by_id (*),
        approved_by:users!approved_by_id (*),
        rejected_by:users!rejected_by_id (*),
        cancelled_by:users!cancelled_by_id (*),
        updated_by:users!updated_by_id (*),
        transfer_updates (
          *,
          user:users!user_id (*)
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      return new NextResponse('Transfer not found', { status: 404 })
    }

    return NextResponse.json(transfer)
  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

// PATCH /api/transfer/[id] - Update transfer transport information
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const body = await request.json()
    const {
      transport_company,
      transport_cost,
      transport_pickup_date,
      expected_arrival_date,
      transport_notes
    } = body

    const { id } = await params
    
    // Fetch the current transfer to check permissions
    const { data: currentTransfer, error: fetchError } = await supabaseAdmin
      .from('transfers')
      .select('*, vehicle:vehicles!vehicle_id(*)')
      .eq('id', id)
      .single()

    if (fetchError || !currentTransfer) {
      return new NextResponse('Transfer not found', { status: 404 })
    }

    // Check permissions
    if (!canEditTransportInfo(session.user, currentTransfer)) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    // Store previous values for audit trail
    const previousValues: Record<string, any> = {}
    const newValues: Record<string, any> = {}
    const updates: Record<string, any> = {
      updated_by_id: session.user.id,
      last_update_notes: `Transport information updated by ${session.user.name || session.user.email}`
    }

    // Track changes
    if (transport_company !== undefined && transport_company !== currentTransfer.transport_company) {
      previousValues.transport_company = currentTransfer.transport_company
      newValues.transport_company = transport_company
      updates.transport_company = transport_company
    }

    if (transport_cost !== undefined && transport_cost !== currentTransfer.transport_cost) {
      previousValues.transport_cost = currentTransfer.transport_cost
      newValues.transport_cost = transport_cost
      updates.transport_cost = transport_cost
    }

    if (transport_pickup_date !== undefined && transport_pickup_date !== currentTransfer.transport_pickup_date) {
      previousValues.transport_pickup_date = currentTransfer.transport_pickup_date
      newValues.transport_pickup_date = transport_pickup_date
      updates.transport_pickup_date = transport_pickup_date
    }

    if (expected_arrival_date !== undefined && expected_arrival_date !== currentTransfer.expected_arrival_date) {
      previousValues.expected_arrival_date = currentTransfer.expected_arrival_date
      newValues.expected_arrival_date = expected_arrival_date
      updates.expected_arrival_date = expected_arrival_date
    }

    if (transport_notes !== undefined && transport_notes !== currentTransfer.transport_notes) {
      previousValues.transport_notes = currentTransfer.transport_notes
      newValues.transport_notes = transport_notes
      updates.transport_notes = transport_notes
    }

    // Update the transfer
    const { data: updatedTransfer, error: updateError } = await supabaseAdmin
      .from('transfers')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        vehicle:vehicles!vehicle_id (*),
        from_location:dealership_locations!from_location_id (*),
        to_location:dealership_locations!to_location_id (*),
        requested_by:users!requested_by_id (*),
        updated_by:users!updated_by_id (*)
      `)
      .single()

    if (updateError) {
      return new NextResponse('Failed to update transfer', { status: 500 })
    }

    // Create transfer update record
    if (Object.keys(newValues).length > 0) {
      await supabaseAdmin
        .from('transfer_updates')
        .insert({
          transfer_id: id,
          user_id: session.user.id,
          update_type: 'transport_info',
          update_notes: updates.last_update_notes,
          previous_values: previousValues,
          new_values: newValues
        })
    }

    // Create activity log
    await supabaseAdmin
      .from('activities')
      .insert({
        vehicle_id: currentTransfer.vehicle_id,
        user_id: session.user.id,
        action: 'status-updated',
        details: `Updated transport information: ${Object.keys(newValues).join(', ')}`,
        metadata: {
          transferId: id,
          updatedFields: Object.keys(newValues)
        }
      })

    return NextResponse.json(updatedTransfer)
  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}