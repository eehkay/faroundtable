'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { supabase } from '@/lib/supabase-client'
import { Vehicle, DealershipLocation } from '@/types/vehicle'
import { Search, Filter, Download, Plus, Loader2 } from 'lucide-react'
import VehicleDataTable from '@/components/admin/vehicles/VehicleDataTable'
import VehicleFilters from '@/components/admin/vehicles/VehicleFilters'
import VehicleEditModal from '@/components/admin/vehicles/VehicleEditModal'
import VehicleBulkActions from '@/components/admin/vehicles/VehicleBulkActions'
import DeleteConfirmDialog from '@/components/admin/vehicles/DeleteConfirmDialog'
import { toast } from 'sonner'
import { useDebouncedCallback } from 'use-debounce'

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

export default function VehicleManagementClient() {
  const { data: session } = useSession()
  const [vehicles, setVehicles] = useState<VehicleWithLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    status: 'all',
    condition: 'all',
    location: 'all',
    priceRange: 'all',
  })
  const [selectedVehicles, setSelectedVehicles] = useState<Set<string>>(new Set())
  const [editingVehicle, setEditingVehicle] = useState<VehicleWithLocation | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [vehiclesToDelete, setVehiclesToDelete] = useState<string[]>([])

  // Debounced search handler
  const debouncedSearch = useDebouncedCallback((value: string) => {
    setDebouncedSearchTerm(value)
  }, 300)

  // Update debounced search term when search term changes
  useEffect(() => {
    debouncedSearch(searchTerm)
  }, [searchTerm, debouncedSearch])

  // Fetch vehicles with filters
  const fetchVehicles = useCallback(async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('vehicles')
        .select(`
          *,
          location:location_id(
            id,
            name,
            code,
            address,
            city,
            state,
            zip
          ),
          original_location:original_location_id(
            id,
            name,
            code
          ),
          current_transfer:current_transfer_id(
            id,
            status,
            from_location_id,
            to_location_id,
            requested_by_id,
            reason,
            transfer_notes,
            requested_by_date,
            customer_waiting,
            priority,
            expected_pickup_date,
            actual_pickup_date,
            delivered_date,
            created_at,
            from_location:from_location_id(
              id,
              name,
              code
            ),
            to_location:to_location_id(
              id,
              name,
              code
            ),
            requested_by:requested_by_id(
              id,
              name,
              email
            )
          )
        `, { count: 'exact' })
        .order('imported_at', { ascending: false })
        .range((page - 1) * 50, page * 50 - 1)

      // Apply search filter
      if (debouncedSearchTerm) {
        query = query.or(`stock_number.ilike.%${debouncedSearchTerm}%,vin.ilike.%${debouncedSearchTerm}%,make.ilike.%${debouncedSearchTerm}%,model.ilike.%${debouncedSearchTerm}%`)
      }

      // Apply status filter
      if (filters.status !== 'all') {
        query = query.eq('status', filters.status)
      }

      // Apply condition filter
      if (filters.condition !== 'all') {
        query = query.eq('condition', filters.condition)
      }

      // Apply location filter
      if (filters.location !== 'all') {
        query = query.eq('store_code', filters.location)
      }

      // Apply price range filter
      if (filters.priceRange !== 'all') {
        const [min, max] = filters.priceRange.split('-').map(Number)
        if (max) {
          query = query.gte('price', min).lte('price', max)
        } else {
          query = query.gte('price', min)
        }
      }

      const { data, error, count } = await query

      if (error) throw error

      // Transform snake_case to camelCase
      const transformedVehicles = (data || []).map((vehicle: any) => ({
        _id: vehicle.id,
        stockNumber: vehicle.stock_number,
        vin: vehicle.vin,
        year: vehicle.year,
        make: vehicle.make,
        model: vehicle.model,
        trim: vehicle.trim,
        title: vehicle.title,
        price: vehicle.price,
        salePrice: vehicle.sale_price,
        msrp: vehicle.msrp,
        mileage: vehicle.mileage,
        condition: vehicle.condition,
        exteriorColor: vehicle.exterior_color,
        bodyStyle: vehicle.body_style,
        fuelType: vehicle.fuel_type,
        description: vehicle.description,
        features: vehicle.features || [],
        status: vehicle.status,
        storeCode: vehicle.store_code,
        address: vehicle.address,
        location: vehicle.location,
        dealership_location: vehicle.location,
        originalLocation: vehicle.original_location,
        currentTransfer: vehicle.current_transfer,
        imageUrls: vehicle.image_urls || [],
        importedAt: vehicle.imported_at,
        lastSeenInFeed: vehicle.last_seen_in_feed,
        daysOnLot: vehicle.days_on_lot
      }))

      setVehicles(transformedVehicles)
      setTotalCount(count || 0)
    } catch (error) {
      console.error('Error fetching vehicles:', error)
      toast.error('Failed to load vehicles')
    } finally {
      setLoading(false)
    }
  }, [debouncedSearchTerm, filters, page])

  useEffect(() => {
    fetchVehicles()
  }, [fetchVehicles])

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('vehicles-admin')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'vehicles' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            fetchVehicles()
          } else if (payload.eventType === 'UPDATE') {
            // Transform the updated data
            const transformed = {
              _id: payload.new.id,
              stockNumber: payload.new.stock_number,
              vin: payload.new.vin,
              year: payload.new.year,
              make: payload.new.make,
              model: payload.new.model,
              trim: payload.new.trim,
              title: payload.new.title,
              price: payload.new.price,
              salePrice: payload.new.sale_price,
              msrp: payload.new.msrp,
              mileage: payload.new.mileage,
              condition: payload.new.condition,
              exteriorColor: payload.new.exterior_color,
              bodyStyle: payload.new.body_style,
              fuelType: payload.new.fuel_type,
              description: payload.new.description,
              features: payload.new.features || [],
              status: payload.new.status,
              storeCode: payload.new.store_code,
              address: payload.new.address,
              imageUrls: payload.new.image_urls || [],
              importedAt: payload.new.imported_at,
              lastSeenInFeed: payload.new.last_seen_in_feed,
              daysOnLot: payload.new.days_on_lot
            }
            setVehicles(prev => 
              prev.map(v => v._id === payload.new.id ? { ...v, ...transformed } : v)
            )
          } else if (payload.eventType === 'DELETE') {
            setVehicles(prev => prev.filter(v => v._id !== payload.old.id))
            setTotalCount(prev => prev - 1)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchVehicles])

  const handleUpdateVehicle = async (vehicleId: string, updates: Partial<Vehicle>) => {
    try {
      const response = await fetch(`/api/admin/vehicles/${vehicleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      if (!response.ok) throw new Error('Failed to update vehicle')

      toast.success('Vehicle updated successfully')
      setEditingVehicle(null)
      fetchVehicles()
    } catch (error) {
      console.error('Error updating vehicle:', error)
      toast.error('Failed to update vehicle')
    }
  }

  const handleDeleteVehicles = async (vehicleIds: string[]) => {
    setVehiclesToDelete(vehicleIds)
    setShowDeleteConfirm(true)
  }

  const confirmDelete = async () => {
    try {
      const response = await fetch('/api/admin/vehicles', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: vehiclesToDelete }),
      })

      if (!response.ok) throw new Error('Failed to delete vehicles')

      toast.success(`${vehiclesToDelete.length} vehicle(s) deleted successfully`)
      setSelectedVehicles(new Set())
      setShowDeleteConfirm(false)
      setVehiclesToDelete([])
      fetchVehicles()
    } catch (error) {
      console.error('Error deleting vehicles:', error)
      toast.error('Failed to delete vehicles')
    }
  }

  const handleExport = async () => {
    try {
      const response = await fetch('/api/admin/vehicles/export?' + new URLSearchParams({
        search: debouncedSearchTerm,
        status: filters.status,
        condition: filters.condition,
        location: filters.location,
        priceRange: filters.priceRange,
      }))

      if (!response.ok) throw new Error('Failed to export data')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `vehicles-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('Export completed successfully')
    } catch (error) {
      console.error('Error exporting vehicles:', error)
      toast.error('Failed to export vehicles')
    }
  }

  const stats = {
    total: totalCount,
    available: vehicles.filter(v => v.status === 'available').length,
    claimed: vehicles.filter(v => v.status === 'claimed').length,
    inTransit: vehicles.filter(v => v.status === 'in-transit').length,
    delivered: vehicles.filter(v => v.status === 'delivered').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Vehicles</h1>
        <p className="text-gray-400 mt-1">View and manage your vehicles</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-[#1f1f1f] border border-[#2a2a2a] p-4 rounded-lg">
          <p className="text-sm text-gray-400">Total Vehicles</p>
          <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
        </div>
        <div className="bg-[#1f1f1f] border border-[#2a2a2a] p-4 rounded-lg">
          <p className="text-sm text-gray-400">Available</p>
          <p className="text-2xl font-bold text-green-500 mt-1">{stats.available}</p>
        </div>
        <div className="bg-[#1f1f1f] border border-[#2a2a2a] p-4 rounded-lg">
          <p className="text-sm text-gray-400">Claimed</p>
          <p className="text-2xl font-bold text-blue-500 mt-1">{stats.claimed}</p>
        </div>
        <div className="bg-[#1f1f1f] border border-[#2a2a2a] p-4 rounded-lg">
          <p className="text-sm text-gray-400">In Transit</p>
          <p className="text-2xl font-bold text-yellow-500 mt-1">{stats.inTransit}</p>
        </div>
        <div className="bg-[#1f1f1f] border border-[#2a2a2a] p-4 rounded-lg">
          <p className="text-sm text-gray-400">Delivered</p>
          <p className="text-2xl font-bold text-gray-500 mt-1">{stats.delivered}</p>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search inventory"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#141414] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 bg-[#141414] border border-[#2a2a2a] rounded-lg text-white hover:bg-[#1f1f1f] transition-colors flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
          </button>
          
          {selectedVehicles.size > 0 && (
            <VehicleBulkActions
              selectedCount={selectedVehicles.size}
              onDelete={() => handleDeleteVehicles(Array.from(selectedVehicles))}
              onExport={handleExport}
            />
          )}
          
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-[#141414] border border-[#2a2a2a] rounded-lg text-white hover:bg-[#1f1f1f] transition-colors flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <VehicleFilters
          filters={filters}
          onFiltersChange={setFilters}
          onClose={() => setShowFilters(false)}
        />
      )}

      {/* Table */}
      <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <VehicleDataTable
            vehicles={vehicles}
            selectedVehicles={selectedVehicles}
            onSelectionChange={setSelectedVehicles}
            onVehicleClick={setEditingVehicle}
            currentPage={page}
            totalPages={Math.ceil(totalCount / 50)}
            onPageChange={setPage}
          />
        )}
      </div>

      {/* Edit Modal */}
      {editingVehicle && (
        <VehicleEditModal
          vehicle={editingVehicle}
          isOpen={!!editingVehicle}
          onClose={() => setEditingVehicle(null)}
          onSave={(updates) => handleUpdateVehicle(editingVehicle._id!, updates)}
          onDelete={() => handleDeleteVehicles([editingVehicle._id!])}
        />
      )}

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false)
          setVehiclesToDelete([])
        }}
        onConfirm={confirmDelete}
        vehicleCount={vehiclesToDelete.length}
      />
    </div>
  )
}