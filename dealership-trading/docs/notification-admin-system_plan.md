# Round Table Notification Admin System

## Overview

The Round Table Notification Admin System provides centralized control over all system notifications, allowing administrators to configure who receives what notifications through which channels. The system supports multiple communication channels (Email, SMS) with a template-based approach and rule-based routing.

## Core Features

### 1. Template Management System

#### Multi-Channel Templates
Templates support multiple communication channels with channel-specific content:

- **Email Templates**: Full HTML editor with rich formatting
- **SMS Templates**: Plain text with character limits (160/320)
- **Shared Merge Tags**: Consistent variables across all channels
- **Channel-Specific Preview**: See how messages appear in each channel

#### WYSIWYG Email Editor
- Rich text editor (TinyMCE) for HTML emails
- Source code view toggle for direct HTML editing
- Email-safe HTML formatting
- Mobile preview mode
- Subject line with merge tag support
- Test email functionality

#### SMS Template Editor
- Plain text editor with character counter
- 160 character limit (70 for unicode)
- Automatic message splitting for longer texts
- URL shortening for links
- Preview with character count

#### Merge Tag System
Templates support dynamic content through merge tags:

```
Basic Usage:
{{vehicle.year}} {{vehicle.make}} {{vehicle.model}}
{{transfer.from_location.name}}
{{user.email}}

Conditional Blocks:
{{#if transfer.priority}}URGENT: {{/if}}
{{#if customer_waiting}}Customer Waiting{{/if}}

Links:
{{link.view_transfer}}
{{link.approve_transfer}}
{{link.approve_short}} (shortened for SMS)
```

#### Available Merge Tags

**Vehicle Context:**
- `{{vehicle.year}}` - Vehicle year
- `{{vehicle.make}}` - Vehicle manufacturer
- `{{vehicle.model}}` - Vehicle model
- `{{vehicle.vin}}` - Vehicle VIN
- `{{vehicle.stock_number}}` - Stock number
- `{{vehicle.price}}` - Vehicle price
- `{{vehicle.mileage}}` - Current mileage
- `{{vehicle.color}}` - Vehicle color
- `{{vehicle.location.name}}` - Current location

**Transfer Context:**
- `{{transfer.from_location.name}}` - Origin location
- `{{transfer.to_location.name}}` - Destination location
- `{{transfer.requested_by.name}}` - Requester name
- `{{transfer.requested_by.email}}` - Requester email
- `{{transfer.status}}` - Current transfer status
- `{{transfer.priority}}` - Priority level
- `{{transfer.created_at}}` - Request date
- `{{transfer.notes}}` - Transfer notes

**User Context:**
- `{{user.name}}` - Recipient name
- `{{user.email}}` - Recipient email
- `{{user.location.name}}` - Recipient's store
- `{{user.role}}` - Recipient's role

**System Context:**
- `{{link.view_transfer}}` - Direct link to transfer
- `{{link.approve_transfer}}` - One-click approval link
- `{{link.dashboard}}` - Dashboard link
- `{{system.date}}` - Current date
- `{{system.time}}` - Current time

### 2. Notification Rules Engine

#### Rule Configuration
Each rule consists of:
- **Name**: Descriptive rule name
- **Description**: What the rule does
- **Event Trigger**: When to send notification
- **Conditions**: Who should receive it
- **Recipients**: Specific recipient configuration
- **Templates**: Which templates to use
- **Channel Settings**: Email, SMS, or both

#### Event Triggers
Available system events that can trigger notifications:

- Transfer Requested
- Transfer Approved
- Transfer In Transit
- Transfer Delivered
- Transfer Cancelled
- Comment Added
- Vehicle Updated
- Daily Summary (scheduled)

#### Condition Builder
Simple condition builder with:
- **Field Selection**: Role, Location, Vehicle Location, etc.
- **Operators**: equals, not equals, contains
- **Values**: Dropdown or text input based on field
- **Logic**: AND/OR between multiple conditions

Example conditions:
```
When: Transfer Requested
If: Recipient Role = "transport"
OR: Vehicle Location = Recipient Location
Then: Send notification
```

#### Recipient Selection Options

**By Role:**
- Transport Team
- Managers
- Sales Team
- Administrators

**By Location:**
- Vehicle's current location staff
- Vehicle's original location staff
- Transfer destination staff
- Specific locations (multi-select)

**Specific Recipients:**
- Individual users (searchable dropdown)
- Additional email addresses
- Additional phone numbers (for SMS)

### 3. Multi-Channel Support

#### Channel Configuration
Each rule can specify:
- **Enabled Channels**: Email, SMS, or both
- **Channel Priority**: Which channel to try first
- **Fallback Logic**: What to do if primary channel fails

