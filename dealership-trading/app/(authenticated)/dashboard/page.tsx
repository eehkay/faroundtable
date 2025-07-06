import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDashboardStats } from "@/lib/queries-supabase";
import { redirect } from "next/navigation";
import DashboardStats from "@/components/dashboard/DashboardStats";
import RecentActivity from "@/components/dashboard/RecentActivitySupabase";
import QuickActions from "@/components/dashboard/QuickActions";
import IncomingTransferRequests from "@/components/dashboard/IncomingTransferRequests";
import { canViewAllTransfers } from "@/lib/permissions";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/login");
  }

  // Fetch dashboard statistics from Supabase
  const stats = await getDashboardStats();

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

      {/* Incoming Transfer Requests for Managers/Admins */}
      {canViewAllTransfers(session.user.role) && session.user.location && (
        <IncomingTransferRequests 
          userRole={session.user.role}
          userLocationId={session.user.location.id}
        />
      )}

      {/* Recent Activity */}
      <RecentActivity 
        initialActivity={stats.recentActivity} 
        userLocation={session.user.location ? {
          _id: session.user.location.id,
          _type: 'dealershipLocation' as const,
          name: session.user.location.name,
          code: session.user.location.code,
          address: undefined,
          city: undefined,
          state: undefined,
          zip: undefined,
          phone: undefined,
          csvFileName: undefined,
          active: true
        } : undefined}
      />
    </div>
  );
}