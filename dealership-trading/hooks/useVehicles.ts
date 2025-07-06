import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Vehicle } from '@/types/vehicle'

interface VehiclesResponse {
  vehicles: Vehicle[]
  pagination: {
    currentPage: number
    totalPages: number
    totalCount: number
    limit: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

export function useVehicles() {
  const searchParams = useSearchParams()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  
  // Get search params directly - VehicleSearch already handles debouncing
  const search = searchParams.get('search') || ''
  const location = searchParams.get('location') || ''
  const status = searchParams.get('status') || ''
  const minPrice = searchParams.get('minPrice') || ''
  const maxPrice = searchParams.get('maxPrice') || ''
  const minDaysOnLot = searchParams.get('minDaysOnLot') || ''
  const maxDaysOnLot = searchParams.get('maxDaysOnLot') || ''
  const minYear = searchParams.get('minYear') || ''
  const maxYear = searchParams.get('maxYear') || ''
  const minMileage = searchParams.get('minMileage') || ''
  const maxMileage = searchParams.get('maxMileage') || ''
  const make = searchParams.get('make') || ''
  const model = searchParams.get('model') || ''
  const condition = searchParams.get('condition') || ''

  // Reset and fetch when any filter changes
  useEffect(() => {
    let cancelled = false

    const fetchData = async () => {
      if (cancelled) return
      
      setIsLoading(true)
      setError(null)
      setPage(1)
      setVehicles([])

      try {
        const params = new URLSearchParams({
          page: '1',
          limit: '20',
          ...(search && { search }),
          ...(location && { location }),
          ...(status && { status }),
          ...(minPrice && { minPrice }),
          ...(maxPrice && { maxPrice }),
          ...(minDaysOnLot && { minDaysOnLot }),
          ...(maxDaysOnLot && { maxDaysOnLot }),
          ...(minYear && { minYear }),
          ...(maxYear && { maxYear }),
          ...(minMileage && { minMileage }),
          ...(maxMileage && { maxMileage }),
          ...(make && { make }),
          ...(model && { model }),
          ...(condition && { condition }),
        })

        const response = await fetch(`/api/vehicles?${params}`)
        if (!response.ok) {
          throw new Error('Failed to fetch vehicles')
        }

        const data: VehiclesResponse = await response.json()
        
        if (!cancelled) {
          setVehicles(data.vehicles)
          setTotalPages(data.pagination.totalPages)
          setTotalCount(data.pagination.totalCount)
          setHasMore(data.pagination.hasNextPage)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'An error occurred')
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      cancelled = true
    }
  }, [search, location, status, minPrice, maxPrice, minDaysOnLot, maxDaysOnLot, minYear, maxYear, minMileage, maxMileage, make, model, condition])

  const fetchVehicles = useCallback(async (pageNum: number, reset = false) => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '20',
        ...(search && { search }),
        ...(location && { location }),
        ...(status && { status }),
        ...(minPrice && { minPrice }),
        ...(maxPrice && { maxPrice }),
        ...(minDaysOnLot && { minDaysOnLot }),
        ...(maxDaysOnLot && { maxDaysOnLot }),
        ...(minYear && { minYear }),
        ...(maxYear && { maxYear }),
        ...(minMileage && { minMileage }),
        ...(maxMileage && { maxMileage }),
        ...(make && { make }),
        ...(model && { model }),
        ...(condition && { condition }),
      })

      const response = await fetch(`/api/vehicles?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch vehicles')
      }

      const data: VehiclesResponse = await response.json()
      
      setVehicles(prev => reset ? data.vehicles : [...prev, ...data.vehicles])
      setTotalPages(data.pagination.totalPages)
      setTotalCount(data.pagination.totalCount)
      setHasMore(data.pagination.hasNextPage)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [search, location, status, minPrice, maxPrice, minDaysOnLot, maxDaysOnLot, minYear, maxYear, minMileage, maxMileage, make, model, condition])

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchVehicles(nextPage, false)
    }
  }, [page, isLoading, hasMore, fetchVehicles])

  const refreshVehicles = useCallback(() => {
    setPage(1)
    setVehicles([])
    fetchVehicles(1, true)
  }, [fetchVehicles])

  return {
    vehicles,
    isLoading,
    error,
    hasMore,
    totalCount,
    loadMore,
    refreshVehicles
  }
}