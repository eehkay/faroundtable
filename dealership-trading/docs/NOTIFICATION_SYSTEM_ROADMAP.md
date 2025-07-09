# Round Table Advanced Notification System Roadmap

## Overview

This roadmap outlines the implementation plan for enhancing the Round Table notification system with advanced features including customizable templates, a rules engine, multi-channel support, and comprehensive admin controls.

## Implementation Status Summary

- **Phase 1: Template Management** ✅ COMPLETED
  - Full template CRUD with WYSIWYG editor
  - Merge tag system with conditional logic
  - Preview and test functionality
  
- **Phase 2: Rules Engine** ✅ COMPLETED (needs DB migrations)
  - Complete UI for rule management
  - Condition builder with AND/OR logic
  - Recipient configuration system
  - ⚠️ Missing: `notification_rules` and `notification_log` table migrations
  
- **Phase 3: Multi-Channel Support** ✅ COMPLETED
  - Twilio SMS integration
  - SMS opt-in/out management
  - Channel routing and fallback
  - Missing: Cost calculator, URL shortener
  
- **Phase 4: Enhanced Features** ⚙️ IN PROGRESS
  - SMS preferences UI completed
  - Logging code implemented
  - ⚠️ Missing: Database tables, activity viewer, full preference system

## Critical Missing Components

1. **Database Migrations Required:**
   - `notification_rules` table
   - `notification_log` table
   - `sms_consent_log` table
   - `notification_activity` table
   - `user_notification_preferences` table

2. **Minor Features to Complete:**
   - SMS cost estimation calculator
   - URL shortening service
   - Activity viewer UI
   - Per-notification-type preferences
   - Webhook handlers for delivery tracking

## Current State Assessment

### Existing Infrastructure
- ✅ Email service using Resend API
- ✅ Basic email templates (hardcoded)
- ✅ Role-based recipient configuration
- ✅ Admin interface for basic settings
- ✅ 5 notification types (transfer lifecycle)

### Limitations to Address
- ✅ Templates are hardcoded in service layer → Now database-driven
- ✅ No template customization via UI → Full WYSIWYG editor implemented
- ✅ Limited merge variables → Comprehensive merge tag system
- ✅ No SMS support → Twilio integration complete
- ✅ No notification rules engine → Full rules engine implemented
- ⚙️ No delivery tracking → Partially implemented
- ⚙️ No user preferences → SMS preferences only

## Implementation Phases

## Phase 1: Template Management System (1-2 weeks) ✅ COMPLETED

### Goals
Transform hardcoded email templates into a flexible, database-driven system with a rich editing interface.

### Tasks

#### 1.1 Database Schema Updates
- [x] Create `notification_templates` table
  ```sql
  - id, name, description, category
  - channels (JSONB): email/sms content
  - active, created_at, updated_at
  ```
- [x] Migrate existing templates to database
- [x] Add template references to `email_settings`

#### 1.2 Template Editor UI
- [x] Create template management page at `/admin/notifications/templates`
- [x] Implement template list view with CRUD operations
- [x] Add TinyMCE WYSIWYG editor for HTML emails
- [x] Add plain text editor for SMS with character counter
- [x] Implement template categorization (Transfer, System, etc.)

#### 1.3 Merge Tag System
- [x] Define comprehensive merge tag schema
  - Vehicle context: `{{vehicle.*}}`
  - Transfer context: `{{transfer.*}}`
  - User context: `{{user.*}}`
  - System context: `{{system.*}}`
  - Links: `{{link.*}}`
- [x] Build merge tag processor service
- [x] Add merge tag documentation panel in editor
- [x] Implement conditional blocks: `{{#if}}...{{/if}}`

#### 1.4 Template Preview & Testing
- [x] Create preview component with sample data
- [x] Add device preview modes (desktop/mobile)
- [x] Implement test email functionality
- [x] Add SMS preview with character count
- [x] Create template validation service

#### 1.5 API Endpoints
- [x] `GET /api/admin/notification-templates`
- [x] `POST /api/admin/notification-templates`
- [x] `PUT /api/admin/notification-templates/:id`
- [x] `DELETE /api/admin/notification-templates/:id`
- [x] `POST /api/admin/notification-templates/:id/preview`
- [x] `POST /api/admin/notification-templates/:id/test`

