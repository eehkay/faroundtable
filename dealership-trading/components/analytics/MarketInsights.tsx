'use client'

import { VehicleInsights } from '@/types/analytics'
import { AnalyticsCard } from './AnalyticsCard'
import { TrendingUp, AlertCircle, CheckCircle, Info } from 'lucide-react'

interface MarketInsightsProps {
  insights: VehicleInsights
}

export function MarketInsights({ insights }: MarketInsightsProps) {
  const getInsightIcon = (type: string) => {
    if (type.includes('opportunity') || type.includes('strong')) {
      return <CheckCircle className="w-5 h-5 text-green-500" />
    } else if (type.includes('warning') || type.includes('concern')) {
      return <AlertCircle className="w-5 h-5 text-yellow-500" />
    } else if (type.includes('trend') || type.includes('growth')) {
      return <TrendingUp className="w-5 h-5 text-blue-500" />
    }
    return <Info className="w-5 h-5 text-zinc-400" />
  }

  const getInsightBgColor = (type: string) => {
    if (type.includes('opportunity') || type.includes('strong')) {
      return 'bg-green-950/20 border-green-900/50'
    } else if (type.includes('warning') || type.includes('concern')) {
      return 'bg-yellow-950/20 border-yellow-900/50'
    } else if (type.includes('trend') || type.includes('growth')) {
      return 'bg-blue-950/20 border-blue-900/50'
    }
    return 'bg-zinc-950/20 border-zinc-800'
  }

  return (
    <AnalyticsCard 
      title="Key Market Insights" 
      description="AI-powered recommendations based on current market conditions"
    >
      <div className="space-y-3">
        {insights.recommendations.map((recommendation, index) => {
          const insightType = recommendation.toLowerCase()
          return (
            <div 
              key={index} 
              className={`p-4 rounded-lg border ${getInsightBgColor(insightType)}`}
            >
              <div className="flex items-start gap-3">
                {getInsightIcon(insightType)}
                <p className="text-sm text-zinc-200 leading-relaxed flex-1">
                  {recommendation}
                </p>
              </div>
            </div>
          )
        })}

        {/* Quick Stats Summary */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-zinc-800">
          <div className="text-center">
            <div className={`text-2xl font-bold ${
              insights.opportunityScore >= 70 ? 'text-green-500' : 
              insights.opportunityScore >= 40 ? 'text-yellow-500' : 
              'text-red-500'
            }`}>
              {insights.opportunityScore}%
            </div>
            <p className="text-xs text-zinc-400 mt-1">Opportunity Score</p>
          </div>
          
          <div className="text-center">
            <div className={`text-2xl font-bold ${
              insights.pricePosition === 'below' ? 'text-green-500' :
              insights.pricePosition === 'above' ? 'text-red-500' :
              'text-yellow-500'
            }`}>
              {insights.pricePosition === 'below' ? '↓' : 
               insights.pricePosition === 'above' ? '↑' : '→'}
            </div>
            <p className="text-xs text-zinc-400 mt-1">Price Position</p>
          </div>
          
          <div className="text-center">
            <div className={`text-2xl font-bold ${
              insights.demandLevel === 'high' ? 'text-green-500' :
              insights.demandLevel === 'medium' ? 'text-yellow-500' :
              'text-red-500'
            }`}>
              {insights.demandLevel.toUpperCase()}
            </div>
            <p className="text-xs text-zinc-400 mt-1">Demand Level</p>
          </div>
        </div>
      </div>
    </AnalyticsCard>
  )
}