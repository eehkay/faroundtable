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