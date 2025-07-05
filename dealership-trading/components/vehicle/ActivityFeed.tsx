"use client"

import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/lib/supabase-client';
import type { Activity } from '@/types/transfer';
import type { User } from '@/types/user';

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
        
        const { data, error: fetchError } = await supabase
          .from('activities')
          .select(`
            *,
            user:user_id(
              id,
              name,
              email,
              image
            )
          `)
          .eq('vehicle_id', vehicleId)
          .order('created_at', { ascending: false })
          .limit(20);

        if (fetchError) {
          throw fetchError;
        }

        // Transform data to match existing Activity type
        const transformedData: Activity[] = data?.map(activity => ({
          _id: activity.id,
          _type: 'activity' as const,
          vehicle: { _ref: vehicleId },
          action: activity.action,
          details: activity.details,
          metadata: activity.metadata,
          createdAt: activity.created_at,
          user: activity.user ? {
            _id: activity.user.id,
            _type: 'user' as const,
            name: activity.user.name,
            email: activity.user.email,
            image: activity.user.image,
            domain: activity.user.email.split('@')[1],
            role: 'sales' as const,
            lastLogin: new Date().toISOString(),
            active: true
          } : { _ref: activity.user_id }
        })) || [];

        console.log('Fetched activities for vehicle:', vehicleId, transformedData);
        setActivities(transformedData);
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
      .channel(`activities-${vehicleId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activities',
          filter: `vehicle_id=eq.${vehicleId}`
        },
        () => {
          console.log('Activity real-time update received');
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
    const userName = activity.user && 'name' in activity.user ? activity.user.name : 'Someone';
    
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

  if (error) {
    return (
      <div className="bg-[#1f1f1f] border border-red-800/50 rounded-lg p-4">
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
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