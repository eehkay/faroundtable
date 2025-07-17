'use client'

import { ReactNode } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface AnalyticsCardProps {
  title: string
  description?: string
  children: ReactNode
  className?: string
  action?: ReactNode
}

export function AnalyticsCard({ 
  title, 
  description, 
  children, 
  className = '',
  action
}: AnalyticsCardProps) {
  return (
    <Card className={`bg-black/50 border-zinc-800 ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="space-y-1">
          <CardTitle className="text-xl font-semibold text-white">
            {title}
          </CardTitle>
          {description && (
            <CardDescription className="text-sm text-zinc-400">
              {description}
            </CardDescription>
          )}
        </div>
        {action && (
          <div className="flex items-center">
            {action}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  )
}