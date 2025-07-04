"use client"

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { client } from "@/lib/sanity";
import { Activity, Car, MessageSquare, TruckIcon, CheckCircle, XCircle } from "lucide-react";
import type { Activity as ActivityType } from "@/types/transfer";
import type { DealershipLocation } from "@/types/vehicle";

interface RecentActivityProps {
  initialActivity: any[];
  userLocation?: DealershipLocation;
}

export default function RecentActivity({ initialActivity, userLocation }: RecentActivityProps) {
  const [activities, setActivities] = useState(initialActivity);
  const [filterByLocation, setFilterByLocation] = useState(false);

  useEffect(() => {
    const fetchActivities = async () => {
      const query = filterByLocation && userLocation
        ? `*[_type == "activity" && (vehicle->location._ref == $locationId || vehicle->originalLocation._ref == $locationId)] | order(createdAt desc) [0...10] {
            action,
            createdAt,
            vehicle->{title, stockNumber},
            user->{name}
          }`
        : `*[_type == "activity"] | order(createdAt desc) [0...10] {
            action,
            createdAt,
            vehicle->{title, stockNumber},
            user->{name}
          }`;
      
      const params = filterByLocation && userLocation
        ? { locationId: userLocation._id }
        : {};

      const data = await client.fetch(query, params);
      setActivities(data);
    };

    // Subscribe to real-time activity updates
    const query = filterByLocation && userLocation
      ? `*[_type == "activity" && (vehicle->location._ref == $locationId || vehicle->originalLocation._ref == $locationId)]`
      : `*[_type == "activity"]`;
    
    const params = filterByLocation && userLocation
      ? { locationId: userLocation._id }
      : {};

    const subscription = client
      .listen(query, params)
      .subscribe((update) => {
        if (update.transition === 'appear') {
          // Fetch fresh activity list
          fetchActivities();
        }
      });

    return () => subscription.unsubscribe();
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

  const getActivityDescription = (activity: any) => {
    const userName = activity.user?.name || 'Someone';
    const vehicleTitle = activity.vehicle?.title || `Stock #${activity.vehicle?.stockNumber}`;
    
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
        return `${userName} performed an action on ${vehicleTitle}`;
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
            {activities.map((activity, index) => (
              <div key={index} className="flex items-start space-x-3">
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