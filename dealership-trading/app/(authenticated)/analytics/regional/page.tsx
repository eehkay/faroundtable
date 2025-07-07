import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Regional Analytics | Round Table',
  description: 'Regional market insights and trends',
};

export default function RegionalAnalyticsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Regional Market Insights</h1>
        <p className="text-gray-400 mt-2">
          Understand market trends and opportunities in your region
        </p>
      </div>

      {/* Location Selector Placeholder */}
      <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-6 mb-8">
        <h2 className="text-lg font-medium text-white mb-4">Select Location</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Dealership Location
            </label>
            <select
              className="w-full px-3 py-2 bg-black border border-[#2a2a2a] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent transition-all duration-200"
              disabled
            >
              <option>Select a location...</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Search Radius (miles)
            </label>
            <input
              type="number"
              placeholder="50"
              className="w-full px-3 py-2 bg-black border border-[#2a2a2a] rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent transition-all duration-200"
              disabled
            />
          </div>
        </div>

        <div className="mt-6">
          <button
            disabled
            className="px-6 py-2 bg-[#3b82f6] text-white rounded-md font-medium opacity-50 cursor-not-allowed"
          >
            Get Regional Insights
          </button>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-6">
          <div className="w-10 h-10 bg-[#3b82f6]/10 rounded-lg flex items-center justify-center mb-4">
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
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-white mb-2">Popular Vehicles</h3>
          <p className="text-sm text-gray-400">
            Discover the most in-demand vehicles in your market area
          </p>
        </div>

        <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-6">
          <div className="w-10 h-10 bg-[#3b82f6]/10 rounded-lg flex items-center justify-center mb-4">
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
          <h3 className="text-lg font-medium text-white mb-2">Competitor Analysis</h3>
          <p className="text-sm text-gray-400">
            Understand your competitive landscape and market position
          </p>
        </div>

        <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-6">
          <div className="w-10 h-10 bg-[#3b82f6]/10 rounded-lg flex items-center justify-center mb-4">
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
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-white mb-2">Market Opportunities</h3>
          <p className="text-sm text-gray-400">
            Identify gaps and opportunities in your local market
          </p>
        </div>
      </div>

      {/* Coming Soon Notice */}
      <div className="mt-8 p-4 bg-[#3b82f6]/10 rounded-lg text-center">
        <p className="text-sm text-[#3b82f6]">
          Regional analytics features will be available once analytics APIs are configured.
        </p>
      </div>
    </div>
  );
}