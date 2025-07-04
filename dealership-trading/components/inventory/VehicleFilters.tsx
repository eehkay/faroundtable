"use client"

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { ChevronDown, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import type { DealershipLocation } from '@/types/vehicle';

interface VehicleFiltersProps {
  locations: DealershipLocation[];
}

export default function VehicleFilters({ locations }: VehicleFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showPriceDropdown, setShowPriceDropdown] = useState(false);
  const locationRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const priceRef = useRef<HTMLDivElement>(null);

  // Get current filter values
  const selectedLocation = searchParams.get('location');
  const selectedStatus = searchParams.get('status');
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');

  const statuses = [
    { value: 'available', label: 'Available' },
    { value: 'claimed', label: 'Claimed' },
    { value: 'in-transit', label: 'In Transit' },
    { value: 'delivered', label: 'Delivered' },
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
      if (priceRef.current && !priceRef.current.contains(event.target as Node)) {
        setShowPriceDropdown(false);
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

  const clearAllFilters = () => {
    try {
      router.push(pathname);
    } catch (error) {
      console.error('Error clearing filters:', error);
    }
  };

  const activeFilterCount = [selectedLocation, selectedStatus, minPrice, maxPrice].filter(Boolean).length;

  return (
    <div className="bg-white dark:bg-[#1f1f1f] p-4 rounded-lg border border-gray-200 dark:border-[#2a2a2a] transition-all duration-200">
      <div className="flex flex-wrap items-center gap-4">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-100">Filters:</span>
        
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

        {/* Price Range Filter */}
        <div className="relative" ref={priceRef}>
          <button
            onClick={() => setShowPriceDropdown(!showPriceDropdown)}
            className="inline-flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-[#141414] border border-gray-300 dark:border-[#2a2a2a] rounded-lg text-sm text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-[#1f1f1f] transition-all duration-200"
          >
            {minPrice || maxPrice
              ? `$${minPrice || '0'} - $${maxPrice || '∞'}`
              : 'Price Range'}
            <ChevronDown className="h-4 w-4" />
          </button>
          
          {showPriceDropdown && (
            <div className="absolute z-10 mt-2 w-64 rounded-md shadow-lg bg-white dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#333333] p-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Min Price
                  </label>
                  <input
                    type="number"
                    value={minPrice || ''}
                    onChange={(e) => updateFilter('minPrice', e.target.value || null)}
                    placeholder="0"
                    className="w-full px-3 py-1 border border-gray-300 dark:border-[#333333] dark:bg-[#141414] dark:text-white rounded text-sm transition-all duration-200 focus:border-blue-500 dark:focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Max Price
                  </label>
                  <input
                    type="number"
                    value={maxPrice || ''}
                    onChange={(e) => updateFilter('maxPrice', e.target.value || null)}
                    placeholder="No limit"
                    className="w-full px-3 py-1 border border-gray-300 dark:border-[#333333] dark:bg-[#141414] dark:text-white rounded text-sm transition-all duration-200 focus:border-blue-500 dark:focus:border-blue-400"
                  />
                </div>
                <button
                  onClick={() => setShowPriceDropdown(false)}
                  className="w-full bg-blue-600 text-white py-1 rounded text-sm hover:bg-blue-700 transition-all duration-200"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Clear Filters */}
        {activeFilterCount > 0 && (
          <button
            onClick={clearAllFilters}
            className="inline-flex items-center gap-1 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-all duration-200"
          >
            <X className="h-4 w-4" />
            Clear all ({activeFilterCount})
          </button>
        )}
      </div>
    </div>
  );
}