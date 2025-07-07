// Permission helper functions
export function canClaimVehicle(role: string): boolean {
  return ['sales', 'manager', 'admin'].includes(role)
}

export function canApproveTransfer(role: string): boolean {
  return ['manager', 'admin'].includes(role)
}

export function canUpdateTransferStatus(role: string): boolean {
  return ['manager', 'admin', 'transport'].includes(role)
}

// Check if user can mark a transfer as delivered
export function canMarkTransferAsDelivered(
  role: string,
  userLocationId: string | null,
  transferToLocationId: string
): boolean {
  // Admins can always mark as delivered
  if (role === 'admin') return true
  
  // Transport users can always mark as delivered
  if (role === 'transport') return true
  
  // Managers can only mark as delivered if they are at the destination location
  if (role === 'manager' && userLocationId) {
    return userLocationId === transferToLocationId
  }
  
  return false
}

export function canDeleteComment(role: string, isAuthor: boolean): boolean {
  return role === 'admin' || (isAuthor && ['manager', 'sales'].includes(role))
}

export function canEditComment(role: string, isAuthor: boolean): boolean {
  return isAuthor
}

export function canManageUsers(role: string): boolean {
  return role === 'admin'
}

export function canViewAllTransfers(role: string): boolean {
  return ['manager', 'admin'].includes(role)
}

export function canExportData(role: string): boolean {
  return ['manager', 'admin'].includes(role)
}

export function isAdmin(role: string): boolean {
  return role === 'admin'
}

export function isManager(role: string): boolean {
  return role === 'manager'
}

export function canApproveTransfers(role: string): boolean {
  return ['manager', 'admin'].includes(role)
}

export function canViewTransfers(role: string): boolean {
  return ['sales', 'manager', 'admin', 'transport'].includes(role)
}

export function canManageDealerships(role: string): boolean {
  return role === 'admin'
}

// Dealer-specific transfer approval permissions
export function canApproveTransferForLocation(
  role: string, 
  userLocationId: string | null, 
  vehicleFromLocationId: string
): boolean {
  // Admins can approve any transfer
  if (role === 'admin') return true
  
  // Transport users can approve any transfer
  if (role === 'transport') return true
  
  // Managers can only approve transfers for vehicles FROM their own dealership
  if (role === 'manager' && userLocationId) {
    return userLocationId === vehicleFromLocationId
  }
  
  return false
}

export function canRejectTransferForLocation(
  role: string, 
  userLocationId: string | null, 
  vehicleFromLocationId: string
): boolean {
  // Same logic as approval - only the owning dealership (or admin/transport) can reject
  return canApproveTransferForLocation(role, userLocationId, vehicleFromLocationId)
}

// Check if user can access admin features while impersonating
export function canAccessAdminWhileImpersonating(): boolean {
  // Prevent access to sensitive admin features while impersonating
  return false
}

// Check if user can impersonate other users
export function canImpersonate(userRole: string): boolean {
  return userRole === 'admin'
}

// Check if user can be impersonated
export function canBeImpersonated(targetRole: string): boolean {
  // Cannot impersonate other admins for security
  return targetRole !== 'admin'
}