"use client"

import { Car, TruckIcon, Package, Clock } from "lucide-react";

interface DashboardStatsProps {
  stats: {
    totalVehicles: number;
    availableVehicles: number;
    activeTransfers: number;
  };
  userRole: string;
}

export default function DashboardStats({ stats, userRole }: DashboardStatsProps) {
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
      value: Math.floor(stats.activeTransfers * 0.3).toLocaleString(), // Estimate for now
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