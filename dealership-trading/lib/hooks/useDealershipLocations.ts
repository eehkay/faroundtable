import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'

interface DealershipLocation {
  id: string
  name: string
  code: string
  address?: string
  city?: string
  state?: string
  zip?: string
  latitude?: number
  longitude?: number
  city_state?: string
}

export function useDealershipLocations() {
  const [locations, setLocations] = useState<DealershipLocation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchLocations() {
      try {
        const { data, error } = await supabase
          .from('dealership_locations')
          .select('id, name, code, address, city, state, zip, latitude, longitude, city_state')
          .eq('active', true)
          .order('name')

        if (error) throw error
        setLocations(data || [])
      } catch (err) {
        setError(err as Error)
        console.error('Error fetching locations:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchLocations()
  }, [])

  return { locations, isLoading, error }
}