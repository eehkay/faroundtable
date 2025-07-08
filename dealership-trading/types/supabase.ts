// Supabase Database Types

export interface Database {
  public: {
    Tables: {
      dealership_locations: {
        Row: DealershipLocationRow
        Insert: Omit<DealershipLocationRow, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<DealershipLocationRow, 'id'>>
      }
      users: {
        Row: UserRow
        Insert: Omit<UserRow, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<UserRow, 'id'>>
      }
      vehicles: {
        Row: VehicleRow
        Insert: Omit<VehicleRow, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<VehicleRow, 'id'>>
      }
      transfers: {
        Row: TransferRow
        Insert: Omit<TransferRow, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<TransferRow, 'id'>>
      }
      transfer_updates: {
        Row: TransferUpdateRow
        Insert: Omit<TransferUpdateRow, 'id' | 'created_at'>
        Update: Partial<Omit<TransferUpdateRow, 'id'>>
      }
      activities: {
        Row: ActivityRow
        Insert: Omit<ActivityRow, 'id' | 'created_at'>
        Update: Partial<Omit<ActivityRow, 'id'>>
      }
      comments: {
        Row: CommentRow
        Insert: Omit<CommentRow, 'id' | 'created_at'>
        Update: Partial<Omit<CommentRow, 'id'>>
      }
    }
  }
}

export interface DealershipLocationRow {
  id: string
  name: string
  code: string
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  phone: string | null
  email: string | null
  csv_file_name: string | null
  email_domains: string[] | null
  enable_csv_import: boolean
  active: boolean
  created_at: string
  updated_at: string
}

export interface UserRow {
  id: string
  email: string
  name: string | null
  image_url: string | null
  domain: string | null
  role: 'admin' | 'manager' | 'sales' | 'transport'
  location_id: string | null
  active: boolean
  last_login: string | null
  created_at: string
  updated_at: string
}

export interface VehicleRow {
  id: string
  stock_number: string
  vin: string
  year: number
  make: string
  model: string
  trim: string | null
  title: string | null
  price: number
  sale_price: number | null
  msrp: number | null
  mileage: number | null
  condition: 'new' | 'used' | null
  exterior_color: string | null
  body_style: string | null
  fuel_type: string | null
  description: string | null
  features: string[] | null
  status: 'available' | 'claimed' | 'in-transit' | 'delivered'
  store_code: string
  address: string | null
  location_id: string | null
  original_location_id: string | null
  current_transfer_id: string | null
  image_urls: string[] | null
  imported_at: string
  last_seen_in_feed: string | null
  days_on_lot: number | null
  created_at: string
  updated_at: string
  removed_from_feed_at?: string | null
}

export interface TransferRow {
  id: string
  vehicle_id: string
  from_location_id: string
  to_location_id: string
  requested_by_id: string
  status: 'requested' | 'approved' | 'in-transit' | 'delivered' | 'cancelled' | 'rejected'
  reason: string | null
  transfer_notes: string
  money_offer: number | null
  requested_by_date: string
  customer_waiting: boolean
  priority: 'normal' | 'high' | 'urgent'
  expected_pickup_date: string | null
  actual_pickup_date: string | null
  delivered_date: string | null
  approved_by_id: string | null
  approved_at: string | null
  rejected_by_id: string | null
  rejected_at: string | null
  rejection_reason: string | null
  cancelled_by_id: string | null
  cancelled_at: string | null
  transport_notes: string | null
  competing_requests_count: number
  created_at: string
  updated_at: string
  // New enhanced transport fields
  transport_company: string | null
  transport_cost: number | null
  transport_pickup_date: string | null
  expected_arrival_date: string | null
  last_update_notes: string | null
  updated_by_id: string | null
}

export interface TransferUpdateRow {
  id: string
  transfer_id: string
  user_id: string
  update_type: 'status_change' | 'transport_info' | 'dates_updated' | 'notes_added' | 'cost_updated' | 'general_update'
  update_notes: string
  previous_values: Record<string, any>
  new_values: Record<string, any>
  created_at: string
}

export interface ActivityRow {
  id: string
  vehicle_id: string
  user_id: string
  action: 'claimed' | 'released' | 'commented' | 'status-updated' | 'transfer-started' | 'transfer-completed' | 'transfer-approved' | 'transfer-rejected' | 'transfer-cancelled'
  details: string | null
  metadata: Record<string, any>
  created_at: string
}

export interface CommentRow {
  id: string
  vehicle_id: string
  author_id: string
  text: string
  edited: boolean
  edited_at: string | null
  created_at: string
}

// Joined types for queries with related data
export interface TransferWithRelations extends TransferRow {
  vehicle?: VehicleRow
  from_location?: DealershipLocationRow
  to_location?: DealershipLocationRow
  requested_by?: UserRow
  approved_by?: UserRow | null
  rejected_by?: UserRow | null
  cancelled_by?: UserRow | null
  updated_by?: UserRow | null
  transfer_updates?: TransferUpdateRow[]
}

export interface TransferUpdateWithUser extends TransferUpdateRow {
  user?: UserRow
}

export interface VehicleWithRelations extends VehicleRow {
  location?: DealershipLocationRow
  original_location?: DealershipLocationRow
  current_transfer?: TransferRow
}

export interface ActivityWithRelations extends ActivityRow {
  user?: UserRow
  vehicle?: VehicleRow
}

export interface CommentWithRelations extends CommentRow {
  author?: UserRow
}