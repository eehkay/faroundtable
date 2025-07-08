'use client'

import { useState, useRef, useEffect } from 'react'
import { Vehicle, DealershipLocation } from '@/types/vehicle'
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, AlertCircle, Clock, AlertTriangle, RotateCcw } from 'lucide-react'

interface VehicleWithLocation extends Vehicle {
  dealership_location?: DealershipLocation
  originalLocation?: DealershipLocation
  currentTransfer?: {
    id: string
    status: string
    from_location_id: string
    to_location_id: string
    requested_by_id: string
    reason?: string
    transfer_notes: string
    requested_by_date: string
    customer_waiting: boolean
    priority: string
    expected_pickup_date?: string
    actual_pickup_date?: string
    delivered_date?: string
    created_at: string
    from_location?: DealershipLocation
    to_location?: DealershipLocation
    requested_by?: {
      id: string
      name: string
      email: string
    }
  }
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

interface ColumnWidths {
  checkbox: number
  stockNumber: number
  vin: number
  condition: number
  year: number
  make: number
  model: number
  trim: number
  location: number
  transferInfo: number
  price: number
  status: number
  days: number
}

const DEFAULT_COLUMN_WIDTHS: ColumnWidths = {
  checkbox: 50,
  stockNumber: 120,
  vin: 180,
  condition: 100,
  year: 80,
  make: 120,
  model: 120,
  trim: 120,
  location: 150,
  transferInfo: 250,
  price: 120,
  status: 120,
  days: 80
}

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
  
