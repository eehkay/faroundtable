-- Migrate data from notification_log to notification_activity table
-- Both tables exist, so we need to copy data and update schema

-- First, add missing columns to notification_activity if they don't exist
ALTER TABLE notification_activity 
ADD COLUMN IF NOT EXISTS rule_id UUID REFERENCES notification_rules(id),
ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES notification_templates(id),
ADD COLUMN IF NOT EXISTS event TEXT NOT NULL DEFAULT 'unknown',
ADD COLUMN IF NOT EXISTS recipient_id UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS channel TEXT NOT NULL DEFAULT 'email',
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'sent',
ADD COLUMN IF NOT EXISTS error_message TEXT,
ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS recipients TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS subject TEXT,
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS opened_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS clicked_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS failed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS vehicle_id UUID REFERENCES vehicles(id),
ADD COLUMN IF NOT EXISTS transfer_id UUID REFERENCES transfers(id),
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES dealership_locations(id),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now());

-- Copy all data from notification_log to notification_activity
INSERT INTO notification_activity (
    id, rule_id, template_id, event, recipient_id, channel, status, 
    error_message, sent_at, metadata, created_at
)
SELECT 
    id, rule_id, template_id, event, recipient_id, channel, status,
    error_message, sent_at, metadata, COALESCE(sent_at, timezone('utc', now()))
FROM notification_log
ON CONFLICT (id) DO NOTHING;

-- Update recipients array from metadata
UPDATE notification_activity
SET recipients = ARRAY[metadata->>'recipient']
WHERE metadata->>'recipient' IS NOT NULL
AND (recipients IS NULL OR recipients = '{}');

-- Extract vehicleId and transferId from metadata
UPDATE notification_activity
SET 
    vehicle_id = (metadata->>'vehicleId')::uuid,
    transfer_id = (metadata->>'transferId')::uuid
WHERE metadata->>'vehicleId' IS NOT NULL 
   OR metadata->>'transferId' IS NOT NULL;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_notification_activity_created_at ON notification_activity(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_activity_channel ON notification_activity(channel);
CREATE INDEX IF NOT EXISTS idx_notification_activity_status ON notification_activity(status);
CREATE INDEX IF NOT EXISTS idx_notification_activity_template_id ON notification_activity(template_id);
CREATE INDEX IF NOT EXISTS idx_notification_activity_event ON notification_activity(event);
CREATE INDEX IF NOT EXISTS idx_notification_activity_vehicle_id ON notification_activity(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_notification_activity_transfer_id ON notification_activity(transfer_id);

-- Add RLS policies if not exists
ALTER TABLE notification_activity ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admin and managers can view notification activity" ON notification_activity;
DROP POLICY IF EXISTS "System can insert notification activity" ON notification_activity;

-- Admins and managers can view all notification activity
CREATE POLICY "Admin and managers can view notification activity"
  ON notification_activity FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'manager')
    )
  );

-- System can insert notification activity (using service role)
CREATE POLICY "System can insert notification activity"
  ON notification_activity FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Add a comment to document the table
COMMENT ON TABLE notification_activity IS 'Tracks all notification delivery attempts including emails and SMS with delivery status';

-- We'll keep notification_log for now as a backup, but it won't be used anymore
COMMENT ON TABLE notification_log IS 'DEPRECATED: Use notification_activity instead. This table is kept for backup purposes only.';