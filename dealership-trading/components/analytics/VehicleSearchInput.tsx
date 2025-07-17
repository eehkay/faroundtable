'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, Car, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useDealershipLocations } from '@/lib/hooks/useDealershipLocations'

interface Vehicle {
  _id: string
  stockNumber: string
  vin: string
  year: number
  make: string
  model: string
  trim?: string
  mileage: number
  price: number
  location: {
    _id: string
    name: string
    code: string
  }
}

interface VehicleSearchInputProps {
  label?: string
  placeholder?: string
  onVehicleSelect: (vehicle: {
    vin: string
    mileage: number
    locationId: string
    locationZip?: string
    stockNumber: string
    year: number
    make: string
    model: string
    trim?: string
    price: number
  }) => void
  className?: string
}

export default function VehicleSearchInput({ 
  label = "Search Vehicle", 
  placeholder = "Search by VIN, stock #, or year/make/model",
  onVehicleSelect,
  className = ""
}: VehicleSearchInputProps) {
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<Vehicle[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [hasSelected, setHasSelected] = useState(false)
  const searchTimeout = useRef<NodeJS.Timeout | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { locations } = useDealershipLocations()

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Search vehicles
  useEffect(() => {
    // Don't search if user has selected a vehicle
    if (hasSelected) {
      return
    }
    
    if (search.length < 2) {
      setResults([])
      setShowDropdown(false)
      return
    }

    // Clear previous timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current)
    }

    // Debounce search
    searchTimeout.current = setTimeout(async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/vehicles?search=${encodeURIComponent(search)}&limit=10`)
        if (response.ok) {
          const data = await response.json()
          setResults(data.vehicles || [])
          setShowDropdown(true)
          setSelectedIndex(0)
        }
      } catch (error) {
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current)
      }
    }
  }, [search, hasSelected])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || results.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % results.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => (prev - 1 + results.length) % results.length)
        break
      case 'Enter':
        e.preventDefault()
        if (results[selectedIndex]) {
          selectVehicle(results[selectedIndex])
        }
        break
      case 'Escape':
        setShowDropdown(false)
        break
    }
  }

  const selectVehicle = (vehicle: Vehicle) => {
    const location = locations.find(l => l.id === vehicle.location._id)
    
    onVehicleSelect({
      vin: vehicle.vin,
      mileage: vehicle.mileage,
      locationId: vehicle.location._id,
      locationZip: location?.zip,
      stockNumber: vehicle.stockNumber,
      year: vehicle.year,
      make: vehicle.make,
      model: vehicle.model,
      trim: vehicle.trim,
      price: vehicle.price
    })

    // Update search input to show selected vehicle
    setSearch(`${vehicle.stockNumber} - ${vehicle.year} ${vehicle.make} ${vehicle.model}`)
    setShowDropdown(false)
    setResults([]) // Clear results to prevent "No vehicles found" from showing
    setHasSelected(true) // Mark that a vehicle has been selected
  }

  return (
    <div className={`relative ${className}`}>
      {label && <Label className="mb-2 block">{label}</Label>}
      
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setHasSelected(false) // Reset selection flag when user types
            if (e.target.value.length < 2) {
              setResults([]) // Clear results when search is too short
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="pl-10 pr-10"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
        )}
      </div>

      {/* Dropdown Results */}
      {showDropdown && results.length > 0 && (
        <div 
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg shadow-lg max-h-80 overflow-y-auto"
        >
          {results.map((vehicle, index) => (
            <button
              key={vehicle._id}
              onClick={() => selectVehicle(vehicle)}
              className={`w-full px-4 py-3 text-left hover:bg-[#2a2a2a] transition-colors ${
                index === selectedIndex ? 'bg-[#2a2a2a]' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <Car className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-white">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </div>
                    <div className="text-sm text-gray-400">
                      ${vehicle.price.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-sm text-gray-400 mt-1">
                    Stock: {vehicle.stockNumber} • VIN: {vehicle.vin} • {vehicle.mileage.toLocaleString()} mi
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {vehicle.location.name}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No Results */}
      {showDropdown && search.length >= 2 && results.length === 0 && !isLoading && (
        <div className="absolute z-50 w-full mt-1 bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg shadow-lg p-4 text-center text-gray-400">
          No vehicles found
        </div>
      )}
    </div>
  )
}