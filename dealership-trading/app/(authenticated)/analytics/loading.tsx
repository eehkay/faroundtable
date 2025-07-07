export default function AnalyticsLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="h-8 bg-[#2a2a2a] rounded w-64 mb-3 animate-pulse" />
        <div className="h-5 bg-[#2a2a2a] rounded w-96 animate-pulse" />
      </div>

      {/* Content skeleton */}
      <div className="space-y-6">
        <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-6">
          <div className="h-6 bg-[#2a2a2a] rounded w-32 mb-4 animate-pulse" />
          <div className="space-y-3">
            <div className="h-4 bg-[#2a2a2a] rounded w-full animate-pulse" />
            <div className="h-4 bg-[#2a2a2a] rounded w-3/4 animate-pulse" />
            <div className="h-4 bg-[#2a2a2a] rounded w-1/2 animate-pulse" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-6">
              <div className="w-10 h-10 bg-[#2a2a2a] rounded-lg mb-4 animate-pulse" />
              <div className="h-5 bg-[#2a2a2a] rounded w-3/4 mb-2 animate-pulse" />
              <div className="h-4 bg-[#2a2a2a] rounded w-full animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}