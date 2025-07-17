'use client'

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { Clock, AlertTriangle, Package, User } from 'lucide-react';
import TransferActionModal from '@/components/transfers/TransferActionModal';
import { canApproveTransferForLocation } from '@/lib/permissions';

interface IncomingTransfer {
  id: string;
  status: string;
  reason?: string;
  customer_waiting: boolean;
  priority: boolean;
  expected_pickup_date?: string;
  created_at: string;
  from_location_id: string;
  vehicle: {
    id: string;
    vin: string;
    year: number;
    make: string;
    model: string;
    trim?: string;
    stock_number?: string;
    price: number;
    mileage?: number;
    image_urls?: string[];
  };
  from_location: {
    id: string;
    name: string;
    code: string;
  };
  to_location: {
    id: string;
    name: string;
    code: string;
  };
  requested_by: {
    id: string;
    name: string;
    email: string;
  };
}

interface IncomingTransferRequestsProps {
  userRole: string;
  userLocationId?: string;
}

export default function IncomingTransferRequests({ 
  userRole, 
  userLocationId 
}: IncomingTransferRequestsProps) {
  const [transfers, setTransfers] = useState<IncomingTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransfer, setSelectedTransfer] = useState<IncomingTransfer | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'status' | 'cancel' | null>(null);

  const fetchIncomingTransfers = useCallback(async () => {
    if (!userLocationId) return;
    
    try {
      const response = await fetch(`/api/transfers/incoming?location_id=${userLocationId}`);
      if (response.ok) {
        const data = await response.json();
        setTransfers(data.transfers || []);
      }
    } catch (error) {
      // Failed to fetch incoming transfers
    } finally {
      setLoading(false);
    }
  }, [userLocationId]);

  useEffect(() => {
    fetchIncomingTransfers();
  }, [fetchIncomingTransfers]);

  const handleAction = (transfer: IncomingTransfer) => {
    setSelectedTransfer(transfer);
    setActionType('approve'); // Default to approve action for incoming requests
  };


  const canApprove = (transfer: IncomingTransfer) => {
    return canApproveTransferForLocation(
      userRole,
      userLocationId || null,
      transfer.from_location_id
    );
  };

  if (loading) {
    return (
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-lg border border-gray-800 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Clock className="h-5 w-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Incoming Transfer Requests</h3>
        </div>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-800 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (transfers.length === 0) {
    return (
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-lg border border-gray-800 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Clock className="h-5 w-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Incoming Transfer Requests</h3>
        </div>
        <p className="text-gray-400">No pending transfer requests for your dealership.</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-lg border border-gray-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Incoming Transfer Requests</h3>
            <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
              {transfers.length}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {transfers.map((transfer) => (
            <div
              key={transfer.id}
              className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <Package className="h-4 w-4 text-blue-400" />
                    <span className="font-medium text-white">
                      {transfer.vehicle.year} {transfer.vehicle.make} {transfer.vehicle.model}
                    </span>
                    {transfer.priority && (
                      <AlertTriangle className="h-4 w-4 text-red-400" />
                    )}
                    {transfer.customer_waiting && (
                      <span className="text-xs bg-red-500 text-white px-2 py-1 rounded">
                        Customer Waiting
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-400">
                    <div>
                      <span className="text-gray-500">From:</span> {transfer.from_location.name}
                    </div>
                    <div>
                      <span className="text-gray-500">VIN:</span> {transfer.vehicle.vin}
                    </div>
                    <div>
                      <span className="text-gray-500">Requested by:</span> {transfer.requested_by.name}
                    </div>
                    <div>
                      <span className="text-gray-500">Date:</span> {format(new Date(transfer.created_at), 'MMM d, yyyy')}
                    </div>
                  </div>

                  {transfer.reason && (
                    <div className="mt-2 text-sm text-gray-400">
                      <span className="text-gray-500">Reason:</span> {transfer.reason}
                    </div>
                  )}
                </div>

                <div className="flex space-x-2">
                  {canApprove(transfer) && (
                    <button
                      onClick={() => handleAction(transfer)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Review
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedTransfer && actionType && (
        <TransferActionModal
          transfer={{
            _id: selectedTransfer.id,
            status: selectedTransfer.status,
            reason: selectedTransfer.reason,
            customerWaiting: selectedTransfer.customer_waiting,
            priority: selectedTransfer.priority,
            expectedPickupDate: selectedTransfer.expected_pickup_date,
            requestedAt: selectedTransfer.created_at,
            vehicle: {
              _id: selectedTransfer.vehicle.id,
              vin: selectedTransfer.vehicle.vin,
              year: selectedTransfer.vehicle.year,
              make: selectedTransfer.vehicle.make,
              model: selectedTransfer.vehicle.model,
              trim: selectedTransfer.vehicle.trim,
              stockNumber: selectedTransfer.vehicle.stock_number,
              price: selectedTransfer.vehicle.price,
              mileage: selectedTransfer.vehicle.mileage,
              images: selectedTransfer.vehicle.image_urls,
            },
            fromLocation: {
              _id: selectedTransfer.from_location.id,
              name: selectedTransfer.from_location.name,
              code: selectedTransfer.from_location.code,
            },
            toLocation: {
              _id: selectedTransfer.to_location.id,
              name: selectedTransfer.to_location.name,
              code: selectedTransfer.to_location.code,
            },
            requestedBy: {
              _id: selectedTransfer.requested_by.id,
              name: selectedTransfer.requested_by.name,
              email: selectedTransfer.requested_by.email,
            },
          }}
          actionType={actionType}
          onClose={() => {
            setActionType(null);
            setSelectedTransfer(null);
            fetchIncomingTransfers(); // Refresh the list
          }}
        />
      )}
    </>
  );
}