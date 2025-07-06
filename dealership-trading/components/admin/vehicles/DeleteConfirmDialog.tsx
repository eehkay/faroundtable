'use client'

import { AlertTriangle } from 'lucide-react'

interface DeleteConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  vehicleCount: number
}

export default function DeleteConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  vehicleCount,
}: DeleteConfirmDialogProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/80" onClick={onClose} />
        
        <div className="relative bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg w-full max-w-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-shrink-0 w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-white">
              Delete {vehicleCount} {vehicleCount === 1 ? 'vehicle' : 'vehicles'}?
            </h3>
          </div>
          
          <p className="text-gray-400 mb-6">
            This action cannot be undone. This will permanently delete the selected {vehicleCount === 1 ? 'vehicle' : 'vehicles'} and all associated data including comments, activities, and transfer history.
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-[#141414] border border-[#2a2a2a] text-white rounded-lg hover:bg-[#2a2a2a] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete {vehicleCount === 1 ? 'Vehicle' : `${vehicleCount} Vehicles`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}