import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase-server'

// GET - Fetch AI context settings
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch context settings (should only be one row)
    const { data, error } = await supabaseAdmin
      .from('ai_context_settings')
      .select('*')
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching AI context settings:', error)
      return NextResponse.json(
        { error: 'Failed to fetch AI context settings' },
        { status: 500 }
      )
    }

    // If no settings exist, return defaults
    if (!data) {
      return NextResponse.json({
        success: true,
        data: {
          market_position_context: 'This section contains price prediction data comparing the vehicle\'s current price to market predictions. \'raw\' contains unprocessed API responses, \'processed\' contains calculated values. Key metrics: predicted_price, confidence level, price_range (market bounds)',
          inventory_analysis_context: 'Market Day Supply (MDS) indicates how many days of inventory exist based on current sales rate. Lower MDS = higher demand/scarcity, Higher MDS = oversupply. inventory_count: current listings, sales_count: recent sales used for MDS calculation',
          regional_performance_context: 'Historical sales data for this vehicle type in the specified city/region. Includes pricing statistics, mileage averages, and days on market trends. \'count\' represents historical sales volume in this market',
          competitive_landscape_context: 'Shows competing inventory within the search radius. Limited to top 20 vehicles to reduce data size. Includes pricing, mileage, distance from location, and days on market. totalCount shows full inventory size even though listings are limited',
          demand_analysis_context: 'Based on keyword search volume data from DataForSEO. Shows consumer interest through search queries. Vehicle-specific keywords indicate direct interest in this model. Generic keywords show general market activity',
          include_context: true
        }
      })
    }

    return NextResponse.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 }
    )
  }
}

// PUT - Update AI context settings
export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    // Get request body
    const body = await request.json()
    const {
      market_position_context,
      inventory_analysis_context,
      regional_performance_context,
      competitive_landscape_context,
      demand_analysis_context,
      include_context
    } = body

    // Validate required fields
    if (!market_position_context || !inventory_analysis_context || 
        !regional_performance_context || !competitive_landscape_context || 
        !demand_analysis_context) {
      return NextResponse.json(
        { error: 'All context fields are required' },
        { status: 400 }
      )
    }

    // Get current settings for audit log
    const { data: currentSettings } = await supabaseAdmin
      .from('ai_context_settings')
      .select('*')
      .single()

    // Update or insert settings
    const { data, error } = await supabaseAdmin
      .from('ai_context_settings')
      .upsert({
        market_position_context,
        inventory_analysis_context,
        regional_performance_context,
        competitive_landscape_context,
        demand_analysis_context,
        include_context: include_context !== false, // Default to true
        updated_by: session.user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Error updating AI context settings:', error)
      return NextResponse.json(
        { error: 'Failed to update AI context settings' },
        { status: 500 }
      )
    }

    // Create audit log entries for changed fields
    if (currentSettings) {
      const auditEntries: any[] = []
      const fields = [
        'market_position_context',
        'inventory_analysis_context',
        'regional_performance_context',
        'competitive_landscape_context',
        'demand_analysis_context',
        'include_context'
      ]

      for (const field of fields) {
        if (currentSettings[field] !== body[field]) {
          auditEntries.push({
            changed_by: session.user.id,
            field_name: field,
            old_value: currentSettings[field]?.toString(),
            new_value: body[field]?.toString()
          })
        }
      }

      if (auditEntries.length > 0) {
        await supabaseAdmin
          .from('ai_context_settings_audit')
          .insert(auditEntries)
      }
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'AI context settings updated successfully'
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 }
    )
  }
}

// POST - Reset to default settings
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    // Default values
    const defaults = {
      market_position_context: 'This section contains price prediction data comparing the vehicle\'s current price to market predictions. \'raw\' contains unprocessed API responses, \'processed\' contains calculated values. Key metrics: predicted_price, confidence level, price_range (market bounds)',
      inventory_analysis_context: 'Market Day Supply (MDS) indicates how many days of inventory exist based on current sales rate. Lower MDS = higher demand/scarcity, Higher MDS = oversupply. inventory_count: current listings, sales_count: recent sales used for MDS calculation',
      regional_performance_context: 'Historical sales data for this vehicle type in the specified city/region. Includes pricing statistics, mileage averages, and days on market trends. \'count\' represents historical sales volume in this market',
      competitive_landscape_context: 'Shows competing inventory within the search radius. Limited to top 20 vehicles to reduce data size. Includes pricing, mileage, distance from location, and days on market. totalCount shows full inventory size even though listings are limited',
      demand_analysis_context: 'Based on keyword search volume data from DataForSEO. Shows consumer interest through search queries. Vehicle-specific keywords indicate direct interest in this model. Generic keywords show general market activity',
      include_context: true,
      updated_by: session.user.id
    }

    // Update settings
    const { data, error } = await supabaseAdmin
      .from('ai_context_settings')
      .upsert(defaults)
      .select()
      .single()

    if (error) {
      console.error('Error resetting AI context settings:', error)
      return NextResponse.json(
        { error: 'Failed to reset AI context settings' },
        { status: 500 }
      )
    }

    // Log the reset action
    await supabaseAdmin
      .from('ai_context_settings_audit')
      .insert({
        changed_by: session.user.id,
        field_name: 'RESET_ALL',
        old_value: 'Custom settings',
        new_value: 'Default settings'
      })

    return NextResponse.json({
      success: true,
      data,
      message: 'AI context settings reset to defaults'
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 }
    )
  }
}