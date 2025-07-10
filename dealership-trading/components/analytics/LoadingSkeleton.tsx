'use client'

interface LoadingSkeletonProps {
  lines?: number
  className?: string
}

export function LoadingSkeleton({ lines = 3, className = '' }: LoadingSkeletonProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="h-4 bg-zinc-800 rounded w-full" />
        </div>
      ))}
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="bg-black/50 border border-zinc-800 rounded-lg p-6 space-y-4">
      <div className="animate-pulse space-y-3">
        <div className="h-4 bg-zinc-800 rounded w-1/3" />
        <div className="h-8 bg-zinc-800 rounded w-1/2" />
        <div className="space-y-2">
          <div className="h-3 bg-zinc-800 rounded w-full" />
          <div className="h-3 bg-zinc-800 rounded w-4/5" />
        </div>
      </div>
    </div>
  )
}

export function ChartSkeleton() {
  return (
    <div className="bg-black/50 border border-zinc-800 rounded-lg p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-zinc-800 rounded w-1/4" />
        <div className="h-64 bg-zinc-800 rounded" />
      </div>
    </div>
  )
}