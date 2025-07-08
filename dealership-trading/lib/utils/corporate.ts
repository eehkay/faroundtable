// Utility functions for corporate user handling

export const CORPORATE_LOCATION_CODE = 'CORP';
export const CORPORATE_DOMAINS = ['delmaradv.com', 'formanautomotive.com'];

/**
 * Check if a location is the corporate headquarters
 */
export function isCorporateLocation(locationCode?: string | null): boolean {
  return locationCode === CORPORATE_LOCATION_CODE;
}

/**
 * Check if a user is a corporate user based on their location
 */
export function isCorporateUser(user: { location?: { code?: string } | null }): boolean {
  return isCorporateLocation(user.location?.code);
}

/**
 * Check if an email domain is a corporate domain
 */
export function isCorporateDomain(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  return CORPORATE_DOMAINS.includes(domain);
}

/**
 * Get display text for corporate users
 */
export function getCorporateDisplayText(): {
  locationName: string;
  locationDescription: string;
} {
  return {
    locationName: 'All Locations',
    locationDescription: 'Corporate - Access to all dealership locations',
  };
}