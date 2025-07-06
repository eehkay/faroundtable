"use client"

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { ChevronDown, X, Calendar, Gauge, Car, Fuel } from 'lucide-react';
import { useState, useRef, useEffect, useMemo } from 'react';
import type { DealershipLocation } from '@/types/vehicle';
import { RangeSlider } from '@/components/ui/range-slider';

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
  const [showAgeDropdown, setShowAgeDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [showMileageDropdown, setShowMileageDropdown] = useState(false);
  const [showMakeDropdown, setShowMakeDropdown] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showConditionDropdown, setShowConditionDropdown] = useState(false);
  const locationRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const priceRef = useRef<HTMLDivElement>(null);
  const ageRef = useRef<HTMLDivElement>(null);
  const yearRef = useRef<HTMLDivElement>(null);
  const mileageRef = useRef<HTMLDivElement>(null);
  const makeRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<HTMLDivElement>(null);
  const conditionRef = useRef<HTMLDivElement>(null);
  
  // State for slider values
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [ageRange, setAgeRange] = useState<[number, number]>([0, 10]);
  const [yearRange, setYearRange] = useState<[number, number]>([2015, new Date().getFullYear()]);
  const [mileageRange, setMileageRange] = useState<[number, number]>([0, 150000]);

  // Get current filter values
  const selectedLocation = searchParams.get('location');
  const selectedStatus = searchParams.get('status');
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
  const minAge = searchParams.get('minAge');
  const maxAge = searchParams.get('maxAge');
  const minYear = searchParams.get('minYear');
  const maxYear = searchParams.get('maxYear');
  const minMileage = searchParams.get('minMileage');
  const maxMileage = searchParams.get('maxMileage');
  const selectedMake = searchParams.get('make');
  const selectedModel = searchParams.get('model');
  const selectedCondition = searchParams.get('condition');
  
  // Update slider values when search params change
  useEffect(() => {
    if (minPrice || maxPrice) {
      setPriceRange([parseInt(minPrice || '0'), parseInt(maxPrice || '100000')]);
    }
    if (minAge || maxAge) {
      setAgeRange([parseInt(minAge || '0'), parseInt(maxAge || '10')]);
    }
    if (minYear || maxYear) {
      setYearRange([parseInt(minYear || '2015'), parseInt(maxYear || String(new Date().getFullYear()))]);
    }
    if (minMileage || maxMileage) {
      setMileageRange([parseInt(minMileage || '0'), parseInt(maxMileage || '150000')]);
    }
  }, [minPrice, maxPrice, minAge, maxAge, minYear, maxYear, minMileage, maxMileage]);

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
      if (ageRef.current && !ageRef.current.contains(event.target as Node)) {
        setShowAgeDropdown(false);
      }
      if (yearRef.current && !yearRef.current.contains(event.target as Node)) {
        setShowYearDropdown(false);
      }
      if (mileageRef.current && !mileageRef.current.contains(event.target as Node)) {
        setShowMileageDropdown(false);
      }
      if (makeRef.current && !makeRef.current.contains(event.target as Node)) {
        setShowMakeDropdown(false);
      }
      if (modelRef.current && !modelRef.current.contains(event.target as Node)) {
        setShowModelDropdown(false);
      }
      if (conditionRef.current && !conditionRef.current.contains(event.target as Node)) {
        setShowConditionDropdown(false);
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

  const activeFilterCount = [
    selectedLocation,
    selectedStatus,
    minPrice,
    maxPrice,
    minAge,
    maxAge,
    minYear,
    maxYear,
    minMileage,
    maxMileage,
    selectedMake,
    selectedModel,
    selectedCondition
  ].filter(Boolean).length;

  const updateRangeFilter = (minKey: string, maxKey: string, values: [number, number]) => {
    try {
      const params = new URLSearchParams(searchParams.toString());
      
      if (values[0] > 0) {
        params.set(minKey, values[0].toString());
      } else {
        params.delete(minKey);
      }
      
      if (values[1] < (maxKey.includes('Price') ? 100000 : maxKey.includes('Age') ? 10 : maxKey.includes('Year') ? new Date().getFullYear() : 150000)) {
        params.set(maxKey, values[1].toString());
      } else {
        params.delete(maxKey);
      }
      
      router.push(`${pathname}?${params.toString()}`);
    } catch (error) {
      console.error('Error updating range filter:', error);
    }
  };
  
  return (
    <div className="bg-white dark:bg-[#1f1f1f] p-4 rounded-lg border border-gray-200 dark:border-[#2a2a2a] transition-all duration-200">
      <div className="flex flex-wrap items-center gap-3">
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

        {/* Age Filter */}
        <div className="relative" ref={ageRef}>
          <button
            onClick={() => setShowAgeDropdown(!showAgeDropdown)}
            className="inline-flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-[#141414] border border-gray-300 dark:border-[#2a2a2a] rounded-lg text-sm text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-[#1f1f1f] transition-all duration-200"
          >
            <Calendar className="h-4 w-4" />
            {minAge || maxAge
              ? `${minAge || '0'}-${maxAge || '10'} years`
              : 'Vehicle Age'}
            <ChevronDown className="h-4 w-4" />
          </button>
          
          {showAgeDropdown && (
            <div className="absolute z-10 mt-2 w-80 rounded-md shadow-lg bg-white dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#333333] p-4">
              <RangeSlider
                label="Vehicle Age (Years)"
                min={0}
                max={10}
                step={1}
                value={ageRange}
                onValueChange={(value) => setAgeRange(value as [number, number])}
                onValueCommit={(value) => updateRangeFilter('minAge', 'maxAge', value as [number, number])}
                formatValue={(v) => `${v} ${v === 1 ? 'year' : 'years'}`}
              />
              <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                Drag to filter by vehicle age
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
            <div className="absolute z-10 mt-2 w-80 rounded-md shadow-lg bg-white dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#333333] p-4">
              <RangeSlider
                label="Price Range"
                min={0}
                max={100000}
                step={1000}
                value={priceRange}
                onValueChange={(value) => setPriceRange(value as [number, number])}
                onValueCommit={(value) => updateRangeFilter('minPrice', 'maxPrice', value as [number, number])}
                formatValue={(v) => v.toLocaleString()}
                prefix="$"
              />
              <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                Drag to filter by price range
              </div>
            </div>
          )}
        </div>

        {/* Year Range Filter */}
        <div className="relative" ref={yearRef}>
          <button
            onClick={() => setShowYearDropdown(!showYearDropdown)}
            className="inline-flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-[#141414] border border-gray-300 dark:border-[#2a2a2a] rounded-lg text-sm text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-[#1f1f1f] transition-all duration-200"
          >
            <Calendar className="h-4 w-4" />
            {minYear || maxYear
              ? `${minYear || '2015'}-${maxYear || new Date().getFullYear()}`
              : 'Year'}
            <ChevronDown className="h-4 w-4" />
          </button>
          
          {showYearDropdown && (
            <div className="absolute z-10 mt-2 w-80 rounded-md shadow-lg bg-white dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#333333] p-4">
              <RangeSlider
                label="Model Year"
                min={2000}
                max={new Date().getFullYear() + 1}
                step={1}
                value={yearRange}
                onValueChange={(value) => setYearRange(value as [number, number])}
                onValueCommit={(value) => updateRangeFilter('minYear', 'maxYear', value as [number, number])}
              />
              <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                Drag to filter by model year
              </div>
            </div>
          )}
        </div>

        {/* Mileage Range Filter */}
        <div className="relative" ref={mileageRef}>
          <button
            onClick={() => setShowMileageDropdown(!showMileageDropdown)}
            className="inline-flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-[#141414] border border-gray-300 dark:border-[#2a2a2a] rounded-lg text-sm text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-[#1f1f1f] transition-all duration-200"
          >
            <Gauge className="h-4 w-4" />
            {minMileage || maxMileage
              ? `${(parseInt(minMileage || '0') / 1000).toFixed(0)}k-${(parseInt(maxMileage || '150000') / 1000).toFixed(0)}k mi`
              : 'Mileage'}
            <ChevronDown className="h-4 w-4" />
          </button>
          
          {showMileageDropdown && (
            <div className="absolute z-10 mt-2 w-80 rounded-md shadow-lg bg-white dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#333333] p-4">
              <RangeSlider
                label="Mileage"
                min={0}
                max={200000}
                step={5000}
                value={mileageRange}
                onValueChange={(value) => setMileageRange(value as [number, number])}
                onValueCommit={(value) => updateRangeFilter('minMileage', 'maxMileage', value as [number, number])}
                formatValue={(v) => `${(v / 1000).toFixed(0)}k`}
                suffix=" miles"
              />
              <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                Drag to filter by mileage
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