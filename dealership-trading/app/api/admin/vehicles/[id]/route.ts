import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { isAdmin, isManager } from '@/lib/permissions'
import { supabaseAdmin } from '@/lib/supabase'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (!isAdmin(session.user.role) && !isManager(session.user.role))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const updates = await request.json()
    const vehicleId = params.id

    // Validate that we're not updating protected fields
    const allowedFields = [
      'price',
      'salePrice',
      'status',
      'condition',
      'mileage',
      'description',
      'features'
    ]

    const filteredUpdates = Object.keys(updates)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = updates[key]
        return obj
      }, {} as any)

    // Update the vehicle
    const { data, error } = await supabaseAdmin
      .from('vehicles')
      .update({
        ...filteredUpdates,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', vehicleId)
      .select()
      .single()

    if (error) {
      console.error('Error updating vehicle:', error)
      return NextResponse.json({ error: 'Failed to update vehicle' }, { status: 500 })
    }

    // Log the update in activities
    await supabaseAdmin
      .from('activities')
      .insert({
        vehicleId,
        userId: session.user.id,
        action: 'updated',
        description: `Updated vehicle details`,
        metadata: { updates: filteredUpdates },
      })

    return NextResponse.json({ vehicle: data })
  } catch (error) {
    console.error('Error in PATCH /api/admin/vehicles/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (!isAdmin(session.user.role) && !isManager(session.user.role))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const vehicleId = params.id

    // Check if vehicle has active transfers
    const { data: transfers, error: transferError } = await supabaseAdmin
      .from('transfers')
      .select('id')
      .eq('vehicleId', vehicleId)
      .in('status', ['requested', 'approved', 'in-transit'])

    if (transferError) {
      console.error('Error checking transfers:', transferError)
      return NextResponse.json({ error: 'Failed to check transfers' }, { status: 500 })
    }

    if (transfers && transfers.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete vehicle with active transfers' },
        { status: 400 }
      )
    }

    // Log the deletion before deleting
    const { data: vehicle } = await supabaseAdmin
      .from('vehicles')
      .select('stockNumber, vin, make, model, year')
      .eq('id', vehicleId)
      .single()

    // Delete the vehicle
    const { error: deleteError } = await supabaseAdmin
      .from('vehicles')
      .delete()
      .eq('id', vehicleId)

    if (deleteError) {
      console.error('Error deleting vehicle:', deleteError)
      return NextResponse.json({ error: 'Failed to delete vehicle' }, { status: 500 })
    }

    // Log the deletion in activities
    if (vehicle) {
      await supabaseAdmin
        .from('activities')
        .insert({
          vehicleId: null, // Vehicle is deleted, so no reference
          userId: session.user.id,
          action: 'deleted',
          description: `Deleted vehicle: ${vehicle.year} ${vehicle.make} ${vehicle.model} (${vehicle.stockNumber})`,
          metadata: { deletedVehicle: vehicle },
        })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/admin/vehicles/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}