#### Channel Priority Options
- Email only
- SMS only
- SMS first, Email fallback
- Email first, SMS for urgent
- Both simultaneously

#### SMS-Specific Features
- Character limit warnings
- Cost estimation per rule
- Quiet hours configuration (no SMS after certain time)
- Opt-out management
- Delivery confirmation tracking

### 4. Admin Interface

#### Rules List Page
```
Notification Rules
--------------------------------------------------------
[+ New Rule]

✓ Transport - All Transfers                    [Active]
  When: Any transfer event → To: All transport users
  Channels: Email, SMS | Template: Transfer Default
  [Edit] [Delete] [Test] [Duplicate]

✓ Managers - Own Vehicles                      [Active]
  When: Transfer Requested → To: Location managers
  Channels: Email only | Template: Manager Alert
  [Edit] [Delete] [Test] [Duplicate]

✗ Sales Team Updates                         [Inactive]
  When: Transfer Approved → To: Sales at destination
  Channels: Email only | Template: Vehicle Incoming
  [Edit] [Delete] [Test] [Duplicate]
```

#### Rule Editor Interface
```
Edit Rule
--------------------------------------------------------
Basic Information:
  Name: [____________________]
  Description: [____________________]
  Status: ( ) Active  ( ) Inactive

Trigger:
  When this happens: [Transfer Requested ▼]

Conditions:
  Send notification if:
  [Recipient Role ▼] [equals ▼] [transport ▼]
  [+ Add Condition]
  
  Condition Logic: ( ) Match ALL  ( ) Match ANY

Recipients:
  ☑ Users matching conditions above
  ☐ Vehicle's current location:
     ☐ All Staff  ☑ Managers  ☐ Sales
  ☐ Vehicle's original location:
     ☐ All Staff  ☐ Managers  ☐ Sales
  ☐ Specific users: [Select users...]
  
  Additional recipients:
  Emails: [____________________]
  Phones: [____________________]

Channels & Templates:
  ☑ Email
     Template: [Transfer Notification Email ▼]
  ☑ SMS
     Template: [Transfer Notification SMS ▼]
  
  Priority: [SMS first, Email fallback ▼]

[Save] [Cancel] [Send Test]
```

#### Template Editor Interface
```
Edit Template: Transfer Notification
--------------------------------------------------------
Template Info:
  Name: [____________________]
  Description: [____________________]
  Category: [Transfer ▼]

Email Template:
  ☑ Enable Email
  
  Subject: [Transfer Request - {{vehicle.year}} {{vehicle.make}}]
  
  [WYSIWYG Editor Toolbar]
  ┌─────────────────────────────────────────────────┐
  │ <h2>Transfer Request</h2>                       │
  │ <p>A new transfer has been requested:</p>       │
  │ <table>                                         │
  │   <tr>                                          │
  │     <td>Vehicle:</td>                           │
  │     <td>{{vehicle.year}} {{vehicle.make}}</td>  │
  │   </tr>                                         │
  │ </table>                                        │
  └─────────────────────────────────────────────────┘
  
  [Visual] [Source] | Insert Merge Tag: [Vehicle ▼]

SMS Template:
  ☑ Enable SMS
  
  Message ({{charCount}}/160):
  [Transfer Request: {{vehicle.year}} {{vehicle.make}} 
   from {{transfer.from_location.name}}. 
   Reply Y to approve. {{link.approve_short}}]

[Preview Email] [Preview SMS] [Send Test] [Save]
```

### 5. Testing & Validation

#### Test Functionality
- **Send Test**: Sends to admin email/phone only
- **Preview Recipients**: Shows who would receive notification
- **Sample Data**: Uses real vehicle/transfer for testing
- **Dry Run Mode**: Logs actions without sending

#### Validation Rules
- Required fields validation
- Email format validation
- Phone number format validation
- Template variable validation
- Character limit enforcement (SMS)

### 6. Data Models

#### Rule Structure
```typescript
interface NotificationRule {
  id: string;
  name: string;
  description: string;
  active: boolean;
  event: NotificationEvent;
  conditions: Condition[];
  conditionLogic: 'AND' | 'OR';
  recipients: RecipientConfig;
  channels: ChannelConfig;
  created_at: Date;
  updated_at: Date;
}

interface Condition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains';
  value: string;
}

interface RecipientConfig {
  useConditions: boolean;
  currentLocation: Role[];
  originalLocation: Role[];
  specificUsers: string[];
  additionalEmails: string[];
  additionalPhones: string[];
}

interface ChannelConfig {
  email: {
    enabled: boolean;
    templateId: string;
  };
  sms: {
    enabled: boolean;
    templateId: string;
  };
  priority: ChannelPriority;
}
```

