'use client'

import { useState } from 'react';
import { format } from 'date-fns';
import { Truck, Check, X, AlertTriangle, Package, Clock } from 'lucide-react';
import TransferActionModal from './TransferActionModal';
import { canApproveTransfers, canUpdateTransferStatus, canApproveTransferForLocation, canRejectTransferForLocation } from '@/lib/permissions';

interface Transfer {
  _id: string;
  status: string;
  reason?: string;
  customerWaiting: boolean;
  priority: boolean;
  expectedPickupDate?: string;
  requestedAt: string;
  approvedAt?: string;
  intransitAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  fromLocationId?: string;
  vehicle: {
    _id: string;
    vin: string;
    year: number;
    make: string;
    model: string;
    trim?: string;
    stockNumber?: string;
    price: number;
    mileage?: number;
    images?: string[];
  };
  fromLocation: {
    _id: string;
    name: string;
    code: string;
  };
  toLocation: {
    _id: string;
    name: string;
    code: string;
  };
  requestedBy: {
    _id: string;
    name: string;
    email: string;
    image?: string;
  };
  approvedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  intransitBy?: {
    _id: string;
    name: string;
    email: string;
  };
  deliveredBy?: {
    _id: string;
    name: string;
    email: string;
  };
  cancelledBy?: {
    _id: string;
    name: string;
    email: string;
  };
}

interface TransferListProps {
  transfers: Transfer[];
  userRole: string;
  currentUserId: string;
  userLocationId?: string;
  onTransferUpdate?: (updatedTransfer: any) => void;
}

export default function TransferList({ transfers, userRole, currentUserId, userLocationId, onTransferUpdate }: TransferListProps) {
  
  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'status' | 'cancel' | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'requested':
        return 'text-yellow-500 bg-yellow-500/10';
      case 'approved':
        return 'text-blue-500 bg-blue-500/10';
      case 'in-transit':
        return 'text-purple-500 bg-purple-500/10';
      case 'delivered':
        return 'text-green-500 bg-green-500/10';
      case 'cancelled':
        return 'text-red-500 bg-red-500/10';
      default:
        return 'text-gray-500 bg-gray-500/10';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'requested':
        return <Clock className="w-4 h-4" />;
      case 'approved':
        return <Check className="w-4 h-4" />;
      case 'in-transit':
        return <Truck className="w-4 h-4" />;
      case 'delivered':
        return <Package className="w-4 h-4" />;
      case 'cancelled':
        return <X className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const handleAction = (transfer: Transfer, action: 'approve' | 'status' | 'cancel') => {
    setSelectedTransfer(transfer);
    setActionType(action);
  };

  const canPerformAction = (transfer: Transfer, action: string) => {
    switch (action) {
      case 'approve':
        return transfer.status === 'requested' && 
               transfer.fromLocationId &&
               canApproveTransferForLocation(userRole, userLocationId || null, transfer.fromLocationId);
      case 'in-transit':
        return transfer.status === 'approved' && canUpdateTransferStatus(userRole);
      case 'delivered':
        return transfer.status === 'in-transit' && canUpdateTransferStatus(userRole);
      case 'cancel':
        return (
          transfer.status !== 'delivered' &&
          (transfer.requestedBy._id === currentUserId || userRole === 'admin' || userRole === 'manager')
        );
      default:
        return false;
    }
  };

  if (transfers.length === 0) {
    return (
      <div className="text-center py-12 bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg">
        <p className="text-gray-400">No transfers found matching your criteria.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {transfers.map((transfer) => (
          <div
            key={transfer._id}
            className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg p-6 hover:bg-[#2a2a2a] transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-3">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(transfer.status)}`}>
                    {getStatusIcon(transfer.status)}
                    {transfer.status.charAt(0).toUpperCase() + transfer.status.slice(1).replace('-', ' ')}
                  </span>
                  {transfer.priority && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium text-orange-500 bg-orange-500/10">
                      <AlertTriangle className="w-4 h-4" />
                      Priority
                    </span>
                  )}
                  {transfer.customerWaiting && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium text-purple-500 bg-purple-500/10">
                      Customer Waiting
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-semibold text-white mb-2">
                  {transfer.vehicle.year} {transfer.vehicle.make} {transfer.vehicle.model} {transfer.vehicle.trim || ''}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">VIN: <span className="text-gray-300">{transfer.vehicle.vin}</span></p>
                    <p className="text-gray-400">Stock #: <span className="text-gray-300">{transfer.vehicle.stockNumber || 'N/A'}</span></p>
                    <p className="text-gray-400">Price: <span className="text-gray-300">${transfer.vehicle.price.toLocaleString()}</span></p>
                  </div>
                  <div>
                    <p className="text-gray-400">From: <span className="text-gray-300">{transfer.fromLocation.name}</span></p>
                    <p className="text-gray-400">To: <span className="text-gray-300">{transfer.toLocation.name}</span></p>
                    <p className="text-gray-400">Requested by: <span className="text-gray-300">{transfer.requestedBy.name}</span></p>
                  </div>
                </div>

                {transfer.reason && (
                  <div className="mt-3 p-3 bg-[#2a2a2a] rounded-lg">
                    <p className="text-sm text-gray-400">Reason: <span className="text-gray-300">{transfer.reason}</span></p>
                  </div>
                )}

                <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
                  <span>Requested: {format(new Date(transfer.requestedAt), 'MMM d, yyyy h:mm a')}</span>
                  {transfer.approvedAt && (
                    <span>Approved: {format(new Date(transfer.approvedAt), 'MMM d, yyyy h:mm a')}</span>
                  )}
                  {transfer.deliveredAt && (
                    <span>Delivered: {format(new Date(transfer.deliveredAt), 'MMM d, yyyy h:mm a')}</span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2 ml-6">
                {canPerformAction(transfer, 'approve') && (
                  <button
                    onClick={() => handleAction(transfer, 'approve')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Approve
                  </button>
                )}
                {canPerformAction(transfer, 'in-transit') && (
                  <button
                    onClick={() => handleAction(transfer, 'status')}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                  >
                    Mark In Transit
                  </button>
                )}
                {canPerformAction(transfer, 'delivered') && (
                  <button
                    onClick={() => handleAction(transfer, 'status')}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    Mark Delivered
                  </button>
                )}
                {canPerformAction(transfer, 'cancel') && (
                  <button
                    onClick={() => handleAction(transfer, 'cancel')}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedTransfer && actionType && (
        <TransferActionModal
          transfer={selectedTransfer}
          actionType={actionType}
          onClose={() => {
            setSelectedTransfer(null);
            setActionType(null);
          }}
          onTransferUpdate={onTransferUpdate}
        />
      )}
    </>
  );
}