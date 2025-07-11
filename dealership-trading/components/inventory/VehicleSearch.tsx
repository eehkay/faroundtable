"use client"

import { useState, useCallback, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';

export default function VehicleSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');

  // Sync URL changes to local state
  useEffect(() => {
    const urlSearchTerm = searchParams.get('search') || '';
    if (urlSearchTerm !== searchTerm) {
      setSearchTerm(urlSearchTerm);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]); // Intentionally exclude searchTerm to prevent infinite loop

  // Debounced search to avoid too many URL updates
  const debouncedSearch = useDebouncedCallback((value: string) => {
    try {
      const params = new URLSearchParams(searchParams.toString());
      
      if (value) {
        params.set('search', value);
      } else {
        params.delete('search');
      }
      
      router.push(`${pathname}?${params.toString()}`);
    } catch (error) {
      // Error updating search params
    }
  }, 300);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    debouncedSearch(value);
  };

  const clearSearch = () => {
    try {
      setSearchTerm('');
      const params = new URLSearchParams(searchParams.toString());
      params.delete('search');
      router.push(`${pathname}?${params.toString()}`);
    } catch (error) {
      // Error clearing search
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className="block w-full rounded-lg border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] py-2.5 pl-10 pr-10 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 sm:text-sm"
          placeholder="Search by VIN, stock number, make, model..."
        />
        {searchTerm && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 flex items-center pr-3"
          >
            <X className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300" />
          </button>
        )}
      </div>
    </div>
  );
}