"use client"

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { ChevronDown, X, Calendar, Gauge, DollarSign, Clock } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import type { DealershipLocation } from '@/types/vehicle';
import { RangeSlider } from '@/components/ui/range-slider';

interface VehicleFiltersProps {
  locations: DealershipLocation[];
}

interface VehicleStats {
  minPrice: number;
  maxPrice: number;
  minYear: number;
  maxYear: number;  
  minMileage: number;
  maxMileage: number;
  minDaysOnLot: number;
  maxDaysOnLot: number;
  makes: string[];
}

export default function VehicleFilters({ locations }: VehicleFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Dropdown states
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const locationRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  
  // Fetch dynamic ranges from inventory
  const [stats, setStats] = useState<VehicleStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  
  // State for slider values
  const [daysOnLotRange, setDaysOnLotRange] = useState<[number, number]>([0, 90]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [yearRange, setYearRange] = useState<[number, number]>([2015, new Date().getFullYear()]);
  const [mileageRange, setMileageRange] = useState<[number, number]>([0, 150000]);

  // Get current filter values
  const selectedLocation = searchParams.get('location');
  const selectedStatus = searchParams.get('status');
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
  const minDaysOnLot = searchParams.get('minDaysOnLot');
  const maxDaysOnLot = searchParams.get('maxDaysOnLot');
  const minYear = searchParams.get('minYear');
  const maxYear = searchParams.get('maxYear');
  const minMileage = searchParams.get('minMileage');
  const maxMileage = searchParams.get('maxMileage');
  
  // Fetch vehicle stats for dynamic ranges
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/vehicles/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
          
          // Set initial ranges based on inventory
          if (!minDaysOnLot && !maxDaysOnLot) {
            setDaysOnLotRange([data.minDaysOnLot, data.maxDaysOnLot]);
          }
          if (!minPrice && !maxPrice) {
            setPriceRange([data.minPrice, data.maxPrice]);
          }
          if (!minYear && !maxYear) {
            setYearRange([data.minYear, data.maxYear]);
          }
          if (!minMileage && !maxMileage) {
            setMileageRange([data.minMileage, data.maxMileage]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch vehicle stats:', error);
      } finally {
        setIsLoadingStats(false);
      }
    };
    
    fetchStats();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Update slider values when search params change
  useEffect(() => {
    if (!stats) return; // Wait for stats to load
    
    // Always update sliders based on current params or default to full range
    setPriceRange([
      parseInt(minPrice || stats.minPrice.toString()),
      parseInt(maxPrice || stats.maxPrice.toString())
    ]);
    
    setDaysOnLotRange([
      parseInt(minDaysOnLot || stats.minDaysOnLot.toString()),
      parseInt(maxDaysOnLot || stats.maxDaysOnLot.toString())
    ]);
    
    setYearRange([
      parseInt(minYear || stats.minYear.toString()),
      parseInt(maxYear || stats.maxYear.toString())
    ]);
    
    setMileageRange([
      parseInt(minMileage || stats.minMileage.toString()),
      parseInt(maxMileage || stats.maxMileage.toString())
    ]);
  }, [minPrice, maxPrice, minDaysOnLot, maxDaysOnLot, minYear, maxYear, minMileage, maxMileage, stats]);

  const statuses = [
    { value: 'available', label: 'Available' },
    { value: 'claimed', label: 'Claimed' },
    { value: 'in-transit', label: 'In Transit' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'removed', label: 'Removed' },
  ];

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (locationRef.current && !locationRef.current.contains(event.target as Node)) {
        setShowLocationDropdown(false);
      }
      if (statusRef.current && !statusRef.current.contains(event.target as Node)) {
        setShowStatusDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const updateFilter = (key: string, value: string | null) => {
    try {
      const params = new URLSearchParams(searchParams.toString());
      
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      
      router.push(`${pathname}?${params.toString()}`);
    } catch (error) {
      console.error('Error updating filter:', error);
    }
  };

  const updateRangeFilter = useCallback((minKey: string, maxKey: string, values: [number, number], defaults: [number, number]) => {
    try {
      const params = new URLSearchParams(searchParams.toString());
      
      // Only set params if they differ from the full range
      if (values[0] > defaults[0]) {
        params.set(minKey, values[0].toString());
      } else {
        params.delete(minKey);
      }
      
      if (values[1] < defaults[1]) {
        params.set(maxKey, values[1].toString());
      } else {
        params.delete(maxKey);
      }
      
      router.push(`${pathname}?${params.toString()}`);
    } catch (error) {
      console.error('Error updating range filter:', error);
    }
  }, [pathname, router, searchParams]);

  const clearAllFilters = () => {
    try {
      router.push(pathname);
    } catch (error) {
      console.error('Error clearing filters:', error);
    }
  };

  const activeFilterCount = [
    selectedLocation,
    selectedStatus,
    minPrice,
    maxPrice,
    minDaysOnLot,
    maxDaysOnLot,
    minYear,
    maxYear,
    minMileage,
    maxMileage
  ].filter(Boolean).length;
  
  if (isLoadingStats) {
    return (
      <div className="bg-white dark:bg-[#1f1f1f] p-4 rounded-lg border border-gray-200 dark:border-[#2a2a2a] transition-all duration-200">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-full"></div>
        </div>
      </div>
    );
  }

  // Build active filter chips
  const filterChips: { label: string; onRemove: () => void }[] = [];
  
  if (selectedLocation) {
    filterChips.push({
      label: `Location: ${locations.find(l => l._id === selectedLocation)?.name || 'Selected'}`,
      onRemove: () => updateFilter('location', null)
    });
  }
  if (selectedStatus) {
    filterChips.push({
      label: `Status: ${statuses.find(s => s.value === selectedStatus)?.label || selectedStatus}`,
      onRemove: () => updateFilter('status', null)
    });
  }
  if (minDaysOnLot || maxDaysOnLot) {
    filterChips.push({
      label: `Days: ${minDaysOnLot || '0'}-${maxDaysOnLot || stats?.maxDaysOnLot || '90'}`,
      onRemove: () => {
        updateFilter('minDaysOnLot', null);
        updateFilter('maxDaysOnLot', null);
      }
    });
  }
  if (minPrice || maxPrice) {
    filterChips.push({
      label: `Price: $${(parseInt(minPrice || '0') / 1000).toFixed(0)}k-$${(parseInt(maxPrice || stats?.maxPrice.toString() || '100000') / 1000).toFixed(0)}k`,
      onRemove: () => {
        updateFilter('minPrice', null);
        updateFilter('maxPrice', null);
      }
    });
  }
  if (minYear || maxYear) {
    filterChips.push({
      label: `Year: ${minYear || stats?.minYear || '2000'}-${maxYear || stats?.maxYear || new Date().getFullYear()}`,
      onRemove: () => {
        updateFilter('minYear', null);
        updateFilter('maxYear', null);
      }
    });
  }
  if (minMileage || maxMileage) {
    filterChips.push({
      label: `Mileage: ${(parseInt(minMileage || '0') / 1000).toFixed(0)}k-${(parseInt(maxMileage || stats?.maxMileage.toString() || '200000') / 1000).toFixed(0)}k`,
      onRemove: () => {
        updateFilter('minMileage', null);
        updateFilter('maxMileage', null);
      }
    });
  }
  
  return (
    <div className="bg-white dark:bg-[#1f1f1f] p-6 rounded-lg border border-gray-200 dark:border-[#2a2a2a] transition-all duration-200 space-y-6">
      {/* Active Filter Chips */}
      {filterChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-100 mr-2">Active:</span>
          {filterChips.map((chip, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
            >
              {chip.label}
              <button
                onClick={chip.onRemove}
                className="ml-1 hover:text-blue-900 dark:hover:text-blue-200 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          {filterChips.length > 1 && (
            <button
              onClick={clearAllFilters}
              className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium"
            >
              Clear all
            </button>
          )}
        </div>
      )}
      
      {/* Dropdown Filters Row */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-100">Quick Filters:</span>
        
        {/* Location Filter */}
        <div className="relative" ref={locationRef}>
          <button
            onClick={() => setShowLocationDropdown(!showLocationDropdown)}
            className="inline-flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-[#141414] border border-gray-300 dark:border-[#2a2a2a] rounded-lg text-sm text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-[#1f1f1f] transition-all duration-200"
          >
            {selectedLocation
              ? locations.find(l => l._id === selectedLocation)?.name || 'Location'
              : 'All Locations'}
            <ChevronDown className="h-4 w-4" />
          </button>
          
          {showLocationDropdown && (
            <div className="absolute z-10 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#333333]">
              <div className="py-1">
                <button
                  onClick={() => {
                    updateFilter('location', null);
                    setShowLocationDropdown(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-[#333333] transition-all duration-200"
                >
                  All Locations
                </button>
                {locations.map((location) => (
                  <button
                    key={location._id}
                    onClick={() => {
                      updateFilter('location', location._id);
                      setShowLocationDropdown(false);
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm transition-all duration-200 ${
                      selectedLocation === location._id
                        ? 'bg-blue-50 dark:bg-blue-600/20 text-blue-700 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-[#333333]'
                    }`}
                  >
                    {location.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Status Filter */}
        <div className="relative" ref={statusRef}>
          <button
            onClick={() => setShowStatusDropdown(!showStatusDropdown)}
            className="inline-flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-[#141414] border border-gray-300 dark:border-[#2a2a2a] rounded-lg text-sm text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-[#1f1f1f] transition-all duration-200"
          >
            {selectedStatus
              ? statuses.find(s => s.value === selectedStatus)?.label || 'Status'
              : 'All Statuses'}
            <ChevronDown className="h-4 w-4" />
          </button>
          
          {showStatusDropdown && (
            <div className="absolute z-10 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#333333]">
              <div className="py-1">
                <button
                  onClick={() => {
                    updateFilter('status', null);
                    setShowStatusDropdown(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-[#333333] transition-all duration-200"
                >
                  All Statuses
                </button>
                {statuses.map((status) => (
                  <button
                    key={status.value}
                    onClick={() => {
                      updateFilter('status', status.value);
                      setShowStatusDropdown(false);
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm transition-all duration-200 ${
                      selectedStatus === status.value
                        ? 'bg-blue-50 dark:bg-blue-600/20 text-blue-700 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-[#333333]'
                    }`}
                  >
                    {status.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Clear Filters - Always visible when filters active */}
        {activeFilterCount > 0 && (
          <button
            onClick={clearAllFilters}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-all duration-200 shadow-sm"
          >
            <X className="h-4 w-4" />
            Clear all filters ({activeFilterCount})
          </button>
        )}
      </div>

      {/* Sliders Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Days on Lot Slider */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-100">
            <Clock className="h-4 w-4" />
            Days on Lot
          </div>
          <RangeSlider
            min={stats?.minDaysOnLot || 0}
            max={stats?.maxDaysOnLot || 90}
            step={1}
            value={daysOnLotRange}
            onValueChange={(value) => setDaysOnLotRange(value as [number, number])}
            onValueCommit={(value) => updateRangeFilter('minDaysOnLot', 'maxDaysOnLot', value as [number, number], [stats?.minDaysOnLot || 0, stats?.maxDaysOnLot || 90])}
            formatValue={(v) => `${v}d`}
            showValues={true}
          />
        </div>

        {/* Price Range Slider */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-100">
            <DollarSign className="h-4 w-4" />
            Price Range
          </div>
          <RangeSlider
            min={stats?.minPrice || 0}
            max={stats?.maxPrice || 100000}
            step={1000}
            value={priceRange}
            onValueChange={(value) => setPriceRange(value as [number, number])}
            onValueCommit={(value) => updateRangeFilter('minPrice', 'maxPrice', value as [number, number], [stats?.minPrice || 0, stats?.maxPrice || 100000])}
            formatValue={(v) => `${(v / 1000).toFixed(0)}k`}
            prefix="$"
            showValues={true}
          />
        </div>

        {/* Year Range Slider */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-100">
            <Calendar className="h-4 w-4" />
            Model Year
          </div>
          <RangeSlider
            min={stats?.minYear || 2000}
            max={stats?.maxYear || new Date().getFullYear() + 1}
            step={1}
            value={yearRange}
            onValueChange={(value) => setYearRange(value as [number, number])}
            onValueCommit={(value) => updateRangeFilter('minYear', 'maxYear', value as [number, number], [stats?.minYear || 2000, stats?.maxYear || new Date().getFullYear() + 1])}
            showValues={true}
          />
        </div>

        {/* Mileage Range Slider */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-100">
            <Gauge className="h-4 w-4" />
            Mileage
          </div>
          <RangeSlider
            min={stats?.minMileage || 0}
            max={stats?.maxMileage || 200000}
            step={5000}
            value={mileageRange}
            onValueChange={(value) => setMileageRange(value as [number, number])}
            onValueCommit={(value) => updateRangeFilter('minMileage', 'maxMileage', value as [number, number], [stats?.minMileage || 0, stats?.maxMileage || 200000])}
            formatValue={(v) => `${(v / 1000).toFixed(0)}k`}
            showValues={true}
          />
        </div>
      </div>
    </div>
  );
}