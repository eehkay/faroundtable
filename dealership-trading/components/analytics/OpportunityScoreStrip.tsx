import { Info } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface OpportunityScoreStripProps {
  score: number
  breakdown: {
    priceCompetitiveness: number
    inventoryScarcity: number
    regionalDemand: number
    marketTiming: number
  }
  recommendation: string
}

export default function OpportunityScoreStrip({ 
  score, 
  breakdown, 
  recommendation 
}: OpportunityScoreStripProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500'
    if (score >= 60) return 'text-blue-500'
    if (score >= 40) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getProgressColor = (score: number) => {
    if (score >= 80) return 'bg-green-500'
    if (score >= 60) return 'bg-blue-500'
    if (score >= 40) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" | "outline" => {
    if (score >= 80) return 'default'
    if (score >= 60) return 'secondary'
    if (score >= 40) return 'outline'
    return 'destructive'
  }

  const getMetricColor = (value: number) => {
    if (value >= 80) return { bg: 'bg-green-500/20', text: 'text-green-500', border: 'border-green-500/30' }
    if (value >= 60) return { bg: 'bg-blue-500/20', text: 'text-blue-500', border: 'border-blue-500/30' }
    if (value >= 40) return { bg: 'bg-yellow-500/20', text: 'text-yellow-500', border: 'border-yellow-500/30' }
    if (value >= 20) return { bg: 'bg-orange-500/20', text: 'text-orange-500', border: 'border-orange-500/30' }
    return { bg: 'bg-red-500/20', text: 'text-red-500', border: 'border-red-500/30' }
  }

  const metrics = [
    { 
      label: 'Price Position', 
      value: breakdown.priceCompetitiveness, 
      tooltip: 'How competitively your vehicle is priced compared to market predictions (50% is optimal)' 
    },
    { 
      label: 'Inventory Scarcity', 
      value: breakdown.inventoryScarcity, 
      tooltip: 'Market availability of similar vehicles (higher score = lower supply = higher demand)' 
    },
    { 
      label: 'Regional Demand', 
      value: breakdown.regionalDemand, 
      tooltip: 'Local market activity and sales volume for this vehicle type in your area' 
    },
    { 
      label: 'Market Timing', 
      value: breakdown.marketTiming, 
      tooltip: 'How quickly similar vehicles sell in the market (higher score = faster sales)' 
    },
  ]

  return (
    <TooltipProvider delayDuration={0}>
      <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg p-6 transition-all duration-200 ease hover:bg-[#2a2a2a]/50">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Score and Progress */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className={`text-3xl font-bold ${getScoreColor(score)}`}>
                {score}
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-[#a3a3a3] uppercase">Opportunity</span>
                <span className="text-xs text-[#a3a3a3] uppercase">Score</span>
              </div>
            </div>
            
            {/* Progress Bar and Badge */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
              <div className="w-full sm:w-32 h-2 bg-[#141414] rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${getProgressColor(score)}`}
                  style={{ width: `${score}%` }}
                />
              </div>
              
              <Badge variant={getScoreBadgeVariant(score)} className="text-xs whitespace-nowrap">
                {recommendation}
              </Badge>
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 xl:gap-8 w-full lg:w-auto">
            {metrics.map((metric) => {
              const colors = getMetricColor(metric.value)
              return (
                <div key={metric.label} className="relative text-center">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className={`cursor-help rounded-lg p-3 ${colors.bg} ${colors.border} border transition-all duration-200 hover:scale-105`}>
                        <div className={`text-lg font-semibold ${colors.text}`}>{metric.value}%</div>
                        <div className="text-xs text-[#737373] leading-tight mt-1">
                          {metric.label.split(' ').map((word, index) => (
                            <div key={index}>{word}</div>
                          ))}
                        </div>
                        <Info className="h-3 w-3 text-[#737373]/60 absolute top-0 right-0 mt-1 mr-1" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs z-50">
                      <p className="text-xs">{metric.tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}