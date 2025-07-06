import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { isAdmin, isManager } from '@/lib/permissions'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (!isAdmin(session.user.role) && !isManager(session.user.role))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { ids } = await request.json()

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Invalid vehicle IDs' }, { status: 400 })
    }

    // Check if any vehicles have active transfers
    const { data: transfers, error: transferError } = await supabaseAdmin
      .from('transfers')
      .select('vehicleId')
      .in('vehicleId', ids)
      .in('status', ['requested', 'approved', 'in-transit'])

    if (transferError) {
      console.error('Error checking transfers:', transferError)
      return NextResponse.json({ error: 'Failed to check transfers' }, { status: 500 })
    }

    if (transfers && transfers.length > 0) {
      const vehiclesWithTransfers = transfers.map(t => t.vehicleId)
      return NextResponse.json(
        { 
          error: 'Cannot delete vehicles with active transfers',
          vehiclesWithTransfers 
        },
        { status: 400 }
      )
    }

    // Get vehicle details before deletion for logging
    const { data: vehicles } = await supabaseAdmin
      .from('vehicles')
      .select('id, stockNumber, vin, make, model, year')
      .in('id', ids)

    // Delete the vehicles
    const { error: deleteError } = await supabaseAdmin
      .from('vehicles')
      .delete()
      .in('id', ids)

    if (deleteError) {
      console.error('Error deleting vehicles:', deleteError)
      return NextResponse.json({ error: 'Failed to delete vehicles' }, { status: 500 })
    }

    // Log the bulk deletion
    if (vehicles && vehicles.length > 0) {
      await supabaseAdmin
        .from('activities')
        .insert({
          vehicleId: null,
          userId: session.user.id,
          action: 'bulk_deleted',
          description: `Deleted ${vehicles.length} vehicles`,
          metadata: { 
            deletedVehicles: vehicles.map(v => ({
              stockNumber: v.stockNumber,
              vehicle: `${v.year} ${v.make} ${v.model}`
            }))
          },
        })
    }

    return NextResponse.json({ 
      success: true, 
      deletedCount: vehicles?.length || 0 
    })
  } catch (error) {
    console.error('Error in DELETE /api/admin/vehicles:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}