#### Template Structure
```typescript
interface NotificationTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  channels: {
    email: {
      enabled: boolean;
      subject: string;
      bodyHtml: string;
      bodyText: string;
    };
    sms: {
      enabled: boolean;
      message: string;
    };
  };
  active: boolean;
  created_at: Date;
  updated_at: Date;
}
```

### 7. Implementation Guidelines

#### Database Schema
```sql
-- Notification rules table
CREATE TABLE notification_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT true,
  event TEXT NOT NULL,
  conditions JSONB DEFAULT '[]',
  condition_logic TEXT DEFAULT 'AND',
  recipients JSONB NOT NULL,
  channels JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notification templates table
CREATE TABLE notification_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  channels JSONB NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notification log table
CREATE TABLE notification_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_id UUID REFERENCES notification_rules(id),
  template_id UUID REFERENCES notification_templates(id),
  event TEXT NOT NULL,
  recipient_id UUID REFERENCES users(id),
  channel TEXT NOT NULL,
  status TEXT NOT NULL,
  error_message TEXT,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### API Endpoints
```
# Rules
GET    /api/admin/notification-rules
POST   /api/admin/notification-rules
PUT    /api/admin/notification-rules/:id
DELETE /api/admin/notification-rules/:id
POST   /api/admin/notification-rules/:id/test

# Templates  
GET    /api/admin/notification-templates
POST   /api/admin/notification-templates
PUT    /api/admin/notification-templates/:id
DELETE /api/admin/notification-templates/:id
POST   /api/admin/notification-templates/:id/preview

# Testing
POST   /api/admin/notifications/test
GET    /api/admin/notifications/preview-recipients
```

### 8. Security & Permissions

#### Access Control
- Only administrators can access notification settings
- Role-based permission checks on all endpoints
- Audit logging for all configuration changes

#### Data Security
- HTML sanitization in email templates
- Phone number validation and formatting
- Email address validation
- SQL injection prevention in conditions
- XSS prevention in merge tags

### 9. Performance Considerations

#### Optimization Strategies
- Rule evaluation caching
- Template compilation caching
- Batch recipient queries
- Asynchronous notification sending
- Rate limiting per channel

#### Scalability
- Queue-based notification processing
- Horizontal scaling support
- Database query optimization
- Minimal rule evaluation overhead

### 10. Future Enhancements

#### Planned Channels
- Slack integration
- Microsoft Teams
- WhatsApp Business API
- Push notifications

#### Advanced Features
- Scheduled notifications
- Recurring summaries
- A/B testing for templates
- Analytics and reporting
- Delivery tracking
- Smart batching

## Example Configurations

### Example 1: Transport Team - All Notifications
```json
{
  "name": "Transport Team - All Transfers",
  "description": "Notify all transport users of any transfer activity",
  "event": "transfer_*",
  "conditions": [
    {
      "field": "recipient.role",
      "operator": "equals",
      "value": "transport"
    }
  ],
  "recipients": {
    "useConditions": true
  },
  "channels": {
    "email": {
      "enabled": true,
      "templateId": "transport-transfer-email"
    },
    "sms": {
      "enabled": true,
      "templateId": "transport-transfer-sms"
    },
    "priority": "sms_first"
  }
}
```

### Example 2: Manager - Own Store Only
```json
{
  "name": "Managers - Own Vehicles",
  "description": "Notify managers only about their store's vehicles",
  "event": "transfer_requested",
  "conditions": [
    {
      "field": "recipient.role",
      "operator": "equals",
      "value": "manager"
    },
    {
      "field": "vehicle.location_id",
      "operator": "equals",
      "value": "{{recipient.location_id}}"
    }
  ],
  "conditionLogic": "AND",
  "recipients": {
    "useConditions": true
  },
  "channels": {
    "email": {
      "enabled": true,
      "templateId": "manager-approval-email"
    },
    "sms": {
      "enabled": false
    }
  }
}
```

## Best Practices

### Template Design
1. Keep SMS messages under 160 characters
2. Include clear call-to-action in emails
3. Use merge tags for personalization
4. Test templates with real data
5. Provide plain text fallback for emails

### Rule Configuration
1. Start simple, add complexity as needed
2. Use descriptive names for rules
3. Document the purpose of each rule
4. Test rules before activating
5. Review rules regularly for relevance

### Channel Selection
1. Use SMS for urgent, time-sensitive notifications
2. Use email for detailed information
3. Consider user preferences and demographics
4. Monitor channel costs
5. Implement proper fallback logic