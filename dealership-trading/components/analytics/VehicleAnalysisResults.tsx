'use client'

import { VehicleAnalysis } from '@/types/analytics'
import { VehicleSearchParams } from './VehicleSearchForm'
import { AnalyticsCard } from './AnalyticsCard'
import { MetricDisplay } from './MetricDisplay'
import { PricingComparison } from './PricingComparison'
import { DemandIndicator } from './DemandIndicator'
import { MarketInsights } from './MarketInsights'
import { BarChart, LineChart } from './charts'
import { RefreshCw, TrendingUp, DollarSign, Activity, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CardSkeleton } from './LoadingSkeleton'

interface VehicleAnalysisResultsProps {
  analysis: VehicleAnalysis
  isLoading?: boolean
  searchParams: VehicleSearchParams
  onRefresh?: () => void
}

export function VehicleAnalysisResults({ 
  analysis, 
  isLoading = false,
  searchParams,
  onRefresh 
}: VehicleAnalysisResultsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    )
  }

  const { vehicle, marketData, demandData, insights, priceHistory, similarVehicles } = analysis

  // Prepare chart data
  const priceHistoryChartData = {
    labels: priceHistory?.map(h => new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })) || [],
    datasets: [{
      label: 'Average Price',
      data: priceHistory?.map(h => h.averagePrice) || [],
      borderColor: '#3b82f6',
      tension: 0.4
    }]
  }

  const inventoryChartData = {
    labels: ['Your Region', 'State Average', 'National Average'],
    datasets: [{
      label: 'Available Inventory',
      data: [
        marketData.inventoryCount,
        marketData.stateInventory || 0,
        marketData.nationalInventory || 0
      ],
      backgroundColor: ['#3b82f6', '#10b981', '#6b7280']
    }]
  }

  return (
    <div className="space-y-6">
      {/* Vehicle Header */}
      <AnalyticsCard 
        title={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
        description={vehicle.vin ? `VIN: ${vehicle.vin}` : `${vehicle.trim || ''}`}
        action={
          onRefresh && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          )
        }
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricDisplay
            label="Opportunity Score"
            value={insights.opportunityScore}
            format="number"
            trend={
              insights.opportunityScore > 70 
                ? { value: insights.opportunityScore - 50, direction: 'up' }
                : insights.opportunityScore < 30
                ? { value: 50 - insights.opportunityScore, direction: 'down' }
                : undefined
            }
          />
          <MetricDisplay
            label="Market Position"
            value={insights.pricePosition === 'below' ? 'Below Market' : insights.pricePosition === 'above' ? 'Above Market' : 'At Market'}
          />
          <MetricDisplay
            label="Demand Level"
            value={insights.demandLevel.charAt(0).toUpperCase() + insights.demandLevel.slice(1)}
          />
          <MetricDisplay
            label="Days on Market"
            value={marketData.daysOnMarket}
            format="number"
          />
        </div>
      </AnalyticsCard>

      {/* Key Insights */}
      <MarketInsights insights={insights} />

      {/* Market Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pricing Analysis */}
        <AnalyticsCard 
          title="Pricing Analysis" 
          description="Current market pricing trends"
        >
          <PricingComparison marketData={marketData} />
        </AnalyticsCard>

        {/* Demand Metrics */}
        <AnalyticsCard 
          title="Demand Metrics" 
          description="Search volume and interest trends"
        >
          <DemandIndicator demandData={demandData} />
        </AnalyticsCard>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Price History */}
        {priceHistory && priceHistory.length > 0 && (
          <AnalyticsCard 
            title="Price Trends" 
            description="Historical pricing over time"
          >
            <LineChart 
              data={priceHistoryChartData}
              height="250px"
              options={{
                plugins: {
                  legend: { display: false }
                },
                scales: {
                  y: {
                    ticks: {
                      callback: function(value) {
                        return new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD',
                          minimumFractionDigits: 0
                        }).format(value as number)
                      }
                    }
                  }
                }
              }}
            />
          </AnalyticsCard>
        )}

        {/* Inventory Comparison */}
        <AnalyticsCard 
          title="Inventory Levels" 
          description="Regional inventory comparison"
        >
          <BarChart 
            data={inventoryChartData}
            height="250px"
            options={{
              plugins: {
                legend: { display: false }
              }
            }}
          />
        </AnalyticsCard>
      </div>

      {/* Similar Vehicles */}
      {similarVehicles && similarVehicles.length > 0 && (
        <AnalyticsCard 
          title="Similar Vehicles in Market" 
          description={`Found ${similarVehicles.length} comparable vehicles within ${searchParams.radius} miles`}
        >
          <div className="space-y-3">
            {similarVehicles.slice(0, 5).map((vehicle, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-zinc-900 rounded-lg">
                <div>
                  <p className="text-white font-medium">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-zinc-400 mt-1">
                    <span>{vehicle.mileage?.toLocaleString()} mi</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {vehicle.distance} mi away
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-white">
                    ${vehicle.price.toLocaleString()}
                  </p>
                  <p className="text-xs text-zinc-400">
                    Listed {vehicle.daysOnMarket} days ago
                  </p>
                </div>
              </div>
            ))}
          </div>
        </AnalyticsCard>
      )}
    </div>
  )
}