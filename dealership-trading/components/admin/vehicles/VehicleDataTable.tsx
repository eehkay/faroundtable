'use client'

import { useState, useRef, useEffect } from 'react'
import { Vehicle, DealershipLocation } from '@/types/vehicle'
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'

interface VehicleWithLocation extends Vehicle {
  dealership_location?: DealershipLocation
}

interface VehicleDataTableProps {
  vehicles: VehicleWithLocation[]
  selectedVehicles: Set<string>
  onSelectionChange: (selected: Set<string>) => void
  onVehicleClick: (vehicle: VehicleWithLocation) => void
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

type SortKey = 'stockNumber' | 'year' | 'make' | 'model' | 'price' | 'status' | 'daysOnLot'
type SortDirection = 'asc' | 'desc'

export default function VehicleDataTable({
  vehicles,
  selectedVehicles,
  onSelectionChange,
  onVehicleClick,
  currentPage,
  totalPages,
  onPageChange,
}: VehicleDataTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('stockNumber')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const checkboxRef = useRef<HTMLInputElement>(null)

  // Set indeterminate state on checkbox
  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = selectedVehicles.size > 0 && selectedVehicles.size < vehicles.length
    }
  }, [selectedVehicles.size, vehicles.length])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDirection('asc')
    }
  }

  const sortedVehicles = [...vehicles].sort((a, b) => {
    const aValue = a[sortKey]
    const bValue = b[sortKey]

    if (aValue === null || aValue === undefined) return 1
    if (bValue === null || bValue === undefined) return -1

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  const handleSelectAll = () => {
    if (selectedVehicles.size === vehicles.length) {
      onSelectionChange(new Set())
    } else {
      onSelectionChange(new Set(vehicles.map(v => v._id!)))
    }
  }

  const handleSelectVehicle = (vehicleId: string) => {
    const newSelection = new Set(selectedVehicles)
    if (newSelection.has(vehicleId)) {
      newSelection.delete(vehicleId)
    } else {
      newSelection.add(vehicleId)
    }
    onSelectionChange(newSelection)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'text-green-500'
      case 'claimed':
        return 'text-blue-500'
      case 'in-transit':
        return 'text-yellow-500'
      case 'delivered':
        return 'text-gray-500'
      default:
        return 'text-gray-400'
    }
  }

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) {
      return <div className="w-4 h-4" />
    }
    return sortDirection === 'asc' ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    )
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#2a2a2a]">
              <th className="text-left p-4">
                <input
                  ref={checkboxRef}
                  type="checkbox"
                  checked={selectedVehicles.size === vehicles.length && vehicles.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-600 bg-[#141414] text-blue-500 focus:ring-blue-500"
                />
              </th>
              <th className="text-left p-4">
                <button
                  onClick={() => handleSort('stockNumber')}
                  className="flex items-center gap-1 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                >
                  Stock
                  <SortIcon column="stockNumber" />
                </button>
              </th>
              <th className="text-left p-4 text-sm font-medium text-gray-400">VIN</th>
              <th className="text-left p-4 text-sm font-medium text-gray-400">Condition</th>
              <th className="text-left p-4">
                <button
                  onClick={() => handleSort('year')}
                  className="flex items-center gap-1 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                >
                  Year
                  <SortIcon column="year" />
                </button>
              </th>
              <th className="text-left p-4">
                <button
                  onClick={() => handleSort('make')}
                  className="flex items-center gap-1 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                >
                  Make
                  <SortIcon column="make" />
                </button>
              </th>
              <th className="text-left p-4">
                <button
                  onClick={() => handleSort('model')}
                  className="flex items-center gap-1 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                >
                  Model
                  <SortIcon column="model" />
                </button>
              </th>
              <th className="text-left p-4 text-sm font-medium text-gray-400">Trim</th>
              <th className="text-left p-4 text-sm font-medium text-gray-400">Location</th>
              <th className="text-left p-4">
                <button
                  onClick={() => handleSort('price')}
                  className="flex items-center gap-1 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                >
                  Price
                  <SortIcon column="price" />
                </button>
              </th>
              <th className="text-left p-4">
                <button
                  onClick={() => handleSort('status')}
                  className="flex items-center gap-1 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                >
                  Status
                  <SortIcon column="status" />
                </button>
              </th>
              <th className="text-left p-4">
                <button
                  onClick={() => handleSort('daysOnLot')}
                  className="flex items-center gap-1 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                >
                  Days
                  <SortIcon column="daysOnLot" />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedVehicles.map((vehicle) => (
              <tr
                key={vehicle._id}
                onClick={() => onVehicleClick(vehicle)}
                className="border-b border-[#2a2a2a] hover:bg-[#2a2a2a] cursor-pointer transition-colors"
              >
                <td className="p-4" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedVehicles.has(vehicle._id!)}
                    onChange={() => handleSelectVehicle(vehicle._id!)}
                    className="rounded border-gray-600 bg-[#141414] text-blue-500 focus:ring-blue-500"
                  />
                </td>
                <td className="p-4 text-white font-medium">{vehicle.stockNumber}</td>
                <td className="p-4 text-gray-400 font-mono text-sm">{vehicle.vin}</td>
                <td className="p-4">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    vehicle.condition === 'new' 
                      ? 'bg-green-500/20 text-green-500' 
                      : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {vehicle.condition}
                  </span>
                </td>
                <td className="p-4 text-white">{vehicle.year}</td>
                <td className="p-4 text-white">{vehicle.make}</td>
                <td className="p-4 text-white">{vehicle.model}</td>
                <td className="p-4 text-gray-400">{vehicle.trim || '-'}</td>
                <td className="p-4 text-gray-400">
                  {vehicle.dealership_location?.name || vehicle.storeCode}
                </td>
                <td className="p-4 text-white font-medium">{formatPrice(vehicle.price)}</td>
                <td className="p-4">
                  <span className={`font-medium ${getStatusColor(vehicle.status)}`}>
                    {vehicle.status.charAt(0).toUpperCase() + vehicle.status.slice(1)}
                  </span>
                </td>
                <td className="p-4 text-gray-400">{vehicle.daysOnLot || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between p-4 border-t border-[#2a2a2a]">
        <div className="text-sm text-gray-400">
          Showing {((currentPage - 1) * 50) + 1}-{Math.min(currentPage * 50, vehicles.length)} of {vehicles.length}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 rounded-lg bg-[#141414] border border-[#2a2a2a] text-white hover:bg-[#1f1f1f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="px-4 py-2 text-sm text-gray-400">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg bg-[#141414] border border-[#2a2a2a] text-white hover:bg-[#1f1f1f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}