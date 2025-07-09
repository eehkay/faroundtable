# Round Table Notification System Documentation

## Overview

The Round Table notification system provides automated communication through email notifications and real-time activity updates. This document describes the current implementation as of January 2025.

## Notification Types

### 1. Email Notifications

The system sends automated emails for the following events:

#### Transfer Lifecycle Notifications
- **Transfer Requested**: Notifies managers/admins when a vehicle claim is made
- **Transfer Approved**: Confirms approval to the requester and destination store
- **Transfer In Transit**: Updates parties when vehicle is marked as in transit
- **Transfer Delivered**: Confirms successful delivery
- **Transfer Cancelled**: Notifies relevant parties of cancellation

#### Email Service Implementation
- **Provider**: Resend API
- **Configuration**: Stored in `email_settings` table
- **Templates**: Customizable through admin interface
- **Error Handling**: Graceful fallback when API key is missing

### 2. Real-time Activity Updates

#### Supabase Real-time Subscriptions
- Dashboard activity feed updates live
- Transfer request monitoring
- Statistics refresh without page reload
- No page refresh required for new activities

#### Activity Types Tracked
- Vehicle claims/releases
- Transfer status changes
- User comments
- Location transfers
- Admin actions

### 3. UI Toast Notifications

- **Library**: `sonner` for React
- **Theme**: Dark mode configured
- **Usage**: Limited to specific actions (vehicle updates)
- **Location**: Root layout configuration

## System Architecture

### Core Components

#### 1. Email Service (`/lib/email/service.ts`)
```typescript
- sendTransferEmail(type, transfer, additionalData)
- getNotificationSettings()
- determineRecipients(transfer, settings)
- renderEmailTemplate(template, data)
```

#### 2. API Routes
- `/api/email-settings/` - CRUD for email configuration
- `/api/transfer/[action]` - Triggers transfer notifications
- `/api/comment/` - Handles comment creation (no notifications yet)

#### 3. Admin Interface (`/app/(authenticated)/admin/notifications/`)
- Email settings management
- Template customization
- Recipient role configuration
- Test email functionality

### Database Schema

#### Tables
```sql
email_settings
- id: uuid
- setting_type: text (general, template)
- key: text
- value: jsonb
- created_at, updated_at

activities
- id, type, description
- user_id, location_id
- vehicle_id, transfer_id
- created_at

comment_mentions
- id, comment_id
- user_id
- created_at
```

### Notification Flow

#### Transfer Request Example
1. User claims vehicle via UI
2. API creates transfer record
3. Activity logged to database
4. Email service queries settings
5. Recipients determined by role/location
6. Email sent via Resend API
7. Real-time subscription broadcasts activity

## Configuration

### Environment Variables
```env
RESEND_API_KEY=re_xxxxxxxxxxxx
RESEND_FROM_EMAIL=notifications@company.com
```

### Email Settings Structure
```json
{
  "general": {
    "fromName": "Round Table",
    "fromEmail": "notifications@roundtable.com",
    "replyTo": "support@roundtable.com"
  },
  "templates": {
    "transfer_requested": {
      "subject": "New Transfer Request",
      "body": "...",
      "recipientRoles": ["manager", "admin"]
    }
  }
}
```

## Current Limitations

### Missing Features
1. **Browser Push Notifications**: Not implemented
2. **Notification Center**: No in-app notification history
3. **User Preferences**: No individual notification settings
4. **Mention Notifications**: Database ready but not functional
5. **Notification Badges**: No unread indicators
6. **Digest Emails**: No batched notifications
7. **SMS/Text Messages**: Email only currently

### Technical Constraints
1. **Tracking**: No read/delivery tracking
2. **Retry Logic**: No automatic retry for failed emails
3. **Rate Limiting**: No protection against notification spam
4. **Localization**: English only templates
5. **Rich Media**: Plain text emails only

## Usage Examples

### Sending a Transfer Email
```typescript
await sendTransferNotificationEmail(
  'transfer_approved',
  transfer,
  { approvedBy: session.user }
);
```

### Subscribing to Activities
```typescript
const channel = supabase
  .channel('activities')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'activities' },
    handleNewActivity
  )
  .subscribe();
```

### Creating a Toast Notification
```typescript
import { toast } from 'sonner';
toast.success('Vehicle updated successfully');
```

## Admin Features

### Email Template Management
- Access via `/admin/notifications`
- Edit subject lines and body content
- Configure recipient roles per notification type
- Test emails before saving

### Monitoring
- View sent email logs (if enabled)
- Check Resend dashboard for delivery stats
- Monitor real-time subscription health

## Security Considerations

1. **Authentication**: All notification triggers require valid session
2. **Authorization**: Role-based recipient determination
3. **Data Privacy**: No sensitive data in email subjects
4. **API Keys**: Stored as environment variables only
5. **Rate Limiting**: Relies on Resend's built-in limits

## Future Considerations

This system provides basic notification functionality but has room for enhancement. See `NOTIFICATION_SYSTEM_IMPROVEMENTS.md` for recommended upgrades.