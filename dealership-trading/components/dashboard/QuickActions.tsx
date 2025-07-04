"use client"

import Link from "next/link";
import { Car, TruckIcon, ClipboardCheck, Users } from "lucide-react";
import { canApproveTransfer, canManageUsers } from "@/lib/permissions";

interface QuickActionsProps {
  userRole: string;
}

export default function QuickActions({ userRole }: QuickActionsProps) {
  const actions = [
    {
      name: "Browse Inventory",
      description: "View all available vehicles",
      href: "/inventory",
      icon: Car,
      show: true,
    },
    {
      name: "View Transfers",
      description: "Track active vehicle transfers",
      href: "/transfers",
      icon: TruckIcon,
      show: true,
    },
    {
      name: "Pending Approvals",
      description: "Review transfer requests",
      href: "/transfers?status=requested",
      icon: ClipboardCheck,
      show: canApproveTransfer(userRole),
    },
    {
      name: "User Management",
      description: "Manage dealership users",
      href: "/admin/users",
      icon: Users,
      show: canManageUsers(userRole),
    },
  ];

  const visibleActions = actions.filter(action => action.show);

  return (
    <div className="bg-white dark:bg-[#1f1f1f] shadow dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.5)] rounded-lg p-6 border border-gray-200 dark:border-[#2a2a2a]">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {visibleActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.name}
              href={action.href}
              className="relative rounded-lg border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] hover:bg-gray-50 dark:hover:bg-[#1f1f1f] px-6 py-4 shadow-sm dark:shadow-[0_1px_2px_0_rgba(0,0,0,0.5)] hover:shadow-md dark:hover:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.5)] transition-all hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-black"
            >
              <div className="flex items-center space-x-3">
                <Icon className="h-6 w-6 text-blue-600" />
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    {action.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {action.description}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}