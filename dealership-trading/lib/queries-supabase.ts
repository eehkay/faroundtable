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
    .in('status', ['requested', 'approved', 'in-transit'])

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
    } : undefined,
    originalLocation: data.original_location ? {
      _id: data.original_location.id,
      name: data.original_location.name,
      code: data.original_location.code
    } : undefined,
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
      } : undefined,
      toLocation: transfer.to_location ? {
        _id: transfer.to_location.id,
        name: transfer.to_location.name,
        code: transfer.to_location.code
      } : undefined,
      requestedBy: transfer.requested_by ? {
        _id: transfer.requested_by.id,
        name: transfer.requested_by.name,
        email: transfer.requested_by.email
      } : undefined
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
  return data?.map((activity: any) => ({
    _id: activity.id,
    action: activity.action,
    details: activity.details,
    metadata: activity.metadata,
    createdAt: activity.created_at,
    user: activity.user ? {
      name: activity.user.name,
      email: activity.user.email,
      image: activity.user.image_url
    } : undefined
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
  return data?.map((comment: any) => ({
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
    } : undefined,
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
  return data?.map((user: any) => ({
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
    } : undefined
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

  const userData = data as any;
  
  // Transform to match existing format
  return {
    _id: userData.id,
    email: userData.email,
    name: userData.name,
    image: userData.image_url,
    domain: userData.domain,
    role: userData.role,
    active: userData.active,
    lastLogin: userData.last_login,
    location: userData.location ? {
      _id: userData.location.id,
      name: userData.location.name,
      code: userData.location.code,
      address: userData.location.address
    } : undefined
  }
}

// Search users
export async function searchUsers(search: string) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select(`
      id,
      email,
      name,
      image_url,
      role,
      active,
      location:location_id(
        id,
        name,
        code
      )
    `)
    .or(`name.ilike.%${search}%,email.ilike.%${search}%`)
    .order('name', { ascending: true })
    .limit(50)

  if (error) {
    console.error('Error searching users:', error)
    return []
  }

  // Transform to match existing format
  return data?.map((user: any) => ({
    _id: user.id,
    email: user.email,
    name: user.name,
    image: user.image_url,
    role: user.role,
    active: user.active,
    location: user.location ? {
      _id: user.location.id,
      name: user.location.name,
      code: user.location.code
    } : undefined
  })) || []
}

// Get users by role
export async function getUsersByRole(role: string) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select(`
      id,
      email,
      name,
      image_url,
      role,
      active,
      location:location_id(
        id,
        name,
        code
      )
    `)
    .eq('role', role)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching users by role:', error)
    return []
  }

  // Transform to match existing format
  return data?.map((user: any) => ({
    _id: user.id,
    email: user.email,
    name: user.name,
    image: user.image_url,
    role: user.role,
    active: user.active,
    location: user.location ? {
      _id: user.location.id,
      name: user.location.name,
      code: user.location.code
    } : undefined
  })) || []
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
      id,
      action,
      details,
      created_at,
      vehicle:vehicle_id(
        id,
        title,
        stock_number,
        make,
        model,
        year
      ),
      user:user_id(
        id,
        name,
        email,
        image_url
      )
    `).order('created_at', { ascending: false }).limit(10)
  ])

  // Also get in-transit count separately for the stats
  const inTransitResult = await supabaseAdmin
    .from('transfers')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'in-transit')

  return {
    totalVehicles: totalVehiclesResult.count || 0,
    availableVehicles: availableVehiclesResult.count || 0,
    activeTransfers: activeTransfersResult.count || 0,
    inTransitVehicles: inTransitResult.count || 0,
    recentActivity: recentActivityResult.data?.map((activity: any) => {
      // Handle both single object and array returns from Supabase
      const vehicle = Array.isArray(activity.vehicle) ? activity.vehicle[0] : activity.vehicle;
      const user = Array.isArray(activity.user) ? activity.user[0] : activity.user;
      
      return {
        _id: activity.id,
        action: activity.action,
        details: activity.details,
        createdAt: activity.created_at,
        vehicle: vehicle ? {
          _id: vehicle.id,
          title: vehicle.title || 
                 (vehicle.year && vehicle.make && vehicle.model 
                   ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`.trim()
                   : `Stock #${vehicle.stock_number || 'Unknown'}`),
          stockNumber: vehicle.stock_number
        } : null,
        user: user ? {
          _id: user.id,
          name: user.name,
          email: user.email,
          image: user.image_url
        } : null
      };
    }) || []
  }
}

