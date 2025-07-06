'use client'

import { useState } from 'react';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface TransferActionModalProps {
  transfer: any;
  actionType: 'approve' | 'status' | 'cancel';
  onClose: () => void;
}

export default function TransferActionModal({ transfer, actionType, onClose }: TransferActionModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [error, setError] = useState('');

  const getActionTitle = () => {
    switch (actionType) {
      case 'approve':
        return 'Approve Transfer';
      case 'status':
        return transfer.status === 'approved' ? 'Mark as In Transit' : 'Mark as Delivered';
      case 'cancel':
        return 'Cancel Transfer';
      default:
        return '';
    }
  };

  const getActionDescription = () => {
    switch (actionType) {
      case 'approve':
        return `Approve the transfer request for ${transfer.vehicle.year} ${transfer.vehicle.make} ${transfer.vehicle.model} from ${transfer.fromLocation.name} to ${transfer.toLocation.name}?`;
      case 'status':
        if (transfer.status === 'approved') {
          return `Mark the vehicle as in transit to ${transfer.toLocation.name}?`;
        } else {
          return `Confirm that the vehicle has been delivered to ${transfer.toLocation.name}?`;
        }
      case 'cancel':
        return `Cancel the transfer request for ${transfer.vehicle.year} ${transfer.vehicle.make} ${transfer.vehicle.model}?`;
      default:
        return '';
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      let endpoint = '';
      let method = 'PUT';
      let body: any = {};

      switch (actionType) {
        case 'approve':
          endpoint = `/api/transfer/${transfer._id}/approve`;
          break;
        case 'status':
          endpoint = `/api/transfer/${transfer._id}/status`;
          body = { status: transfer.status === 'approved' ? 'in-transit' : 'delivered' };
          break;
        case 'cancel':
          endpoint = `/api/transfer/${transfer._id}/cancel`;
          body = { reason: cancellationReason };
          break;
      }

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to perform action';
        try {
          const data = await response.json();
          errorMessage = data.error || errorMessage;
        } catch (jsonError) {
          // If response is not JSON, use the status text or default message
          errorMessage = response.statusText || `Server error (${response.status})`;
        }
        throw new Error(errorMessage);
      }

      // Refresh the page to show updated data
      router.refresh();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">{getActionTitle()}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-gray-300 mb-6">{getActionDescription()}</p>

        {actionType === 'cancel' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Cancellation Reason (Optional)
            </label>
            <textarea
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              className="w-full bg-[#2a2a2a] border border-[#333333] text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              rows={3}
              placeholder="Enter reason for cancellation..."
            />
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-[#2a2a2a] text-white rounded-lg hover:bg-[#333333] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${
              actionType === 'cancel'
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : actionType === 'approve'
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : transfer.status === 'approved'
                ? 'bg-purple-600 hover:bg-purple-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {loading ? 'Processing...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}