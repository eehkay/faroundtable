-- Round Table Database Schema for Supabase
-- Run this in the Supabase SQL editor to create all tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Dealership Locations Table (create first as it's referenced by users)
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
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Users Table
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
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Vehicles Table
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
  days_on_lot INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT unique_store_stock UNIQUE (store_code, stock_number)
);

-- 4. Transfers Table
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
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Now add the foreign key constraint to vehicles table
ALTER TABLE vehicles 
ADD CONSTRAINT fk_current_transfer 
FOREIGN KEY (current_transfer_id) 
REFERENCES transfers(id);

-- 5. Activities Table
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
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Comments Table
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id),
  
  text TEXT NOT NULL,
  edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Comment Mentions Junction Table
CREATE TABLE comment_mentions (
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  PRIMARY KEY (comment_id, user_id)
);

-- 8. Import Logs Table
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
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Email Settings Table
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

-- Create Indexes for Performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_location ON users(location_id);

CREATE INDEX idx_locations_code ON dealership_locations(code);
CREATE INDEX idx_locations_active ON dealership_locations(active);

CREATE INDEX idx_vehicles_vin ON vehicles(vin);
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_location ON vehicles(location_id);
CREATE INDEX idx_vehicles_store_code ON vehicles(store_code);
CREATE INDEX idx_vehicles_stock_number ON vehicles(stock_number);
CREATE INDEX idx_vehicles_year_make_model ON vehicles(year, make, model);
CREATE INDEX idx_vehicles_price ON vehicles(price);

-- Full text search index for vehicles
CREATE INDEX idx_vehicles_search ON vehicles 
USING GIN (to_tsvector('english', 
  COALESCE(make, '') || ' ' || 
  COALESCE(model, '') || ' ' || 
  COALESCE(trim, '') || ' ' ||
  COALESCE(vin, '') || ' ' ||
  COALESCE(stock_number, '')
));

CREATE INDEX idx_transfers_vehicle ON transfers(vehicle_id);
CREATE INDEX idx_transfers_status ON transfers(status);
CREATE INDEX idx_transfers_from_location ON transfers(from_location_id);
CREATE INDEX idx_transfers_to_location ON transfers(to_location_id);
CREATE INDEX idx_transfers_requested_by ON transfers(requested_by_id);
CREATE INDEX idx_transfers_created_at ON transfers(created_at);

CREATE INDEX idx_activities_vehicle ON activities(vehicle_id);
CREATE INDEX idx_activities_user ON activities(user_id);
CREATE INDEX idx_activities_action ON activities(action);
CREATE INDEX idx_activities_created_at ON activities(created_at DESC);

CREATE INDEX idx_comments_vehicle ON comments(vehicle_id);
CREATE INDEX idx_comments_author ON comments(author_id);
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);

CREATE INDEX idx_import_logs_timestamp ON import_logs(timestamp DESC);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE dealership_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_settings ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies (you'll need to adjust based on your auth setup)

-- Everyone can read dealership locations
CREATE POLICY "Public read access to locations" ON dealership_locations
  FOR SELECT USING (true);

-- All authenticated users can read vehicles
CREATE POLICY "Authenticated users can view vehicles" ON vehicles
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- All authenticated users can read users
CREATE POLICY "Authenticated users can view all users" ON users
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- All authenticated users can read comments
CREATE POLICY "Authenticated users can view comments" ON comments
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Users can create comments
CREATE POLICY "Authenticated users can create comments" ON comments
  FOR INSERT WITH CHECK (auth.uid() = author_id);

-- All authenticated users can read activities
CREATE POLICY "Authenticated users can view activities" ON activities
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Add triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dealership_locations_updated_at BEFORE UPDATE ON dealership_locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transfers_updated_at BEFORE UPDATE ON transfers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial dealership locations
INSERT INTO dealership_locations (id, name, code, active, csv_file_name) VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'United Nissan Las Vegas', 'MP1568', true, 'MP1568.csv'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'United Nissan Reno', 'MP22171', true, 'MP22171.csv'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'United Nissan Imperial', 'MP18527', true, 'MP18527.csv'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'United Kia Imperial', 'MP23003', true, 'MP23003.csv'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'United Toyota Imperial', 'MP22968', true, 'MP22968.csv');

-- Add legacy Sanity ID columns for migration tracking
-- These can be dropped after migration is complete and verified
ALTER TABLE dealership_locations ADD COLUMN IF NOT EXISTS legacy_sanity_id VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS legacy_sanity_id VARCHAR(255) UNIQUE;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS legacy_sanity_id VARCHAR(255) UNIQUE;
ALTER TABLE transfers ADD COLUMN IF NOT EXISTS legacy_sanity_id VARCHAR(255) UNIQUE;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS legacy_sanity_id VARCHAR(255) UNIQUE;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS legacy_sanity_id VARCHAR(255) UNIQUE;