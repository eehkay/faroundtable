'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { TransferWithRelations, ActivityWithRelations } from '@/types/supabase'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { ChevronLeft, Truck, Calendar, DollarSign, Edit2, Save, X, FileText } from 'lucide-react'
import { format } from 'date-fns'
import { Session } from 'next-auth'
import TransferTimeline from '@/components/transfers/TransferTimeline'
import TransferActivities from '@/components/transfers/TransferActivities'
import VehicleGallery from '@/components/vehicle/VehicleGallery'
import TransferActionModal from '@/components/transfers/TransferActionModal'
import { canEditTransportInfo, canApproveTransferForLocation, canUpdateTransferStatus, canMarkTransferAsDelivered } from '@/lib/permissions'

interface TransferDetailClientProps {
  transfer: TransferWithRelations
  activities: ActivityWithRelations[]
  currentUser: Session['user']
}

export default function TransferDetailClient({ 
  transfer: initialTransfer, 
  activities: initialActivities,
  currentUser 
}: TransferDetailClientProps) {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [transfer, setTransfer] = useState(initialTransfer)
  const [activities, setActivities] = useState(initialActivities)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editData, setEditData] = useState({
    transport_company: transfer.transport_company || '',
    transport_cost: transfer.transport_cost?.toString() || '',
    transport_pickup_date: transfer.transport_pickup_date || '',
    expected_arrival_date: transfer.expected_arrival_date || '',
    transport_notes: transfer.transport_notes || ''
  })
  const [selectedAction, setSelectedAction] = useState<'approve' | 'status' | 'cancel' | null>(null)
  const [showActionModal, setShowActionModal] = useState(false)

  const canEdit = canEditTransportInfo(currentUser, transfer)

  // Permission checks for status actions
  const canApprove = transfer.status === 'requested' && 
    canApproveTransferForLocation(currentUser.role, currentUser.location?.id || null, transfer.from_location_id)
  
  const canMarkInTransit = transfer.status === 'approved' && 
    canUpdateTransferStatus(currentUser.role)
  
  const canMarkDelivered = transfer.status === 'in-transit' && 
    canMarkTransferAsDelivered(currentUser.role, currentUser.location?.id || null, transfer.to_location_id)
  
  const canCancel = transfer.status !== 'delivered' && 
    transfer.status !== 'cancelled' &&
    (transfer.requested_by_id === currentUser.id || currentUser.role === 'admin' || currentUser.role === 'manager')

  const handlePrintPDF = () => {
    window.print()
  }

  const handleAction = (action: 'approve' | 'status' | 'cancel') => {
    setSelectedAction(action)
    setShowActionModal(true)
  }

  const handleTransferUpdate = (updatedTransfer: any) => {
    setTransfer(prev => ({ ...prev, ...updatedTransfer }))
    router.refresh()
  }

  useEffect(() => {
    // Subscribe to transfer updates
    const transferChannel = supabase
      .channel(`transfer:${transfer.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'transfers',
          filter: `id=eq.${transfer.id}`
        },
        (payload) => {
          setTransfer(prev => ({ ...prev, ...payload.new }))
        }
      )
      .subscribe()

    // Subscribe to new activities
    const activityChannel = supabase
      .channel(`activities:${transfer.vehicle_id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activities',
          filter: `vehicle_id=eq.${transfer.vehicle_id}`
        },
        async (payload) => {
          // Fetch the full activity with user data
          const { data } = await supabase
            .from('activities')
            .select('*, user:users!user_id (*)')
            .eq('id', payload.new.id)
            .single()
          
          if (data) {
            setActivities(prev => [data, ...prev])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(transferChannel)
      supabase.removeChannel(activityChannel)
    }
  }, [transfer.id, transfer.vehicle_id, supabase])

  const handleSave = async () => {
    setIsSaving(true)
    
    try {
      const response = await fetch(`/api/transfer/${transfer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transport_company: editData.transport_company || null,
          transport_cost: editData.transport_cost ? parseFloat(editData.transport_cost) : null,
          transport_pickup_date: editData.transport_pickup_date || null,
          expected_arrival_date: editData.expected_arrival_date || null,
          transport_notes: editData.transport_notes || null
        })
      })

      if (response.ok) {
        const updatedTransfer = await response.json()
        setTransfer(updatedTransfer)
        setIsEditing(false)
      } else {
        const error = await response.text()
        alert(`Failed to update: ${error}`)
      }
    } catch (error) {
      console.error('Error updating transfer:', error)
      alert('Failed to update transfer')
    } finally {
      setIsSaving(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'requested': return 'bg-yellow-600 text-white'
      case 'approved': return 'bg-blue-600 text-white'
      case 'in-transit': return 'bg-purple-600 text-white'
      case 'delivered': return 'bg-green-600 text-white'
      case 'cancelled': return 'bg-gray-600 text-white'
      case 'rejected': return 'bg-red-600 text-white'
      default: return 'bg-gray-600 text-white'
    }
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          @page {
            margin: 0.3in;
            size: letter;
          }

          body {
            background: white !important;
            color: black !important;
            font-size: 11pt !important;
          }

          .print\\:hidden {
            display: none !important;
          }

          button {
            display: none !important;
          }

          [class*="bg-[#"] {
            background-color: white !important;
            border: 1px solid #e5e5e5 !important;
          }

          .text-white {
            color: black !important;
          }

          .text-gray-400,
          .text-gray-500 {
            color: #666 !important;
          }

          /* Compact spacing */
          .mb-6 {
            margin-bottom: 0.5rem !important;
          }

          .p-6 {
            padding: 0.75rem !important;
          }

          .gap-6 {
            gap: 0.5rem !important;
          }

          .gap-4 {
            gap: 0.25rem !important;
          }

          .mb-4 {
            margin-bottom: 0.25rem !important;
          }

          .mt-1 {
            margin-top: 0.125rem !important;
          }

          .mt-2 {
            margin-top: 0.25rem !important;
          }

          .pb-8 {
            padding-bottom: 0.5rem !important;
          }

          /* Reduce font sizes */
          .text-3xl {
            font-size: 18pt !important;
          }

          .text-2xl {
            font-size: 14pt !important;
          }

          .text-xl {
            font-size: 12pt !important;
          }

          .text-lg {
            font-size: 11pt !important;
          }

          .text-base {
            font-size: 10pt !important;
          }

          .text-sm {
            font-size: 9pt !important;
          }

          .text-xs {
            font-size: 8pt !important;
          }

          /* Maintain status badge colors */
          .bg-yellow-600 {
            background-color: #fbbf24 !important;
            color: black !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .bg-blue-600 {
            background-color: #3b82f6 !important;
            color: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .bg-green-600 {
            background-color: #10b981 !important;
            color: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .bg-purple-600 {
            background-color: #9333ea !important;
            color: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .bg-red-600 {
            background-color: #ef4444 !important;
            color: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          /* Prevent page breaks */
          [class*="rounded-lg"] {
            page-break-inside: avoid;
          }

          /* Compact report header */
          .transfer-report-header {
            display: block !important;
            text-align: center;
            font-size: 16pt;
            font-weight: bold;
            margin-bottom: 0.5rem;
          }

          /* Hide hover effects */
          .hover\\:bg-\\[\\#2a2a2a\\] {
            background-color: white !important;
          }

          /* Hide vehicle gallery in print */
          .vehicle-gallery-section {
            display: none !important;
          }

          /* Compact timeline */
          .timeline-content h3 {
            font-size: 10pt !important;
          }

          /* Hide activities section for one-page report */
          .activity-feed-section {
            display: none !important;
          }

          /* Hide timeline section for one-page report */
          .timeline-section {
            display: none !important;
          }

          /* Compact transfer details grid */
          .grid-cols-1.md\\:grid-cols-2 {
            grid-template-columns: repeat(3, 1fr) !important;
          }

          /* Inline transport info for space saving */
          .transport-info-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }

          /* Super compact transfer details */
          .transfer-details-grid {
            display: flex !important;
            flex-wrap: wrap !important;
            gap: 0.5rem !important;
          }

          .transfer-details-grid > div {
            flex: 0 0 32% !important;
            margin-bottom: 0.25rem !important;
          }

          .transfer-details-grid dt {
            font-size: 8pt !important;
            margin-bottom: 0 !important;
          }

          .transfer-details-grid dd {
            font-size: 9pt !important;
          }

          /* Remove footer date */
          [data-print-date]::after {
            display: none !important;
          }

          /* Further reduce section headers */
          h2 {
            margin-bottom: 0.25rem !important;
          }

          /* Hide the status badge in header */
          .status-badge-container {
            display: none !important;
          }

          /* Ensure max-w-7xl doesn't add extra spacing */
          .max-w-7xl {
            max-width: 100% !important;
            padding: 0 !important;
          }
        }
      `}</style>
      
      <div className="min-h-screen">
        <div className="transfer-report-header hidden print:block">Transfer Report</div>
        <div className="mx-auto max-w-7xl" data-print-date={new Date().toLocaleDateString()}>
        {/* Header */}
        <div className="mb-6 flex items-center justify-between print:hidden">
          <button
            onClick={() => router.push('/transfers')}
            className="flex items-center text-gray-400 hover:text-white transition-all duration-200 ease-in-out"
          >
            <ChevronLeft className="h-5 w-5 mr-1" />
            Back to Transfers
          </button>
          
          <div className="flex items-center gap-4">
            {/* Status Action Buttons */}
            {canApprove && (
              <button
                onClick={() => handleAction('approve')}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors print:hidden"
              >
                Approve
              </button>
            )}
            {canMarkInTransit && (
              <button
                onClick={() => handleAction('status')}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors print:hidden"
              >
                Mark In Transit
              </button>
            )}
            {canMarkDelivered && (
              <button
                onClick={() => handleAction('status')}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors print:hidden"
              >
                Mark Delivered
              </button>
            )}
            {canCancel && (
              <button
                onClick={() => handleAction('cancel')}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors print:hidden"
              >
                {transfer.requested_by_id === currentUser.id ? 'Cancel' : 'Deny'}
              </button>
            )}
            
            <button
              onClick={handlePrintPDF}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors print:hidden"
            >
              <FileText className="h-4 w-4" />
              Export PDF
            </button>
            
            <div className={`px-4 py-2 rounded-full text-xs font-medium uppercase tracking-wider text-white ${getStatusColor(transfer.status)} status-badge-container`}>
              {transfer.status.charAt(0).toUpperCase() + transfer.status.slice(1).replace('-', ' ')}
            </div>
          </div>
        </div>

        {/* Vehicle Information */}
        <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg p-6 mb-6 hover:bg-[#2a2a2a] transition-colors">
          <h1 className="text-3xl font-bold text-white mb-6">
            {transfer.vehicle?.year} {transfer.vehicle?.make} {transfer.vehicle?.model}
          </h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Vehicle Details Column */}
            <div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <p className="text-sm text-gray-400 mb-1">VIN</p>
                  <p className="text-base text-white font-mono">{transfer.vehicle?.vin}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Stock Number</p>
                  <p className="text-base text-white">{transfer.vehicle?.stock_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Price</p>
                  <p className="text-base text-white font-semibold">${transfer.vehicle?.price.toLocaleString()}</p>
                </div>
                {transfer.vehicle?.mileage && (
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Mileage</p>
                    <p className="text-base text-white">{transfer.vehicle.mileage.toLocaleString()} miles</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Vehicle Images Column */}
            {transfer.vehicle?.image_urls && transfer.vehicle.image_urls.length > 0 && (
              <div className="vehicle-gallery-section">
                <VehicleGallery 
                  images={transfer.vehicle.image_urls} 
                  vehicleTitle={`${transfer.vehicle.year} ${transfer.vehicle.make} ${transfer.vehicle.model}`}
                  compact={true}
                />
              </div>
            )}
          </div>
        </div>

        {/* Transfer Route */}
        <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold text-white mb-6">Transfer Route</h2>
          <div className="flex items-center justify-between">
            <div className="text-center">
              <div className="text-xl font-bold text-white">{transfer.from_location?.name}</div>
              <div className="text-sm text-gray-400 mt-1">{transfer.from_location?.code}</div>
            </div>
            <div className="flex-1 px-8">
              <div className="h-0.5 bg-[#2a2a2a] relative">
                <Truck className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-[#3b82f6] bg-black p-1 rounded-full" />
              </div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-white">{transfer.to_location?.name}</div>
              <div className="text-sm text-gray-400 mt-1">{transfer.to_location?.code}</div>
            </div>
          </div>
        </div>

        {/* Transport Information */}
        <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-white">Transport Information</h2>
            {canEdit && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors print:hidden"
              >
                <Edit2 className="h-4 w-4" />
                Edit
              </button>
            )}
            {isEditing && (
              <div className="flex gap-2 print:hidden">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  Save
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false)
                    setEditData({
                      transport_company: transfer.transport_company || '',
                      transport_cost: transfer.transport_cost?.toString() || '',
                      transport_pickup_date: transfer.transport_pickup_date || '',
                      expected_arrival_date: transfer.expected_arrival_date || '',
                      transport_notes: transfer.transport_notes || ''
                    })
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 transport-info-grid">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Transport Company</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.transport_company}
                  onChange={(e) => setEditData(prev => ({ ...prev, transport_company: e.target.value }))}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white focus:border-blue-600 focus:outline-none transition-colors"
                  placeholder="Enter transport company name"
                />
              ) : (
                <p className="text-base text-white">{transfer.transport_company || <span className="text-gray-500">Not specified</span>}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Transport Cost</label>
              {isEditing ? (
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <input
                    type="number"
                    value={editData.transport_cost}
                    onChange={(e) => setEditData(prev => ({ ...prev, transport_cost: e.target.value }))}
                    className="w-full pl-10 pr-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white focus:border-blue-600 focus:outline-none transition-colors"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>
              ) : (
                <p className="text-base text-white">
                  {transfer.transport_cost ? `$${transfer.transport_cost.toFixed(2)}` : <span className="text-gray-500">Not specified</span>}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Transport Pickup Date</label>
              {isEditing ? (
                <input
                  type="date"
                  value={editData.transport_pickup_date}
                  onChange={(e) => setEditData(prev => ({ ...prev, transport_pickup_date: e.target.value }))}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white focus:border-blue-600 focus:outline-none transition-colors cursor-pointer"
                  style={{
                    colorScheme: 'dark',
                    WebkitAppearance: 'none',
                    MozAppearance: 'textfield'
                  }}
                  onClick={(e) => {
                    // Trigger the date picker when clicking anywhere on the input
                    (e.target as HTMLInputElement).showPicker?.();
                  }}
                />
              ) : (
                <p className="text-base text-white">
                  {transfer.transport_pickup_date 
                    ? format(new Date(transfer.transport_pickup_date), 'MMM d, yyyy')
                    : <span className="text-gray-500">Not specified</span>}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Expected Arrival Date</label>
              {isEditing ? (
                <input
                  type="date"
                  value={editData.expected_arrival_date}
                  onChange={(e) => setEditData(prev => ({ ...prev, expected_arrival_date: e.target.value }))}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white focus:border-blue-600 focus:outline-none transition-colors cursor-pointer"
                  style={{
                    colorScheme: 'dark',
                    WebkitAppearance: 'none',
                    MozAppearance: 'textfield'
                  }}
                  onClick={(e) => {
                    // Trigger the date picker when clicking anywhere on the input
                    (e.target as HTMLInputElement).showPicker?.();
                  }}
                />
              ) : (
                <p className="text-base text-white">
                  {transfer.expected_arrival_date 
                    ? format(new Date(transfer.expected_arrival_date), 'MMM d, yyyy')
                    : <span className="text-gray-500">Not specified</span>}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-400 mb-2">Transport Notes</label>
              {isEditing ? (
                <textarea
                  value={editData.transport_notes}
                  onChange={(e) => setEditData(prev => ({ ...prev, transport_notes: e.target.value }))}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white focus:border-blue-600 focus:outline-none transition-colors resize-none"
                  rows={3}
                  placeholder="Add any relevant notes about the transport..."
                />
              ) : (
                <p className="text-base text-white whitespace-pre-wrap">
                  {transfer.transport_notes || <span className="text-gray-500">No notes</span>}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Transfer Details */}
        <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold text-white mb-6">Transfer Details</h2>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 transfer-details-grid">
            <div>
              <dt className="text-sm font-medium text-gray-400 mb-1">Requested By</dt>
              <dd className="text-base text-white">{transfer.requested_by?.name || transfer.requested_by?.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-400 mb-1">Requested Date</dt>
              <dd className="text-base text-white">
                {format(new Date(transfer.requested_by_date), 'MMM d, yyyy h:mm a')}
              </dd>
            </div>
            {transfer.money_offer && (
              <div>
                <dt className="text-sm font-medium text-gray-400 mb-1">Money Offer</dt>
                <dd className="text-base text-white font-semibold">${transfer.money_offer.toFixed(2)}</dd>
              </div>
            )}
            <div>
              <dt className="text-sm font-medium text-gray-400 mb-1">Priority</dt>
              <dd>
                <span className={`inline-flex px-3 py-1 text-xs font-medium uppercase tracking-wider rounded-full ${
                  transfer.priority === 'urgent' ? 'bg-red-500/20 text-red-400' :
                  transfer.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                  'bg-gray-500/20 text-gray-400'
                }`}>
                  {transfer.priority}
                </span>
              </dd>
            </div>
            {transfer.expected_pickup_date && (
              <div>
                <dt className="text-sm font-medium text-gray-400 mb-1">Requested Pickup Date</dt>
                <dd className="text-base text-white">
                  {format(new Date(transfer.expected_pickup_date), 'MMM d, yyyy')}
                </dd>
              </div>
            )}
            {transfer.customer_waiting && (
              <div>
                <dt className="text-sm font-medium text-gray-400 mb-1">Customer Status</dt>
                <dd>
                  <span className="inline-flex px-3 py-1 text-xs font-medium uppercase tracking-wider bg-yellow-500/20 text-yellow-400 rounded-full">
                    Customer Waiting
                  </span>
                </dd>
              </div>
            )}
            {transfer.transfer_notes && (
              <div className="md:col-span-2">
                <dt className="text-sm font-medium text-gray-400 mb-1">Transfer Notes</dt>
                <dd className="text-base text-white whitespace-pre-wrap bg-[#2a2a2a] rounded-lg p-3">{transfer.transfer_notes}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Timeline */}
        <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg p-6 mb-6 timeline-section">
          <h2 className="text-2xl font-semibold text-white mb-6">Transfer Timeline</h2>
          <TransferTimeline transfer={transfer} />
        </div>

        {/* Activities */}
        <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg p-6 activity-feed-section">
          <h2 className="text-2xl font-semibold text-white mb-6">Activity Feed</h2>
          <TransferActivities activities={activities} />
        </div>
      </div>
    </div>

    {/* Transfer Action Modal */}
    {showActionModal && selectedAction && (
      <TransferActionModal
        transfer={{
          _id: transfer.id,
          status: transfer.status,
          vehicle: {
            _id: transfer.vehicle?.id || '',
            year: transfer.vehicle?.year || 0,
            make: transfer.vehicle?.make || '',
            model: transfer.vehicle?.model || '',
            trim: transfer.vehicle?.trim
          },
          fromLocation: {
            _id: transfer.from_location?.id || '',
            name: transfer.from_location?.name || '',
            code: transfer.from_location?.code || ''
          },
          toLocation: {
            _id: transfer.to_location?.id || '',
            name: transfer.to_location?.name || '',
            code: transfer.to_location?.code || ''
          },
          requestedBy: {
            _id: transfer.requested_by?.id || '',
            name: transfer.requested_by?.name || '',
            email: transfer.requested_by?.email || ''
          }
        }}
        actionType={selectedAction}
        onClose={() => {
          setShowActionModal(false)
          setSelectedAction(null)
        }}
        onTransferUpdate={handleTransferUpdate}
        isRequester={transfer.requested_by_id === currentUser.id}
      />
    )}
    </>
  )
}