// Get all transfers for a vehicle (for unified feed)
export async function getVehicleTransfers(vehicleId: string) {
  const { data, error } = await supabaseAdmin
    .from('transfers')
    .select(`
      id,
      status,
      reason,
      transfer_notes,
      money_offer,
      requested_by_date,
      customer_waiting,
      priority,
      expected_pickup_date,
      actual_pickup_date,
      delivered_date,
      approved_at,
      rejected_at,
      rejection_reason,
      cancelled_at,
      transport_notes,
      competing_requests_count,
      created_at,
      from_location:from_location_id(id, name, code),
      to_location:to_location_id(id, name, code),
      requested_by:requested_by_id(id, name, email),
      approved_by:approved_by_id(id, name, email),
      rejected_by:rejected_by_id(id, name, email),
      cancelled_by:cancelled_by_id(id, name, email)
    `)
    .eq('vehicle_id', vehicleId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching vehicle transfers:', error)
    return []
  }

  // Transform to match feed format
  return data?.map((transfer: any) => ({
    _id: transfer.id,
    status: transfer.status,
    reason: transfer.reason,
    transferNotes: transfer.transfer_notes,
    moneyOffer: transfer.money_offer,
    requestedByDate: transfer.requested_by_date,
    customerWaiting: transfer.customer_waiting,
    priority: transfer.priority,
    expectedPickupDate: transfer.expected_pickup_date,
    actualPickupDate: transfer.actual_pickup_date,
    deliveredDate: transfer.delivered_date,
    approvedAt: transfer.approved_at,
    rejectedAt: transfer.rejected_at,
    rejectionReason: transfer.rejection_reason,
    cancelledAt: transfer.cancelled_at,
    transportNotes: transfer.transport_notes,
    competingRequestsCount: transfer.competing_requests_count,
    createdAt: transfer.created_at,
    fromLocation: transfer.from_location ? {
      _id: transfer.from_location.id,
      name: transfer.from_location.name,
      code: transfer.from_location.code
    } : undefined,
    toLocation: transfer.to_location ? {
      _id: transfer.to_location.id,
      name: transfer.to_location.name,
      code: transfer.to_location.code
    } : undefined,
    requestedBy: transfer.requested_by ? {
      _id: transfer.requested_by.id,
      name: transfer.requested_by.name,
      email: transfer.requested_by.email
    } : undefined,
    approvedBy: transfer.approved_by ? {
      _id: transfer.approved_by.id,
      name: transfer.approved_by.name,
      email: transfer.approved_by.email
    } : undefined,
    rejectedBy: transfer.rejected_by ? {
      _id: transfer.rejected_by.id,
      name: transfer.rejected_by.name,
      email: transfer.rejected_by.email
    } : undefined,
    cancelledBy: transfer.cancelled_by ? {
      _id: transfer.cancelled_by.id,
      name: transfer.cancelled_by.name,
      email: transfer.cancelled_by.email
    } : undefined
  })) || []
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
  return data?.map((location: any) => ({
    _id: location.id,
    _type: 'dealershipLocation' as const,
    name: location.name,
    code: location.code,
    address: location.address,
    city: location.city,
    state: location.state,
    zip: location.zip,
    phone: location.phone,
    active: true // We already filter by active in the query
  })) || []
}