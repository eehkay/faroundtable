# Email Settings Migration Guide

This guide documents the migration of email notification settings from Sanity to Supabase.

## Overview

The email notification system has been migrated from Sanity CMS to Supabase to consolidate data storage and improve performance. This migration affects:

1. Email settings storage
2. Email template configuration
3. Notification recipient management

## Changes Made

### Database Schema

Email settings are now stored in the `email_settings` table in Supabase with the following structure:

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

### API Endpoints

New API endpoints have been created for email settings management:

- `GET /api/email-settings` - Get all email settings
- `POST /api/email-settings` - Create/update email settings
- `GET /api/email-settings/[key]` - Get specific email setting
- `DELETE /api/email-settings/[key]` - Delete specific email setting

### Setting Keys

The following setting keys are used:

- `general` - General email settings (from name, from email, reply-to)
- `transferRequested` - Settings for transfer request notifications
- `transferApproved` - Settings for transfer approval notifications
- `transferInTransit` - Settings for in-transit notifications
- `transferDelivered` - Settings for delivery notifications
- `transferCancelled` - Settings for cancellation notifications

### Metadata Structure

Each notification type (except `general`) stores configuration in the `metadata` field:

```json
{
  "recipientRoles": ["admin", "manager"],
  "notifyOriginStore": true,
  "notifyDestinationStore": false,
  "notifyRequester": false
}
```

## Migration Steps

1. **Run the migration script** (if you have existing Sanity email settings):
   ```bash
   npx ts-node scripts/migrate-email-settings.ts
   ```

2. **Verify settings** in the Supabase dashboard or through the admin UI

3. **Remove Sanity email settings** (optional, after confirming migration success)

## Updated Components

The following components have been updated to use Supabase:

1. **EmailSettingsForm** - General email settings management
2. **EmailTemplateEditor** - Template and notification configuration
3. **Email Service** (`/lib/email/service.ts`) - Core email sending logic

## Testing

After migration, test the email system:

1. Go to Admin > Email Settings
2. Configure general settings (from email, etc.)
3. Configure each notification template
4. Use the "Preview & Test" tab to send test emails
5. Perform actual transfer operations to verify notifications

## Rollback

If needed, the system can be rolled back by:

1. Reverting the code changes
2. Re-enabling Sanity email settings in the schema
3. Restoring email settings data in Sanity

## Benefits

- **Unified data storage** - All application data now in Supabase
- **Better performance** - Direct database queries instead of API calls
- **Improved flexibility** - JSONB metadata field allows easy extension
- **Simplified deployment** - One less service dependency