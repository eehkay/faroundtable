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

  const fetchVehicles = useCallback(async (pageNum: number, reset = false) => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '20',
        ...(searchParams.get('search') && { search: searchParams.get('search')! }),
        ...(searchParams.get('location') && { location: searchParams.get('location')! }),
        ...(searchParams.get('status') && { status: searchParams.get('status')! }),
        ...(searchParams.get('minPrice') && { minPrice: searchParams.get('minPrice')! }),
        ...(searchParams.get('maxPrice') && { maxPrice: searchParams.get('maxPrice')! }),
        ...(searchParams.get('minAge') && { minAge: searchParams.get('minAge')! }),
        ...(searchParams.get('maxAge') && { maxAge: searchParams.get('maxAge')! }),
        ...(searchParams.get('minYear') && { minYear: searchParams.get('minYear')! }),
        ...(searchParams.get('maxYear') && { maxYear: searchParams.get('maxYear')! }),
        ...(searchParams.get('minMileage') && { minMileage: searchParams.get('minMileage')! }),
        ...(searchParams.get('maxMileage') && { maxMileage: searchParams.get('maxMileage')! }),
        ...(searchParams.get('make') && { make: searchParams.get('make')! }),
        ...(searchParams.get('model') && { model: searchParams.get('model')! }),
        ...(searchParams.get('condition') && { condition: searchParams.get('condition')! }),
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
  }, [searchParams])

  // Reset and fetch when search params change
  useEffect(() => {
    setPage(1)
    setVehicles([])
    fetchVehicles(1, true)
  }, [searchParams])

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchVehicles(nextPage)
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