"use client"

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/lib/supabase-client";
import { Activity, Car, MessageSquare, TruckIcon, CheckCircle, XCircle } from "lucide-react";
import type { DealershipLocation } from "@/types/vehicle";

interface ActivityItem {
  _id: string;
  action: string;
  details?: string;
  createdAt: string;
  vehicle: {
    _id: string;
    title: string;
    stockNumber: string;
  } | null;
  user: {
    _id: string;
    name: string;
    email: string;
    image?: string;
  } | null;
}

interface RecentActivityProps {
  initialActivity: ActivityItem[];
  userLocation?: DealershipLocation;
}

export default function RecentActivity({ initialActivity, userLocation }: RecentActivityProps) {
  const [activities, setActivities] = useState<ActivityItem[]>(initialActivity);
  const [filterByLocation, setFilterByLocation] = useState(false);

  useEffect(() => {
    const fetchActivities = async () => {
      let query = supabase
        .from('activities')
        .select(`
          id,
          action,
          details,
          created_at,
          vehicle:vehicle_id(
            id,
            title,
            stock_number,
            make,
            model,
            year,
            location_id,
            original_location_id
          ),
          user:user_id(
            id,
            name,
            email,
            image_url
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      // Apply location filter if needed
      if (filterByLocation && userLocation) {
        // This would need a more complex query to filter by vehicle location
        // For now, we'll filter client-side after fetching
      }

      const { data, error } = await query;

      if (!error && data) {
        let filteredData = data;
        
        // Client-side filtering for location
        if (filterByLocation && userLocation) {
          filteredData = data.filter(activity => {
            const vehicle = activity.vehicle as any;
            return vehicle && 
              (vehicle.location_id === userLocation._id || 
               vehicle.original_location_id === userLocation._id);
          });
        }

        const formattedActivities: ActivityItem[] = filteredData.map(activity => {
          const vehicle = activity.vehicle as any;
          const user = activity.user as any;
          
          return {
            _id: activity.id,
            action: activity.action,
            details: activity.details,
            createdAt: activity.created_at,
            vehicle: vehicle ? {
              _id: vehicle.id,
              title: vehicle.title || 
                     (vehicle.year && vehicle.make && vehicle.model 
                       ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`.trim()
                       : `Stock #${vehicle.stock_number || 'Unknown'}`),
              stockNumber: vehicle.stock_number
            } : null,
            user: user ? {
              _id: user.id,
              name: user.name,
              email: user.email,
              image: user.image_url
            } : null
          };
        });

        setActivities(formattedActivities);
      }
    };

    // Initial fetch when filter changes
    fetchActivities();

    // Set up real-time subscription
    const channel = supabase
      .channel('activity-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activities'
        },
        async (payload) => {
          // Fetch the complete activity with joins
          const { data: newActivity } = await supabase
            .from('activities')
            .select(`
              id,
              action,
              details,
              created_at,
              vehicle:vehicle_id(
                id,
                title,
                stock_number,
                make,
                model,
                year,
                location_id,
                original_location_id
              ),
              user:user_id(
                id,
                name,
                email,
                image_url
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (newActivity) {
            // Check if activity should be shown based on filter
            const vehicle = newActivity.vehicle as any;
            const shouldShow = !filterByLocation || !userLocation || 
              (vehicle && 
               (vehicle.location_id === userLocation._id || 
                vehicle.original_location_id === userLocation._id));

            if (shouldShow) {
              const activityVehicle = newActivity.vehicle as any;
              const activityUser = newActivity.user as any;
              
              const formattedActivity: ActivityItem = {
                _id: newActivity.id,
                action: newActivity.action,
                details: newActivity.details,
                createdAt: newActivity.created_at,
                vehicle: activityVehicle ? {
                  _id: activityVehicle.id,
                  title: activityVehicle.title || 
                         (activityVehicle.year && activityVehicle.make && activityVehicle.model 
                           ? `${activityVehicle.year} ${activityVehicle.make} ${activityVehicle.model}`.trim()
                           : `Stock #${activityVehicle.stock_number || 'Unknown'}`),
                  stockNumber: activityVehicle.stock_number
                } : null,
                user: activityUser ? {
                  _id: activityUser.id,
                  name: activityUser.name,
                  email: activityUser.email,
                  image: activityUser.image_url
                } : null
              };

              // Add to beginning of list and limit to 10 items
              setActivities(prev => [formattedActivity, ...prev.slice(0, 9)]);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filterByLocation, userLocation]);

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'claimed':
        return <TruckIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
      case 'released':
        return <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />;
      case 'commented':
        return <MessageSquare className="h-5 w-5 text-gray-600 dark:text-gray-400" />;
      case 'status-updated':
        return <Activity className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />;
      case 'transfer-started':
        return <Car className="h-5 w-5 text-green-600 dark:text-green-400" />;
      case 'transfer-completed':
        return <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />;
      default:
        return <Activity className="h-5 w-5 text-gray-600 dark:text-gray-400" />;
    }
  };

  const getActivityDescription = (activity: ActivityItem) => {
    const userName = activity.user?.name || 'Someone';
    const vehicleTitle = activity.vehicle?.title || `Stock #${activity.vehicle?.stockNumber || 'Unknown'}`;
    
    switch (activity.action) {
      case 'claimed':
        return `${userName} claimed ${vehicleTitle}`;
      case 'released':
        return `${userName} released claim on ${vehicleTitle}`;
      case 'commented':
        return `${userName} commented on ${vehicleTitle}`;
      case 'status-updated':
        return `${userName} updated status of ${vehicleTitle}`;
      case 'transfer-started':
        return `Transfer started for ${vehicleTitle}`;
      case 'transfer-completed':
        return `Transfer completed for ${vehicleTitle}`;
      default:
        return activity.details || `${userName} performed an action on ${vehicleTitle}`;
    }
  };

  return (
    <div className="bg-white dark:bg-[#1f1f1f] rounded-lg shadow dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.5)] border border-gray-200 dark:border-[#2a2a2a] transition-colors duration-200">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-[#2a2a2a]">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
          {userLocation && (
            <label className="flex items-center text-sm">
              <input
                type="checkbox"
                checked={filterByLocation}
                onChange={(e) => {
                  setFilterByLocation(e.target.checked);
                }}
                className="mr-2 rounded text-blue-600 focus:ring-blue-500 dark:text-blue-400"
              />
              <span className="text-gray-600 dark:text-gray-400">My location only</span>
            </label>
          )}
        </div>
      </div>
      
      <div className="px-6 py-4">
        {activities.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">No recent activity</p>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity._id} className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  {getActivityIcon(activity.action)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 dark:text-gray-100">
                    {getActivityDescription(activity)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}