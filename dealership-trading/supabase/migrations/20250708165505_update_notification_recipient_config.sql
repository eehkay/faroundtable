-- Update notification rules recipient config to use new field names
-- Rename 'originalLocation' to 'requestingLocation' in recipient_config JSON

UPDATE notification_rules
SET recipient_config = jsonb_set(
  recipient_config - 'originalLocation',
  '{requestingLocation}',
  COALESCE(recipient_config->'originalLocation', '[]'::jsonb)
)
WHERE recipient_config ? 'originalLocation';

-- Add indexes for better query performance on notification rules
CREATE INDEX IF NOT EXISTS idx_notification_rules_active ON notification_rules(active);
CREATE INDEX IF NOT EXISTS idx_notification_rules_event ON notification_rules(event);