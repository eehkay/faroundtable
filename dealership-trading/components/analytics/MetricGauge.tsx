interface MetricGaugeProps {
  value: number
  max?: number
  label: string
  size?: 'sm' | 'md' | 'lg'
  showPercentage?: boolean
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'auto'
}

export default function MetricGauge({ 
  value, 
  max = 100, 
  label, 
  size = 'md',
  showPercentage = true,
  color = 'auto'
}: MetricGaugeProps) {
  const percentage = (value / max) * 100
  
  const getColor = () => {
    if (color !== 'auto') {
      const colorMap = {
        blue: 'stroke-[#3b82f6]',
        green: 'stroke-green-500',
        yellow: 'stroke-yellow-500',
        red: 'stroke-red-500'
      }
      return colorMap[color]
    }
    
    if (percentage >= 80) return 'stroke-green-500'
    if (percentage >= 60) return 'stroke-[#3b82f6]'
    if (percentage >= 40) return 'stroke-yellow-500'
    return 'stroke-red-500'
  }

  const sizeMap = {
    sm: { width: 60, height: 60, strokeWidth: 4, fontSize: 'text-lg' },
    md: { width: 80, height: 80, strokeWidth: 6, fontSize: 'text-2xl' },
    lg: { width: 100, height: 100, strokeWidth: 8, fontSize: 'text-3xl' }
  }

  const { width, height, strokeWidth, fontSize } = sizeMap[size]
  const radius = (width - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width={width} height={height} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={width / 2}
            cy={height / 2}
            r={radius}
            stroke="#2a2a2a"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx={width / 2}
            cy={height / 2}
            r={radius}
            className={`${getColor()} transition-all duration-500`}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-bold text-white ${fontSize}`}>
            {showPercentage ? `${Math.round(percentage)}%` : value}
          </span>
        </div>
      </div>
      <span className="text-xs text-[#a3a3a3] mt-2">{label}</span>
    </div>
  )
}