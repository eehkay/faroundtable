# Sanity to Supabase Migration Plan

## Table of Contents
1. [Overview & Goals](#overview--goals)
2. [Database Schema Design](#database-schema-design)
3. [Data Migration Process](#data-migration-process)
4. [Code Migration Patterns](#code-migration-patterns)
5. [Real-time Features](#real-time-features)
6. [Authentication Strategy](#authentication-strategy)
7. [Testing & Validation](#testing--validation)
8. [Rollback Strategy](#rollback-strategy)
9. [Timeline & Phases](#timeline--phases)
10. [Appendix - Scripts & Tools](#appendix---scripts--tools)

## Overview & Goals

### Current State (Sanity)
- **Data Store**: Sanity CMS with document-based storage
- **Queries**: GROQ query language
- **Real-time**: Sanity listeners
- **Auth**: NextAuth with Sanity user storage
- **File Storage**: Sanity assets for images

### Target State (Supabase)
- **Data Store**: PostgreSQL with relational tables
- **Queries**: SQL with PostgREST API
- **Real-time**: Supabase Realtime subscriptions
- **Auth**: NextAuth with Supabase adapter (or Supabase Auth)
- **File Storage**: Supabase Storage for images

### Migration Goals
1. **Zero Downtime**: Run both systems in parallel during migration
2. **Data Integrity**: Ensure all data is migrated accurately
3. **Performance Improvement**: Leverage SQL indexes and relationships
4. **Cost Reduction**: Move to more cost-effective solution
5. **Future Scalability**: Better foundation for growth

## Database Schema Design

### 1. Users Table
```sql
-- Users table (integrates with NextAuth or Supabase Auth)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  image_url TEXT,
  domain VARCHAR(100),
  role VARCHAR(50) NOT NULL DEFAULT 'sales' CHECK (role IN ('admin', 'manager', 'sales', 'transport')),
  location_id UUID REFERENCES dealership_locations(id),
  active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Sanity migration fields
  legacy_sanity_id VARCHAR(255) UNIQUE
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_location ON users(location_id);
```

### 2. Dealership Locations Table
```sql
CREATE TABLE dealership_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(2),
  zip VARCHAR(10),
  phone VARCHAR(20),
  email VARCHAR(255),
  csv_file_name VARCHAR(255),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Sanity migration fields
  legacy_sanity_id VARCHAR(255) UNIQUE
);

-- Indexes
CREATE INDEX idx_locations_code ON dealership_locations(code);
CREATE INDEX idx_locations_active ON dealership_locations(active);
```

### 3. Vehicles Table
```sql
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_number VARCHAR(100) NOT NULL,
  vin VARCHAR(17) UNIQUE NOT NULL,
  
  -- Basic Information
  year INTEGER NOT NULL CHECK (year >= 1900 AND year <= 2100),
  make VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  trim VARCHAR(100),
  title TEXT,
  
  -- Pricing
  price INTEGER NOT NULL CHECK (price >= 0),
  sale_price INTEGER CHECK (sale_price >= 0),
  msrp INTEGER CHECK (msrp >= 0),
  
  -- Details
  mileage INTEGER CHECK (mileage >= 0),
  condition VARCHAR(20) CHECK (condition IN ('new', 'used')),
  exterior_color VARCHAR(50),
  body_style VARCHAR(50),
  fuel_type VARCHAR(50),
  description TEXT,
  features TEXT[],
  
  -- Status & Location
  status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'claimed', 'in-transit', 'delivered')),
  store_code VARCHAR(50) NOT NULL,
  address TEXT,
  location_id UUID REFERENCES dealership_locations(id),
  original_location_id UUID REFERENCES dealership_locations(id),
  current_transfer_id UUID,
  
  -- Images
  image_urls TEXT[],
  
  -- Tracking
  imported_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_seen_in_feed TIMESTAMP WITH TIME ZONE,
  days_on_lot INTEGER GENERATED ALWAYS AS (
    EXTRACT(DAY FROM CURRENT_TIMESTAMP - imported_at)
  ) STORED,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Sanity migration fields
  legacy_sanity_id VARCHAR(255) UNIQUE,
  
  -- Constraints
  CONSTRAINT unique_store_stock UNIQUE (store_code, stock_number)
);

-- Indexes for performance
CREATE INDEX idx_vehicles_vin ON vehicles(vin);
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_location ON vehicles(location_id);
CREATE INDEX idx_vehicles_store_code ON vehicles(store_code);
CREATE INDEX idx_vehicles_stock_number ON vehicles(stock_number);
CREATE INDEX idx_vehicles_year_make_model ON vehicles(year, make, model);
CREATE INDEX idx_vehicles_price ON vehicles(price);

-- Full text search index
CREATE INDEX idx_vehicles_search ON vehicles 
USING GIN (to_tsvector('english', 
  COALESCE(make, '') || ' ' || 
  COALESCE(model, '') || ' ' || 
  COALESCE(trim, '') || ' ' ||
  COALESCE(vin, '') || ' ' ||
  COALESCE(stock_number, '')
));
```

### 4. Transfers Table
```sql
CREATE TABLE transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  from_location_id UUID NOT NULL REFERENCES dealership_locations(id),
  to_location_id UUID NOT NULL REFERENCES dealership_locations(id),
  requested_by_id UUID NOT NULL REFERENCES users(id),
  
  status VARCHAR(20) NOT NULL DEFAULT 'requested' CHECK (status IN (
    'requested', 'approved', 'in-transit', 'delivered', 'cancelled', 'rejected'
  )),
  
  -- Transfer details
  reason TEXT,
  transfer_notes TEXT NOT NULL,
  money_offer DECIMAL(10, 2),
  requested_by_date TIMESTAMP WITH TIME ZONE NOT NULL,
  customer_waiting BOOLEAN DEFAULT false,
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('normal', 'high', 'urgent')),
  
  -- Dates
  expected_pickup_date DATE,
  actual_pickup_date DATE,
  delivered_date TIMESTAMP WITH TIME ZONE,
  
  -- Approval/Rejection
  approved_by_id UUID REFERENCES users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_by_id UUID REFERENCES users(id),
  rejected_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  cancelled_by_id UUID REFERENCES users(id),
  cancelled_at TIMESTAMP WITH TIME ZONE,
  
  -- Transport details
  transport_notes TEXT,
  
  -- Competition tracking
  competing_requests_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Sanity migration fields
  legacy_sanity_id VARCHAR(255) UNIQUE
);

-- Indexes
CREATE INDEX idx_transfers_vehicle ON transfers(vehicle_id);
CREATE INDEX idx_transfers_status ON transfers(status);
CREATE INDEX idx_transfers_from_location ON transfers(from_location_id);
CREATE INDEX idx_transfers_to_location ON transfers(to_location_id);
CREATE INDEX idx_transfers_requested_by ON transfers(requested_by_id);
CREATE INDEX idx_transfers_created_at ON transfers(created_at);

-- Add foreign key to vehicles table
ALTER TABLE vehicles 
ADD CONSTRAINT fk_current_transfer 
FOREIGN KEY (current_transfer_id) 
REFERENCES transfers(id);
```

### 5. Activities Table
```sql
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  
  action VARCHAR(50) NOT NULL CHECK (action IN (
    'claimed', 'released', 'commented', 'status-updated', 
    'transfer-started', 'transfer-completed', 'transfer-approved',
    'transfer-rejected', 'transfer-cancelled'
  )),
  
  details TEXT,
  
  -- Metadata as JSONB for flexibility
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Sanity migration fields
  legacy_sanity_id VARCHAR(255) UNIQUE
);

-- Indexes
CREATE INDEX idx_activities_vehicle ON activities(vehicle_id);
CREATE INDEX idx_activities_user ON activities(user_id);
CREATE INDEX idx_activities_action ON activities(action);
CREATE INDEX idx_activities_created_at ON activities(created_at DESC);
```

### 6. Comments Table
```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id),
  
  text TEXT NOT NULL,
  edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Sanity migration fields
  legacy_sanity_id VARCHAR(255) UNIQUE
);

-- Indexes
CREATE INDEX idx_comments_vehicle ON comments(vehicle_id);
CREATE INDEX idx_comments_author ON comments(author_id);
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);

-- Mentions junction table
CREATE TABLE comment_mentions (
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  PRIMARY KEY (comment_id, user_id)
);
```

### 7. Import Logs Table
```sql
CREATE TABLE import_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  success BOOLEAN NOT NULL,
  
  -- Results
  vehicles_imported INTEGER DEFAULT 0,
  vehicles_updated INTEGER DEFAULT 0,
  vehicles_deleted INTEGER DEFAULT 0,
  
  -- Errors and details stored as JSONB
  errors JSONB DEFAULT '[]',
  details TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Sanity migration fields
  legacy_sanity_id VARCHAR(255) UNIQUE
);

-- Index
CREATE INDEX idx_import_logs_timestamp ON import_logs(timestamp DESC);
```

### 8. Email Settings Table (New Addition)
```sql
CREATE TABLE email_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  enabled BOOLEAN DEFAULT true,
  recipients TEXT[],
  template TEXT,
  subject VARCHAR(255),
  metadata JSONB DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_by_id UUID REFERENCES users(id)
);
```

### 9. Row Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE dealership_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_logs ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view all users" ON users
  FOR SELECT USING (true);

CREATE POLICY "Only admins can modify users" ON users
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('admin', 'manager')
    )
  );

-- Vehicles policies
CREATE POLICY "All authenticated users can view vehicles" ON vehicles
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can modify vehicles based on role" ON vehicles
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('admin', 'manager')
    )
    OR
    (
      auth.uid() IN (SELECT id FROM users WHERE role = 'sales')
      AND location_id IN (
        SELECT location_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- Transfers policies
CREATE POLICY "Users can view transfers for their location" ON transfers
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM users WHERE role IN ('admin', 'manager'))
    OR
    from_location_id IN (SELECT location_id FROM users WHERE id = auth.uid())
    OR
    to_location_id IN (SELECT location_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Users can create transfer requests" ON transfers
  FOR INSERT WITH CHECK (
    auth.uid() = requested_by_id
  );

CREATE POLICY "Managers can approve/reject transfers" ON transfers
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('admin', 'manager')
      AND location_id = from_location_id
    )
  );
```

## Data Migration Process

### Phase 1: Export from Sanity

#### 1.1 Export Script
```typescript
// scripts/export-sanity-data.ts
import { createClient } from '@sanity/client'
import fs from 'fs/promises'
import path from 'path'

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID!,
  dataset: process.env.SANITY_DATASET!,
  token: process.env.SANITY_API_TOKEN!,
  apiVersion: '2023-01-01',
  useCdn: false
})

async function exportData() {
  const exportDir = path.join(__dirname, '../sanity-export')
  await fs.mkdir(exportDir, { recursive: true })

  // Export each document type
  const documentTypes = [
    'user', 'dealershipLocation', 'vehicle', 
    'transfer', 'activity', 'comment', 'importLog'
  ]

  for (const type of documentTypes) {
    console.log(`Exporting ${type}...`)
    const data = await client.fetch(`*[_type == "${type}"]`)
    await fs.writeFile(
      path.join(exportDir, `${type}.json`),
      JSON.stringify(data, null, 2)
    )
    console.log(`Exported ${data.length} ${type} documents`)
  }
}

exportData()
```

### Phase 2: Transform Data

#### 2.1 Transform Users
```typescript
// scripts/transform-users.ts
interface SanityUser {
  _id: string
  email: string
  name?: string
  image?: string
  domain?: string
  role?: string
  location?: { _ref: string }
  active?: boolean
  lastLogin?: string
}

interface SupabaseUser {
  email: string
  name?: string
  image_url?: string
  domain?: string
  role: string
  location_id?: string
  active: boolean
  last_login?: string
  legacy_sanity_id: string
}

function transformUser(sanityUser: SanityUser): SupabaseUser {
  return {
    email: sanityUser.email,
    name: sanityUser.name,
    image_url: sanityUser.image,
    domain: sanityUser.domain,
    role: sanityUser.role || 'sales',
    location_id: sanityUser.location?._ref,
    active: sanityUser.active ?? true,
    last_login: sanityUser.lastLogin,
    legacy_sanity_id: sanityUser._id
  }
}
```

#### 2.2 Transform Vehicles
```typescript
// scripts/transform-vehicles.ts
interface SanityVehicle {
  _id: string
  stockNumber: string
  vin: string
  year: number
  make: string
  model: string
  // ... other fields
  location?: { _ref: string }
  originalLocation?: { _ref: string }
  currentTransfer?: { _ref: string }
  imageUrls?: string[]
}

interface SupabaseVehicle {
  stock_number: string
  vin: string
  year: number
  make: string
  model: string
  // ... snake_case fields
  location_id?: string
  original_location_id?: string
  current_transfer_id?: string
  image_urls?: string[]
  legacy_sanity_id: string
}

function transformVehicle(sanityVehicle: SanityVehicle): SupabaseVehicle {
  return {
    stock_number: sanityVehicle.stockNumber,
    vin: sanityVehicle.vin,
    year: sanityVehicle.year,
    make: sanityVehicle.make,
    model: sanityVehicle.model,
    trim: sanityVehicle.trim,
    title: sanityVehicle.title,
    price: sanityVehicle.price,
    sale_price: sanityVehicle.salePrice,
    msrp: sanityVehicle.msrp,
    mileage: sanityVehicle.mileage,
    condition: sanityVehicle.condition,
    exterior_color: sanityVehicle.exteriorColor,
    body_style: sanityVehicle.bodyStyle,
    fuel_type: sanityVehicle.fuelType,
    description: sanityVehicle.description,
    features: sanityVehicle.features,
    status: sanityVehicle.status,
    store_code: sanityVehicle.storeCode,
    address: sanityVehicle.address,
    location_id: sanityVehicle.location?._ref,
    original_location_id: sanityVehicle.originalLocation?._ref,
    current_transfer_id: sanityVehicle.currentTransfer?._ref,
    image_urls: sanityVehicle.imageUrls,
    imported_at: sanityVehicle.importedAt,
    last_seen_in_feed: sanityVehicle.lastSeenInFeed,
    legacy_sanity_id: sanityVehicle._id
  }
}
```

### Phase 3: Import to Supabase

#### 3.1 Import Script
```typescript
// scripts/import-to-supabase.ts
import { createClient } from '@supabase/supabase-js'
import fs from 'fs/promises'
import path from 'path'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

async function importData() {
  const importOrder = [
    { table: 'users', file: 'users-transformed.json' },
    { table: 'dealership_locations', file: 'locations-transformed.json' },
    { table: 'vehicles', file: 'vehicles-transformed.json' },
    { table: 'transfers', file: 'transfers-transformed.json' },
    { table: 'activities', file: 'activities-transformed.json' },
    { table: 'comments', file: 'comments-transformed.json' },
    { table: 'import_logs', file: 'import-logs-transformed.json' }
  ]

  for (const { table, file } of importOrder) {
    console.log(`Importing ${table}...`)
    
    const data = JSON.parse(
      await fs.readFile(path.join(__dirname, '../supabase-import', file), 'utf-8')
    )
    
    // Import in batches of 100
    const batchSize = 100
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize)
      
      const { error } = await supabase
        .from(table)
        .insert(batch)
      
      if (error) {
        console.error(`Error importing ${table}:`, error)
        throw error
      }
      
      console.log(`Imported ${i + batch.length}/${data.length} ${table}`)
    }
  }
  
  // Update sequences and fix foreign key references
  await fixReferences()
}

async function fixReferences() {
  // Update current_transfer_id in vehicles after transfers are imported
  const { data: transfers } = await supabase
    .from('transfers')
    .select('id, legacy_sanity_id')
  
  const transferMap = new Map(
    transfers?.map(t => [t.legacy_sanity_id, t.id]) || []
  )
  
  // Update vehicles with correct transfer IDs
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('id, current_transfer_id')
    .not('current_transfer_id', 'is', null)
  
  for (const vehicle of vehicles || []) {
    if (vehicle.current_transfer_id && transferMap.has(vehicle.current_transfer_id)) {
      await supabase
        .from('vehicles')
        .update({ current_transfer_id: transferMap.get(vehicle.current_transfer_id) })
        .eq('id', vehicle.id)
    }
  }
}
```

## Code Migration Patterns

### Pattern 1: Simple Fetch Query

#### Before (Sanity)
```typescript
// lib/queries.ts
export const vehicleByStockNumberQuery = groq`
  *[_type == "vehicle" && stockNumber == $stockNumber][0] {
    ...,
    location->{
      _id,
      name,
      code
    }
  }
`

// Component usage
const vehicle = await client.fetch(vehicleByStockNumberQuery, { stockNumber })
```

#### After (Supabase)
```typescript
// lib/supabase-queries.ts
export async function getVehicleByStockNumber(stockNumber: string) {
  const { data, error } = await supabase
    .from('vehicles')
    .select(`
      *,
      location:dealership_locations(*)
    `)
    .eq('stock_number', stockNumber)
    .single()
  
  if (error) throw error
  return data
}

// Component usage
const vehicle = await getVehicleByStockNumber(stockNumber)
```

### Pattern 2: Complex Query with Filtering

#### Before (Sanity)
```typescript
// API route
const filters = []
if (search) {
  filters.push(`(
    lower(make) match lower("*${search}*") ||
    lower(model) match lower("*${search}*") ||
    lower(vin) match lower("*${search}*")
  )`)
}
if (location) filters.push(`location._ref == "${location}"`)
if (status) filters.push(`status == "${status}"`)

const filterString = filters.length > 0 ? ` && ${filters.join(' && ')}` : ''
const vehicles = await client.fetch(
  `*[_type == "vehicle"${filterString}] | order(createdAt desc) [${offset}...${offset + limit}]`
)
```

#### After (Supabase)
```typescript
// API route
let query = supabase
  .from('vehicles')
  .select('*, location:dealership_locations(*)', { count: 'exact' })

if (search) {
  query = query.or(`make.ilike.%${search}%,model.ilike.%${search}%,vin.ilike.%${search}%`)
}
if (location) {
  query = query.eq('location_id', location)
}
if (status) {
  query = query.eq('status', status)
}

const { data, count, error } = await query
  .order('created_at', { ascending: false })
  .range(offset, offset + limit - 1)
```

### Pattern 3: Mutations

#### Before (Sanity)
```typescript
// Create transfer
const transfer = await writeClient.create({
  _type: 'transfer',
  _id: transferId,
  vehicle: { _ref: vehicleId },
  fromStore: { _ref: fromStoreId },
  toStore: { _ref: toStoreId },
  requestedBy: { _ref: userId },
  status: 'requested',
  // ... other fields
})

// Update vehicle
await writeClient
  .patch(vehicleId)
  .set({ 
    status: 'claimed',
    currentTransfer: { _ref: transfer._id }
  })
  .commit()
```

#### After (Supabase)
```typescript
// Create transfer (using transaction)
const { data: transfer, error: transferError } = await supabase
  .from('transfers')
  .insert({
    vehicle_id: vehicleId,
    from_location_id: fromLocationId,
    to_location_id: toLocationId,
    requested_by_id: userId,
    status: 'requested',
    // ... other fields
  })
  .select()
  .single()

if (transferError) throw transferError

// Update vehicle
const { error: vehicleError } = await supabase
  .from('vehicles')
  .update({
    status: 'claimed',
    current_transfer_id: transfer.id
  })
  .eq('id', vehicleId)

if (vehicleError) throw vehicleError
```

### Pattern 4: Transactions

#### Before (Sanity)
```typescript
// No native transaction support in Sanity
// Multiple operations that should be atomic
await writeClient.create(activity)
await writeClient.patch(vehicle).set({ status: 'delivered' }).commit()
await writeClient.patch(transfer).set({ status: 'delivered' }).commit()
```

#### After (Supabase)
```typescript
// Using Supabase RPC for transactions
const { error } = await supabase.rpc('complete_transfer', {
  p_transfer_id: transferId,
  p_user_id: userId
})

// RPC function in database
CREATE OR REPLACE FUNCTION complete_transfer(
  p_transfer_id UUID,
  p_user_id UUID
) RETURNS void AS $$
BEGIN
  -- Update transfer
  UPDATE transfers 
  SET status = 'delivered', 
      delivered_date = NOW()
  WHERE id = p_transfer_id;
  
  -- Update vehicle
  UPDATE vehicles v
  SET status = 'available',
      current_transfer_id = NULL
  FROM transfers t
  WHERE t.id = p_transfer_id
    AND v.id = t.vehicle_id;
  
  -- Create activity
  INSERT INTO activities (vehicle_id, user_id, action, details)
  SELECT vehicle_id, p_user_id, 'transfer-completed', 'Transfer delivered'
  FROM transfers
  WHERE id = p_transfer_id;
END;
$$ LANGUAGE plpgsql;
```

## Real-time Features

### Pattern 1: Vehicle Updates

#### Before (Sanity)
```typescript
// components/inventory/VehicleGrid.tsx
useEffect(() => {
  const subscription = client
    .listen(`*[_type == "vehicle"]`)
    .subscribe((update) => {
      if (update.transition === 'appear' || 
          update.transition === 'disappear' || 
          update.transition === 'update') {
        refreshVehicles()
      }
    })

  return () => subscription.unsubscribe()
}, [refreshVehicles])
```

#### After (Supabase)
```typescript
// components/inventory/VehicleGrid.tsx
useEffect(() => {
  const subscription = supabase
    .channel('vehicle-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'vehicles'
      },
      (payload) => {
        if (payload.eventType === 'INSERT' || 
            payload.eventType === 'DELETE' || 
            payload.eventType === 'UPDATE') {
          refreshVehicles()
        }
      }
    )
    .subscribe()

  return () => {
    subscription.unsubscribe()
  }
}, [refreshVehicles])
```

### Pattern 2: Activity Feed

#### Before (Sanity)
```typescript
// Real-time activity feed
const subscription = listenClient
  .listen(
    `*[_type == "activity" && vehicle._ref == $vehicleId] | order(createdAt desc)`,
    { vehicleId }
  )
  .subscribe((update) => {
    if (update.transition === 'appear') {
      setActivities(prev => [update.result, ...prev])
    }
  })
```

#### After (Supabase)
```typescript
// Real-time activity feed
const subscription = supabase
  .channel(`activities:vehicle_id=eq.${vehicleId}`)
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'activities',
      filter: `vehicle_id=eq.${vehicleId}`
    },
    async (payload) => {
      // Fetch the complete activity with user info
      const { data } = await supabase
        .from('activities')
        .select('*, user:users(*)')
        .eq('id', payload.new.id)
        .single()
      
      if (data) {
        setActivities(prev => [data, ...prev])
      }
    }
  )
  .subscribe()