## Phase 2: Notification Rules Engine (2-3 weeks) ✅ COMPLETED

### Goals
Build a flexible rules system that determines who receives notifications based on configurable conditions.

### Tasks

#### 2.1 Database Schema
- [ ] Create `notification_rules` table ⚠️ MISSING MIGRATION
  ```sql
  - id, name, description, active
  - event, conditions (JSONB), condition_logic
  - recipients (JSONB), channels (JSONB)
  - created_at, updated_at
  ```
- [ ] Create `notification_log` table for tracking ⚠️ MISSING MIGRATION

#### 2.2 Rules Management UI
- [x] Create rules list page at `/admin/notifications/rules`
- [x] Build rule editor with multi-step form
- [x] Implement drag-and-drop rule prioritization
- [x] Add rule duplication feature
- [x] Create bulk actions (activate/deactivate)

#### 2.3 Condition Builder
- [x] Design condition builder UI component
- [x] Implement field selection dropdowns
- [x] Add operator selection (equals, contains, etc.)
- [x] Build AND/OR logic toggle
- [x] Create condition validation

#### 2.4 Recipient Configuration
- [x] Build recipient selection interface
  - By role checkboxes
  - By location multi-select
  - Specific users search/select
  - Additional emails/phones input
- [x] Implement recipient preview
- [x] Add recipient validation

#### 2.5 Rule Processing Engine
- [x] Create rule evaluation service
- [x] Build recipient resolver based on conditions
- [x] Implement rule caching for performance
- [x] Add rule execution logging
- [x] Create fallback handling

#### 2.6 API Endpoints
- [x] `GET /api/admin/notification-rules`
- [x] `POST /api/admin/notification-rules`
- [x] `PUT /api/admin/notification-rules/:id`
- [x] `DELETE /api/admin/notification-rules/:id`
- [x] `POST /api/admin/notification-rules/:id/test`
- [x] `GET /api/admin/notification-rules/preview-recipients`

## Phase 3: Multi-Channel Support (1-2 weeks) ✅ COMPLETED

### Goals
Add SMS as a notification channel with proper routing and fallback logic.

### Tasks

#### 3.1 SMS Infrastructure
- [x] Integrate Twilio SDK
- [x] Add phone number field to user profiles
- [x] Create phone number validation service
- [x] Implement SMS opt-in/out management

#### 3.2 Channel Configuration
- [x] Update rules to support channel selection
- [x] Implement channel priority options
- [x] Create fallback logic handler
- [x] Add quiet hours configuration
- [ ] Build cost estimation calculator

#### 3.3 SMS Template Features
- [x] Add SMS template section to editor
- [x] Implement 160/320 character limits
- [ ] Create URL shortening service
- [x] Add Unicode detection and warnings
- [x] Build message splitting preview

#### 3.4 Delivery Management
- [x] Create unified notification queue
- [x] Implement channel-specific rate limiting
- [x] Add retry logic with exponential backoff
- [x] Build delivery status tracking
- [x] Create failure notifications

## Phase 4: Enhanced Features (2-3 weeks) ⚙️ PARTIALLY COMPLETED

### Goals
Add advanced capabilities including logging, analytics, and user preferences.

### Tasks

#### 4.1 Activity Logging
- [ ] Create `notification_activity` table ⚠️ MISSING MIGRATION
- [x] Log all notification attempts
- [x] Track delivery status per channel
- [x] Store error messages and retry counts
- [ ] Build activity viewer UI

#### 4.2 User Preferences
- [ ] Create `user_notification_preferences` table ⚠️ MISSING MIGRATION
- [x] Build preferences UI in user profile (SMS only)
- [ ] Add per-notification-type toggles
- [ ] Implement digest preferences
- [ ] Create preference inheritance logic

#### 4.3 Delivery Tracking
- [ ] Set up Resend webhooks
- [ ] Create webhook handler endpoints
- [ ] Track opens, clicks, bounces
- [ ] Set up Twilio status callbacks
- [ ] Build delivery status UI

#### 4.4 Analytics Dashboard
- [ ] Create analytics page at `/admin/notifications/analytics`
- [ ] Build notification volume charts
- [ ] Add delivery success rate metrics
- [ ] Create recipient engagement reports
- [ ] Implement template performance tracking

