-- Insert default notification rules for transfer events
-- Only insert if they don't already exist

-- Transfer Requested Rule
INSERT INTO notification_rules (
  id,
  name,
  description,
  active,
  event,
  conditions,
  condition_logic,
  recipient_config,
  channel_config,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  'Transfer Request Notifications',
  'Send notifications when a vehicle transfer is requested',
  true,
  'transfer_requested',
  '[]'::jsonb,
  'AND',
  jsonb_build_object(
    'useConditions', false,
    'currentLocation', ARRAY['manager', 'admin'],
    'requestingLocation', ARRAY['sales', 'manager', 'admin'],
    'destinationLocation', ARRAY[]::text[],
    'specificUsers', ARRAY[]::text[],
    'additionalEmails', ARRAY[]::text[],
    'additionalPhones', ARRAY[]::text[]
  ),
  jsonb_build_object(
    'email', jsonb_build_object(
      'enabled', true,
      'templateId', (SELECT id FROM notification_templates WHERE name = 'Transfer Request' AND active = true LIMIT 1)
    ),
    'sms', jsonb_build_object(
      'enabled', false,
      'templateId', ''
    ),
    'priority', 'email_first'
  ),
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM notification_rules WHERE event = 'transfer_requested'
);

-- Transfer Approved Rule
INSERT INTO notification_rules (
  id,
  name,
  description,
  active,
  event,
  conditions,
  condition_logic,
  recipient_config,
  channel_config,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  'Transfer Approval Notifications',
  'Send notifications when a vehicle transfer is approved',
  true,
  'transfer_approved',
  '[]'::jsonb,
  'AND',
  jsonb_build_object(
    'useConditions', false,
    'currentLocation', ARRAY['sales', 'manager', 'admin', 'transport'],
    'requestingLocation', ARRAY[]::text[],
    'destinationLocation', ARRAY['sales', 'manager', 'admin', 'transport'],
    'specificUsers', ARRAY[]::text[],
    'additionalEmails', ARRAY[]::text[],
    'additionalPhones', ARRAY[]::text[]
  ),
  jsonb_build_object(
    'email', jsonb_build_object(
      'enabled', true,
      'templateId', (SELECT id FROM notification_templates WHERE name = 'Transfer Approved' AND active = true LIMIT 1)
    ),
    'sms', jsonb_build_object(
      'enabled', false,
      'templateId', ''
    ),
    'priority', 'email_first'
  ),
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM notification_rules WHERE event = 'transfer_approved'
);

-- Transfer In Transit Rule
INSERT INTO notification_rules (
  id,
  name,
  description,
  active,
  event,
  conditions,
  condition_logic,
  recipient_config,
  channel_config,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  'Transfer In Transit Notifications',
  'Send notifications when a vehicle transfer is in transit',
  true,
  'transfer_in_transit',
  '[]'::jsonb,
  'AND',
  jsonb_build_object(
    'useConditions', false,
    'currentLocation', ARRAY[]::text[],
    'requestingLocation', ARRAY[]::text[],
    'destinationLocation', ARRAY['sales', 'manager', 'admin'],
    'specificUsers', ARRAY[]::text[],
    'additionalEmails', ARRAY[]::text[],
    'additionalPhones', ARRAY[]::text[]
  ),
  jsonb_build_object(
    'email', jsonb_build_object(
      'enabled', true,
      'templateId', (SELECT id FROM notification_templates WHERE name = 'Transfer In Transit' AND active = true LIMIT 1)
    ),
    'sms', jsonb_build_object(
      'enabled', false,
      'templateId', ''
    ),
    'priority', 'email_first'
  ),
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM notification_rules WHERE event = 'transfer_in_transit'
);

-- Transfer Delivered Rule
INSERT INTO notification_rules (
  id,
  name,
  description,
  active,
  event,
  conditions,
  condition_logic,
  recipient_config,
  channel_config,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  'Transfer Delivered Notifications',
  'Send notifications when a vehicle transfer is delivered',
  true,
  'transfer_delivered',
  '[]'::jsonb,
  'AND',
  jsonb_build_object(
    'useConditions', false,
    'currentLocation', ARRAY['manager', 'admin'],
    'requestingLocation', ARRAY[]::text[],
    'destinationLocation', ARRAY['sales', 'manager', 'admin'],
    'specificUsers', ARRAY[]::text[],
    'additionalEmails', ARRAY[]::text[],
    'additionalPhones', ARRAY[]::text[]
  ),
  jsonb_build_object(
    'email', jsonb_build_object(
      'enabled', true,
      'templateId', (SELECT id FROM notification_templates WHERE name = 'Transfer Delivered' AND active = true LIMIT 1)
    ),
    'sms', jsonb_build_object(
      'enabled', false,
      'templateId', ''
    ),
    'priority', 'email_first'
  ),
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM notification_rules WHERE event = 'transfer_delivered'
);

-- Transfer Cancelled Rule
INSERT INTO notification_rules (
  id,
  name,
  description,
  active,
  event,
  conditions,
  condition_logic,
  recipient_config,
  channel_config,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  'Transfer Cancellation Notifications',
  'Send notifications when a vehicle transfer is cancelled',
  true,
  'transfer_cancelled',
  '[]'::jsonb,
  'AND',
  jsonb_build_object(
    'useConditions', false,
    'currentLocation', ARRAY['manager', 'admin'],
    'requestingLocation', ARRAY['sales', 'manager', 'admin'],
    'destinationLocation', ARRAY['sales', 'manager', 'admin'],
    'specificUsers', ARRAY[]::text[],
    'additionalEmails', ARRAY[]::text[],
    'additionalPhones', ARRAY[]::text[]
  ),
  jsonb_build_object(
    'email', jsonb_build_object(
      'enabled', true,
      'templateId', (SELECT id FROM notification_templates WHERE name = 'Transfer Cancelled' AND active = true LIMIT 1)
    ),
    'sms', jsonb_build_object(
      'enabled', false,
      'templateId', ''
    ),
    'priority', 'email_first'
  ),
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM notification_rules WHERE event = 'transfer_cancelled'
);