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

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Import Controls */}
        <div className="space-y-6">
          {/* Import Configuration */}
          <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-100 mb-4">Import Configuration</h2>
            
            <div className="space-y-4">
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

          {/* Manual Import Trigger */}
          <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-100 mb-2">Manual Import</h2>
            <p className="text-sm text-gray-400 mb-4">
              Trigger an import manually with custom options
            </p>
            <ImportTrigger />
          </div>
        </div>

        {/* Right Column - Import Features */}
        <div className="bg-[#141414] border border-[#2a2a2a]/30 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-100 mb-4">Import Features</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-[#3b82f6]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-[#3b82f6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-100">Dry Run Preview</h4>
                <p className="text-sm text-gray-400 mt-1">
                  Preview changes before applying them to the database. See exactly what vehicles will be added, updated, or removed.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-[#3b82f6]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-[#3b82f6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-100">Store-Specific Import</h4>
                <p className="text-sm text-gray-400 mt-1">
                  Import inventory for specific dealerships only. Useful for testing or updating individual store data.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-[#3b82f6]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-[#3b82f6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-100">30-Day Soft Delete</h4>
                <p className="text-sm text-gray-400 mt-1">
                  Vehicles removed from the feed are marked as &quot;removed&quot; for 30 days before permanent deletion, preventing accidental data loss.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-[#3b82f6]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-[#3b82f6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-100">Transfer Protection</h4>
                <p className="text-sm text-gray-400 mt-1">
                  Vehicles with active transfers are never deleted during imports, ensuring ongoing transactions are preserved.
                </p>
              </div>
            </div>
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