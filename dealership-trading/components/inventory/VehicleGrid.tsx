"use client"

import { useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { X, RotateCcw } from 'lucide-react';
import { useDebouncedCallback } from 'use-debounce';
import VehicleCard from './VehicleCard';
import { supabase } from '@/lib/supabase-client';
import { useVehicles } from '@/hooks/useVehicles';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import type { DealershipLocation } from '@/types/vehicle';

interface VehicleGridProps {
  userLocation?: DealershipLocation;
  userRole: string;
}

export default function VehicleGrid({ userLocation, userRole }: VehicleGridProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { vehicles, isLoading, error, hasMore, totalCount, loadMore, refreshVehicles } = useVehicles();
  const { setLoadMoreRef } = useInfiniteScroll({
    onLoadMore: loadMore,
    hasMore,
    isLoading,
    threshold: 200
  });

  // Get active filters for display
  const activeFilters: { label: string; value: string; key: string }[] = [];
  
  const search = searchParams.get('search');
  const location = searchParams.get('location');
  const status = searchParams.get('status');
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
  const minDaysOnLot = searchParams.get('minDaysOnLot');
  const maxDaysOnLot = searchParams.get('maxDaysOnLot');
  const minYear = searchParams.get('minYear');
  const maxYear = searchParams.get('maxYear');
  const minMileage = searchParams.get('minMileage');
  const maxMileage = searchParams.get('maxMileage');
  
  if (search) activeFilters.push({ label: 'Search', value: search, key: 'search' });
  if (location) activeFilters.push({ label: 'Location', value: 'Selected', key: 'location' });
  if (status) activeFilters.push({ label: 'Status', value: status, key: 'status' });
  if (minPrice || maxPrice) {
    activeFilters.push({ 
      label: 'Price', 
      value: `$${minPrice || '0'} - $${maxPrice || '∞'}`, 
      key: 'price' 
    });
  }
  if (minDaysOnLot || maxDaysOnLot) {
    activeFilters.push({ 
      label: 'Days on Lot', 
      value: `${minDaysOnLot || '0'} - ${maxDaysOnLot || '∞'} days`, 
      key: 'daysOnLot' 
    });
  }
  if (minYear || maxYear) {
    activeFilters.push({ 
      label: 'Year', 
      value: `${minYear || '0'} - ${maxYear || '∞'}`, 
      key: 'year' 
    });
  }
  if (minMileage || maxMileage) {
    activeFilters.push({ 
      label: 'Mileage', 
      value: `${minMileage || '0'} - ${maxMileage || '∞'} mi`, 
      key: 'mileage' 
    });
  }

  const clearAllFilters = () => {
    router.push('/inventory');
  };

  // Debounced refresh to prevent rapid successive updates
  const debouncedRefresh = useDebouncedCallback(() => {
    refreshVehicles();
  }, 1000);

  // Subscribe to real-time updates
  useEffect(() => {
    const channel = supabase
      .channel('vehicle-grid-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vehicles'
        },
        (payload) => {
          // Use debounced refresh to prevent rapid successive updates
          debouncedRefresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      // Cancel any pending refresh when component unmounts
      debouncedRefresh.cancel();
    };
  }, [debouncedRefresh]);

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
      <div className="text-center py-16 px-4">
        <div className="max-w-md mx-auto">
          {/* Icon */}
          <div className="mb-6">
            <div className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-600">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          
          {/* Main message */}
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No vehicles found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Your filters are too specific. Try adjusting them to see more results.
          </p>
          
          {/* Active filters display */}
          {activeFilters.length > 0 && (
            <div className="mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Active filters:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {activeFilters.map((filter, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
                  >
                    {filter.label}: {filter.value}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={clearAllFilters}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium"
            >
              <RotateCcw className="h-4 w-4" />
              Reset All Filters
            </button>
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 font-medium"
            >
              Go Back
            </button>
          </div>
          
          {/* Helpful tips */}
          <div className="mt-8 text-left bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tips:</p>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Try widening your price range</li>
              <li>• Select &quot;All Locations&quot; to see inventory from other stores</li>
              <li>• Adjust the year range to include older or newer models</li>
              <li>• Clear the search term if you&apos;re looking for specific text</li>
            </ul>
          </div>
        </div>
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