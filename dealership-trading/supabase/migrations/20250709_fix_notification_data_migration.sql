-- Fix notification data migration - handle NOT NULL constraints properly

-- First, let's copy data from notification_log to notification_activity with proper defaults
INSERT INTO notification_activity (
    id, 
    rule_id, 
    template_id, 
    event, 
    channel, 
    status,
    recipients, -- This is required and NOT NULL
    error_message, 
    sent_at, 
    metadata, 
    created_at,
    vehicle_id,
    transfer_id,
    user_id
)
SELECT 
    nl.id, 
    nl.rule_id, 
    nl.template_id, 
    nl.event, 
    nl.channel, 
    nl.status,
    -- Extract recipients from metadata or create empty array
    CASE 
        WHEN nl.metadata->>'recipient' IS NOT NULL THEN ARRAY[nl.metadata->>'recipient']
        ELSE ARRAY[]::text[]
    END as recipients,
    nl.error_message, 
    nl.sent_at, 
    nl.metadata, 
    COALESCE(nl.sent_at, timezone('utc', now())),
    -- Extract IDs from metadata
    CASE 
        WHEN nl.metadata->>'vehicleId' ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
        THEN (nl.metadata->>'vehicleId')::uuid 
        ELSE NULL 
    END as vehicle_id,
    CASE 
        WHEN nl.metadata->>'transferId' ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
        THEN (nl.metadata->>'transferId')::uuid 
        ELSE NULL 
    END as transfer_id,
    nl.recipient_id as user_id
FROM notification_log nl
ON CONFLICT (id) DO NOTHING;

-- Verify the migration
DO $$
DECLARE
    log_count integer;
    activity_count integer;
BEGIN
    SELECT COUNT(*) INTO log_count FROM notification_log;
    SELECT COUNT(*) INTO activity_count FROM notification_activity;
    
    RAISE NOTICE 'Migrated % records from notification_log to notification_activity', activity_count;
    RAISE NOTICE 'Original notification_log had % records', log_count;
END $$;