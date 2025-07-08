-- Add enhanced transport fields to transfers table
ALTER TABLE transfers
ADD COLUMN IF NOT EXISTS transport_company VARCHAR(255),
ADD COLUMN IF NOT EXISTS transport_cost DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS expected_arrival_date DATE,
ADD COLUMN IF NOT EXISTS last_update_notes TEXT,
ADD COLUMN IF NOT EXISTS updated_by_id UUID REFERENCES users(id);

-- Create transfer_updates table for tracking history
CREATE TABLE IF NOT EXISTS transfer_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id UUID NOT NULL REFERENCES transfers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  update_type VARCHAR(50) NOT NULL CHECK (update_type IN (
    'status_change', 'transport_info', 'dates_updated', 'notes_added', 'cost_updated', 'general_update'
  )),
  update_notes TEXT NOT NULL,
  
  -- Store previous values for audit trail
  previous_values JSONB DEFAULT '{}',
  new_values JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_transfer_updates_transfer_id ON transfer_updates(transfer_id);
CREATE INDEX IF NOT EXISTS idx_transfer_updates_user_id ON transfer_updates(user_id);
CREATE INDEX IF NOT EXISTS idx_transfer_updates_created_at ON transfer_updates(created_at DESC);

-- Enable RLS on transfer_updates
ALTER TABLE transfer_updates ENABLE ROW LEVEL SECURITY;

-- RLS Policy: All authenticated users can view transfer updates
CREATE POLICY "Authenticated users can view transfer updates" ON transfer_updates
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- RLS Policy: Users can create transfer updates if they have permission to view the transfer
CREATE POLICY "Users with transfer access can create updates" ON transfer_updates
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM transfers t
      JOIN users u ON u.id = auth.uid()
      WHERE t.id = transfer_id
      AND (
        -- User is admin
        u.role = 'admin' OR
        -- User is manager at either location
        (u.role = 'manager' AND (u.location_id = t.from_location_id OR u.location_id = t.to_location_id)) OR
        -- User is transport role
        u.role = 'transport' OR
        -- User requested the transfer
        t.requested_by_id = u.id
      )
    )
  );

-- Add comment to document the new fields
COMMENT ON COLUMN transfers.transport_company IS 'Name of the transport company handling the vehicle transfer';
COMMENT ON COLUMN transfers.transport_cost IS 'Actual cost of transporting the vehicle';
COMMENT ON COLUMN transfers.expected_arrival_date IS 'Expected date when the vehicle will arrive at destination';
COMMENT ON COLUMN transfers.last_update_notes IS 'Most recent update notes for quick reference';
COMMENT ON COLUMN transfers.updated_by_id IS 'User who made the last update to transport information';

COMMENT ON TABLE transfer_updates IS 'Tracks all updates and changes made to a transfer for audit trail';