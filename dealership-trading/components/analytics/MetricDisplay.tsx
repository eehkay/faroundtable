'use client'

import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from 'lucide-react'

interface MetricDisplayProps {
  label: string
  value: string | number | undefined | null
  trend?: {
    value: number
    direction: 'up' | 'down' | 'neutral'
  }
  format?: 'number' | 'currency' | 'percentage'
  className?: string
}

export function MetricDisplay({ 
  label, 
  value, 
  trend,
  format = 'number',
  className = '' 
}: MetricDisplayProps) {
  const formatValue = (val: string | number | undefined | null) => {
    if (val === undefined || val === null) return '-'
    if (typeof val === 'string') return val
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(val)
      case 'percentage':
        return `${val}%`
      default:
        return new Intl.NumberFormat('en-US').format(val)
    }
  }

  const getTrendIcon = () => {
    if (!trend) return null
    
    const iconClass = 'w-4 h-4'
    switch (trend.direction) {
      case 'up':
        return <ArrowUpIcon className={`${iconClass} text-green-500`} />
      case 'down':
        return <ArrowDownIcon className={`${iconClass} text-red-500`} />
      default:
        return <MinusIcon className={`${iconClass} text-zinc-500`} />
    }
  }

  const getTrendColor = () => {
    if (!trend) return ''
    
    switch (trend.direction) {
      case 'up':
        return 'text-green-500'
      case 'down':
        return 'text-red-500'
      default:
        return 'text-zinc-500'
    }
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <p className="text-sm font-medium text-zinc-400">{label}</p>
      <div className="flex items-baseline gap-2">
        <p className="text-2xl font-bold text-white">
          {formatValue(value)}
        </p>
        {trend && (
          <div className={`flex items-center gap-1 text-sm ${getTrendColor()}`}>
            {getTrendIcon()}
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>
    </div>
  )
}