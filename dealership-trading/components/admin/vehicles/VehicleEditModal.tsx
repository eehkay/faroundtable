'use client'

import { useState, useEffect } from 'react'
import { X, FileText, Key, DollarSign, Calendar, MapPin, Trash2, Plus, Loader2 } from 'lucide-react'
import { Vehicle, DealershipLocation } from '@/types/vehicle'
import { format } from 'date-fns'

interface VehicleWithLocation extends Vehicle {
  dealership_location?: DealershipLocation
}

interface VehicleEditModalProps {
  vehicle: VehicleWithLocation
  isOpen: boolean
  onClose: () => void
  onSave: (updates: Partial<Vehicle>) => Promise<void>
  onDelete: () => void
}

export default function VehicleEditModal({
  vehicle,
  isOpen,
  onClose,
  onSave,
  onDelete,
}: VehicleEditModalProps) {
  const [formData, setFormData] = useState<Partial<Vehicle>>({})
  const [features, setFeatures] = useState<string[]>(vehicle.features || [])
  const [newFeature, setNewFeature] = useState('')
  const [saving, setSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    setFormData({
      price: vehicle.price,
      salePrice: vehicle.salePrice,
      status: vehicle.status,
      condition: vehicle.condition,
      mileage: vehicle.mileage,
      description: vehicle.description,
    })
    setFeatures(vehicle.features || [])
  }, [vehicle])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave({
        ...formData,
        features,
      })
      onClose()
    } catch (error) {
      console.error('Error saving vehicle:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleAddFeature = () => {
    if (newFeature.trim() && !features.includes(newFeature.trim())) {
      setFeatures([...features, newFeature.trim()])
      setNewFeature('')
    }
  }

  const handleRemoveFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index))
  }

  const handleDelete = () => {
    onDelete()
    onClose()
  }

  if (!isOpen) return null

  const vehicleTitle = `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim || ''}`.trim()

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/80" onClick={onClose} />
        
        <div className="relative bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="sticky top-0 bg-[#1f1f1f] border-b border-[#2a2a2a] p-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">{vehicleTitle}</h2>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Vehicle Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-gray-400">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm">Stock:</span>
                  <span className="text-white font-medium">{vehicle.stockNumber}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <Key className="h-4 w-4" />
                  <span className="text-sm">VIN:</span>
                  <span className="text-white font-mono text-sm">{vehicle.vin}</span>
                </div>
              </div>

              {/* Pricing */}
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-3">Pricing</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Retail Price *
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <input
                        type="number"
                        value={formData.price || ''}
                        onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                        className="w-full pl-10 pr-3 py-2 bg-[#141414] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Sale Price
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <input
                        type="number"
                        value={formData.salePrice || ''}
                        onChange={(e) => setFormData({ ...formData, salePrice: parseInt(e.target.value) || undefined })}
                        className="w-full pl-10 pr-3 py-2 bg-[#141414] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Vehicle Details */}
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-3">Vehicle Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status || vehicle.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as Vehicle['status'] })}
                      className="w-full px-3 py-2 bg-[#141414] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="available">Available</option>
                      <option value="claimed">Claimed</option>
                      <option value="in-transit">In Transit</option>
                      <option value="delivered">Delivered</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Condition
                    </label>
                    <select
                      value={formData.condition || vehicle.condition}
                      onChange={(e) => setFormData({ ...formData, condition: e.target.value as Vehicle['condition'] })}
                      className="w-full px-3 py-2 bg-[#141414] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="new">New</option>
                      <option value="used">Used</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Mileage
                    </label>
                    <input
                      type="number"
                      value={formData.mileage || ''}
                      onChange={(e) => setFormData({ ...formData, mileage: parseInt(e.target.value) || undefined })}
                      className="w-full px-3 py-2 bg-[#141414] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Location
                    </label>
                    <div className="flex items-center gap-2 px-3 py-2 bg-[#141414] border border-[#2a2a2a] rounded-lg">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="text-white">{vehicle.dealership_location?.name || vehicle.storeCode}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-3">Features</h3>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFeature())}
                      placeholder="Add a feature"
                      className="flex-1 px-3 py-2 bg-[#141414] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddFeature}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {features.map((feature, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 px-3 py-1 bg-[#141414] border border-[#2a2a2a] rounded-full"
                      >
                        <span className="text-sm text-white">{feature}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFeature(index)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-3">Notes</h3>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 bg-[#141414] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
                  placeholder="Add any additional notes..."
                />
              </div>

              {/* System Information */}
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-3">System Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-400">Imported:</span>
                    <span className="text-white">
                      {vehicle.importedAt ? format(new Date(vehicle.importedAt), 'MMM d, yyyy') : 'Unknown'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-400">Last Updated:</span>
                    <span className="text-white">
                      {vehicle.lastSeenInFeed ? format(new Date(vehicle.lastSeenInFeed), 'MMM d, yyyy') : 'Unknown'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Days on Lot:</span>
                    <span className="text-white">{vehicle.daysOnLot || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-[#1f1f1f] border-t border-[#2a2a2a] p-6 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 bg-red-600/20 text-red-500 rounded-lg hover:bg-red-600/30 transition-colors flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete Vehicle
              </button>
              
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-[#141414] border border-[#2a2a2a] text-white rounded-lg hover:bg-[#2a2a2a] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </div>
          </form>

          {/* Delete Confirmation Dialog */}
          {showDeleteConfirm && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4">
              <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg p-6 max-w-md">
                <h3 className="text-lg font-semibold text-white mb-2">Delete Vehicle?</h3>
                <p className="text-gray-400 mb-6">
                  This action cannot be undone. This will permanently delete the vehicle and all associated data (comments, activities, etc.)
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 px-4 py-2 bg-[#141414] border border-[#2a2a2a] text-white rounded-lg hover:bg-[#2a2a2a] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Delete Vehicle
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}