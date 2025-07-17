import { MapPin, Calendar, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface CompetitorCardProps {
  distance: number
  price: number
  dealer: string
  daysOnMarket: number
  vdpUrl?: string
  currentPrice: number
  rank: number
}

export default function CompetitorCard({
  distance,
  price,
  dealer,
  daysOnMarket,
  vdpUrl,
  currentPrice,
  rank
}: CompetitorCardProps) {
  const priceDiff = (price || 0) - (currentPrice || 0)
  const priceDiffPercent = currentPrice ? (priceDiff / currentPrice) * 100 : 0
  
  const getRankColor = (rank: number) => {
    if (rank === 1) return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
    if (rank === 2) return 'bg-gray-400/10 text-gray-400 border-gray-400/20'
    if (rank === 3) return 'bg-orange-600/10 text-orange-600 border-orange-600/20'
    return 'bg-[#2a2a2a] text-[#a3a3a3] border-[#2a2a2a]'
  }

  return (
    <div className="bg-[#141414] border border-[#2a2a2a] rounded-lg p-4 hover:bg-[#1f1f1f] transition-all duration-200">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border ${getRankColor(rank)}`}>
            {rank}
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-medium text-white line-clamp-1">{dealer}</h4>
            <div className="flex items-center gap-2 text-xs text-[#737373]">
              <MapPin className="h-3 w-3" />
              <span>{distance} miles</span>
            </div>
          </div>
        </div>
        {vdpUrl && (
          <a
            href={vdpUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 hover:bg-[#2a2a2a] rounded transition-colors"
            title="View listing"
          >
            <ExternalLink className="h-4 w-4 text-[#3b82f6]" />
          </a>
        )}
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-lg sm:text-xl font-semibold text-white">
            ${price?.toLocaleString() || 'N/A'}
          </span>
          <Badge 
            variant={priceDiff > 0 ? 'destructive' : 'default'} 
            className="text-xs whitespace-nowrap"
          >
            {priceDiff > 0 ? '+' : ''}{priceDiffPercent.toFixed(1)}%
          </Badge>
        </div>
        
        <div className="flex items-center gap-1 text-xs text-[#737373]">
          <Calendar className="h-3 w-3" />
          <span>{daysOnMarket} days on market</span>
        </div>
      </div>
    </div>
  )
}