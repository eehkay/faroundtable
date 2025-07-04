import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { client } from "@/lib/sanity";
import { allUsersQuery, dealershipLocationsQuery } from "@/lib/queries";
import { canManageUsers } from "@/lib/permissions";
import { redirect } from "next/navigation";
import UserList from "@/components/admin/UserList";
import { Suspense } from "react";

export default async function UsersPage() {
  const session = await getServerSession(authOptions);
  
  console.log('Admin Users Page - Session:', session?.user?.role);
  console.log('Admin Users Page - Can Manage Users:', session ? canManageUsers(session.user.role) : false);
  
  if (!session || !canManageUsers(session.user.role)) {
    console.log('Redirecting to dashboard - insufficient permissions');
    redirect("/dashboard");
  }

  // Fetch users and locations
  const [users, locations] = await Promise.all([
    client.fetch(allUsersQuery),
    client.fetch(dealershipLocationsQuery)
  ]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Management</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Manage user accounts, roles, and permissions across all dealership locations
        </p>
      </div>

      {/* User Management Interface */}
      <Suspense fallback={<div className="animate-pulse bg-[#1f1f1f] h-96 rounded-lg"></div>}>
        <UserList 
          initialUsers={users} 
          locations={locations}
          currentUserId={session.user.id}
        />
      </Suspense>
    </div>
  );
}