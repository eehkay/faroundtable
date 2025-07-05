import { supabaseAdmin } from './supabase-server'

// Helper function to get vehicle by stock number
export async function getVehicleByStockNumber(stockNumber: string) {
  const { data, error } = await supabaseAdmin
    .from('vehicles')
    .select(`
      *,
      location:location_id(
        id,
        name,
        code,
        address,
        city,
        state,
        zip,
        phone
      ),
      original_location:original_location_id(
        id,
        name,
        code
      )
    `)
    .eq('stock_number', stockNumber)
    .single()
    
  if (!data) {
    return null
  }
  
  // Fetch active transfer requests separately
  const { data: transferRequests } = await supabaseAdmin
    .from('transfers')
    .select(`
      id,
      status,
      transfer_notes,
      money_offer,
      requested_by_date,
      customer_waiting,
      priority,
      from_location:from_location_id(id, name, code),
      to_location:to_location_id(id, name, code),
      requested_by:requested_by_id(id, name, email)
    `)
    .eq('vehicle_id', data.id)
    .eq('status', 'requested')

  if (error) {
    console.error('Error fetching vehicle:', error)
    return null
  }

  // Transform to match existing format
  return {
    _id: data.id,
    stockNumber: data.stock_number,
    vin: data.vin,
    year: data.year,
    make: data.make,
    model: data.model,
    trim: data.trim,
    title: data.title,
    price: data.price,
    salePrice: data.sale_price,
    msrp: data.msrp,
    mileage: data.mileage,
    condition: data.condition,
    exteriorColor: data.exterior_color,
    bodyStyle: data.body_style,
    fuelType: data.fuel_type,
    description: data.description,
    features: data.features || [],
    imageUrls: data.image_urls || [],
    status: data.status,
    storeCode: data.store_code,
    daysOnLot: data.days_on_lot || 0,
    location: data.location ? {
      _id: data.location.id,
      name: data.location.name,
      code: data.location.code,
      address: data.location.address,
      city: data.location.city,
      state: data.location.state,
      zip: data.location.zip,
      phone: data.location.phone
    } : null,
    originalLocation: data.original_location ? {
      _id: data.original_location.id,
      name: data.original_location.name,
      code: data.original_location.code
    } : null,
    activeTransferRequests: transferRequests?.map((transfer: any) => ({
      _id: transfer.id,
      status: transfer.status,
      transferNotes: transfer.transfer_notes,
      moneyOffer: transfer.money_offer,
      requestedByDate: transfer.requested_by_date,
      customerWaiting: transfer.customer_waiting,
      priority: transfer.priority,
      fromLocation: transfer.from_location ? {
        _id: transfer.from_location.id,
        name: transfer.from_location.name,
        code: transfer.from_location.code
      } : null,
      toLocation: transfer.to_location ? {
        _id: transfer.to_location.id,
        name: transfer.to_location.name,
        code: transfer.to_location.code
      } : null,
      requestedBy: transfer.requested_by ? {
        _id: transfer.requested_by.id,
        name: transfer.requested_by.name,
        email: transfer.requested_by.email
      } : null
    })) || []
  }
}

// Get vehicle activity
export async function getVehicleActivity(vehicleId: string) {
  const { data, error } = await supabaseAdmin
    .from('activities')
    .select(`
      id,
      action,
      details,
      metadata,
      created_at,
      user:user_id(
        name,
        email,
        image_url
      )
    `)
    .eq('vehicle_id', vehicleId)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('Error fetching activity:', error)
    return []
  }

  // Transform to match existing format
  return data?.map(activity => ({
    _id: activity.id,
    action: activity.action,
    details: activity.details,
    metadata: activity.metadata,
    createdAt: activity.created_at,
    user: activity.user ? {
      name: activity.user.name,
      email: activity.user.email,
      image: activity.user.image_url
    } : null
  })) || []
}

