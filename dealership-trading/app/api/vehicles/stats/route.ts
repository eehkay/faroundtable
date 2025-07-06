import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get min/max values for various fields
    const { data: stats, error } = await supabaseAdmin
      .from('vehicles')
      .select('price, year, mileage, days_on_lot')
      .not('price', 'is', null)
      .not('year', 'is', null)
      .not('mileage', 'is', null)
      .not('days_on_lot', 'is', null)

    if (error) {
      console.error('Error fetching vehicle stats:', error)
      throw error
    }

    if (!stats || stats.length === 0) {
      return NextResponse.json({
        minPrice: 0,
        maxPrice: 100000,
        minYear: 2015,
        maxYear: new Date().getFullYear(),
        minMileage: 0,
        maxMileage: 150000,
        minDaysOnLot: 0,
        maxDaysOnLot: 90
      })
    }

    // Calculate min/max values
    const prices = stats.map(v => v.price).filter(p => p !== null)
    const years = stats.map(v => v.year).filter(y => y !== null)
    const mileages = stats.map(v => v.mileage).filter(m => m !== null)
    const daysOnLot = stats.map(v => v.days_on_lot).filter(d => d !== null)

    // Get unique makes and models
    const { data: makes } = await supabaseAdmin
      .from('vehicles')
      .select('make')
      .not('make', 'is', null)
      .order('make')
    
    const uniqueMakes = [...new Set(makes?.map(v => v.make) || [])]

    return NextResponse.json({
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
      minYear: Math.min(...years),
      maxYear: Math.max(...years),
      minMileage: Math.min(...mileages),
      maxMileage: Math.max(...mileages),
      minDaysOnLot: Math.min(...daysOnLot),
      maxDaysOnLot: Math.max(...daysOnLot),
      makes: uniqueMakes
    })
  } catch (error) {
    console.error('Error fetching vehicle stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch vehicle stats' },
      { status: 500 }
    )
  }
}