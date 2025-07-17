import { TrendingUp, TrendingDown, Clock, Target, DollarSign } from 'lucide-react'

interface SummaryDashboardStripProps {
  currentPrice: number
  marketPrice: number
  daysOnMarket: number
  demandLevel: 'high' | 'medium' | 'low'
}

export default function SummaryDashboardStrip({ 
  currentPrice, 
  marketPrice, 
  daysOnMarket,
  demandLevel
}: SummaryDashboardStripProps) {
  const priceDiff = ((currentPrice - marketPrice) / marketPrice) * 100
  const isPriceHigh = priceDiff > 5
  const isPriceLow = priceDiff < -5
  
  const getDemandColor = (level: string) => {
    switch(level) {
      case 'high': return 'text-green-500'
      case 'medium': return 'text-yellow-500'
      case 'low': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  const getDemandBg = (level: string) => {
    switch(level) {
      case 'high': return 'bg-green-500/10'
      case 'medium': return 'bg-yellow-500/10'
      case 'low': return 'bg-red-500/10'
      default: return 'bg-gray-500/10'
    }
  }

  return (
    <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg p-4 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-4 lg:gap-6 xl:gap-8">
          {/* Price Comparison */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-[#3b82f6] flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-xs text-[#737373] uppercase">Current vs Market</div>
                <div className="flex items-baseline gap-1 sm:gap-2 flex-wrap">
                  <span className="text-base sm:text-lg font-semibold text-white">
                    ${currentPrice.toLocaleString()}
                  </span>
                  <span className="text-xs sm:text-sm text-[#737373]">vs</span>
                  <span className="text-base sm:text-lg text-[#a3a3a3]">
                    ${marketPrice.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-md whitespace-nowrap ${
              isPriceHigh ? 'bg-red-500/10' : isPriceLow ? 'bg-green-500/10' : 'bg-gray-500/10'
            }`}>
              {isPriceHigh ? (
                <TrendingUp className="h-3 sm:h-4 w-3 sm:w-4 text-red-500" />
              ) : isPriceLow ? (
                <TrendingDown className="h-3 sm:h-4 w-3 sm:w-4 text-green-500" />
              ) : null}
              <span className={`text-xs sm:text-sm font-medium ${
                isPriceHigh ? 'text-red-500' : isPriceLow ? 'text-green-500' : 'text-gray-500'
              }`}>
                {priceDiff > 0 ? '+' : ''}{priceDiff.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Days on Market and Demand Level - Grid on mobile */}
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-4 lg:gap-6 xl:gap-8 w-full sm:w-auto">
            {/* Days on Market */}
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-[#3b82f6] flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-xs text-[#737373] uppercase truncate">Days on Market</div>
                <div className="text-base sm:text-lg font-semibold text-white">{daysOnMarket}</div>
              </div>
            </div>

            {/* Demand Level */}
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-[#3b82f6] flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-xs text-[#737373] uppercase truncate">Demand Level</div>
                <div className={`text-base sm:text-lg font-semibold capitalize ${getDemandColor(demandLevel)}`}>
                  {demandLevel}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}