// Get vehicle comments
export async function getVehicleComments(vehicleId: string) {
  const { data, error } = await supabaseAdmin
    .from('comments')
    .select(`
      id,
      text,
      edited,
      edited_at,
      created_at,
      author:author_id(
        id,
        name,
        email,
        image_url
      )
    `)
    .eq('vehicle_id', vehicleId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching comments:', error)
    return []
  }

  // Transform to match existing format
  return data?.map(comment => ({
    _id: comment.id,
    text: comment.text,
    edited: comment.edited,
    editedAt: comment.edited_at,
    createdAt: comment.created_at,
    author: comment.author ? {
      _id: comment.author.id,
      name: comment.author.name,
      email: comment.author.email,
      image: comment.author.image_url
    } : null,
    mentions: [] // Mentions will be fetched separately if needed
  })) || []
}

// Get all users
export async function getAllUsers() {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select(`
      id,
      email,
      name,
      image_url,
      domain,
      role,
      active,
      last_login,
      location:location_id(
        id,
        name,
        code
      )
    `)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching users:', error)
    return []
  }

  // Transform to match existing format
  return data?.map(user => ({
    _id: user.id,
    email: user.email,
    name: user.name,
    image: user.image_url,
    domain: user.domain,
    role: user.role,
    active: user.active,
    lastLogin: user.last_login,
    location: user.location ? {
      _id: user.location.id,
      name: user.location.name,
      code: user.location.code
    } : null
  })) || []
}

// Get user by ID
export async function getUserById(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select(`
      id,
      email,
      name,
      image_url,
      domain,
      role,
      active,
      last_login,
      location:location_id(
        id,
        name,
        code,
        address
      )
    `)
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching user:', error)
    return null
  }

  // Transform to match existing format
  return {
    _id: data.id,
    email: data.email,
    name: data.name,
    image: data.image_url,
    domain: data.domain,
    role: data.role,
    active: data.active,
    lastLogin: data.last_login,
    location: data.location ? {
      _id: data.location.id,
      name: data.location.name,
      code: data.location.code,
      address: data.location.address
    } : null
  }
}

// Get dashboard stats
export async function getDashboardStats() {
  const [
    totalVehiclesResult,
    availableVehiclesResult,
    activeTransfersResult,
    recentActivityResult
  ] = await Promise.all([
    supabaseAdmin.from('vehicles').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('vehicles').select('*', { count: 'exact', head: true }).eq('status', 'available'),
    supabaseAdmin.from('transfers').select('*', { count: 'exact', head: true }).in('status', ['requested', 'approved', 'in-transit']),
    supabaseAdmin.from('activities').select(`
      action,
      created_at,
      vehicle:vehicles!activities_vehicle_id_fkey(title, stock_number),
      user:users!activities_user_id_fkey(name)
    `).order('created_at', { ascending: false }).limit(10)
  ])

  return {
    totalVehicles: totalVehiclesResult.count || 0,
    availableVehicles: availableVehiclesResult.count || 0,
    activeTransfers: activeTransfersResult.count || 0,
    recentActivity: recentActivityResult.data?.map(activity => ({
      action: activity.action,
      createdAt: activity.created_at,
      vehicle: activity.vehicle ? {
        title: activity.vehicle.title,
        stockNumber: activity.vehicle.stock_number
      } : null,
      user: activity.user ? {
        name: activity.user.name
      } : null
    })) || []
  }
}

// Get dealership locations
export async function getDealershipLocations() {
  const { data, error } = await supabaseAdmin
    .from('dealership_locations')
    .select(`
      id,
      name,
      code,
      address,
      city,
      state,
      zip,
      phone
    `)
    .eq('active', true)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching locations:', error)
    return []
  }

  // Transform to match existing format
  return data?.map(location => ({
    _id: location.id,
    name: location.name,
    code: location.code,
    address: location.address,
    city: location.city,
    state: location.state,
    zip: location.zip,
    phone: location.phone
  })) || []
}