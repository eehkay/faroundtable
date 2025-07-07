import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Vehicle Analytics | Round Table',
  description: 'Analyze market data for specific vehicles',
};

export default function VehicleAnalyticsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Vehicle Market Analysis</h1>
        <p className="text-gray-400 mt-2">
          Get detailed market insights for any vehicle by VIN or make/model
        </p>
      </div>

      {/* Search Form Placeholder */}
      <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-6 mb-8">
        <h2 className="text-lg font-medium text-white mb-4">Search Vehicle</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              VIN (17 characters)
            </label>
            <input
              type="text"
              placeholder="Enter VIN"
              className="w-full px-3 py-2 bg-black border border-[#2a2a2a] rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent transition-all duration-200"
              disabled
            />
          </div>
          
          <div className="md:flex md:items-end">
            <div className="text-sm text-gray-500 mb-2 md:mb-0 md:mr-4">OR</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Make
            </label>
            <input
              type="text"
              placeholder="e.g., Toyota"
              className="w-full px-3 py-2 bg-black border border-[#2a2a2a] rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent transition-all duration-200"
              disabled
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Model
            </label>
            <input
              type="text"
              placeholder="e.g., Camry"
              className="w-full px-3 py-2 bg-black border border-[#2a2a2a] rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent transition-all duration-200"
              disabled
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Year
            </label>
            <input
              type="number"
              placeholder="e.g., 2023"
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
            Analyze Vehicle
          </button>
        </div>
      </div>

      {/* Feature Preview */}
      <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-8">
        <div className="text-center">
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
                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          
          <h3 className="text-lg font-medium text-white mb-2">
            Coming Soon: Vehicle Market Analysis
          </h3>
          
          <p className="text-gray-400 max-w-2xl mx-auto">
            This feature will provide comprehensive market analysis including pricing trends, 
            demand metrics, competitive analysis, and actionable recommendations for any vehicle 
            in your inventory.
          </p>
        </div>
      </div>
    </div>
  );
}