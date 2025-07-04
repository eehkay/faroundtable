import groq from 'groq'

// Vehicle queries
export const vehiclesQuery = groq`
  *[_type == "vehicle"] | order(createdAt desc) {
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
    activeTransferRequests[]->{
      _id,
      status
    },
    daysOnLot
  }
`

export const vehicleByStockNumberQuery = groq`
  *[_type == "vehicle" && stockNumber == $stockNumber][0] {
    ...,
    location->{
      _id,
      name,
      code,
      address,
      city,
      state,
      zip,
      phone
    },
    originalLocation->{
      _id,
      name,
      code
    },
    activeTransferRequests[]->{
      _id,
      status,
      transferNotes,
      moneyOffer,
      requestedByDate,
      customerWaiting,
      priority,
      fromLocation->{_id, name, code},
      toLocation->{_id, name, code},
      requestedBy->{_id, name, email}
    }
  }
`

// Transfer queries
export const activeTransfersQuery = groq`
  *[_type == "transfer" && status in ["requested", "approved", "in-transit"]] | order(createdAt desc) {
    _id,
    status,
    reason,
    customerWaiting,
    priority,
    expectedPickupDate,
    createdAt,
    vehicle->{
      _id,
      stockNumber,
      title,
      imageUrls
    },
    fromStore->{name, code},
    toStore->{name, code},
    requestedBy->{name, email}
  }
`

export const transfersByStoreQuery = groq`
  *[_type == "transfer" && (fromStore._ref == $storeId || toStore._ref == $storeId)] | order(createdAt desc) [0...50] {
    _id,
    status,
    createdAt,
    vehicle->{
      stockNumber,
      title
    },
    fromStore->{name},
    toStore->{name},
    requestedBy->{name}
  }
`

// Activity queries
export const vehicleActivityQuery = groq`
  *[_type == "activity" && vehicle._ref == $vehicleId] | order(createdAt desc) [0...20] {
    _id,
    action,
    details,
    metadata,
    createdAt,
    user->{
      name,
      email,
      image
    }
  }
`

// Comment queries
export const vehicleCommentsQuery = groq`
  *[_type == "comment" && vehicle._ref == $vehicleId] | order(createdAt desc) {
    _id,
    text,
    edited,
    editedAt,
    createdAt,
    author->{
      _id,
      name,
      email,
      image
    },
    mentions[]->{
      _id,
      name
    }
  }
`

// Search query
export const vehicleSearchQuery = groq`
  *[_type == "vehicle" && (
    make match $search + "*" ||
    model match $search + "*" ||
    stockNumber match $search + "*" ||
    vin match $search + "*" ||
    title match $search + "*"
  )] | order(price asc) [0...50] {
    _id,
    stockNumber,
    title,
    price,
    imageUrls,
    status,
    location->{name}
  }
`

// Dashboard stats
export const dashboardStatsQuery = groq`
  {
    "totalVehicles": count(*[_type == "vehicle"]),
    "availableVehicles": count(*[_type == "vehicle" && status == "available"]),
    "activeTransfers": count(*[_type == "transfer" && status in ["requested", "approved", "in-transit"]]),
    "recentActivity": *[_type == "activity"] | order(createdAt desc) [0...10] {
      action,
      createdAt,
      vehicle->{title, stockNumber},
      user->{name}
    }
  }
`

// User management queries
export const allUsersQuery = groq`
  *[_type == "user"] | order(name asc) {
    _id,
    email,
    name,
    image,
    domain,
    role,
    active,
    lastLogin,
    location->{
      _id,
      name,
      code
    }
  }
`

export const userByIdQuery = groq`
  *[_type == "user" && _id == $userId][0] {
    _id,
    email,
    name,
    image,
    domain,
    role,
    active,
    lastLogin,
    location->{
      _id,
      name,
      code,
      address
    }
  }
`

export const usersByRoleQuery = groq`
  *[_type == "user" && role == $role] | order(name asc) {
    _id,
    email,
    name,
    image,
    role,
    active,
    location->{name, code}
  }
`

export const searchUsersQuery = groq`
  *[_type == "user" && (
    name match $search + "*" ||
    email match $search + "*"
  )] | order(name asc) [0...50] {
    _id,
    email,
    name,
    image,
    role,
    active,
    location->{name, code}
  }
`

export const dealershipLocationsQuery = groq`
  *[_type == "dealershipLocation" && active == true] | order(name asc) {
    _id,
    name,
    code,
    address,
    city,
    state,
    zip,
    phone
  }
`