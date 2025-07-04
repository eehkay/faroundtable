"use client"

import { useEffect, useCallback } from 'react';
import VehicleCard from './VehicleCard';
import { client } from '@/lib/sanity';
import { useVehicles } from '@/hooks/useVehicles';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import type { DealershipLocation } from '@/types/vehicle';

interface VehicleGridProps {
  userLocation?: DealershipLocation;
  userRole: string;
}

export default function VehicleGrid({ userLocation, userRole }: VehicleGridProps) {
  const { vehicles, isLoading, error, hasMore, totalCount, loadMore, refreshVehicles } = useVehicles();
  const { setLoadMoreRef } = useInfiniteScroll({
    onLoadMore: loadMore,
    hasMore,
    isLoading,
    threshold: 200
  });

  // Subscribe to real-time updates
  useEffect(() => {
    const subscription = client
      .listen(`*[_type == "vehicle"]`)
      .subscribe((update) => {
        if (update.transition === 'appear' || update.transition === 'disappear' || update.transition === 'update') {
          // Refresh the current page when changes occur
          refreshVehicles();
        }
      });

    return () => subscription.unsubscribe();
  }, [refreshVehicles]);

  const handleVehicleUpdate = useCallback(() => {
    refreshVehicles();
  }, [refreshVehicles]);

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 text-lg">Error loading vehicles</p>
        <p className="text-gray-500 text-sm mt-2">{error}</p>
        <button 
          onClick={refreshVehicles}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!isLoading && vehicles.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400 text-lg">No vehicles found matching your criteria.</p>
        <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Try adjusting your filters or search terms.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        {totalCount > 0 && `Showing ${vehicles.length} of ${totalCount} vehicles`}
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {vehicles.map((vehicle) => (
          <VehicleCard
            key={vehicle._id}
            vehicle={vehicle}
            userLocation={userLocation}
            userRole={userRole}
            onUpdate={handleVehicleUpdate}
          />
        ))}
      </div>
      
      {/* Loading indicator for initial load */}
      {isLoading && vehicles.length === 0 && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}
      
      {/* Infinite scroll trigger */}
      {vehicles.length > 0 && (
        <div ref={setLoadMoreRef} className="py-8 text-center">
          {isLoading && (
            <div className="inline-flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-gray-500">Loading more vehicles...</span>
            </div>
          )}
          {!hasMore && vehicles.length > 0 && (
            <p className="text-gray-500">No more vehicles to load</p>
          )}
        </div>
      )}
    </div>
  );
}