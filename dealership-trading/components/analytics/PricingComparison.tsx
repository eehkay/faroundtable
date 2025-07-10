'use client'

import { VehicleMarketData } from '@/types/analytics'
import { DollarSign, TrendingDown, TrendingUp, Minus } from 'lucide-react'

interface PricingComparisonProps {
  marketData: VehicleMarketData
}

export function PricingComparison({ marketData }: PricingComparisonProps) {
  const { averagePrice, priceRange, yourPrice, pricePercentile } = marketData

  const priceDifference = yourPrice ? yourPrice - averagePrice : 0
  const percentDifference = yourPrice ? ((yourPrice - averagePrice) / averagePrice) * 100 : 0

  const getPriceIndicator = () => {
    if (!yourPrice) return null
    
    if (percentDifference < -5) {
      return {
        icon: <TrendingDown className="w-5 h-5 text-green-500" />,
        text: 'Below Market',
        color: 'text-green-500',
        bgColor: 'bg-green-950/20'
      }
    } else if (percentDifference > 5) {
      return {
        icon: <TrendingUp className="w-5 h-5 text-red-500" />,
        text: 'Above Market',
        color: 'text-red-500',
        bgColor: 'bg-red-950/20'
      }
    } else {
      return {
        icon: <Minus className="w-5 h-5 text-yellow-500" />,
        text: 'At Market',
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-950/20'
      }
    }
  }

  const indicator = getPriceIndicator()

  return (
    <div className="space-y-4">
      {/* Market Average */}
      <div className="bg-zinc-900 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-zinc-400">Market Average</span>
          <DollarSign className="w-4 h-4 text-zinc-500" />
        </div>
        <p className="text-2xl font-bold text-white">
          ${averagePrice.toLocaleString()}
        </p>
        <p className="text-xs text-zinc-500 mt-1">
          Based on {marketData.inventoryCount} similar vehicles
        </p>
      </div>

      {/* Your Price Comparison */}
      {yourPrice && indicator && (
        <div className={`rounded-lg p-4 ${indicator.bgColor}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-zinc-400">Your Price</span>
            {indicator.icon}
          </div>
          <p className="text-2xl font-bold text-white">
            ${yourPrice.toLocaleString()}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-sm font-medium ${indicator.color}`}>
              {indicator.text}
            </span>
            <span className="text-sm text-zinc-400">
              {Math.abs(percentDifference).toFixed(1)}% {percentDifference > 0 ? 'higher' : 'lower'}
            </span>
          </div>
        </div>
      )}

      {/* Price Range */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-zinc-400">Price Range</span>
          <span className="text-zinc-300">
            ${priceRange.min.toLocaleString()} - ${priceRange.max.toLocaleString()}
          </span>
        </div>
        
        {/* Visual Price Range */}
        <div className="relative h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div 
            className="absolute h-full bg-gradient-to-r from-blue-600 to-blue-400"
            style={{
              left: '0%',
              width: '100%'
            }}
          />
          {yourPrice && (
            <div 
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full border-2 border-blue-600 -ml-2"
              style={{
                left: `${((yourPrice - priceRange.min) / (priceRange.max - priceRange.min)) * 100}%`
              }}
            />
          )}
        </div>
        
        <div className="flex justify-between text-xs text-zinc-500">
          <span>Lowest</span>
          <span>Highest</span>
        </div>
      </div>

      {/* Price Percentile */}
      {pricePercentile !== undefined && (
        <div className="bg-zinc-900/50 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">Price Percentile</span>
            <span className="text-sm font-medium text-white">
              {pricePercentile}th percentile
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            {pricePercentile > 75 ? 'Premium pricing' : 
             pricePercentile > 50 ? 'Above median pricing' :
             pricePercentile > 25 ? 'Below median pricing' :
             'Competitive pricing'}
          </p>
        </div>
      )}
    </div>
  )
}