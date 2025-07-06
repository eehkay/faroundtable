import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { isAdmin, isManager } from '@/lib/permissions'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (!isAdmin(session.user.role) && !isManager(session.user.role))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all'
    const condition = searchParams.get('condition') || 'all'
    const location = searchParams.get('location') || 'all'
    const priceRange = searchParams.get('priceRange') || 'all'

    // Build query
    let query = supabaseAdmin
      .from('vehicles')
      .select(`
        *,
        dealership_location:dealership_locations(*)
      `)
      .order('importedAt', { ascending: false })

    // Apply search filter
    if (search) {
      query = query.or(`stockNumber.ilike.%${search}%,vin.ilike.%${search}%,make.ilike.%${search}%,model.ilike.%${search}%`)
    }

    // Apply status filter
    if (status !== 'all') {
      query = query.eq('status', status)
    }

    // Apply condition filter
    if (condition !== 'all') {
      query = query.eq('condition', condition)
    }

    // Apply location filter
    if (location !== 'all') {
      query = query.eq('storeCode', location)
    }

    // Apply price range filter
    if (priceRange !== 'all') {
      const [min, max] = priceRange.split('-').map(Number)
      if (max) {
        query = query.gte('price', min).lte('price', max)
      } else {
        query = query.gte('price', min)
      }
    }

    const { data: vehicles, error } = await query

    if (error) {
      console.error('Error fetching vehicles for export:', error)
      return NextResponse.json({ error: 'Failed to fetch vehicles' }, { status: 500 })
    }

    // Generate CSV
    const headers = [
      'Stock Number',
      'VIN',
      'Year',
      'Make',
      'Model',
      'Trim',
      'Condition',
      'Status',
      'Location',
      'Price',
      'Sale Price',
      'Mileage',
      'Exterior Color',
      'Body Style',
      'Fuel Type',
      'Days on Lot',
      'Imported Date',
      'Last Updated'
    ]

    const rows = vehicles?.map(vehicle => [
      vehicle.stockNumber,
      vehicle.vin,
      vehicle.year,
      vehicle.make,
      vehicle.model,
      vehicle.trim || '',
      vehicle.condition,
      vehicle.status,
      vehicle.dealership_location?.name || vehicle.storeCode,
      vehicle.price,
      vehicle.salePrice || '',
      vehicle.mileage || '',
      vehicle.exteriorColor || '',
      vehicle.bodyStyle || '',
      vehicle.fuelType || '',
      vehicle.daysOnLot || 0,
      vehicle.importedAt ? new Date(vehicle.importedAt).toLocaleDateString() : '',
      vehicle.lastSeenInFeed ? new Date(vehicle.lastSeenInFeed).toLocaleDateString() : ''
    ])

    const csv = [
      headers.join(','),
      ...(rows?.map(row => 
        row.map(cell => 
          typeof cell === 'string' && cell.includes(',') 
            ? `"${cell.replace(/"/g, '""')}"` 
            : cell
        ).join(',')
      ) || [])
    ].join('\n')

    // Return CSV file
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="vehicles-export-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error('Error in GET /api/admin/vehicles/export:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}