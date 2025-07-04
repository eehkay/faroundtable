'use client'

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Users, TruckIcon, Mail, Activity, Package, AlertTriangle, Settings, FileText } from "lucide-react";
import Link from "next/link";
import { client } from "@/lib/sanity";
import { groq } from "next-sanity";
import { isAdmin, isManager } from "@/lib/permissions";

interface DashboardStats {
  totalUsers: number;
  activeTransfers: number;
  pendingTransfers: number;
  totalVehicles: number;
  recentActivities: any[];
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeTransfers: 0,
    pendingTransfers: 0,
    totalVehicles: 0,
    recentActivities: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && !isAdmin(session.user.role) && !isManager(session.user.role)) {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (!session) return;

    const fetchStats = async () => {
      try {
        const [users, transfers, vehicles, activities] = await Promise.all([
          // Total users
          client.fetch(groq`count(*[_type == "user" && active == true])`),
          
          // Active transfers
          client.fetch(groq`{
            "active": count(*[_type == "transfer" && status in ["approved", "in-transit"]]),
            "pending": count(*[_type == "transfer" && status == "requested"])
          }`),
          
          // Total vehicles
          client.fetch(groq`count(*[_type == "vehicle" && status == "available"])`),
          
          // Recent activities
          client.fetch(groq`
            *[_type == "activity"] | order(timestamp desc)[0...5] {
              _id,
              action,
              timestamp,
              user->{name, email},
              vehicle->{year, make, model},
              fromLocation->{name},
              toLocation->{name}
            }
          `)
        ]);

        setStats({
          totalUsers: users,
          activeTransfers: transfers.active,
          pendingTransfers: transfers.pending,
          totalVehicles: vehicles,
          recentActivities: activities
        });
      } catch (error) {
        console.error('Failed to fetch admin stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [session]);

  if (status === "loading" || loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-[#2a2a2a] rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-[#2a2a2a] rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-[#2a2a2a] rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!session || (!isAdmin(session.user.role) && !isManager(session.user.role))) {
    return null;
  }

  const adminSections = [
    {
      title: "User Management",
      description: "Manage users, roles, and permissions",
      icon: Users,
      href: "/admin/users",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      show: isAdmin(session.user.role)
    },
    {
      title: "Transfer Management",
      description: "Review and approve transfer requests",
      icon: TruckIcon,
      href: "/admin/transfers",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      show: true
    },
    {
      title: "Notification Settings",
      description: "Configure email templates and preferences",
      icon: Mail,
      href: "/admin/notifications",
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      show: isAdmin(session.user.role)
    },
    {
      title: "System Settings",
      description: "General system configuration",
      icon: Settings,
      href: "/admin/settings",
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
      show: isAdmin(session.user.role),
      comingSoon: true
    },
    {
      title: "Reports & Analytics",
      description: "View system reports and analytics",
      icon: FileText,
      href: "/admin/reports",
      color: "text-cyan-500",
      bgColor: "bg-cyan-500/10",
      show: true,
      comingSoon: true
    },
    {
      title: "Activity Logs",
      description: "View detailed system activity logs",
      icon: Activity,
      href: "/admin/activity",
      color: "text-pink-500",
      bgColor: "bg-pink-500/10",
      show: isAdmin(session.user.role),
      comingSoon: true
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
        <p className="mt-2 text-gray-400">
          Manage your dealership network from one central location
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Total Users</p>
              <p className="mt-2 text-3xl font-bold text-white">{stats.totalUsers}</p>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <Users className="h-6 w-6 text-blue-500" />
            </div>
          </div>
        </div>

        <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Active Transfers</p>
              <p className="mt-2 text-3xl font-bold text-white">{stats.activeTransfers}</p>
            </div>
            <div className="p-3 bg-purple-500/10 rounded-lg">
              <TruckIcon className="h-6 w-6 text-purple-500" />
            </div>
          </div>
        </div>

        <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Pending Transfers</p>
              <p className="mt-2 text-3xl font-bold text-white">{stats.pendingTransfers}</p>
            </div>
            <div className="p-3 bg-yellow-500/10 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-yellow-500" />
            </div>
          </div>
        </div>

        <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Available Vehicles</p>
              <p className="mt-2 text-3xl font-bold text-white">{stats.totalVehicles}</p>
            </div>
            <div className="p-3 bg-green-500/10 rounded-lg">
              <Package className="h-6 w-6 text-green-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Admin Sections */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Admin Sections</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminSections.filter(section => section.show).map((section) => {
            const Icon = section.icon;
            return (
              <Link
                key={section.href}
                href={section.comingSoon ? '#' : section.href}
                className={`bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg p-6 hover:bg-[#2a2a2a] transition-colors ${section.comingSoon ? 'cursor-not-allowed opacity-60' : ''}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 ${section.bgColor} rounded-lg`}>
                    <Icon className={`h-6 w-6 ${section.color}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white">
                      {section.title}
                      {section.comingSoon && (
                        <span className="ml-2 text-xs bg-[#2a2a2a] text-gray-400 px-2 py-1 rounded">Coming Soon</span>
                      )}
                    </h3>
                    <p className="mt-1 text-sm text-gray-400">{section.description}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Recent Activity</h2>
        <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg overflow-hidden">
          {stats.recentActivities.length > 0 ? (
            <div className="divide-y divide-[#2a2a2a]">
              {stats.recentActivities.map((activity) => (
                <div key={activity._id} className="p-4 hover:bg-[#2a2a2a] transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-white">
                        <span className="font-medium">{activity.user?.name || 'Unknown'}</span>
                        {' '}
                        <span className="text-gray-400">
                          {activity.action.replace(/_/g, ' ')}
                        </span>
                        {activity.vehicle && (
                          <span className="text-gray-300">
                            {' '}{activity.vehicle.year} {activity.vehicle.make} {activity.vehicle.model}
                          </span>
                        )}
                      </p>
                      {(activity.fromLocation || activity.toLocation) && (
                        <p className="text-xs text-gray-500 mt-1">
                          {activity.fromLocation?.name}
                          {activity.fromLocation && activity.toLocation && ' → '}
                          {activity.toLocation?.name}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(activity.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-400">
              No recent activity
            </div>
          )}
        </div>
      </div>
    </div>
  );
}