#### 4.5 Additional Notification Types
- [ ] Comment mentions
- [ ] Vehicle price changes
- [ ] Transfer deadline reminders
- [ ] Daily/weekly summaries
- [ ] System announcements

## Phase 5: Advanced Capabilities (Future)

### Goals
Long-term enhancements for scalability and additional channels.

### Tasks

#### 5.1 Additional Channels
- [ ] Slack integration via webhooks
- [ ] Microsoft Teams connectors
- [ ] WhatsApp Business API
- [ ] In-app push notifications

#### 5.2 Advanced Features
- [ ] A/B testing for templates
- [ ] Smart notification batching
- [ ] Machine learning for optimal send times
- [ ] Internationalization support
- [ ] Template marketplace

#### 5.3 Developer Features
- [ ] Webhook API for external systems
- [ ] Notification API for third-party apps
- [ ] Template SDK
- [ ] Custom channel plugins

## Technical Requirements

### Frontend Technologies
- Next.js 15 with App Router
- TinyMCE for WYSIWYG editing
- React Hook Form for complex forms
- Recharts for analytics
- Tailwind CSS for styling

### Backend Technologies
- Supabase for database
- Resend for email delivery
- Twilio for SMS (Phase 3)
- Bull/BullMQ for job queues
- Redis for caching

### Database Migrations
1. Phase 1: `notification_templates` table
2. Phase 2: `notification_rules`, `notification_log` tables
3. Phase 3: Add phone fields to users
4. Phase 4: `notification_activity`, `user_preferences` tables

## Success Metrics

### Phase 1 Completion
- [ ] All email templates migrated to database
- [ ] Template editor fully functional
- [ ] Merge tags working with live data
- [ ] Preview and test features operational

### Phase 2 Completion
- [ ] Rules engine processing all notifications
- [ ] Condition builder intuitive and bug-free
- [ ] All existing notifications converted to rules
- [ ] Test mode working reliably

### Phase 3 Completion
- [ ] SMS notifications sending successfully
- [ ] Channel fallback logic working
- [ ] Phone number management complete
- [ ] Cost tracking implemented

### Phase 4 Completion
- [ ] Full notification history available
- [ ] User preferences respected
- [ ] Delivery tracking operational
- [ ] Analytics providing insights

## Testing Strategy

### Unit Tests
- Template merge tag processing
- Rule condition evaluation
- Recipient resolution logic
- Channel routing decisions

### Integration Tests
- End-to-end notification flow
- Multi-channel delivery
- Webhook processing
- Queue reliability

### User Acceptance Tests
- Admin can create/edit templates
- Rules correctly target recipients
- Users receive appropriate notifications
- Analytics accurately reflect activity

## Risk Mitigation

### Technical Risks
- **Email delivery issues**: Implement robust retry logic
- **SMS costs**: Add spending limits and alerts
- **Performance degradation**: Use caching and queues
- **Data loss**: Regular backups and versioning

### Business Risks
- **User notification fatigue**: Implement smart batching
- **Compliance issues**: Add unsubscribe and consent
- **Adoption challenges**: Provide training and docs
- **Feature creep**: Stick to roadmap phases

## Documentation Requirements

### Admin Documentation
- [ ] Template creation guide
- [ ] Rules configuration tutorial
- [ ] Merge tag reference
- [ ] Troubleshooting guide

### Developer Documentation
- [ ] API endpoint reference
- [ ] Database schema docs
- [ ] Integration guides
- [ ] Code examples

### User Documentation
- [ ] Notification preferences help
- [ ] Opt-out instructions
- [ ] Channel setup guides

## Timeline Summary

- **Phase 1**: 1-2 weeks (Template Management)
- **Phase 2**: 2-3 weeks (Rules Engine)
- **Phase 3**: 1-2 weeks (Multi-Channel)
- **Phase 4**: 2-3 weeks (Enhanced Features)
- **Total**: 6-10 weeks for core features

## Next Steps

1. Review and approve roadmap
2. Set up feature branch
3. Begin Phase 1 implementation
4. Create initial database migrations
5. Build template management UI

---

**Last Updated**: January 8, 2025  
**Status**: Phases 1-3 Complete, Phase 4 In Progress  
**Owner**: Round Table Development Team  

**Next Steps**: 
1. Create missing database migrations
2. Complete activity viewer UI
3. Implement full user preferences system
4. Add delivery tracking webhooks