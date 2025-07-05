import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDealershipLocations } from "@/lib/queries-supabase";
import { canManageDealerships } from "@/lib/permissions";
import { redirect } from "next/navigation";
import DealershipList from "@/components/admin/DealershipList";
import { Suspense } from "react";

export default async function DealershipsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || !canManageDealerships(session.user.role)) {
    redirect("/dashboard");
  }

  // Fetch dealership locations
  const dealerships = await getDealershipLocations();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dealership Management</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Manage dealership information, locations, and settings
        </p>
      </div>

      {/* Dealership Management Interface */}
      <Suspense fallback={<div className="animate-pulse bg-[#1f1f1f] h-96 rounded-lg"></div>}>
        <DealershipList 
          initialDealerships={dealerships} 
        />
      </Suspense>
    </div>
  );
}