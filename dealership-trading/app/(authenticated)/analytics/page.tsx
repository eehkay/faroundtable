import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Analytics | Round Table',
  description: 'Market intelligence and analytics for your dealership inventory',
};

export default function AnalyticsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Analytics Dashboard</h1>
        <p className="text-gray-400 mt-2">
          Market intelligence and insights for your dealership inventory
        </p>
      </div>

      {/* Coming Soon Message */}
      <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-12 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#3b82f6]/10 rounded-full mb-4">
              <svg
                className="w-8 h-8 text-[#3b82f6]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
          </div>
          
          <h2 className="text-2xl font-semibold text-white mb-4">
            Analytics Features Coming Soon
          </h2>
          
          <p className="text-gray-400 mb-8">
            We&apos;re building powerful analytics tools to help you make data-driven decisions 
            about your inventory. Soon you&apos;ll be able to:
          </p>

          <div className="grid gap-4 text-left max-w-lg mx-auto">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[#3b82f6]/20 mt-0.5 mr-3">
                <div className="w-full h-full rounded-full bg-[#3b82f6]" />
              </div>
              <div>
                <h3 className="font-medium text-white">Vehicle Market Analysis</h3>
                <p className="text-sm text-gray-400">
                  Get real-time pricing insights and demand metrics for any vehicle
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[#3b82f6]/20 mt-0.5 mr-3">
                <div className="w-full h-full rounded-full bg-[#3b82f6]" />
              </div>
              <div>
                <h3 className="font-medium text-white">Regional Market Insights</h3>
                <p className="text-sm text-gray-400">
                  Understand local market trends and competitive positioning
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[#3b82f6]/20 mt-0.5 mr-3">
                <div className="w-full h-full rounded-full bg-[#3b82f6]" />
              </div>
              <div>
                <h3 className="font-medium text-white">Transfer Intelligence</h3>
                <p className="text-sm text-gray-400">
                  Optimize inter-store transfers based on regional demand data
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[#3b82f6]/20 mt-0.5 mr-3">
                <div className="w-full h-full rounded-full bg-[#3b82f6]" />
              </div>
              <div>
                <h3 className="font-medium text-white">Custom Reports</h3>
                <p className="text-sm text-gray-400">
                  Create and schedule custom analytics reports for your team
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-[#3b82f6]/10 rounded-lg">
            <p className="text-sm text-[#3b82f6]">
              <strong>Note:</strong> Analytics features require API configuration. 
              Contact your administrator to enable these features.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}