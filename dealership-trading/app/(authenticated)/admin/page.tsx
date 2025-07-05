'use client'

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Users, TruckIcon, Mail, Activity, Package, AlertTriangle, Settings, FileText } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase-client";
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
        const [
          usersResult,
          activeTransfersResult,
          pendingTransfersResult,
          vehiclesResult,
          activitiesResult
        ] = await Promise.all([
          // Total active users
          supabase.from('users').select('*', { count: 'exact', head: true }).eq('active', true),
          
          // Active transfers
          supabase.from('transfers').select('*', { count: 'exact', head: true })
            .in('status', ['approved', 'in-transit']),
          
          // Pending transfers
          supabase.from('transfers').select('*', { count: 'exact', head: true })
            .eq('status', 'requested'),
          
          // Available vehicles
          supabase.from('vehicles').select('*', { count: 'exact', head: true })
            .eq('status', 'available'),
          
          // Recent activities with joins
          supabase.from('activities')
            .select(`
              id,
              action,
              created_at,
              user:user_id(
                name,
                email
              ),
              vehicle:vehicle_id(
                year,
                make,
                model
              ),
              metadata
            `)
            .order('created_at', { ascending: false })
            .limit(5)
        ]);

        setStats({
          totalUsers: usersResult.count || 0,
          activeTransfers: activeTransfersResult.count || 0,
          pendingTransfers: pendingTransfersResult.count || 0,
          totalVehicles: vehiclesResult.count || 0,
          recentActivities: activitiesResult.data || []
        });
      } catch (error) {
        console.error('Failed to fetch admin stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    // Set up real-time subscriptions
    const transferChannel = supabase
      .channel('admin-transfer-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transfers' }, () => {
        fetchStats();
      })
      .subscribe();

    const activityChannel = supabase
      .channel('admin-activity-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activities' }, () => {
        fetchStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(transferChannel);
      supabase.removeChannel(activityChannel);
    };
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
                <div key={activity.id} className="p-4 hover:bg-[#2a2a2a] transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-white">
                        <span className="font-medium">{activity.user?.name || 'Unknown'}</span>
                        {' '}
                        <span className="text-gray-400">
                          {activity.action.replace(/-/g, ' ')}
                        </span>
                        {activity.vehicle && (
                          <span className="text-gray-300">
                            {' '}{activity.vehicle.year} {activity.vehicle.make} {activity.vehicle.model}
                          </span>
                        )}
                      </p>
                      {activity.metadata && (activity.metadata.fromStore || activity.metadata.toStore) && (
                        <p className="text-xs text-gray-500 mt-1">
                          {activity.metadata.fromStore}
                          {activity.metadata.fromStore && activity.metadata.toStore && ' → '}
                          {activity.metadata.toStore}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(activity.created_at).toLocaleString()}
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