import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { client } from "@/lib/sanity";
import { dashboardStatsQuery } from "@/lib/queries";
import { redirect } from "next/navigation";
import DashboardStats from "@/components/dashboard/DashboardStats";
import RecentActivity from "@/components/dashboard/RecentActivity";
import QuickActions from "@/components/dashboard/QuickActions";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/login");
  }

  // Fetch dashboard statistics
  const stats = await client.fetch(dashboardStatsQuery);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Welcome back, {session.user.name}! Here&apos;s an overview of the inventory system.
        </p>
      </div>

      {/* Statistics Cards */}
      <DashboardStats stats={stats} userRole={session.user.role} />

      {/* Quick Actions */}
      <QuickActions userRole={session.user.role} />

      {/* Recent Activity */}
      <RecentActivity 
        initialActivity={stats.recentActivity} 
        userLocation={session.user.location ? {
          ...session.user.location,
          _type: 'dealershipLocation' as const,
          active: true
        } : undefined}
      />
    </div>
  );
}