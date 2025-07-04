"use client"

import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { client } from '@/lib/sanity';
import { vehicleActivityQuery } from '@/lib/queries';
import type { Activity } from '@/types/transfer';

interface ActivityFeedProps {
  vehicleId: string;
}

export default function ActivityFeed({ vehicleId }: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const data = await client.fetch(vehicleActivityQuery, { vehicleId });
        setActivities(data);
      } catch (error) {
        console.error('Failed to fetch activities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
    
    // Subscribe to real-time updates
    const subscription = client
      .listen(`*[_type == "activity" && vehicle._ref == $vehicleId]`, { vehicleId })
      .subscribe((update) => {
        if (update.transition === 'appear') {
          fetchActivities();
        }
      });

    return () => subscription.unsubscribe();
  }, [vehicleId]);

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'claimed': return '🚚';
      case 'released': return '↩️';
      case 'commented': return '💬';
      case 'status-updated': return '📝';
      case 'transfer-started': return '🚗';
      case 'transfer-completed': return '✅';
      default: return '📌';
    }
  };

  const getActivityDescription = (activity: Activity) => {
    const userName = activity.user?.name || 'Someone';
    
    switch (activity.action) {
      case 'claimed':
        return `${userName} claimed this vehicle for transfer`;
      case 'released':
        return `${userName} released the transfer claim`;
      case 'commented':
        return `${userName} added a comment`;
      case 'status-updated':
        return `${userName} updated the status`;
      case 'transfer-started':
        return `${userName} started the transfer`;
      case 'transfer-completed':
        return `${userName} completed the transfer`;
      default:
        return activity.details || 'Activity recorded';
    }
  };

  if (loading) {
    return <div className="animate-pulse bg-[#2a2a2a] h-32 rounded"></div>;
  }

  return (
    <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg p-4 transition-all duration-200">
      <h3 className="font-semibold mb-4 text-white">Activity Feed</h3>
      
      {activities.length === 0 ? (
        <p className="text-gray-400 text-sm">No activity yet</p>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => (
            <div key={activity._id} className="flex gap-3 pb-3 last:pb-0 border-b border-[#2a2a2a]/30 last:border-b-0">
              <div className="text-2xl">{getActivityIcon(activity.action)}</div>
              <div className="flex-1">
                <p className="text-sm text-gray-100">
                  {getActivityDescription(activity)}
                </p>
                <p className="text-xs text-gray-400">
                  {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}