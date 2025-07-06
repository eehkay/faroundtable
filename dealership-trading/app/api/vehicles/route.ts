import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const ITEMS_PER_PAGE = 20

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.log('Vehicle API called by user:', session.user.email)

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || String(ITEMS_PER_PAGE))
    const search = searchParams.get('search') || ''
    const location = searchParams.get('location') || ''
    const status = searchParams.get('status') || ''
    const minPrice = searchParams.get('minPrice') || ''
    const maxPrice = searchParams.get('maxPrice') || ''
    const minDaysOnLot = searchParams.get('minDaysOnLot') || ''
    const maxDaysOnLot = searchParams.get('maxDaysOnLot') || ''
    const minYear = searchParams.get('minYear') || ''
    const maxYear = searchParams.get('maxYear') || ''
    const minMileage = searchParams.get('minMileage') || ''
    const maxMileage = searchParams.get('maxMileage') || ''
    const make = searchParams.get('make') || ''
    const model = searchParams.get('model') || ''
    const condition = searchParams.get('condition') || ''

    const offset = (page - 1) * limit

    // Start building query
    let query = supabaseAdmin
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
        ),
        current_transfer:current_transfer_id(
          id,
          status,
          to_location:to_location_id(
            name
          )
        )
      `, { count: 'exact' })

    // Apply filters
    if (search) {
      // Use ilike for case-insensitive search
      query = query.or(`make.ilike.%${search}%,model.ilike.%${search}%,vin.ilike.%${search}%,title.ilike.%${search}%,stock_number.ilike.%${search}%`)
    }

    if (location && location !== 'all') {
      query = query.eq('location_id', location)
    }

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (minPrice) {
      query = query.gte('price', parseInt(minPrice))
    }

    if (maxPrice) {
      query = query.lte('price', parseInt(maxPrice))
    }

    // Days on lot filter
    if (minDaysOnLot) {
      query = query.gte('days_on_lot', parseInt(minDaysOnLot))
    }
    if (maxDaysOnLot) {
      query = query.lte('days_on_lot', parseInt(maxDaysOnLot))
    }

    // Year filter
    if (minYear) {
      query = query.gte('year', parseInt(minYear))
    }
    if (maxYear) {
      query = query.lte('year', parseInt(maxYear))
    }

    // Mileage filter
    if (minMileage) {
      query = query.gte('mileage', parseInt(minMileage))
    }
    if (maxMileage) {
      query = query.lte('mileage', parseInt(maxMileage))
    }

    // Make filter
    if (make && make !== 'all') {
      query = query.ilike('make', make)
    }

    // Model filter
    if (model && model !== 'all') {
      query = query.ilike('model', model)
    }

    // Condition filter
    if (condition && condition !== 'all') {
      query = query.eq('condition', condition)
    }

    // Apply pagination and ordering
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: vehicles, error, count } = await query

    console.log('Query result:', { 
      vehicleCount: vehicles?.length, 
      totalCount: count,
      error: error?.message 
    })

    if (error) {
      console.error('Supabase error:', error)
      throw error
    }

    const totalCount = count || 0
    const totalPages = Math.ceil(totalCount / limit)

    // Transform the data to match the existing format
    const transformedVehicles = vehicles?.map(vehicle => ({
      _id: vehicle.id,
      stockNumber: vehicle.stock_number,
      vin: vehicle.vin,
      year: vehicle.year,
      make: vehicle.make,
      model: vehicle.model,
      trim: vehicle.trim,
      title: vehicle.title,
      price: vehicle.price,
      salePrice: vehicle.sale_price,
      msrp: vehicle.msrp,
      mileage: vehicle.mileage,
      condition: vehicle.condition,
      exteriorColor: vehicle.exterior_color,
      bodyStyle: vehicle.body_style,
      fuelType: vehicle.fuel_type,
      imageUrls: vehicle.image_urls || [],
      status: vehicle.status,
      storeCode: vehicle.store_code,
      location: vehicle.location ? {
        _id: vehicle.location.id,
        name: vehicle.location.name,
        code: vehicle.location.code
      } : null,
      originalLocation: vehicle.original_location ? {
        _id: vehicle.original_location.id,
        name: vehicle.original_location.name,
        code: vehicle.original_location.code
      } : null,
      currentTransfer: vehicle.current_transfer ? {
        _id: vehicle.current_transfer.id,
        status: vehicle.current_transfer.status,
        toStore: vehicle.current_transfer.to_location ? {
          name: vehicle.current_transfer.to_location.name
        } : null
      } : null,
      daysOnLot: vehicle.days_on_lot || 0
    })) || []

    return NextResponse.json({
      vehicles: transformedVehicles,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    })
  } catch (error) {
    console.error('Error fetching vehicles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch vehicles' },
      { status: 500 }
    )
  }
}