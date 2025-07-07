# Round Table Transfer Process Documentation

## Overview

The Round Table platform enables a 5-store dealership network to transfer vehicles between locations. This document outlines the complete transfer process, user permissions, and business rules.

## Transfer Status Flow

```
┌─────────────┐     ┌──────────┐     ┌────────────┐     ┌───────────┐
│  requested  │────▶│ approved │────▶│ in-transit │────▶│ delivered │
└─────────────┘     └──────────┘     └────────────┘     └───────────┘
       │                   │                 │
       ▼                   ▼                 ▼
  ┌──────────┐      ┌───────────┐    ┌───────────┐
  │ rejected │      │ cancelled │    │ cancelled │
  └──────────┘      └───────────┘    └───────────┘
```

### Status Definitions

- **`requested`** - Initial state when a user claims a vehicle from another location
- **`approved`** - Manager/admin at the source location has approved the transfer
- **`in-transit`** - Vehicle is being transported between locations
- **`delivered`** - Transfer completed, vehicle now at destination location
- **`cancelled`** - Transfer was cancelled (can happen at approved or in-transit stage)
- **`rejected`** - Manager/admin at source location rejected the transfer request

## Vehicle Status During Transfer

The vehicle's status changes throughout the transfer process:

- **`available`** - Vehicle can be claimed
- **`claimed`** - Transfer approved, awaiting pickup
- **`in-transfer`** - Vehicle is in transit
- **`delivered`** - Temporary status, reverts to `available` at destination

## User Roles and Permissions

### Admin (Full System Access)
- ✅ Can claim vehicles from any location
- ✅ Can approve/reject transfers from any location
- ✅ Can update transfer status (in-transit, delivered)
- ✅ Can cancel any transfer
- ✅ Can view all transfers system-wide
- ✅ Can export data
- ✅ Can manage users and dealerships
- ✅ Can impersonate other users (except other admins)

### Manager (Location-Specific Authority)
- ✅ Can claim vehicles from other locations
- ✅ Can approve/reject transfers FROM their own location only
- ✅ Can update transfer status for their location's vehicles
- ✅ Can cancel transfers involving their location
- ✅ Can view all transfers (not just their location)
- ✅ Can export data
- ❌ Cannot manage users or dealerships
- ❌ Cannot impersonate users

### Sales (Basic Access)
- ✅ Can claim vehicles from other locations
- ✅ Can view transfers they initiated
- ✅ Can view their location's incoming/outgoing transfers
- ✅ Can add comments to transfers
- ❌ Cannot approve/reject transfers
- ❌ Cannot update transfer status
- ❌ Cannot export data

### Transport (Logistics Only)
- ✅ Can update transfer status (mark as in-transit/delivered)
- ✅ Can view transfers assigned for transport
- ❌ Cannot claim vehicles
- ❌ Cannot approve/reject transfers
- ❌ Cannot export data

## Transfer Process Steps

### 1. Request Phase
**Who**: Sales, Manager, or Admin user  
**Action**: Claims a vehicle from another location  
**System Updates**:
- Creates transfer record with status `requested`
- Tracks competing requests count
- Sends email notification to source location managers
- Creates activity log entry

### 2. Approval Phase
**Who**: Manager/Admin at the source location  
**Action**: Reviews and approves or rejects the transfer request  
**System Updates**:
- If approved:
  - Transfer status → `approved`
  - Vehicle status → `claimed`
  - Auto-rejects all other pending requests for the same vehicle
  - Sends approval notification to requester
  - Creates activity log
- If rejected:
  - Transfer status → `rejected`
  - Records rejection reason
  - Sends rejection notification
  - Creates activity log

### 3. Transit Phase
**Who**: Manager, Admin, or Transport user  
**Action**: Marks vehicle as picked up and in transit  
**System Updates**:
- Transfer status → `in-transit`
- Vehicle status → `in-transfer`
- Records pickup date/time
- Creates activity log

### 4. Delivery Phase
**Who**: Transport user, Manager at destination location, or Admin  
**Action**: Confirms vehicle delivery at destination  
**System Updates**:
- Transfer status → `delivered`
- Vehicle status → `available`
- Updates vehicle location to destination
- Clears `current_transfer_id` reference
- Records delivery date/time
- Creates activity log

**Permission Details**:
- Transport users can mark any transfer as delivered
- Managers can only mark transfers as delivered at their own location (destination)
- Admins can mark any transfer as delivered from any location

## Business Rules

### Location-Based Approval
- Only managers/admins at the source location can approve or reject transfer requests
- This ensures each dealership maintains control over their inventory

### Competing Requests
- Multiple stores can request the same vehicle simultaneously
- The system tracks the number of competing requests
- When one request is approved, all others are automatically rejected
- Rejected users receive notification about the auto-rejection

### Daily Import Protection
- Vehicles with active transfers (requested, approved, or in-transit) are preserved during daily CSV imports
- This prevents loss of transfer data during inventory updates

### Post-Delivery Retention
- Delivered vehicles remain in the system for 3 days after delivery
- This allows for any post-delivery issues to be addressed
- After 3 days, the vehicle may be removed during the next import if not in the current inventory

### Transfer Cancellation
- Transfers can be cancelled at the `approved` or `in-transit` stage
- Cancelling reverts the vehicle status to `available`
- Cancellation sends notifications to all involved parties

## API Endpoints

### POST `/api/transfer/claim`
Creates a new transfer request

### PUT `/api/transfer/[id]/approve`
Approves a transfer request (source location managers/admins only)

### PUT `/api/transfer/[id]/reject`
Rejects a transfer request with reason

### PUT `/api/transfer/[id]/status`
Updates transfer status (in-transit or delivered)

### PUT `/api/transfer/[id]/cancel`
Cancels an active transfer

### GET `/api/transfer/vehicle/[vehicleId]/requests`
Gets all transfer requests for a specific vehicle

## Email Notifications

The system sends automated emails for:
- New transfer requests (to source location managers)
- Transfer approvals (to requester)
- Transfer rejections (to requester)
- Transfer cancellations (to all involved parties)
- Delivery confirmations (optional)

## Activity Logging

All transfer actions are logged in the activities table:
- Transfer creation
- Approval/rejection decisions
- Status updates
- Cancellations
- Comments added to transfers

This provides a complete audit trail for all vehicle movements between dealerships.

## Security Considerations

- All API endpoints require authentication
- Permission checks are enforced at the API level
- Location-based restrictions are validated server-side
- Admin impersonation is limited (cannot impersonate other admins)
- Sensitive data (like money offers) is filtered based on user permissions