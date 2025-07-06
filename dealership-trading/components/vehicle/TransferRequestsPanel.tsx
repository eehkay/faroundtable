"use client"

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Check, 
  X, 
  DollarSign, 
  Calendar, 
  User, 
  Building2,
  AlertCircle,
  Clock
} from 'lucide-react';
import { canApproveTransfers } from '@/lib/permissions';

interface TransferRequest {
  _id: string;
  status: string;
  transferNotes: string;
  reason: string;
  moneyOffer?: number;
  requestedByDate: string;
  customerWaiting: boolean;
  priority: 'normal' | 'high' | 'urgent';
  expectedPickupDate?: string;
  createdAt: string;
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
  };
}

interface TransferRequestsPanelProps {
  vehicleId: string;
  vehicleLocation: string;
  onUpdate?: () => void;
}

export default function TransferRequestsPanel({ vehicleId, vehicleLocation, onUpdate }: TransferRequestsPanelProps) {
  const { data: session } = useSession();
  const [transfers, setTransfers] = useState<TransferRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransfer, setSelectedTransfer] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const canManageTransfers = session && vehicleLocation === session.user.location?.id && canApproveTransfers(session.user.role);

  useEffect(() => {
    const fetchTransfers = async () => {
      try {
        const response = await fetch(`/api/transfer/vehicle/${vehicleId}/requests`);
        if (response.ok) {
          const data = await response.json();
          setTransfers(data.transfers.filter((t: TransferRequest) => t.status === 'requested'));
        }
      } catch (error) {
        console.error('Failed to fetch transfers:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTransfers();
  }, [vehicleId]);


  const handleApprove = async (transferId: string) => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/transfer/${transferId}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        // Refetch transfers
        const transferResponse = await fetch(`/api/transfer/vehicle/${vehicleId}/requests`);
        if (transferResponse.ok) {
          const data = await transferResponse.json();
          setTransfers(data.transfers.filter((t: TransferRequest) => t.status === 'requested'));
        }
        onUpdate?.();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to approve transfer');
      }
    } catch (error) {
      alert('Failed to approve transfer');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedTransfer || !rejectionReason.trim()) return;
    
    setActionLoading(true);
    try {
      const response = await fetch(`/api/transfer/${selectedTransfer}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectionReason })
      });

      if (response.ok) {
        setShowRejectDialog(false);
        setSelectedTransfer(null);
        setRejectionReason('');
        // Refetch transfers
        const transferResponse = await fetch(`/api/transfer/vehicle/${vehicleId}/requests`);
        if (transferResponse.ok) {
          const data = await transferResponse.json();
          setTransfers(data.transfers.filter((t: TransferRequest) => t.status === 'requested'));
        }
        onUpdate?.();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to reject transfer');
      }
    } catch (error) {
      alert('Failed to reject transfer');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse bg-[#1a1a1a] h-32 rounded-lg"></div>;
  }

  if (transfers.length === 0) {
    return null;
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-500 bg-red-500/10';
      case 'high': return 'text-orange-500 bg-orange-500/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  return (
    <>
      <Card className="bg-[#1a1a1a] border-0">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            Transfer Requests
            <Badge variant="secondary" className="bg-blue-500/10 text-blue-400">
              {transfers.length} Pending
            </Badge>
          </CardTitle>
          <CardDescription>
            Multiple stores are requesting this vehicle
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {transfers.map((transfer) => (
            <div
              key={transfer._id}
              className="bg-[#0a0a0a] rounded-lg p-4 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">{transfer.toLocation.name}</span>
                    <Badge className={getPriorityColor(transfer.priority)}>
                      {transfer.priority}
                    </Badge>
                    {transfer.customerWaiting && (
                      <Badge className="bg-yellow-500/10 text-yellow-400">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Customer Waiting
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-4 text-xs text-gray-400">
                    {transfer.moneyOffer && (
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        <span className="font-medium text-green-400">
                          ${transfer.moneyOffer.toLocaleString()}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>Needed by {new Date(transfer.requestedByDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>{transfer.requestedBy.name || transfer.requestedBy.email}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatDistanceToNow(new Date(transfer.createdAt))} ago</span>
                    </div>
                  </div>
                </div>

                {canManageTransfers && (
                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleApprove(transfer._id)}
                      disabled={actionLoading}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        setSelectedTransfer(transfer._id);
                        setShowRejectDialog(true);
                      }}
                      disabled={actionLoading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reject Transfer Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this transfer request.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid w-full gap-1.5">
              <Label htmlFor="reason">Rejection Reason</Label>
              <Textarea
                id="reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                placeholder="Vehicle already sold, not available for transfer, etc."
                className="bg-zinc-800 border-zinc-700"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setSelectedTransfer(null);
                setRejectionReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleReject}
              disabled={actionLoading || !rejectionReason.trim()}
            >
              {actionLoading ? 'Rejecting...' : 'Reject Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}