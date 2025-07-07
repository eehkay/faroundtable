import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canManageDealerships } from "@/lib/permissions";
import { redirect } from "next/navigation";
import ImportHistory from "@/components/admin/ImportHistory";
import ImportTrigger from "@/components/admin/ImportTrigger";
import { Suspense } from "react";

export default async function ImportsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || !canManageDealerships(session.user.role)) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Vehicle Import Management</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Monitor and manage vehicle inventory imports from SFTP
        </p>
      </div>

      {/* Import Status Card */}
      <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-100">Import Configuration</h2>
            <p className="mt-1 text-sm text-gray-400">
              Daily imports run automatically at 2:00 AM PST
            </p>
          </div>
          <ImportTrigger />
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#141414] p-4 rounded-lg">
            <p className="text-sm text-gray-400">Schedule</p>
            <p className="text-lg font-medium text-gray-100">Daily at 2:00 AM PST</p>
          </div>
          <div className="bg-[#141414] p-4 rounded-lg">
            <p className="text-sm text-gray-400">Source</p>
            <p className="text-lg font-medium text-gray-100">SFTP Server</p>
          </div>
          <div className="bg-[#141414] p-4 rounded-lg">
            <p className="text-sm text-gray-400">Data Enrichment</p>
            <p className="text-lg font-medium text-gray-100">
              {process.env.ENABLE_ADVANCED_ANALYTICS === 'true' ? 'Enabled' : 'Disabled'}
            </p>
          </div>
        </div>
      </div>

      {/* Import History */}
      <Suspense fallback={<div className="animate-pulse bg-[#1f1f1f] h-96 rounded-lg"></div>}>
        <ImportHistory limit={20} />
      </Suspense>

      {/* Help Section */}
      <div className="bg-[#141414] border border-[#2a2a2a]/30 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-100 mb-4">Import Process Overview</h3>
        <div className="space-y-3 text-sm text-gray-400">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-[#3b82f6]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs text-[#3b82f6] font-medium">1</span>
            </div>
            <div>
              <p className="text-gray-300 font-medium">SFTP Download</p>
              <p>Connect to SFTP server and download CSV files for each dealership</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-[#3b82f6]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs text-[#3b82f6] font-medium">2</span>
            </div>
            <div>
              <p className="text-gray-300 font-medium">File Mapping</p>
              <p>Match CSV files to dealerships using configured file names</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-[#3b82f6]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs text-[#3b82f6] font-medium">3</span>
            </div>
            <div>
              <p className="text-gray-300 font-medium">Data Processing</p>
              <p>Parse CSV data, validate vehicles, and enrich with API data if enabled</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-[#3b82f6]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs text-[#3b82f6] font-medium">4</span>
            </div>
            <div>
              <p className="text-gray-300 font-medium">Database Sync</p>
              <p>Update vehicle inventory, preserving active transfers</p>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-[#1f1f1f] rounded-lg border border-[#2a2a2a]/50">
          <p className="text-sm text-gray-400">
            <span className="font-medium text-gray-300">Note:</span> Vehicles with active transfers (claimed or in-transit) 
            are preserved during imports. Delivered vehicles older than 3 days are automatically reset to available status.
          </p>
        </div>
      </div>
    </div>
  );
}