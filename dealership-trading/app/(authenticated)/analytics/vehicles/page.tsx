'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { VehicleSearchForm, VehicleSearchParams } from '@/components/analytics/VehicleSearchForm'
import { AnalyticsCard } from '@/components/analytics/AnalyticsCard'
import { VehicleAnalysisResults } from '@/components/analytics/VehicleAnalysisResults'
import { AnalyticsErrorBoundary } from '@/components/analytics/AnalyticsErrorBoundary'
import { AlertCircle } from 'lucide-react'

async function analyzeVehicle(params: VehicleSearchParams) {
  const response = await fetch('/api/analytics/vehicle/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to analyze vehicle')
  }

  return response.json()
}

export default function VehicleAnalyticsPage() {
  const [searchParams, setSearchParams] = useState<VehicleSearchParams | null>(null)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['vehicle-analysis', searchParams],
    queryFn: () => analyzeVehicle(searchParams!),
    enabled: !!searchParams,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1
  })

  const handleSearch = (params: VehicleSearchParams) => {
    setSearchParams(params)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Vehicle Market Analysis</h1>
        <p className="text-[#a3a3a3] mt-2">
          Get detailed market insights for any vehicle by VIN or make/model
        </p>
      </div>

      {/* Search Form */}
      <AnalyticsErrorBoundary>
        <AnalyticsCard 
          title="Search Vehicle" 
          description="Enter VIN or make/model to analyze market conditions"
          className="mb-8"
        >
          <VehicleSearchForm onSearch={handleSearch} isLoading={isLoading} />
        </AnalyticsCard>
      </AnalyticsErrorBoundary>

      {/* Error State */}
      {error && (
          <div className="bg-red-950/20 border border-red-900/50 rounded-lg p-6 mb-8">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-red-200 font-medium mb-1">Analysis Error</h3>
                <p className="text-red-300/80 text-sm">{error.message}</p>
                <button
                  onClick={() => refetch()}
                  className="mt-3 text-sm text-red-400 hover:text-red-300"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}

      {/* Results */}
      {data && !error && (
        <AnalyticsErrorBoundary>
          <VehicleAnalysisResults 
            analysis={data} 
            isLoading={isLoading}
            searchParams={searchParams!}
          />
        </AnalyticsErrorBoundary>
      )}

      {/* Initial State */}
      {!searchParams && !error && (
          <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-[#3b82f6]/10 rounded-full mb-4">
                <svg
                  className="w-6 h-6 text-[#3b82f6]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              
              <h3 className="text-lg font-medium text-white mb-2">
                Start Your Analysis
              </h3>
              
              <p className="text-gray-400 max-w-2xl mx-auto">
                Search for a vehicle by VIN or make/model to get comprehensive market insights 
                including pricing trends, demand metrics, and actionable recommendations.
              </p>
            </div>
          </div>
        )}
    </div>
  )
}