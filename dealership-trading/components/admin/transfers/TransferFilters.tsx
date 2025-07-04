'use client'

import { useEffect, useState } from 'react';
import { client } from '@/lib/sanity';
import { groq } from 'next-sanity';

interface TransferFiltersProps {
  filters: {
    status: string;
    location: string;
    dateRange: string;
  };
  onFilterChange: (filters: any) => void;
}

export default function TransferFilters({ filters, onFilterChange }: TransferFiltersProps) {
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const data = await client.fetch(groq`
          *[_type == "dealershipLocation" && active == true] {
            _id,
            name,
            code
          } | order(name asc)
        `);
        setLocations(data);
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

  return (
    <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-full bg-[#2a2a2a] border border-[#333333] text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Statuses</option>
            <option value="requested">Requested</option>
            <option value="approved">Approved</option>
            <option value="in-transit">In Transit</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Location
          </label>
          <select
            value={filters.location}
            onChange={(e) => handleFilterChange('location', e.target.value)}
            className="w-full bg-[#2a2a2a] border border-[#333333] text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Locations</option>
            {locations.map((location: any) => (
              <option key={location._id} value={location._id}>
                {location.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Date Range
          </label>
          <select
            value={filters.dateRange}
            onChange={(e) => handleFilterChange('dateRange', e.target.value)}
            className="w-full bg-[#2a2a2a] border border-[#333333] text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>
        </div>
      </div>
    </div>
  );
}