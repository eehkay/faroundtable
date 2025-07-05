"use client"

import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/lib/supabase-client';
import { getVehicleActivity } from '@/lib/queries-supabase-client';
import type { Activity } from '@/types/transfer';

interface ActivityFeedProps {
  vehicleId: string;
}

export default function ActivityFeed({ vehicleId }: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setError(null);
        const data = await getVehicleActivity(vehicleId);
        console.log('Fetched activities for vehicle:', vehicleId, data);
        setActivities(data || []);
      } catch (error) {
        console.error('Failed to fetch activities:', error);
        setError('Failed to load activity feed. Please check your connection.');
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel(`activities:${vehicleId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activities',
          filter: `vehicle_id=eq.${vehicleId}`
        },
        (payload) => {
          console.log('Activity real-time update:', payload);
          fetchActivities();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [vehicleId]);

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'claimed':
        return '🔐';
      case 'released':
        return '🔓';
      case 'commented':
        return '💬';
      case 'status-updated':
        return '📋';
      case 'transfer-started':
        return '🚚';
      case 'transfer-completed':
        return '✅';
      case 'transfer-approved':
        return '✔️';
      case 'transfer-rejected':
        return '❌';
      case 'transfer-cancelled':
        return '🚫';
      default:
        return '📌';
    }
  };

  const getActivityMessage = (activity: Activity) => {
    switch (activity.action) {
      case 'claimed':
        return `claimed this vehicle`;
      case 'released':
        return `released this vehicle`;
      case 'commented':
        return `added a comment`;
      case 'status-updated':
        return `updated the status to ${activity.metadata?.newStatus || 'unknown'}`;
      case 'transfer-started':
        return `started a transfer request`;
      case 'transfer-completed':
        return `completed the transfer`;
      case 'transfer-approved':
        return `approved the transfer request`;
      case 'transfer-rejected':
        return `rejected the transfer request`;
      case 'transfer-cancelled':
        return `cancelled the transfer request`;
      default:
        return activity.details || 'performed an action';
    }
  };

  if (loading) {
    return (
      <div className="bg-[#1f1f1f] rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Activity Feed</h3>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gray-700 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-700 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-700 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#1f1f1f] rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Activity Feed</h3>
        <div className="text-red-400 text-sm">{error}</div>
      </div>
    );
  }

  return (
    <div className="bg-[#1f1f1f] rounded-lg shadow-sm p-6 transition-all duration-200">
      <h3 className="text-lg font-semibold text-white mb-4">Activity Feed</h3>
      
      {activities.length === 0 ? (
        <p className="text-gray-400 text-sm">No activity yet</p>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity._id} className="flex items-start gap-3">
              <div className="flex-shrink-0 text-2xl">
                {getActivityIcon(activity.action)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-300">
                  <span className="font-medium text-white">
                    {activity.user?.name || 'Unknown user'}
                  </span>{' '}
                  {getActivityMessage(activity)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
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