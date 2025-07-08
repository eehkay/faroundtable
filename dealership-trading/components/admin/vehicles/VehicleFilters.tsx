'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { supabase } from '@/lib/supabase-client'
import { DealershipLocation } from '@/types/vehicle'

interface VehicleFiltersProps {
  filters: {
    status: string
    condition: string
    location: string
    priceRange: string
  }
  onFiltersChange: (filters: any) => void
  onClose: () => void
}

export default function VehicleFilters({ filters, onFiltersChange, onClose }: VehicleFiltersProps) {
  const [locations, setLocations] = useState<DealershipLocation[]>([])

  useEffect(() => {
    // Fetch dealership locations
    const fetchLocations = async () => {
      const { data, error } = await supabase
        .from('dealership_locations')
        .select('*')
        .eq('active', true)
        .order('name')

      if (!error && data) {
        // Transform Supabase data to match our type
        const transformedLocations = data.map((loc: any) => ({
          _id: loc.id,
          _type: 'dealershipLocation' as const,
          name: loc.name,
          code: loc.code,
          address: loc.address,
          city: loc.city,
          state: loc.state,
          zip: loc.zip,
          phone: loc.phone,
          email: loc.email,
          csvFileName: loc.csv_file_name,
          active: loc.active,
          createdAt: loc.created_at,
          updatedAt: loc.updated_at
        }))
        setLocations(transformedLocations)
      }
    }

    fetchLocations()
  }, [])

  const handleFilterChange = (key: string, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    })
  }

  const resetFilters = () => {
    onFiltersChange({
      status: 'all',
      condition: 'all',
      location: 'all',
      priceRange: 'all',
    })
  }

  const hasActiveFilters = Object.values(filters).some(value => value !== 'all')

  return (
    <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Filters</h3>
        <div className="flex items-center gap-4">
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-sm text-blue-500 hover:text-blue-400 transition-colors"
            >
              Reset all
            </button>
          )}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-full px-3 py-2 bg-[#141414] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="claimed">Claimed</option>
            <option value="in-transit">In Transit</option>
            <option value="delivered">Delivered</option>
          </select>
        </div>

        {/* Condition Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Condition
          </label>
          <select
            value={filters.condition}
            onChange={(e) => handleFilterChange('condition', e.target.value)}
            className="w-full px-3 py-2 bg-[#141414] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Conditions</option>
            <option value="new">New</option>
            <option value="used">Used</option>
          </select>
        </div>

        {/* Location Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Location
          </label>
          <select
            value={filters.location}
            onChange={(e) => handleFilterChange('location', e.target.value)}
            className="w-full px-3 py-2 bg-[#141414] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Locations</option>
            {locations.map((location) => (
              <option key={location._id} value={location._id}>
                {location.name}
              </option>
            ))}
          </select>
        </div>

        {/* Price Range Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Price Range
          </label>
          <select
            value={filters.priceRange}
            onChange={(e) => handleFilterChange('priceRange', e.target.value)}
            className="w-full px-3 py-2 bg-[#141414] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Prices</option>
            <option value="0-25000">Under $25,000</option>
            <option value="25000-50000">$25,000 - $50,000</option>
            <option value="50000-75000">$50,000 - $75,000</option>
            <option value="75000-100000">$75,000 - $100,000</option>
            <option value="100000-999999999">Over $100,000</option>
          </select>
        </div>
      </div>
    </div>
  )
}