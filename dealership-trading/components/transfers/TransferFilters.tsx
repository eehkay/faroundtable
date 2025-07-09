'use client'

import { useEffect, useState, useRef, useMemo } from 'react';
import { supabase } from '@/lib/supabase-client';
import { ChevronDown, X, Check } from 'lucide-react';
import StatusFilterPills from './StatusFilterPills';

interface Location {
  id: string;
  name: string;
  code: string;
}

interface TransferFiltersProps {
  filters: {
    status: string;
    location: string;
    locations?: string[];
    dateRange: string;
  };
  onFilterChange: (filters: any) => void;
}

export default function TransferFilters({ filters, onFilterChange }: TransferFiltersProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const locationRef = useRef<HTMLDivElement>(null);
  const selectedLocations = useMemo(() => filters.locations || [], [filters.locations]);
  const [tempSelectedLocations, setTempSelectedLocations] = useState<string[]>(selectedLocations);

  // Sync temp selections with actual selections when they change externally
  useEffect(() => {
    setTempSelectedLocations(selectedLocations);
  }, [selectedLocations]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (locationRef.current && !locationRef.current.contains(event.target as Node)) {
        if (showLocationDropdown) {
          // Commit the changes when closing
          if (JSON.stringify(tempSelectedLocations) !== JSON.stringify(selectedLocations)) {
            onFilterChange({
              ...filters,
              locations: tempSelectedLocations,
              location: 'all'
            });
          }
          setShowLocationDropdown(false);
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showLocationDropdown, tempSelectedLocations, selectedLocations, filters, onFilterChange]);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const { data, error } = await supabase
          .from('dealership_locations')
          .select('id, name, code')
          .eq('active', true)
          .order('name', { ascending: true });
        
        if (error) throw error;
        console.log('Fetched locations for transfer filters:', data);
        setLocations(data || []);
      } catch (error) {
        console.error('Failed to fetch locations:', error);
      }
    };

    fetchLocations();
  }, []);

  const handleFilterChange = (key: string, value: string) => {
    onFilterChange({
      ...filters,
      [key]: value
    });
  };

  const toggleLocation = (locationId: string) => {
    const currentLocations = [...tempSelectedLocations];
    const index = currentLocations.indexOf(locationId);
    
    if (index > -1) {
      currentLocations.splice(index, 1);
    } else {
      currentLocations.push(locationId);
    }
    
    setTempSelectedLocations(currentLocations);
  };

  const selectAllLocations = () => {
    setTempSelectedLocations([]);
  };

  const activeFilterCount = [
    selectedLocations.length > 0 ? 'locations' : null,
    filters.status !== 'all' ? 'status' : null,
    filters.dateRange !== 'all' ? 'dateRange' : null
  ].filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Main Filters Row */}
      <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Multi-select Location Filter */}
          <div className="relative" ref={locationRef}>
            <button
              onClick={() => setShowLocationDropdown(!showLocationDropdown)}
              className="inline-flex items-center gap-2 px-3 py-2 bg-[#141414] border border-[#2a2a2a] rounded-lg text-sm text-white hover:bg-[#1f1f1f] transition-all duration-200"
            >
              {tempSelectedLocations.length > 0
                ? `${tempSelectedLocations.length} Location${tempSelectedLocations.length > 1 ? 's' : ''}`
                : 'All Locations'}
              <ChevronDown className="h-4 w-4" />
            </button>
            
            {showLocationDropdown && (
              <div className="absolute z-10 mt-2 w-64 rounded-md shadow-lg bg-[#2a2a2a] border border-[#333333] max-h-80 overflow-y-auto">
                <div className="py-1">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      selectAllLocations();
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-[#333333] transition-all duration-200 font-medium"
                  >
                    <div className="flex items-center justify-between">
                      <span>All Locations</span>
                      {tempSelectedLocations.length === 0 && <Check className="h-4 w-4 text-blue-600" />}
                    </div>
                  </button>
                  <div className="border-t border-[#333333] my-1"></div>
                  {locations.map((location) => (
                    <button
                      key={location.id}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleLocation(location.id);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-[#333333] transition-all duration-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 border rounded ${
                          tempSelectedLocations.includes(location.id)
                            ? 'bg-blue-600 border-blue-600'
                            : 'border-gray-600'
                        } flex items-center justify-center`}>
                          {tempSelectedLocations.includes(location.id) && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </div>
                        <span>{location.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Status Dropdown (for all statuses including cancelled/rejected) */}
          <div>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="bg-[#141414] border border-[#2a2a2a] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Active</option>
              <option value="requested">Requested</option>
              <option value="approved">Approved</option>
              <option value="in-transit">In Transit</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled/Denied</option>
            </select>
          </div>

          {/* Date Range Filter */}
          <div>
            <select
              value={filters.dateRange}
              onChange={(e) => handleFilterChange('dateRange', e.target.value)}
              className="bg-[#141414] border border-[#2a2a2a] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>

          {/* Clear Filters */}
          {activeFilterCount > 0 && (
            <button
              onClick={() => onFilterChange({ status: 'all', location: 'all', locations: [], dateRange: 'all' })}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-all duration-200 shadow-sm"
            >
              <X className="h-4 w-4" />
              Clear filters ({activeFilterCount})
            </button>
          )}
        </div>
      </div>

      {/* Status Filter Pills */}
      <StatusFilterPills
        selectedStatus={filters.status}
        onStatusChange={(status) => handleFilterChange('status', status)}
        locations={selectedLocations}
      />
    </div>
  );
}