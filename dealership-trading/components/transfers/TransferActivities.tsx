import { ActivityWithRelations } from '@/types/supabase'
import { format } from 'date-fns'
import { MessageSquare, UserCheck, UserX, TruckIcon, CheckCircle, XCircle, Activity } from 'lucide-react'

interface TransferActivitiesProps {
  activities: ActivityWithRelations[]
}

export default function TransferActivities({ activities }: TransferActivitiesProps) {
  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'commented': return MessageSquare
      case 'claimed': return UserCheck
      case 'released': return UserX
      case 'transfer-started': return TruckIcon
      case 'transfer-completed': return CheckCircle
      case 'transfer-approved': return CheckCircle
      case 'transfer-rejected': return XCircle
      case 'transfer-cancelled': return XCircle
      default: return Activity
    }
  }

  const getActivityColor = (action: string) => {
    switch (action) {
      case 'transfer-approved': return 'text-blue-400'
      case 'transfer-completed': return 'text-green-400'
      case 'transfer-rejected': return 'text-red-400'
      case 'transfer-cancelled': return 'text-gray-400'
      case 'claimed': return 'text-yellow-400'
      default: return 'text-gray-400'
    }
  }

  const formatAction = (action: string) => {
    return action.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        No activities yet
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => {
        const Icon = getActivityIcon(activity.action)
        const color = getActivityColor(activity.action)

        return (
          <div key={activity.id} className="flex items-start space-x-3">
            <div className={`mt-1 ${color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-white">
                  {activity.user?.name || activity.user?.email}
                </span>
                <span className="text-gray-400">
                  {formatAction(activity.action)}
                </span>
              </div>
              {activity.details && (
                <p className="mt-1 text-sm text-gray-400">{activity.details}</p>
              )}
              {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                <div className="mt-1 text-sm text-gray-500">
                  {activity.metadata.fromStatus && activity.metadata.toStatus && (
                    <span>
                      Status: {activity.metadata.fromStatus} → {activity.metadata.toStatus}
                    </span>
                  )}
                  {activity.metadata.fromStore && activity.metadata.toStore && (
                    <span className="ml-2">
                      Route: {activity.metadata.fromStore} → {activity.metadata.toStore}
                    </span>
                  )}
                </div>
              )}
              <time className="text-xs text-gray-500">
                {format(new Date(activity.created_at), 'MMM d, yyyy h:mm a')}
              </time>
            </div>
          </div>
        )
      })}
    </div>
  )
}