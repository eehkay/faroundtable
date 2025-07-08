import { TransferWithRelations } from '@/types/supabase'
import { format } from 'date-fns'
import { Check, X, Clock, Truck, Package } from 'lucide-react'

interface TransferTimelineProps {
  transfer: TransferWithRelations
}

interface TimelineItem {
  status: string
  date: string
  user?: any
  icon: React.ComponentType<any>
  color: string
  title: string
  description: string
  reason?: string
}

export default function TransferTimeline({ transfer }: TransferTimelineProps) {
  const timelineItems: TimelineItem[] = []

  // Requested
  timelineItems.push({
    status: 'requested',
    date: transfer.created_at,
    user: transfer.requested_by,
    icon: Clock,
    color: 'bg-yellow-500/20 text-yellow-400',
    title: 'Transfer Requested',
    description: `Requested by ${transfer.requested_by?.name || transfer.requested_by?.email}`
  })

  // Approved or Rejected
  if (transfer.approved_at) {
    timelineItems.push({
      status: 'approved',
      date: transfer.approved_at,
      user: transfer.approved_by,
      icon: Check,
      color: 'bg-blue-500/20 text-blue-400',
      title: 'Transfer Approved',
      description: `Approved by ${transfer.approved_by?.name || transfer.approved_by?.email}`
    })
  }

  if (transfer.rejected_at) {
    timelineItems.push({
      status: 'rejected',
      date: transfer.rejected_at,
      user: transfer.rejected_by,
      icon: X,
      color: 'bg-red-500/20 text-red-400',
      title: 'Transfer Rejected',
      description: `Rejected by ${transfer.rejected_by?.name || transfer.rejected_by?.email}`,
      reason: transfer.rejection_reason || undefined
    })
  }

  // Cancelled
  if (transfer.cancelled_at) {
    timelineItems.push({
      status: 'cancelled',
      date: transfer.cancelled_at,
      user: transfer.cancelled_by,
      icon: X,
      color: 'bg-gray-500/20 text-gray-400',
      title: 'Transfer Cancelled',
      description: `Cancelled by ${transfer.cancelled_by?.name || transfer.cancelled_by?.email}`
    })
  }

  // In Transit
  if (transfer.actual_pickup_date || transfer.status === 'in-transit') {
    timelineItems.push({
      status: 'in-transit',
      date: transfer.actual_pickup_date || transfer.updated_at,
      icon: Truck,
      color: 'bg-purple-500/20 text-purple-400',
      title: 'In Transit',
      description: transfer.actual_pickup_date 
        ? `Vehicle picked up on ${format(new Date(transfer.actual_pickup_date), 'MMM d, yyyy')}`
        : 'Vehicle is in transit'
    })
  }

  // Delivered
  if (transfer.delivered_date) {
    timelineItems.push({
      status: 'delivered',
      date: transfer.delivered_date,
      icon: Package,
      color: 'bg-green-500/20 text-green-400',
      title: 'Delivered',
      description: `Delivered on ${format(new Date(transfer.delivered_date), 'MMM d, yyyy')}`
    })
  }

  // Sort by date
  timelineItems.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  return (
    <div className="relative">
      {timelineItems.map((item, index) => {
        const Icon = item.icon
        const isLast = index === timelineItems.length - 1
        const isCompleted = timelineItems.findIndex(i => i.status === transfer.status) >= index

        return (
          <div key={item.status} className="relative flex items-start">
            {/* Line */}
            {!isLast && (
              <div className={`absolute left-4 top-8 h-full w-0.5 ${
                isCompleted ? 'bg-zinc-600' : 'bg-zinc-800'
              }`} />
            )}

            {/* Icon */}
            <div className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border ${
              item.color
            } ${!isCompleted && 'opacity-50'}`}>
              <Icon className="h-4 w-4" />
            </div>

            {/* Content */}
            <div className="ml-4 pb-8">
              <h3 className={`text-base font-medium ${
                isCompleted ? 'text-white' : 'text-gray-500'
              }`}>
                {item.title}
              </h3>
              <p className="mt-1 text-sm text-gray-400">
                {item.description}
              </p>
              {item.reason && (
                <div className="mt-2 p-3 bg-red-500/10 border border-red-500/30 rounded-md">
                  <p className="text-sm text-red-400">
                    <span className="font-medium">Reason:</span> {item.reason}
                  </p>
                </div>
              )}
              <p className="mt-2 text-xs text-gray-500">
                {format(new Date(item.date), 'MMM d, yyyy h:mm a')}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}