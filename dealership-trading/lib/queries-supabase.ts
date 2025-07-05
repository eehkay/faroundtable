import { supabase } from './supabase'

// Helper function to get vehicle by stock number
export async function getVehicleByStockNumber(stockNumber: string) {
  const { data, error } = await supabase
    .from('vehicles')
    .select(`
      *,
      location:dealership_locations!vehicles_location_id_fkey(
        id,
        name,
        code,
        address,
        city,
        state,
        zip,
        phone
      ),
      original_location:dealership_locations!vehicles_original_location_id_fkey(
        id,
        name,
        code
      ),
      active_transfer_requests:transfers!transfers_vehicle_id_fkey(
        id,
        status,
        transfer_notes,
        money_offer,
        requested_by_date,
        customer_waiting,
        priority,
        from_location:dealership_locations!transfers_from_location_id_fkey(id, name, code),
        to_location:dealership_locations!transfers_to_location_id_fkey(id, name, code),
        requested_by:users!transfers_requested_by_id_fkey(id, name, email)
      )
    `)
    .eq('stock_number', stockNumber)
    .eq('active_transfer_requests.status', 'requested')
    .single()

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
    daysOnLot: data.days_on_lot,
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
    activeTransferRequests: data.active_transfer_requests?.map((transfer: any) => ({
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
  const { data, error } = await supabase
    .from('activities')
    .select(`
      id,
      action,
      details,
      metadata,
      created_at,
      user:users!activities_user_id_fkey(
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
  const { data, error } = await supabase
    .from('comments')
    .select(`
      id,
      text,
      edited,
      edited_at,
      created_at,
      author:users!comments_author_id_fkey(
        id,
        name,
        email,
        image_url
      ),
      mentions:comment_mentions(
        user:users!comment_mentions_user_id_fkey(
          id,
          name
        )
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
    mentions: comment.mentions?.map((m: any) => ({
      _id: m.user.id,
      name: m.user.name
    })) || []
  })) || []
}

// Get all users
export async function getAllUsers() {
  const { data, error } = await supabase
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
      location:dealership_locations!users_location_id_fkey(
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
  const { data, error } = await supabase
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
      location:dealership_locations!users_location_id_fkey(
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
    supabase.from('vehicles').select('*', { count: 'exact', head: true }),
    supabase.from('vehicles').select('*', { count: 'exact', head: true }).eq('status', 'available'),
    supabase.from('transfers').select('*', { count: 'exact', head: true }).in('status', ['requested', 'approved', 'in-transit']),
    supabase.from('activities').select(`
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
  const { data, error } = await supabase
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