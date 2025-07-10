import { LucideIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface ActionCardProps {
  icon: LucideIcon
  title: string
  description: string
  impact?: 'high' | 'medium' | 'low'
  priority?: number
}

export default function ActionCard({
  icon: Icon,
  title,
  description,
  impact,
  priority
}: ActionCardProps) {
  const getImpactColor = (impact?: string) => {
    switch(impact) {
      case 'high': return 'bg-green-500/10 text-green-500 border-green-500/20'
      case 'medium': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
      case 'low': return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
    }
  }

  return (
    <div className="bg-[#141414] border border-[#2a2a2a] rounded-lg p-4 hover:bg-[#1f1f1f] transition-all duration-200 flex flex-col h-full">
      <div className="flex items-start gap-3 mb-3">
        <div className="p-2 bg-[#3b82f6]/10 rounded-lg">
          <Icon className="h-5 w-5 text-[#3b82f6]" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-medium text-white">{title}</h4>
          {priority && (
            <span className="text-xs text-[#737373]">Priority {priority}</span>
          )}
        </div>
      </div>
      
      <p className="text-sm text-[#a3a3a3] flex-1 mb-3">{description}</p>
      
      {impact && (
        <div className="flex justify-start">
          <Badge variant="outline" className={`text-xs ${getImpactColor(impact)}`}>
            {impact} impact
          </Badge>
        </div>
      )}
    </div>
  )
}