"use client"

import { useEffect, useState } from "react";
import { Car, TruckIcon, Package, Clock } from "lucide-react";
import { supabase } from "@/lib/supabase-client";

interface DashboardStatsProps {
  stats: {
    totalVehicles: number;
    availableVehicles: number;
    activeTransfers: number;
    inTransitVehicles?: number;
  };
  userRole: string;
  enableRealtime?: boolean;
}

export default function DashboardStatsRealtime({ 
  stats: initialStats, 
  userRole, 
  enableRealtime = false 
}: DashboardStatsProps) {
  const [stats, setStats] = useState(initialStats);

  useEffect(() => {
    if (!enableRealtime) return;

    const fetchStats = async () => {
      const [
        totalVehiclesResult,
        availableVehiclesResult,
        activeTransfersResult,
        inTransitResult
      ] = await Promise.all([
        supabase.from('vehicles').select('*', { count: 'exact', head: true }),
        supabase.from('vehicles').select('*', { count: 'exact', head: true }).eq('status', 'available'),
        supabase.from('transfers').select('*', { count: 'exact', head: true }).in('status', ['requested', 'approved', 'in-transit']),
        supabase.from('transfers').select('*', { count: 'exact', head: true }).eq('status', 'in-transit')
      ]);

      setStats({
        totalVehicles: totalVehiclesResult.count || 0,
        availableVehicles: availableVehiclesResult.count || 0,
        activeTransfers: activeTransfersResult.count || 0,
        inTransitVehicles: inTransitResult.count || 0
      });
    };

    // Set up real-time subscriptions
    const vehicleChannel = supabase
      .channel('vehicle-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vehicles'
        },
        () => {
          fetchStats();
        }
      )
      .subscribe();

    const transferChannel = supabase
      .channel('transfer-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transfers'
        },
        () => {
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(vehicleChannel);
      supabase.removeChannel(transferChannel);
    };
  }, [enableRealtime]);

  const statsCards = [
    {
      name: "Total Vehicles",
      value: stats.totalVehicles.toLocaleString(),
      icon: Car,
      color: "bg-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-500/20",
      textColor: "text-blue-600 dark:text-blue-400",
    },
    {
      name: "Available",
      value: stats.availableVehicles.toLocaleString(),
      icon: Package,
      color: "bg-green-500",
      bgColor: "bg-green-50 dark:bg-green-500/20",
      textColor: "text-green-600 dark:text-green-400",
    },
    {
      name: "Active Transfers",
      value: stats.activeTransfers.toLocaleString(),
      icon: TruckIcon,
      color: "bg-yellow-500",
      bgColor: "bg-yellow-50 dark:bg-yellow-500/20",
      textColor: "text-yellow-600 dark:text-yellow-400",
    },
    {
      name: "In Transit",
      value: (stats.inTransitVehicles || 0).toLocaleString(),
      icon: Clock,
      color: "bg-purple-500",
      bgColor: "bg-purple-50 dark:bg-purple-500/20",
      textColor: "text-purple-600 dark:text-purple-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {statsCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.name}
            className="relative overflow-hidden rounded-lg bg-white dark:bg-[#1f1f1f] border border-gray-200 dark:border-[#2a2a2a] px-4 py-5 transition-all duration-200 hover:bg-gray-50 dark:hover:bg-[#333333] hover:shadow-lg dark:hover:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.5)] hover:-translate-y-0.5 sm:px-6 sm:py-6"
          >
            <dt>
              <div className={`absolute rounded-md ${stat.bgColor} p-3`}>
                <Icon className={`h-6 w-6 ${stat.textColor}`} />
              </div>
              <p className="ml-16 truncate text-sm font-medium text-gray-500 dark:text-gray-400">
                {stat.name}
              </p>
            </dt>
            <dd className="ml-16 flex items-baseline">
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {stat.value}
              </p>
            </dd>
          </div>
        );
      })}
    </div>
  );
}