```

### Pattern 3: Comments with Mentions

#### Before (Sanity)
```typescript
// Listen for new comments
const subscription = listenClient
  .listen(
    `*[_type == "comment" && vehicle._ref == $vehicleId]`,
    { vehicleId }
  )
  .subscribe(async (update) => {
    if (update.transition === 'appear') {
      const comment = await client.fetch(
        `*[_id == $id][0]{
          ...,
          author->{name, email, image},
          mentions[]->{_id, name}
        }`,
        { id: update.documentId }
      )
      setComments(prev => [...prev, comment])
    }
  })
```

#### After (Supabase)
```typescript
// Listen for new comments
const subscription = supabase
  .channel(`comments:vehicle_id=eq.${vehicleId}`)
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'comments',
      filter: `vehicle_id=eq.${vehicleId}`
    },
    async (payload) => {
      // Fetch complete comment with author and mentions
      const { data } = await supabase
        .from('comments')
        .select(`
          *,
          author:users!author_id(*),
          comment_mentions(
            user:users(*)
          )
        `)
        .eq('id', payload.new.id)
        .single()
      
      if (data) {
        setComments(prev => [...prev, data])
      }
    }
  )
  .subscribe()
```

## Authentication Strategy

### Option 1: Keep NextAuth with Supabase Adapter (Recommended)

#### Benefits
- Minimal changes to existing auth flow
- Keep Google OAuth as-is
- Gradual migration path

#### Implementation
```typescript
// lib/auth.ts
import { SupabaseAdapter } from '@auth/supabase-adapter'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export const authOptions: NextAuthOptions = {
  adapter: SupabaseAdapter({
    url: process.env.SUPABASE_URL!,
    secret: process.env.SUPABASE_SERVICE_KEY!,
  }),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })
  ],
  callbacks: {
    async session({ session, user }) {
      // Fetch additional user data from Supabase
      const { data } = await supabase
        .from('users')
        .select('*, location:dealership_locations(*)')
        .eq('id', user.id)
        .single()
      
      if (data) {
        session.user = {
          ...session.user,
          role: data.role,
          location: data.location
        }
      }
      
      return session
    }
  }
}
```

### Option 2: Migrate to Supabase Auth

#### Benefits
- Unified auth and database
- Built-in RLS integration
- Simpler architecture

#### Migration Steps
1. Enable Google OAuth in Supabase Dashboard
2. Update login flow
3. Migrate existing sessions

```typescript
// New login page with Supabase Auth
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function LoginPage() {
  const supabase = createClientComponentClient()
  
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/auth/callback`,
        queryParams: {
          hd: 'delmaradv.com,formanautomotive.com' // Domain restrictions
        }
      }
    })
  }
  
  return (
    <button onClick={handleGoogleLogin}>
      Sign in with Google
    </button>
  )
}
```

## Testing & Validation

### 1. Data Integrity Tests

```typescript
// tests/migration-validation.ts
describe('Migration Validation', () => {
  it('should have migrated all users', async () => {
    const sanityUsers = await getSanityUserCount()
    const supabaseUsers = await getSupabaseUserCount()
    expect(supabaseUsers).toBe(sanityUsers)
  })
  
  it('should preserve all vehicle relationships', async () => {
    const { data: vehicles } = await supabase
      .from('vehicles')
      .select('*, location:dealership_locations(*)')
      .not('location_id', 'is', null)
    
    for (const vehicle of vehicles) {
      expect(vehicle.location).toBeDefined()
      expect(vehicle.location.code).toBe(vehicle.store_code)
    }
  })
  
  it('should maintain transfer history', async () => {
    const { data: transfers } = await supabase
      .from('transfers')
      .select(`
        *,
        vehicle:vehicles(*),
        from_location:dealership_locations!from_location_id(*),
        to_location:dealership_locations!to_location_id(*)
      `)
    
    for (const transfer of transfers) {
      expect(transfer.vehicle).toBeDefined()
      expect(transfer.from_location).toBeDefined()
      expect(transfer.to_location).toBeDefined()
    }
  })
})
```

### 2. Feature Parity Tests

```typescript
// tests/feature-parity.ts
describe('Feature Parity', () => {
  it('should search vehicles correctly', async () => {
    const searchTerm = 'Toyota'
    
    // Sanity search
    const sanityResults = await client.fetch(
      `*[_type == "vehicle" && make match "${searchTerm}*"]`
    )
    
    // Supabase search
    const { data: supabaseResults } = await supabase
      .from('vehicles')
      .select()
      .ilike('make', `${searchTerm}%`)
    
    expect(supabaseResults.length).toBe(sanityResults.length)
  })
  
  it('should handle real-time updates', async () => {
    const vehicleId = 'test-vehicle-id'
    const updates: any[] = []
    
    // Subscribe to updates
    const subscription = supabase
      .channel('test-updates')
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'vehicles' },
        (payload) => updates.push(payload)
      )
      .subscribe()
    
    // Make an update
    await supabase
      .from('vehicles')
      .update({ price: 25000 })
      .eq('id', vehicleId)
    
    // Wait for real-time update
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    expect(updates.length).toBe(1)
    expect(updates[0].new.price).toBe(25000)
  })
})
```

### 3. Performance Benchmarks

```typescript
// tests/performance.ts
describe('Performance Benchmarks', () => {
  it('should query vehicles faster than Sanity', async () => {
    const iterations = 100
    
    // Sanity benchmark
    const sanityStart = Date.now()
    for (let i = 0; i < iterations; i++) {
      await client.fetch(`*[_type == "vehicle"] [0...20]`)
    }
    const sanityTime = Date.now() - sanityStart
    
    // Supabase benchmark
    const supabaseStart = Date.now()
    for (let i = 0; i < iterations; i++) {
      await supabase.from('vehicles').select().limit(20)
    }
    const supabaseTime = Date.now() - supabaseStart
    
    console.log(`Sanity: ${sanityTime}ms, Supabase: ${supabaseTime}ms`)
    expect(supabaseTime).toBeLessThan(sanityTime)
  })
})
```

## Rollback Strategy

### 1. Feature Flags

```typescript
// lib/feature-flags.ts
export const useSupabase = process.env.NEXT_PUBLIC_USE_SUPABASE === 'true'

// lib/data-provider.ts
import { sanityProvider } from './providers/sanity'
import { supabaseProvider } from './providers/supabase'

export const dataProvider = useSupabase ? supabaseProvider : sanityProvider
```

### 2. Dual Write Period

```typescript
// During migration, write to both systems
async function updateVehicleStatus(vehicleId: string, status: string) {
  // Write to Supabase
  if (useSupabase) {
    await supabase
      .from('vehicles')
      .update({ status })
      .eq('id', vehicleId)
  }
  
  // Always write to Sanity during migration
  await sanityClient
    .patch(getLegacySanityId(vehicleId))
    .set({ status })
    .commit()
}
```

### 3. Quick Rollback Script

```bash
#!/bin/bash
# rollback.sh

# 1. Update environment variable
sed -i 's/NEXT_PUBLIC_USE_SUPABASE=true/NEXT_PUBLIC_USE_SUPABASE=false/' .env.local

# 2. Clear CDN cache
curl -X POST https://api.vercel.com/v1/purge?url=https://yourdomain.com/*

# 3. Restart application
pm2 restart round-table

echo "Rollback completed. Application now using Sanity."
```

## Timeline & Phases

### Phase 1: Preparation (Day 1-2)
- [ ] Set up Supabase project
- [ ] Create database schema
- [ ] Set up RLS policies
- [ ] Configure authentication
- [ ] Create data export scripts
- [ ] Test migration scripts with sample data

### Phase 2: Infrastructure (Day 3)
- [ ] Set up data abstraction layer
- [ ] Implement feature flags
- [ ] Create Supabase query functions
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy

### Phase 3: Migration (Day 4-5)
- [ ] Export production data from Sanity
- [ ] Transform data to Supabase format
- [ ] Import data to Supabase
- [ ] Validate data integrity
- [ ] Fix any reference issues

### Phase 4: Code Updates (Day 6-7)
- [ ] Update authentication flow
- [ ] Convert API routes
- [ ] Update components with new queries
- [ ] Convert real-time subscriptions
- [ ] Update type definitions

### Phase 5: Testing (Day 8-9)
- [ ] Run integration tests
- [ ] Performance testing
- [ ] User acceptance testing
- [ ] Fix bugs and edge cases
- [ ] Load testing

### Phase 6: Deployment (Day 10)
- [ ] Deploy with feature flag disabled
- [ ] Enable for internal testing
- [ ] Gradual rollout (10% → 50% → 100%)
- [ ] Monitor metrics and errors
- [ ] Full deployment

### Phase 7: Cleanup (Day 11+)
- [ ] Remove Sanity dependencies
- [ ] Clean up migration code
- [ ] Update documentation
- [ ] Cancel Sanity subscription

## Appendix - Scripts & Tools

### A1. Complete Migration Runner

```typescript
// scripts/run-migration.ts
import { program } from 'commander'
import { exportFromSanity } from './export-sanity'
import { transformData } from './transform-data'
import { importToSupabase } from './import-supabase'
import { validateMigration } from './validate-migration'

program
  .name('migrate')
  .description('Migrate from Sanity to Supabase')
  .version('1.0.0')

program
  .command('export')
  .description('Export data from Sanity')
  .action(exportFromSanity)

program
  .command('transform')
  .description('Transform data for Supabase')
  .action(transformData)

program
  .command('import')
  .description('Import data to Supabase')
  .action(importToSupabase)

program
  .command('validate')
  .description('Validate migration')
  .action(validateMigration)

program
  .command('all')
  .description('Run complete migration')
  .action(async () => {
    console.log('Starting complete migration...')
    await exportFromSanity()
    await transformData()
    await importToSupabase()
    await validateMigration()
    console.log('Migration completed!')
  })

program.parse()
```

### A2. Query Conversion Helper

```typescript
// tools/query-converter.ts
export class QueryConverter {
  static groqToSql(groqQuery: string): string {
    // Basic GROQ to SQL conversion patterns
    const patterns = [
      {
        // *[_type == "vehicle"]
        pattern: /\*\[_type == "(\w+)"\]/,
        replace: 'SELECT * FROM $1s'
      },
      {
        // && condition
        pattern: /&&/g,
        replace: 'AND'
      },
      {
        // || condition
        pattern: /\|\|/g,
        replace: 'OR'
      },
      {
        // field == value
        pattern: /(\w+) == "([^"]+)"/g,
        replace: "$1 = '$2'"
      },
      {
        // order by
        pattern: /\| order\((\w+) (asc|desc)\)/,
        replace: 'ORDER BY $1 $2'
      },
      {
        // limit
        pattern: /\[(\d+)\.\.\.(\d+)\]/,
        replace: 'LIMIT $2 OFFSET $1'
      }
    ]
    
    let sql = groqQuery
    patterns.forEach(({ pattern, replace }) => {
      sql = sql.replace(pattern, replace)
    })
    
    return sql
  }
}
```

### A3. Monitoring Dashboard

```typescript
// pages/api/migration/status.ts
export default async function handler(req: NextRequest) {
  const sanityCount = await client.fetch('count(*[_type == "vehicle"])')
  const { count: supabaseCount } = await supabase
    .from('vehicles')
    .select('*', { count: 'exact', head: true })
  
  const syncStatus = {
    sanity: {
      vehicles: sanityCount,
      lastUpdate: await getLastSanityUpdate()
    },
    supabase: {
      vehicles: supabaseCount,
      lastUpdate: await getLastSupabaseUpdate()
    },
    inSync: sanityCount === supabaseCount,
    featureFlag: process.env.NEXT_PUBLIC_USE_SUPABASE === 'true'
  }
  
  return NextResponse.json(syncStatus)
}
```

### A4. Type Generator

```typescript
// scripts/generate-types.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
)

// Generate TypeScript types from database schema
async function generateTypes() {
  const { data, error } = await supabase
    .from('_supabase_schema')
    .select('*')
  
  // Generate types...
}
```

## Conclusion

This migration plan provides a comprehensive path from Sanity to Supabase. The key benefits include:

1. **Better Performance**: SQL queries with proper indexes
2. **Lower Costs**: More economical at scale
3. **Stronger Type Safety**: Database-driven types
4. **Native Transactions**: ACID compliance
5. **Powerful Features**: Row-level security, functions, triggers

The phased approach ensures minimal disruption while maintaining the ability to rollback if needed. With proper testing and gradual rollout, the migration can be completed safely within 2 weeks.