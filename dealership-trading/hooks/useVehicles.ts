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

  const fetchVehicles = useCallback(async (pageNum: number, reset = false, currentSearchParams: URLSearchParams) => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '20',
        ...(currentSearchParams.get('search') && { search: currentSearchParams.get('search')! }),
        ...(currentSearchParams.get('location') && { location: currentSearchParams.get('location')! }),
        ...(currentSearchParams.get('status') && { status: currentSearchParams.get('status')! }),
        ...(currentSearchParams.get('minPrice') && { minPrice: currentSearchParams.get('minPrice')! }),
        ...(currentSearchParams.get('maxPrice') && { maxPrice: currentSearchParams.get('maxPrice')! }),
        ...(currentSearchParams.get('minDaysOnLot') && { minDaysOnLot: currentSearchParams.get('minDaysOnLot')! }),
        ...(currentSearchParams.get('maxDaysOnLot') && { maxDaysOnLot: currentSearchParams.get('maxDaysOnLot')! }),
        ...(currentSearchParams.get('minYear') && { minYear: currentSearchParams.get('minYear')! }),
        ...(currentSearchParams.get('maxYear') && { maxYear: currentSearchParams.get('maxYear')! }),
        ...(currentSearchParams.get('minMileage') && { minMileage: currentSearchParams.get('minMileage')! }),
        ...(currentSearchParams.get('maxMileage') && { maxMileage: currentSearchParams.get('maxMileage')! }),
        ...(currentSearchParams.get('make') && { make: currentSearchParams.get('make')! }),
        ...(currentSearchParams.get('model') && { model: currentSearchParams.get('model')! }),
        ...(currentSearchParams.get('condition') && { condition: currentSearchParams.get('condition')! }),
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
  }, [])

  // Reset and fetch when search params change
  useEffect(() => {
    setPage(1)
    setVehicles([])
    fetchVehicles(1, true, searchParams)
  }, [searchParams, fetchVehicles])

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchVehicles(nextPage, false, searchParams)
    }
  }, [page, isLoading, hasMore, fetchVehicles, searchParams])

  const refreshVehicles = useCallback(() => {
    setPage(1)
    setVehicles([])
    fetchVehicles(1, true, searchParams)
  }, [fetchVehicles, searchParams])

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