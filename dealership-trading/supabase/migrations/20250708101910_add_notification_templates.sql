-- Create notification templates table for customizable email/SMS templates
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  channels JSONB NOT NULL DEFAULT '{}',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Add RLS policies
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;

-- Only admins can manage templates
CREATE POLICY "Admin users can view templates"
  ON notification_templates FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admin users can create templates"
  ON notification_templates FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admin users can update templates"
  ON notification_templates FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admin users can delete templates"
  ON notification_templates FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Create indexes
CREATE INDEX idx_notification_templates_category ON notification_templates(category);
CREATE INDEX idx_notification_templates_active ON notification_templates(active);

-- Create updated_at trigger
CREATE TRIGGER update_notification_templates_updated_at
  BEFORE UPDATE ON notification_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default templates based on existing hardcoded ones
INSERT INTO notification_templates (name, description, category, channels) VALUES
(
  'transfer_requested',
  'Sent when a vehicle transfer is requested',
  'transfer',
  jsonb_build_object(
    'email', jsonb_build_object(
      'enabled', true,
      'subject', 'Transfer Request - {{vehicle.year}} {{vehicle.make}} {{vehicle.model}}',
      'bodyHtml', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Transfer Request</h2>
        <p>A new transfer has been requested for the following vehicle:</p>
        <div style="background-color: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 8px;">
          <h3 style="margin-top: 0;">{{vehicle.year}} {{vehicle.make}} {{vehicle.model}}</h3>
          <p><strong>VIN:</strong> {{vehicle.vin}}</p>
          <p><strong>Stock #:</strong> {{vehicle.stock_number}}</p>
          <p><strong>From:</strong> {{transfer.from_location.name}}</p>
          <p><strong>To:</strong> {{transfer.to_location.name}}</p>
          <p><strong>Requested by:</strong> {{transfer.requested_by.name}} ({{transfer.requested_by.email}})</p>
          {{#if transfer.notes}}<p><strong>Notes:</strong> {{transfer.notes}}</p>{{/if}}
        </div>
        <p><a href="{{link.view_transfer}}" style="background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Transfer Request</a></p>
      </div>',
      'bodyText', 'Transfer Request\n\nA new transfer has been requested for:\n{{vehicle.year}} {{vehicle.make}} {{vehicle.model}}\nVIN: {{vehicle.vin}}\nStock #: {{vehicle.stock_number}}\n\nFrom: {{transfer.from_location.name}}\nTo: {{transfer.to_location.name}}\nRequested by: {{transfer.requested_by.name}}\n\nView details: {{link.view_transfer}}'
    ),
    'sms', jsonb_build_object(
      'enabled', false,
      'message', 'Transfer request: {{vehicle.year}} {{vehicle.make}} from {{transfer.from_location.name}}. View: {{link.view_short}}'
    )
  )
),
(
  'transfer_approved',
  'Sent when a transfer request is approved',
  'transfer',
  jsonb_build_object(
    'email', jsonb_build_object(
      'enabled', true,
      'subject', 'Transfer Approved - {{vehicle.year}} {{vehicle.make}} {{vehicle.model}}',
      'bodyHtml', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #22c55e;">Transfer Approved ✓</h2>
        <p>Your transfer request has been approved!</p>
        <div style="background-color: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 8px;">
          <h3 style="margin-top: 0;">{{vehicle.year}} {{vehicle.make}} {{vehicle.model}}</h3>
          <p><strong>VIN:</strong> {{vehicle.vin}}</p>
          <p><strong>Stock #:</strong> {{vehicle.stock_number}}</p>
          <p><strong>From:</strong> {{transfer.from_location.name}}</p>
          <p><strong>To:</strong> {{transfer.to_location.name}}</p>
          <p><strong>Approved by:</strong> {{transfer.approved_by.name}}</p>
        </div>
        <p>The vehicle is now ready for transport. Please coordinate with the transport team for pickup.</p>
        <p><a href="{{link.view_transfer}}" style="background-color: #22c55e; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Transfer Details</a></p>
      </div>',
      'bodyText', 'Transfer Approved\n\nYour transfer request has been approved!\n\n{{vehicle.year}} {{vehicle.make}} {{vehicle.model}}\nVIN: {{vehicle.vin}}\nStock #: {{vehicle.stock_number}}\n\nFrom: {{transfer.from_location.name}}\nTo: {{transfer.to_location.name}}\nApproved by: {{transfer.approved_by.name}}\n\nView details: {{link.view_transfer}}'
    ),
    'sms', jsonb_build_object(
      'enabled', false,
      'message', 'Transfer approved: {{vehicle.year}} {{vehicle.make}}. Ready for pickup at {{transfer.from_location.name}}. {{link.view_short}}'
    )
  )
),
(
  'transfer_in_transit',
  'Sent when a vehicle is marked as in transit',
  'transfer',
  jsonb_build_object(
    'email', jsonb_build_object(
      'enabled', true,
      'subject', 'Vehicle In Transit - {{vehicle.year}} {{vehicle.make}} {{vehicle.model}}',
      'bodyHtml', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Vehicle In Transit 🚚</h2>
        <p>The following vehicle is now in transit:</p>
        <div style="background-color: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 8px;">
          <h3 style="margin-top: 0;">{{vehicle.year}} {{vehicle.make}} {{vehicle.model}}</h3>
          <p><strong>VIN:</strong> {{vehicle.vin}}</p>
          <p><strong>Stock #:</strong> {{vehicle.stock_number}}</p>
          <p><strong>From:</strong> {{transfer.from_location.name}}</p>
          <p><strong>To:</strong> {{transfer.to_location.name}}</p>
        </div>
        <p>The vehicle has been picked up and is on its way to the destination location.</p>
        <p><a href="{{link.view_transfer}}" style="background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Track Transfer</a></p>
      </div>',
      'bodyText', 'Vehicle In Transit\n\nThe following vehicle is now in transit:\n\n{{vehicle.year}} {{vehicle.make}} {{vehicle.model}}\nVIN: {{vehicle.vin}}\nStock #: {{vehicle.stock_number}}\n\nFrom: {{transfer.from_location.name}}\nTo: {{transfer.to_location.name}}\n\nTrack transfer: {{link.view_transfer}}'
    ),
    'sms', jsonb_build_object(
      'enabled', false,
      'message', 'In transit: {{vehicle.year}} {{vehicle.make}} heading to {{transfer.to_location.name}}. Track: {{link.view_short}}'
    )
  )
),
(
  'transfer_delivered',
  'Sent when a vehicle has been delivered',
  'transfer',
  jsonb_build_object(
    'email', jsonb_build_object(
      'enabled', true,
      'subject', 'Vehicle Delivered - {{vehicle.year}} {{vehicle.make}} {{vehicle.model}}',
      'bodyHtml', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #22c55e;">Vehicle Delivered ✓</h2>
        <p>The following vehicle has been successfully delivered:</p>
        <div style="background-color: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 8px;">
          <h3 style="margin-top: 0;">{{vehicle.year}} {{vehicle.make}} {{vehicle.model}}</h3>
          <p><strong>VIN:</strong> {{vehicle.vin}}</p>
          <p><strong>Stock #:</strong> {{vehicle.stock_number}}</p>
          <p><strong>Delivered to:</strong> {{transfer.to_location.name}}</p>
          <p><strong>Delivered at:</strong> {{system.date}} {{system.time}}</p>
        </div>
        <p>The vehicle is now available at the destination location.</p>
        <p><a href="{{link.view_transfer}}" style="background-color: #22c55e; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Transfer Summary</a></p>
      </div>',
      'bodyText', 'Vehicle Delivered\n\nThe following vehicle has been successfully delivered:\n\n{{vehicle.year}} {{vehicle.make}} {{vehicle.model}}\nVIN: {{vehicle.vin}}\nStock #: {{vehicle.stock_number}}\n\nDelivered to: {{transfer.to_location.name}}\nDelivered at: {{system.date}} {{system.time}}\n\nView summary: {{link.view_transfer}}'
    ),
    'sms', jsonb_build_object(
      'enabled', false,
      'message', 'Delivered: {{vehicle.year}} {{vehicle.make}} now at {{transfer.to_location.name}}. {{link.view_short}}'
    )
  )
),
(
  'transfer_cancelled',
  'Sent when a transfer is cancelled',
  'transfer',
  jsonb_build_object(
    'email', jsonb_build_object(
      'enabled', true,
      'subject', 'Transfer Cancelled - {{vehicle.year}} {{vehicle.make}} {{vehicle.model}}',
      'bodyHtml', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444;">Transfer Cancelled</h2>
        <p>The following transfer has been cancelled:</p>
        <div style="background-color: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 8px;">
          <h3 style="margin-top: 0;">{{vehicle.year}} {{vehicle.make}} {{vehicle.model}}</h3>
          <p><strong>VIN:</strong> {{vehicle.vin}}</p>
          <p><strong>Stock #:</strong> {{vehicle.stock_number}}</p>
          <p><strong>Was going from:</strong> {{transfer.from_location.name}}</p>
          <p><strong>Was going to:</strong> {{transfer.to_location.name}}</p>
          {{#if transfer.cancellation_reason}}<p><strong>Reason:</strong> {{transfer.cancellation_reason}}</p>{{/if}}
        </div>
        <p>The vehicle remains at its current location.</p>
      </div>',
      'bodyText', 'Transfer Cancelled\n\nThe following transfer has been cancelled:\n\n{{vehicle.year}} {{vehicle.make}} {{vehicle.model}}\nVIN: {{vehicle.vin}}\nStock #: {{vehicle.stock_number}}\n\nWas going from: {{transfer.from_location.name}}\nWas going to: {{transfer.to_location.name}}\n\nThe vehicle remains at its current location.'
    ),
    'sms', jsonb_build_object(
      'enabled', false,
      'message', 'Transfer cancelled: {{vehicle.year}} {{vehicle.make}} remains at {{transfer.from_location.name}}'
    )
  )
);

-- Add a reference to template_id in email_settings table
ALTER TABLE email_settings 
ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES notification_templates(id);

-- Update existing email_settings to reference the new templates
UPDATE email_settings 
SET template_id = (SELECT id FROM notification_templates WHERE name = email_settings.setting_key)
WHERE setting_type = 'template' 
AND EXISTS (SELECT 1 FROM notification_templates WHERE name = email_settings.setting_key);