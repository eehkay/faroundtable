-- Migrate existing data from notification_log to notification_activity
-- First, insert any missing records from notification_log

INSERT INTO notification_activity (
  id,
  template_id,
  rule_id,
  event,
  channel,
  status,
  recipients,
  subject,
  content,
  metadata,
  error_message,
  retry_count,
  sent_at,
  delivered_at,
  opened_at,
  clicked_at,
  failed_at,
  created_at,
  vehicle_id,
  transfer_id,
  user_id,
  location_id
)
SELECT 
  nl.id,
  nl.template_id,
  nl.rule_id,
  nl.event,
  nl.channel,
  nl.status,
  ARRAY[]::text[], -- empty recipients array for now
  COALESCE(nl.metadata->>'subject', 'Notification'), -- extract subject from metadata if exists
  COALESCE(nl.metadata->>'content', ''), -- extract content from metadata if exists
  nl.metadata,
  nl.error_message,
  0, -- default retry count
  nl.sent_at,
  CASE WHEN nl.status = 'delivered' THEN nl.sent_at ELSE NULL END, -- assume delivered if status is delivered
  NULL, -- no opened tracking yet
  NULL, -- no click tracking yet
  CASE WHEN nl.status = 'failed' THEN nl.sent_at ELSE NULL END, -- assume failed at sent time if failed
  nl.sent_at, -- use sent_at as created_at
  (nl.metadata->>'vehicleId')::uuid, -- extract from metadata
  (nl.metadata->>'transferId')::uuid, -- extract from metadata
  nl.recipient_id, -- map recipient_id to user_id
  (nl.metadata->>'locationId')::uuid -- extract from metadata
FROM notification_log nl
WHERE NOT EXISTS (
  SELECT 1 FROM notification_activity na WHERE na.id = nl.id
);

-- Create a view to redirect notification_log queries to notification_activity
-- This allows backward compatibility while we update the code
DROP VIEW IF EXISTS notification_log_view;
CREATE VIEW notification_log_view AS
SELECT 
  id,
  rule_id,
  template_id,
  event,
  user_id as recipient_id,
  channel,
  status,
  error_message,
  sent_at,
  metadata
FROM notification_activity;

-- Create INSERT trigger to redirect notification_log inserts to notification_activity
CREATE OR REPLACE FUNCTION redirect_notification_log_insert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_activity (
    id,
    rule_id,
    template_id,
    event,
    channel,
    status,
    recipients,
    subject,
    content,
    metadata,
    error_message,
    retry_count,
    sent_at,
    created_at,
    vehicle_id,
    transfer_id,
    user_id,
    location_id
  )
  VALUES (
    NEW.id,
    NEW.rule_id,
    NEW.template_id,
    NEW.event,
    NEW.channel,
    NEW.status,
    ARRAY[]::text[],
    COALESCE(NEW.metadata->>'subject', 'Notification'),
    COALESCE(NEW.metadata->>'content', ''),
    NEW.metadata,
    NEW.error_message,
    0,
    NEW.sent_at,
    NEW.sent_at,
    (NEW.metadata->>'vehicleId')::uuid,
    (NEW.metadata->>'transferId')::uuid,
    NEW.recipient_id,
    (NEW.metadata->>'locationId')::uuid
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS redirect_notification_log_insert_trigger ON notification_log;

-- Create the trigger
CREATE TRIGGER redirect_notification_log_insert_trigger
INSTEAD OF INSERT ON notification_log_view
FOR EACH ROW
EXECUTE FUNCTION redirect_notification_log_insert();

-- Rename the original table to keep as backup
ALTER TABLE notification_log RENAME TO notification_log_backup;

-- Rename the view to notification_log so existing code continues to work
ALTER VIEW notification_log_view RENAME TO notification_log;