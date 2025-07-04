"use client"

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { canClaimVehicle } from '@/lib/permissions';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

interface ClaimButtonProps {
  vehicleId: string;
  vehicleStatus: string;
  vehicleLocation: string;
  onSuccess?: () => void;
  className?: string;
}

export default function ClaimButton({ vehicleId, vehicleStatus, vehicleLocation, onSuccess, className }: ClaimButtonProps) {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    reason: '',
    customerWaiting: false,
    priority: false,
    expectedPickupDate: ''
  });

  if (!session || !canClaimVehicle(session.user.role)) {
    return null;
  }

  // Don't show claim button if vehicle is at user's location
  if (vehicleLocation === session.user.location?._id) {
    return null;
  }

  // Don't show if vehicle is not available
  if (vehicleStatus !== 'available') {
    return (
      <div className="px-4 py-2 bg-[#2a2a2a] text-gray-400 rounded-lg">
        {vehicleStatus === 'claimed' && 'Claimed'}
        {vehicleStatus === 'in-transit' && 'In Transit'}
        {vehicleStatus === 'delivered' && 'Delivered'}
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/transfer/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId,
          ...formData
        })
      });

      if (response.ok) {
        setIsOpen(false);
        onSuccess?.();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to claim vehicle');
      }
    } catch (error) {
      alert('Failed to claim vehicle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className={className}>
          Claim for Transfer
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Claim Vehicle for Transfer</DialogTitle>
            <DialogDescription>
              Provide details for the transfer request. The origin dealership will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid w-full gap-1.5">
              <Label htmlFor="reason">
                Reason for Transfer
              </Label>
              <Textarea
                id="reason"
                value={formData.reason}
                onChange={(e) => setFormData({...formData, reason: e.target.value})}
                rows={3}
                placeholder="Customer waiting, specific request, etc."
                className="bg-zinc-800 border-zinc-700"
                required
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="customerWaiting"
                  checked={formData.customerWaiting}
                  onCheckedChange={(checked) => setFormData({...formData, customerWaiting: !!checked})}
                />
                <Label htmlFor="customerWaiting" className="text-sm font-normal">
                  Customer Waiting
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="priority"
                  checked={formData.priority}
                  onCheckedChange={(checked) => setFormData({...formData, priority: !!checked})}
                />
                <Label htmlFor="priority" className="text-sm font-normal">
                  High Priority
                </Label>
              </div>
            </div>

            <div className="grid w-full gap-1.5">
              <Label htmlFor="pickupDate">
                Expected Pickup Date
              </Label>
              <Input
                id="pickupDate"
                type="date"
                value={formData.expectedPickupDate}
                onChange={(e) => setFormData({...formData, expectedPickupDate: e.target.value})}
                min={new Date().toISOString().split('T')[0]}
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? 'Claiming...' : 'Confirm Claim'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}