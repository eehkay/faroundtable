import { supabaseAdmin } from '@/lib/supabase-server'

/**
 * DataForSEO Location Configuration
 * 
 * Maps dealership locations to their corresponding DataForSEO location codes
 * for accurate local search volume data.
 */

// Static location code mappings for quick reference
export const DATAFORSEO_LOCATION_CODES = {
  // Las Vegas locations
  LAS_VEGAS: 9057131,
  
  // Reno locations (has two codes that should be used together)
  RENO_PRIMARY: 9058666,
  RENO_SECONDARY: 1022620,
  
  // United States (fallback)
  UNITED_STATES: 2840
} as const

// Dealership-specific mappings
export const DEALERSHIP_LOCATION_MAPPINGS: Record<string, number[]> = {
  'MP18527': [DATAFORSEO_LOCATION_CODES.LAS_VEGAS], // United Kia
  'MP1568': [DATAFORSEO_LOCATION_CODES.LAS_VEGAS], // United Nissan Las Vegas
  'MP22968': [DATAFORSEO_LOCATION_CODES.LAS_VEGAS], // United Toyota Imperial
  'MP23003': [DATAFORSEO_LOCATION_CODES.LAS_VEGAS], // United Kia Imperial
  'MP22171TT': [DATAFORSEO_LOCATION_CODES.RENO_PRIMARY, DATAFORSEO_LOCATION_CODES.RENO_SECONDARY], // United Nissan Reno
}

/**
 * Get DataForSEO location codes for a dealership
 * @param dealershipId - The dealership ID
 * @returns Array of location codes (some locations like Reno have multiple codes)
 */
export async function getLocationCodesForDealership(dealershipId: string): Promise<number[]> {
  try {
    // First, get the dealership details
    const { data: dealership, error } = await supabaseAdmin
      .from('dealership_locations')
      .select('code, dataforseo_location_code')
      .eq('id', dealershipId)
      .single()
    
    if (error || !dealership) {
      console.error('Error fetching dealership:', error)
      return [DATAFORSEO_LOCATION_CODES.UNITED_STATES] // Fallback to US
    }
    
    // Check static mappings first (for multiple location codes)
    if (dealership.code && DEALERSHIP_LOCATION_MAPPINGS[dealership.code]) {
      return DEALERSHIP_LOCATION_MAPPINGS[dealership.code]
    }
    
    // If single location code in database
    if (dealership.dataforseo_location_code) {
      return [dealership.dataforseo_location_code]
    }
    
    // Check the lookup table for multiple codes
    const { data: locationCodes } = await supabaseAdmin
      .from('dealership_location_codes')
      .select('dataforseo_location_code')
      .eq('dealership_location_id', dealershipId)
      .order('is_primary', { ascending: false })
    
    if (locationCodes && locationCodes.length > 0) {
      return locationCodes.map((lc: any) => lc.dataforseo_location_code)
    }
    
    // Fallback to US if no specific location codes found
    return [DATAFORSEO_LOCATION_CODES.UNITED_STATES]
  } catch (error) {
    console.error('Error getting location codes:', error)
    return [DATAFORSEO_LOCATION_CODES.UNITED_STATES]
  }
}

/**
 * Get DataForSEO location codes by dealership code
 * @param dealershipCode - The dealership code (e.g., MP18527)
 * @returns Array of location codes
 */
export function getLocationCodesByDealershipCode(dealershipCode: string): number[] {
  return DEALERSHIP_LOCATION_MAPPINGS[dealershipCode] || [DATAFORSEO_LOCATION_CODES.UNITED_STATES]
}

/**
 * Get location name for display purposes
 * @param locationCode - The DataForSEO location code
 * @returns Human-readable location name
 */
export function getLocationName(locationCode: number): string {
  switch (locationCode) {
    case DATAFORSEO_LOCATION_CODES.LAS_VEGAS:
      return 'Las Vegas, NV'
    case DATAFORSEO_LOCATION_CODES.RENO_PRIMARY:
    case DATAFORSEO_LOCATION_CODES.RENO_SECONDARY:
      return 'Reno, NV'
    case DATAFORSEO_LOCATION_CODES.UNITED_STATES:
      return 'United States'
    default:
      return `Location ${locationCode}`
  }
}

/**
 * Generate location-specific keywords for a vehicle
 * @param baseKeywords - Base keywords (e.g., "Toyota Camry")
 * @param locationName - Location name for local variations
 * @returns Array of location-specific keywords
 */
export function generateLocationKeywords(baseKeywords: string[], locationName: string): string[] {
  const locationKeywords: string[] = []
  
  // Clean up location name (remove state abbreviation for cleaner keywords)
  const cleanLocation = locationName.split(',')[0].trim().toLowerCase()
  
  // Add original keywords first
  baseKeywords.forEach(keyword => {
    locationKeywords.push(keyword)
  })
  
  // Add location-specific variations (limit variations to stay under 20 total)
  baseKeywords.forEach(keyword => {
    // Skip if we're approaching the limit
    if (locationKeywords.length >= 18) return
    
    // Add location variation
    locationKeywords.push(`${keyword} ${cleanLocation}`)
    
    // Add "for sale" variation if there's room
    if (locationKeywords.length < 19 && !keyword.includes('for sale')) {
      locationKeywords.push(`${keyword} for sale`)
    }
  })
  
  // Remove duplicates and ensure we don't exceed 20 keywords
  const uniqueKeywords = [...new Set(locationKeywords)]
  return uniqueKeywords.slice(0, 20)
}