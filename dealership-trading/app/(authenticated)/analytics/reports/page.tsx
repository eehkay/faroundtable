import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Analytics Reports | Round Table',
  description: 'Create and manage analytics reports',
};

export default function AnalyticsReportsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Analytics Reports</h1>
        <p className="text-gray-400 mt-2">
          Create custom reports and schedule automated analytics
        </p>
      </div>

      {/* Create Report Button */}
      <div className="mb-8">
        <button
          disabled
          className="px-6 py-2 bg-[#3b82f6] text-white rounded-md font-medium opacity-50 cursor-not-allowed inline-flex items-center"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Create Report
        </button>
      </div>

      {/* Report Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-6">
          <div className="flex items-start">
            <div className="w-12 h-12 bg-[#3b82f6]/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg
                className="w-6 h-6 text-[#3b82f6]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
                />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-white mb-2">Vehicle Analysis Report</h3>
              <p className="text-sm text-gray-400">
                Comprehensive market analysis for specific vehicles or vehicle types
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-6">
          <div className="flex items-start">
            <div className="w-12 h-12 bg-[#3b82f6]/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg
                className="w-6 h-6 text-[#3b82f6]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-white mb-2">Market Overview Report</h3>
              <p className="text-sm text-gray-400">
                Regional market trends, popular vehicles, and competitive insights
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-6">
          <div className="flex items-start">
            <div className="w-12 h-12 bg-[#3b82f6]/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg
                className="w-6 h-6 text-[#3b82f6]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-white mb-2">Performance Report</h3>
              <p className="text-sm text-gray-400">
                Track inventory performance, turnover rates, and pricing optimization
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-6">
          <div className="flex items-start">
            <div className="w-12 h-12 bg-[#3b82f6]/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg
                className="w-6 h-6 text-[#3b82f6]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-white mb-2">Custom Report</h3>
              <p className="text-sm text-gray-400">
                Build your own report with custom metrics and visualizations
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Coming Soon Notice */}
      <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-8 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-[#3b82f6]/10 rounded-full mb-4">
          <svg
            className="w-6 h-6 text-[#3b82f6]"
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
        <h3 className="text-lg font-medium text-white mb-2">
          Reports Coming Soon
        </h3>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Create custom reports, schedule automated analytics, and export insights 
          to share with your team. This feature will be available once analytics 
          APIs are configured.
        </p>
      </div>
    </div>
  );
}