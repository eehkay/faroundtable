import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Analytics | Round Table',
  description: 'Market intelligence and analytics for your dealership inventory',
};

export default function AnalyticsPage() {
  const analyticsEnabled = process.env.ENABLE_ADVANCED_ANALYTICS === 'true';

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Analytics Dashboard</h1>
        <p className="text-[#a3a3a3] mt-2">
          Market intelligence and insights for your dealership inventory
        </p>
      </div>

      {/* Analytics Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Market Trend Report */}
        <Link
          href="/analytics/market-trend-report"
          className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-6 hover:bg-[#0a0a0a]/80 transition-all duration-200 group"
        >
          <div className="w-10 h-10 bg-[#3b82f6]/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#3b82f6]/20 transition-colors">
            <svg
              className="w-5 h-5 text-[#3b82f6]"
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
          <h3 className="text-lg font-medium text-white mb-2">Market Trend Report</h3>
          <p className="text-sm text-gray-400 mb-4">
            Analyze specific vehicles with pricing insights, demand metrics, and AI-powered recommendations
          </p>
          <div className="text-sm text-[#3b82f6] group-hover:text-[#3b82f6]/80">
            Analyze Vehicle →
          </div>
        </Link>

        {/* Regional Market Analysis */}
        <Link
          href="/analytics/regional"
          className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-6 hover:bg-[#0a0a0a]/80 transition-all duration-200 group"
        >
          <div className="w-10 h-10 bg-[#3b82f6]/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#3b82f6]/20 transition-colors">
            <svg
              className="w-5 h-5 text-[#3b82f6]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-white mb-2">Regional Market Analysis</h3>
          <p className="text-sm text-gray-400 mb-4">
            Discover the best vehicle acquisition opportunities in your market with algorithmic scoring
          </p>
          <div className="text-sm text-[#3b82f6] group-hover:text-[#3b82f6]/80">
            View Regional Insights →
          </div>
        </Link>

        {/* Transfer Intelligence (Coming Soon) */}
        <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-6 opacity-60">
          <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center mb-4">
            <svg
              className="w-5 h-5 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-white mb-2">Transfer Intelligence</h3>
          <p className="text-sm text-gray-400 mb-4">
            Optimize inter-store transfers based on regional demand data
          </p>
          <div className="text-sm text-gray-500">
            Coming Soon
          </div>
        </div>

        {/* Historical Performance (Coming Soon) */}
        <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-6 opacity-60">
          <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center mb-4">
            <svg
              className="w-5 h-5 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-white mb-2">Historical Performance</h3>
          <p className="text-sm text-gray-400 mb-4">
            Track inventory performance metrics and sales trends over time
          </p>
          <div className="text-sm text-gray-500">
            Coming Soon
          </div>
        </div>

        {/* Custom Reports (Coming Soon) */}
        <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-6 opacity-60">
          <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center mb-4">
            <svg
              className="w-5 h-5 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-white mb-2">Custom Reports</h3>
          <p className="text-sm text-gray-400 mb-4">
            Create and schedule custom analytics reports for your team
          </p>
          <div className="text-sm text-gray-500">
            Coming Soon
          </div>
        </div>

        {/* API Usage Monitor (Coming Soon) */}
        <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-6 opacity-60">
          <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center mb-4">
            <svg
              className="w-5 h-5 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-white mb-2">API Usage Monitor</h3>
          <p className="text-sm text-gray-400 mb-4">
            Track API usage and costs across analytics features
          </p>
          <div className="text-sm text-gray-500">
            Coming Soon
          </div>
        </div>
      </div>

      {/* Status Note */}
      {!analyticsEnabled && (
        <div className="mt-8 p-4 bg-[#3b82f6]/10 rounded-lg">
          <p className="text-sm text-[#3b82f6]">
            <strong>Note:</strong> Analytics features require API configuration. 
            Contact your administrator to enable these features.
          </p>
        </div>
      )}
    </div>
  );
}