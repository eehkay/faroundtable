'use client'

import { VehicleDemandData } from '@/types/analytics'
import { Search, TrendingUp, TrendingDown, Calendar, Tag } from 'lucide-react'
import { PieChart } from './charts'

interface DemandIndicatorProps {
  demandData: VehicleDemandData
}

export function DemandIndicator({ demandData }: DemandIndicatorProps) {
  const { 
    monthlySearches, 
    trendDirection, 
    seasonalPeaks, 
    relatedTerms,
    competitorInventory,
    marketVelocity 
  } = demandData

  const getTrendIcon = () => {
    switch (trendDirection) {
      case 'rising':
        return <TrendingUp className="w-5 h-5 text-green-500" />
      case 'declining':
        return <TrendingDown className="w-5 h-5 text-red-500" />
      default:
        return <div className="w-5 h-5 bg-yellow-500 rounded-full" />
    }
  }

  const getTrendColor = () => {
    switch (trendDirection) {
      case 'rising':
        return 'text-green-500'
      case 'declining':
        return 'text-red-500'
      default:
        return 'text-yellow-500'
    }
  }

  const getDemandLevel = () => {
    if (monthlySearches > 10000) return { level: 'Very High', color: 'text-green-500' }
    if (monthlySearches > 5000) return { level: 'High', color: 'text-green-400' }
    if (monthlySearches > 1000) return { level: 'Moderate', color: 'text-yellow-500' }
    if (monthlySearches > 500) return { level: 'Low', color: 'text-orange-500' }
    return { level: 'Very Low', color: 'text-red-500' }
  }

  const demand = getDemandLevel()

  // Prepare pie chart data for market share
  const marketShareData = competitorInventory ? {
    labels: ['Available Inventory', 'Sold in Last 30 Days'],
    datasets: [{
      data: [
        competitorInventory,
        Math.round(competitorInventory * (marketVelocity || 0.3))
      ],
      backgroundColor: ['#3b82f6', '#10b981']
    }]
  } : null

  return (
    <div className="space-y-4">
      {/* Monthly Search Volume */}
      <div className="bg-zinc-900 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-zinc-400">Monthly Search Volume</span>
          <Search className="w-4 h-4 text-zinc-500" />
        </div>
        <p className="text-2xl font-bold text-white">
          {monthlySearches.toLocaleString()}
        </p>
        <div className="flex items-center gap-2 mt-2">
          {getTrendIcon()}
          <span className={`text-sm font-medium ${getTrendColor()}`}>
            {trendDirection.charAt(0).toUpperCase() + trendDirection.slice(1)} trend
          </span>
        </div>
      </div>

      {/* Demand Level Indicator */}
      <div className="bg-zinc-900/50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-400">Demand Level</span>
          <span className={`text-sm font-bold ${demand.color}`}>
            {demand.level}
          </span>
        </div>
        
        {/* Visual Demand Meter */}
        <div className="mt-3 space-y-1">
          {['Very Low', 'Low', 'Moderate', 'High', 'Very High'].map((level, index) => (
            <div key={level} className="flex items-center gap-2">
              <div className="w-16 text-xs text-zinc-500">{level}</div>
              <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${
                    demand.level === level ? 'bg-blue-600' : 
                    ['Very Low', 'Low', 'Moderate', 'High', 'Very High'].indexOf(demand.level) >= index ? 'bg-zinc-700' : ''
                  }`}
                  style={{ width: demand.level === level ? '100%' : '0%' }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Seasonal Peaks */}
      {seasonalPeaks && seasonalPeaks.length > 0 && (
        <div className="bg-zinc-900/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-zinc-500" />
            <span className="text-sm text-zinc-400">Peak Demand Periods</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {seasonalPeaks.map((peak, index) => (
              <span 
                key={index}
                className="px-2 py-1 bg-blue-950/50 text-blue-300 text-xs rounded-md"
              >
                {peak}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Related Search Terms */}
      {relatedTerms && relatedTerms.length > 0 && (
        <div className="bg-zinc-900/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Tag className="w-4 h-4 text-zinc-500" />
            <span className="text-sm text-zinc-400">Popular Search Terms</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {relatedTerms.slice(0, 5).map((term, index) => (
              <span 
                key={index}
                className="px-2 py-1 bg-zinc-800 text-zinc-300 text-xs rounded-md"
              >
                {term}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Market Velocity */}
      {marketVelocity !== undefined && (
        <div className="bg-zinc-900/50 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">Market Velocity</span>
            <span className="text-sm font-medium text-white">
              {(marketVelocity * 100).toFixed(0)}% turnover/month
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            {marketVelocity > 0.4 ? 'Fast-moving market' : 
             marketVelocity > 0.2 ? 'Average market speed' :
             'Slow-moving market'}
          </p>
        </div>
      )}
    </div>
  )
}