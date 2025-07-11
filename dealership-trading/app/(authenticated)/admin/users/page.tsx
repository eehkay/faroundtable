import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAllUsers, getDealershipLocations } from "@/lib/queries-supabase";
import { canManageUsers } from "@/lib/permissions";
import { redirect } from "next/navigation";
import UserList from "@/components/admin/UserList";
import { Suspense } from "react";

export default async function UsersPage() {
  const session = await getServerSession(authOptions);
  
  
  if (!session || !canManageUsers(session.user.role) || session.impersonating?.active) {
    redirect("/dashboard");
  }

  // Fetch users and locations
  const [users, locations] = await Promise.all([
    getAllUsers(),
    getDealershipLocations()
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