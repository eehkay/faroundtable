export interface Vehicle {
  _id?: string
  _type?: 'vehicle'
  stockNumber: string
  vin: string
  year: number
  make: string
  model: string
  trim?: string
  title?: string
  price: number
  salePrice?: number
  msrp?: number
  mileage?: number
  condition: 'new' | 'used'
  exteriorColor?: string
  bodyStyle?: string
  fuelType?: string
  description?: string
  features?: string[]
  status: 'available' | 'claimed' | 'in-transit' | 'delivered' | 'removed'
  storeCode: string
  address?: string
  location?: DealershipLocation | { _ref: string }
  originalLocation?: DealershipLocation | { _ref: string }
  currentTransfer?: { _ref: string } | any // Using 'any' to avoid circular dependency
  imageUrls?: string[]
  importedAt?: string
  lastSeenInFeed?: string
  removedFromFeedAt?: string
  daysOnLot?: number
}

export interface DealershipLocation {
  _id: string
  _type: 'dealershipLocation'
  name: string
  code: string
  address?: string
  city?: string
  state?: string
  zip?: string
  phone?: string
  email?: string
  csvFileName?: string
  active: boolean
  createdAt?: string
  updatedAt?: string
}