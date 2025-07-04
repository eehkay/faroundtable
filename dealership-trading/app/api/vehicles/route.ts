import { NextRequest, NextResponse } from 'next/server'
import { client } from '@/lib/sanity'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

const ITEMS_PER_PAGE = 20

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || String(ITEMS_PER_PAGE))
    const search = searchParams.get('search') || ''
    const location = searchParams.get('location') || ''
    const status = searchParams.get('status') || ''
    const minPrice = searchParams.get('minPrice') || ''
    const maxPrice = searchParams.get('maxPrice') || ''

    const offset = (page - 1) * limit

    // Build filter conditions
    const filters = []
    
    if (search) {
      filters.push(`(
        lower(make) match lower("*${search}*") ||
        lower(model) match lower("*${search}*") ||
        lower(vin) match lower("*${search}*") ||
        lower(title) match lower("*${search}*") ||
        lower(stockNumber) match lower("*${search}*")
      )`)
    }

    if (location && location !== 'all') {
      filters.push(`location._ref == "${location}"`)
    }

    if (status && status !== 'all') {
      filters.push(`status == "${status}"`)
    }

    if (minPrice) {
      filters.push(`price >= ${minPrice}`)
    }

    if (maxPrice) {
      filters.push(`price <= ${maxPrice}`)
    }

    const filterString = filters.length > 0 ? ` && ${filters.join(' && ')}` : ''

    // Get total count
    const countQuery = `count(*[_type == "vehicle"${filterString}])`
    const totalCount = await client.fetch(countQuery)

    // Get paginated vehicles
    const vehiclesQuery = `*[_type == "vehicle"${filterString}] | order(createdAt desc) [${offset}...${offset + limit}] {
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
      imageUrls,
      status,
      storeCode,
      location->{
        _id,
        name,
        code
      },
      originalLocation->{
        _id,
        name,
        code
      },
      currentTransfer->{
        _id,
        status,
        toStore->{name}
      },
      daysOnLot
    }`

    const vehicles = await client.fetch(vehiclesQuery)
    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      vehicles,
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