  // Column resizing state
  const [columnWidths, setColumnWidths] = useState<ColumnWidths>(() => {
    // Load saved widths from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vehicleTableColumnWidths')
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch (e) {
          console.error('Failed to parse saved column widths:', e)
        }
      }
    }
    return DEFAULT_COLUMN_WIDTHS
  })
  const [resizingColumn, setResizingColumn] = useState<keyof ColumnWidths | null>(null)
  const [startX, setStartX] = useState(0)
  const [startWidth, setStartWidth] = useState(0)

  // Set indeterminate state on checkbox
  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = selectedVehicles.size > 0 && selectedVehicles.size < vehicles.length
    }
  }, [selectedVehicles.size, vehicles.length])

  // Save column widths to localStorage when they change
  useEffect(() => {
    localStorage.setItem('vehicleTableColumnWidths', JSON.stringify(columnWidths))
  }, [columnWidths])

  // Handle column resize
  const handleMouseDown = (column: keyof ColumnWidths, e: React.MouseEvent) => {
    e.preventDefault()
    setResizingColumn(column)
    setStartX(e.clientX)
    setStartWidth(columnWidths[column])
  }

  useEffect(() => {
    if (!resizingColumn) return

    // Add class to body to change cursor and prevent selection
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    const handleMouseMove = (e: MouseEvent) => {
      const diff = e.clientX - startX
      const newWidth = Math.max(50, Math.min(500, startWidth + diff)) // Min 50px, max 500px
      
      setColumnWidths(prev => ({
        ...prev,
        [resizingColumn]: newWidth
      }))
    }

    const handleMouseUp = () => {
      setResizingColumn(null)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [resizingColumn, startX, startWidth])

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

  const getTransferStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
      requested: { bg: 'bg-blue-500/20', text: 'text-blue-500', label: 'Requested' },
      approved: { bg: 'bg-yellow-500/20', text: 'text-yellow-500', label: 'Approved' },
      'in-transit': { bg: 'bg-orange-500/20', text: 'text-orange-500', label: 'In Transit' },
      delivered: { bg: 'bg-gray-500/20', text: 'text-gray-400', label: 'Delivered' },
      cancelled: { bg: 'bg-red-500/20', text: 'text-red-500', label: 'Cancelled' },
      rejected: { bg: 'bg-red-500/20', text: 'text-red-500', label: 'Rejected' }
    }
    
    const config = statusConfig[status] || { bg: 'bg-gray-500/20', text: 'text-gray-400', label: status }
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    )
  }

  const getRowBackground = (vehicle: VehicleWithLocation) => {
    if (!vehicle.currentTransfer) return ''
    
    const transferStatus = vehicle.currentTransfer.status
    const isRecent = vehicle.currentTransfer.delivered_date && 
      new Date(vehicle.currentTransfer.delivered_date).getTime() > Date.now() - (3 * 24 * 60 * 60 * 1000)
    
    switch (transferStatus) {
      case 'requested':
        return 'bg-blue-500/5'
      case 'approved':
        return 'bg-yellow-500/5'
      case 'in-transit':
        return 'bg-orange-500/5'
      case 'delivered':
        return isRecent ? 'bg-gray-500/5' : ''
      default:
        return ''
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
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

  const ResizeHandle = ({ column }: { column: keyof ColumnWidths }) => (
    <div
      className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-500 transition-colors group"
      onMouseDown={(e) => handleMouseDown(column, e)}
    >
      <div className="absolute right-[-2px] top-0 h-full w-[5px]" />
    </div>
  )

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-[#2a2a2a]">
        <table className="w-full" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: columnWidths.checkbox }} />
            <col style={{ width: columnWidths.stockNumber }} />
            <col style={{ width: columnWidths.vin }} />
            <col style={{ width: columnWidths.condition }} className="hidden xl:table-column" />
            <col style={{ width: columnWidths.year }} />
            <col style={{ width: columnWidths.make }} />
            <col style={{ width: columnWidths.model }} />
            <col style={{ width: columnWidths.trim }} className="hidden lg:table-column" />
            <col style={{ width: columnWidths.location }} />
            <col style={{ width: columnWidths.transferInfo }} />
            <col style={{ width: columnWidths.price }} />
            <col style={{ width: columnWidths.status }} />
            <col style={{ width: columnWidths.days }} />
          </colgroup>
          <thead>
            <tr className="border-b border-[#2a2a2a]">
              <th className="relative text-left px-6 py-4">
                <input
                  ref={checkboxRef}
                  type="checkbox"
                  checked={selectedVehicles.size === vehicles.length && vehicles.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-600 bg-[#141414] text-blue-500 focus:ring-blue-500"
                />
                <ResizeHandle column="checkbox" />
              </th>
              <th className="relative text-left px-6 py-4">
                <button
                  onClick={() => handleSort('stockNumber')}
                  className="flex items-center gap-1 text-base font-medium text-gray-400 hover:text-white transition-colors"
                >
                  Stock
                  <SortIcon column="stockNumber" />
                </button>
                <ResizeHandle column="stockNumber" />
              </th>
              <th className="relative text-left px-6 py-4 text-base font-medium text-gray-400">
                VIN
                <ResizeHandle column="vin" />
              </th>
              <th className="relative text-left px-6 py-4 text-base font-medium text-gray-400 hidden xl:table-cell">
                Condition
                <ResizeHandle column="condition" />
              </th>
              <th className="relative text-left px-6 py-4">
                <button
                  onClick={() => handleSort('year')}
                  className="flex items-center gap-1 text-base font-medium text-gray-400 hover:text-white transition-colors"
                >
                  Year
                  <SortIcon column="year" />
                </button>
                <ResizeHandle column="year" />
              </th>
              <th className="relative text-left px-6 py-4">
                <button
                  onClick={() => handleSort('make')}
                  className="flex items-center gap-1 text-base font-medium text-gray-400 hover:text-white transition-colors"
                >
                  Make
                  <SortIcon column="make" />
                </button>
                <ResizeHandle column="make" />
              </th>
              <th className="relative text-left px-6 py-4">
                <button
                  onClick={() => handleSort('model')}
                  className="flex items-center gap-1 text-base font-medium text-gray-400 hover:text-white transition-colors"
                >
                  Model
                  <SortIcon column="model" />
                </button>
                <ResizeHandle column="model" />
              </th>
              <th className="relative text-left px-6 py-4 text-base font-medium text-gray-400 hidden lg:table-cell">
                Trim
                <ResizeHandle column="trim" />
              </th>
              <th className="relative text-left px-6 py-4 text-base font-medium text-gray-400">
                Location
                <ResizeHandle column="location" />
              </th>
              <th className="relative text-left px-6 py-4 text-base font-medium text-gray-400">
                Transfer Info
                <ResizeHandle column="transferInfo" />
              </th>
              <th className="relative text-left px-6 py-4">
                <button
                  onClick={() => handleSort('price')}
                  className="flex items-center gap-1 text-base font-medium text-gray-400 hover:text-white transition-colors"
                >
                  Price
                  <SortIcon column="price" />
                </button>
                <ResizeHandle column="price" />
              </th>
              <th className="relative text-left px-6 py-4">
                <button
                  onClick={() => handleSort('status')}
                  className="flex items-center gap-1 text-base font-medium text-gray-400 hover:text-white transition-colors"
                >
                  Status
                  <SortIcon column="status" />
                </button>
                <ResizeHandle column="status" />
              </th>
              <th className="relative text-left px-6 py-4">
                <button
                  onClick={() => handleSort('daysOnLot')}
                  className="flex items-center gap-1 text-base font-medium text-gray-400 hover:text-white transition-colors"
                >
                  Days
                  <SortIcon column="daysOnLot" />
                </button>
                <ResizeHandle column="days" />
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedVehicles.map((vehicle) => (
              <tr
                key={vehicle._id}
                onClick={() => onVehicleClick(vehicle)}
                className={`border-b border-[#2a2a2a] hover:bg-[#333333] cursor-pointer transition-all duration-200 ${getRowBackground(vehicle)} even:bg-[#0a0a0a]`}
              >
                <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedVehicles.has(vehicle._id!)}
                    onChange={() => handleSelectVehicle(vehicle._id!)}
                    className="rounded border-gray-600 bg-[#141414] text-blue-500 focus:ring-blue-500"
                  />
                </td>
                <td className="px-6 py-4 text-white font-medium">{vehicle.stockNumber}</td>
                <td className="px-6 py-4 text-gray-400 font-mono text-sm">
                  <span className="block truncate max-w-[180px]" title={vehicle.vin}>
                    {vehicle.vin}
                  </span>
                </td>
                <td className="px-6 py-4 hidden xl:table-cell">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    vehicle.condition === 'new' 
                      ? 'bg-green-500/20 text-green-500' 
                      : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {vehicle.condition}
                  </span>
                </td>
                <td className="px-6 py-4 text-white">{vehicle.year}</td>
                <td className="px-6 py-4 text-white">{vehicle.make}</td>
                <td className="px-6 py-4 text-white">{vehicle.model}</td>
                <td className="px-6 py-4 text-gray-400 hidden lg:table-cell">{vehicle.trim || '-'}</td>
                <td className="px-6 py-4 text-gray-400">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="block truncate max-w-[150px]" title={vehicle.dealership_location?.name || vehicle.storeCode}>
                        {vehicle.dealership_location?.name || vehicle.storeCode}
                      </span>
                      {vehicle.currentTransfer && 
                       vehicle.currentTransfer.status === 'delivered' && 
                       vehicle.dealership_location?._id !== vehicle.currentTransfer.to_location_id && (
                        <div className="relative group">
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-10">
                            <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                              Location mismatch: Should be at {vehicle.currentTransfer.to_location?.name}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    {vehicle.originalLocation && vehicle.originalLocation._id !== vehicle.dealership_location?._id && (
                      <span className="text-xs text-gray-500">
                        Originally: {vehicle.originalLocation.name}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {vehicle.currentTransfer ? (
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400" title={vehicle.currentTransfer.from_location?.name}>
                          {vehicle.currentTransfer.from_location?.code || 'Unknown'}
                        </span>
                        <span className="text-gray-500">→</span>
                        <span className="text-sm text-white font-medium" title={vehicle.currentTransfer.to_location?.name}>
                          {vehicle.currentTransfer.to_location?.code || 'Unknown'}
                        </span>
                        {getTransferStatusBadge(vehicle.currentTransfer.status)}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span title={`Requested by ${vehicle.currentTransfer.requested_by?.name}`}>
                          By: {vehicle.currentTransfer.requested_by?.name?.split(' ')[0] || 'Unknown'}
                        </span>
                        <span>•</span>
                        <span>{formatDate(vehicle.currentTransfer.requested_by_date)}</span>
                        {vehicle.currentTransfer.customer_waiting && (
                          <>
                            <span>•</span>
                            <span className="text-yellow-500 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Customer Waiting
                            </span>
                          </>
                        )}
                        {vehicle.currentTransfer.priority !== 'normal' && (
                          <>
                            <span>•</span>
                            <span className="text-orange-500 uppercase">{vehicle.currentTransfer.priority}</span>
                          </>
                        )}
                      </div>
                      {vehicle.currentTransfer.expected_pickup_date && (
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Pickup: {formatDate(vehicle.currentTransfer.expected_pickup_date)}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-500">-</span>
                  )}
                </td>
                <td className="px-6 py-4 text-white font-medium">{formatPrice(vehicle.price)}</td>
                <td className="px-6 py-4">
                  <span className={`font-medium ${getStatusColor(vehicle.status)}`}>
                    {vehicle.status.charAt(0).toUpperCase() + vehicle.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-400">{vehicle.daysOnLot || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between p-4 border-t border-[#2a2a2a]">
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-400">
            Showing {((currentPage - 1) * 50) + 1}-{Math.min(currentPage * 50, vehicles.length)} of {vehicles.length}
          </div>
          <button
            onClick={() => setColumnWidths(DEFAULT_COLUMN_WIDTHS)}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
            title="Reset column widths"
          >
            <RotateCcw className="h-3 w-3" />
            Reset columns
          </button>
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