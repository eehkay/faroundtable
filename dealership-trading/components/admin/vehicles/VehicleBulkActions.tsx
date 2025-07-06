'use client'

import { useState, useRef, useEffect } from 'react'
import { Trash2, Download, MoreVertical, CheckSquare } from 'lucide-react'

interface VehicleBulkActionsProps {
  selectedCount: number
  onDelete: () => void
  onExport: () => void
}

export default function VehicleBulkActions({
  selectedCount,
  onDelete,
  onExport,
}: VehicleBulkActionsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
      >
        <CheckSquare className="h-4 w-4" />
        {selectedCount} Selected
        <MoreVertical className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg shadow-lg z-10">
          <div className="py-1">
            <button
              onClick={() => {
                onExport()
                setIsOpen(false)
              }}
              className="w-full px-4 py-2 text-left text-sm text-white hover:bg-[#2a2a2a] transition-colors flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export Selected
            </button>
            <div className="my-1 border-t border-[#2a2a2a]" />
            <button
              onClick={() => {
                onDelete()
                setIsOpen(false)
              }}
              className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-red-500/10 transition-colors flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete Selected
            </button>
          </div>
        </div>
      )}
    </div>
  )
}