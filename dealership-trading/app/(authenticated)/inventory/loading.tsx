import { LoadingCard } from "@/components/Loading";

export default function InventoryLoading() {
  return (
    <div className="space-y-6">
      {/* Page Header Skeleton */}
      <div>
        <div className="h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
        <div className="h-5 bg-gray-200 rounded w-96 animate-pulse"></div>
      </div>

      {/* Search Bar Skeleton */}
      <div className="h-10 bg-gray-200 rounded-lg animate-pulse"></div>

      {/* Filters Skeleton */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center gap-4">
          <div className="h-4 bg-gray-200 rounded w-12 animate-pulse"></div>
          <div className="h-9 bg-gray-200 rounded-lg w-32 animate-pulse"></div>
          <div className="h-9 bg-gray-200 rounded-lg w-32 animate-pulse"></div>
          <div className="h-9 bg-gray-200 rounded-lg w-32 animate-pulse"></div>
        </div>
      </div>

      {/* Vehicle Grid Skeleton */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[...Array(12)].map((_, i) => (
          <LoadingCard key={i} />
        ))}
      </div>
    </div>
  );
}