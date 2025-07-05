# User Roles and Permissions Guide

## Overview

Round Table uses a role-based access control (RBAC) system to manage user permissions across the platform. This document outlines the current roles, their permissions, and guidelines for role management.

## Current User Roles

### 1. **Admin** 
**Purpose**: Complete system administration and oversight
- Full access to all system features
- Can manage users and assign roles
- Can approve/reject all transfers
- Can delete any comments
- Can export all data
- Can access admin dashboard

### 2. **Manager**
**Purpose**: Store management and oversight
- Can approve/reject transfers for their store
- Can view all transfers across the system
- Can export data
- Can update transfer statuses
- Can access admin dashboard (limited features)
- Can delete their own comments

### 3. **Sales**
**Purpose**: Day-to-day sales operations
- Can claim vehicles from other stores
- Can create transfer requests
- Can add comments to vehicles
- Can edit/delete their own comments
- Limited to viewing their own transfers

### 4. **Transport**
**Purpose**: Vehicle transportation and logistics
- Can update transfer statuses (in-transit, delivered)
- Cannot approve/reject transfers
- Cannot claim vehicles
- Focus on logistics execution

## Permissions Matrix

| Permission | Admin | Manager | Sales | Transport |
|------------|-------|---------|-------|-----------|
| **Vehicle Management** |
| Claim vehicles | ✅ | ✅ | ✅ | ❌ |
| View all inventory | ✅ | ✅ | ✅ | ✅ |
| **Transfer Management** |
| Create transfer requests | ✅ | ✅ | ✅ | ❌ |
| Approve/Reject transfers | ✅ | ✅ | ❌ | ❌ |
| Update transfer status | ✅ | ✅ | ❌ | ✅ |
| View all transfers | ✅ | ✅ | ❌ | ❌ |
| Cancel own transfers | ✅ | ✅ | ✅ | ❌ |
| **Comments & Communication** |
| Add comments | ✅ | ✅ | ✅ | ✅ |
| Edit own comments | ✅ | ✅ | ✅ | ✅ |
| Delete own comments | ✅ | ✅ | ✅ | ❌ |
| Delete any comment | ✅ | ❌ | ❌ | ❌ |
| **System Features** |
| Access admin dashboard | ✅ | ✅ | ❌ | ❌ |
| Manage users | ✅ | ❌ | ❌ | ❌ |
| Export data | ✅ | ✅ | ❌ | ❌ |
| View reports | ✅ | ✅ | ❌ | ❌ |

## Implementation Details

### Database Schema
Roles are stored in the `users` table with a constraint ensuring only valid roles:
```sql
CHECK (role IN ('admin', 'manager', 'sales', 'transport'))
```

### Permission Functions
Permissions are enforced through functions in `/lib/permissions.ts`:

```typescript
// Key permission checks
canClaimVehicle(role)         // sales, manager, admin
canApproveTransfer(role)      // manager, admin
canUpdateTransferStatus(role) // manager, admin, transport
canManageUsers(role)          // admin only
canViewAllTransfers(role)     // manager, admin
canExportData(role)           // manager, admin
```

### API Enforcement
- All API routes check user roles before executing operations
- Role validation happens at both API and database levels
- Unauthorized attempts return 403 Forbidden responses

### UI Enforcement
- Navigation items are conditionally rendered based on roles
- Action buttons are hidden/disabled for unauthorized users
- Routes are protected by middleware authentication checks

## Role Assignment Process

1. **Initial Assignment**: New users receive 'sales' role by default during Google SSO
2. **Role Updates**: Only admins can change user roles through the admin dashboard
3. **Role Persistence**: Roles are preserved during user profile updates

## Best Practices

1. **Principle of Least Privilege**: Assign the minimum role necessary for job function
2. **Regular Audits**: Periodically review user roles and permissions
3. **Role Documentation**: Keep this document updated when roles change
4. **Training**: Ensure users understand their role's capabilities and limitations

## Common Use Cases

### Sales Representative
- Claims vehicles they want to transfer to their store
- Communicates with other stores via comments
- Tracks their pending transfer requests

### Store Manager
- Reviews and approves incoming transfer requests
- Monitors all transfer activity for their store
- Exports reports for analysis

### Transport Coordinator
- Updates transfer status when picking up vehicles
- Marks transfers as delivered upon completion
- Focuses solely on logistics execution

### System Administrator
- Manages user accounts and role assignments
- Monitors system-wide activity
- Handles escalated issues and system configuration

## Future Considerations

### Potential New Roles
- **Regional Manager**: Oversight of multiple stores
- **Finance**: Read-only access for financial reporting
- **Customer Service**: Limited access for customer inquiries

### Permission Enhancements
- Granular permissions per store location
- Time-based permissions (temporary elevated access)
- Custom role creation capabilities

## Security Notes

- Roles are enforced at multiple levels (database, API, UI)
- All role changes are logged for audit purposes
- Regular security reviews should include permission validation
- Consider implementing role-based data encryption for sensitive operations

## Current System Analysis & Recommendations

### Permission Gaps Identified

1. **Inconsistent Permission Enforcement**
   - Direct role checks in code instead of using permission functions
   - Examples: Transfer cancellation, comment deletion

2. **Missing Permission Checks**
   - Vehicle list API allows any authenticated user
   - Activity feeds have no role-based restrictions
   - Comment viewing has no dealership-based filtering

3. **Unused Permission Functions**
   - `canViewActivity`, `canAddComment`, `canEditVehicle`, `canViewVehicle`
   - These are defined but never implemented

### Recommended Improvements

#### 1. **Immediate Actions**
- Replace all direct role checks with permission functions
- Add `canCancelTransfer()` function for transfer cancellation logic
- Implement dealership-based data access controls

#### 2. **New Permission Functions Needed**
```typescript
// Transfer cancellation logic
canCancelTransfer(role: string, userId: string, transfer: Transfer): boolean {
  return role === 'admin' || 
         role === 'manager' || 
         userId === transfer.requested_by_id;
}

// Dealership-based access
canAccessDealershipData(user: User, dealershipId: string): boolean {
  return user.role === 'admin' || 
         user.location_id === dealershipId ||
         (user.role === 'manager' && /* has multi-store access */);
}
```

#### 3. **Consider New Roles**
- **Regional Manager**: Oversee multiple dealerships
- **Viewer/Auditor**: Read-only access for compliance
- **Finance**: Limited access to pricing/financial data

#### 4. **Enhanced Security**
- Add row-level security (RLS) policies in Supabase
- Implement audit logging for all role changes
- Add session-based permission caching

---

*Last Updated: July 2025*
*Version: 1.0*