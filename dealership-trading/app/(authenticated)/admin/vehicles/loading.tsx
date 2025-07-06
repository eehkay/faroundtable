export default function VehiclesLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="h-9 bg-[#2a2a2a] rounded w-32 mb-2 animate-pulse" />
        <div className="h-5 bg-[#2a2a2a] rounded w-64 animate-pulse" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-[#1f1f1f] border border-[#2a2a2a] p-4 rounded-lg">
            <div className="h-4 bg-[#2a2a2a] rounded w-24 mb-2 animate-pulse" />
            <div className="h-8 bg-[#2a2a2a] rounded w-16 animate-pulse" />
          </div>
        ))}
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 h-10 bg-[#141414] border border-[#2a2a2a] rounded-lg animate-pulse" />
        <div className="flex gap-2">
          <div className="w-24 h-10 bg-[#141414] border border-[#2a2a2a] rounded-lg animate-pulse" />
          <div className="w-24 h-10 bg-[#141414] border border-[#2a2a2a] rounded-lg animate-pulse" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg overflow-hidden">
        <div className="p-4 border-b border-[#2a2a2a]">
          <div className="flex gap-4">
            <div className="w-8 h-5 bg-[#2a2a2a] rounded animate-pulse" />
            <div className="w-20 h-5 bg-[#2a2a2a] rounded animate-pulse" />
            <div className="w-32 h-5 bg-[#2a2a2a] rounded animate-pulse" />
            <div className="w-16 h-5 bg-[#2a2a2a] rounded animate-pulse" />
            <div className="w-12 h-5 bg-[#2a2a2a] rounded animate-pulse" />
            <div className="w-24 h-5 bg-[#2a2a2a] rounded animate-pulse" />
            <div className="w-24 h-5 bg-[#2a2a2a] rounded animate-pulse" />
          </div>
        </div>
        {[...Array(10)].map((_, i) => (
          <div key={i} className="p-4 border-b border-[#2a2a2a]">
            <div className="flex gap-4">
              <div className="w-8 h-5 bg-[#2a2a2a] rounded animate-pulse" />
              <div className="w-20 h-5 bg-[#2a2a2a] rounded animate-pulse" />
              <div className="w-32 h-5 bg-[#2a2a2a] rounded animate-pulse" />
              <div className="w-16 h-5 bg-[#2a2a2a] rounded animate-pulse" />
              <div className="w-12 h-5 bg-[#2a2a2a] rounded animate-pulse" />
              <div className="w-24 h-5 bg-[#2a2a2a] rounded animate-pulse" />
              <div className="w-24 h-5 bg-[#2a2a2a] rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}