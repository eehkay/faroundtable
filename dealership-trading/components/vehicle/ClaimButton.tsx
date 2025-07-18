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
import { DatePicker } from '@/components/ui/date-picker';

interface ClaimButtonProps {
  vehicleId: string;
  vehicleStatus: string;
  vehicleLocation: string;
  activeTransferRequests?: number;
  onSuccess?: () => void;
  className?: string;
}

export default function ClaimButton({ vehicleId, vehicleStatus, vehicleLocation, activeTransferRequests = 0, onSuccess, className }: ClaimButtonProps) {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    reason: '',
    transferNotes: '',
    moneyOffer: '',
    priority: 'normal' as 'normal' | 'high' | 'urgent',
    expectedPickupDate: '',
    requestedByDate: ''
  });
  const [requestedByDateTime, setRequestedByDateTime] = useState<Date>();
  const [expectedPickupDate, setExpectedPickupDate] = useState<Date>();
  const [displayMoneyOffer, setDisplayMoneyOffer] = useState('');

  if (!session || !canClaimVehicle(session.user.role)) {
    return null;
  }

  // Don't show claim button if vehicle is at user's location
  if (vehicleLocation === session.user.location?.id) {
    return null;
  }

  // Show different states based on vehicle status
  if (vehicleStatus !== 'available' && vehicleStatus !== 'claimed') {
    return (
      <div className="px-4 py-2 bg-[#2a2a2a] text-gray-400 rounded-lg">
        {vehicleStatus === 'in-transit' && 'In Transit'}
        {vehicleStatus === 'delivered' && 'Delivered'}
      </div>
    );
  }

  // Format money value for display
  const formatMoney = (value: string) => {
    // Remove non-numeric characters
    const numericValue = value.replace(/[^0-9]/g, '');
    if (!numericValue) return '';
    
    // Convert to number and format
    const num = parseInt(numericValue, 10);
    return new Intl.NumberFormat('en-US').format(num);
  };

  const handleMoneyOfferChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, '');
    setFormData({...formData, moneyOffer: rawValue});
    setDisplayMoneyOffer(formatMoney(rawValue));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // No validation needed - all fields are optional
    
    setLoading(true);

    try {
      const payload = {
        vehicleId,
        ...formData,
        reason: formData.transferNotes, // Map transferNotes to reason for backward compatibility
        moneyOffer: formData.moneyOffer ? parseInt(formData.moneyOffer, 10) : undefined,
        requestedByDate: requestedByDateTime?.toISOString(),
        expectedPickupDate: expectedPickupDate?.toISOString()
      };
      
      
      const response = await fetch('/api/transfer/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setIsOpen(false);
        // Reset form
        setFormData({
          reason: '',
          transferNotes: '',
          moneyOffer: '',
          priority: 'normal' as 'normal' | 'high' | 'urgent',
          expectedPickupDate: '',
          requestedByDate: ''
        });
        setRequestedByDateTime(undefined);
        setExpectedPickupDate(undefined);
        setDisplayMoneyOffer('');
        onSuccess?.();
      } else {
        let errorMessage = 'Failed to submit transfer request';
        try {
          const error = await response.json();
          errorMessage = error.details || error.error || errorMessage;
        } catch (e) {
          // Failed to parse error response
        }
        alert(errorMessage);
      }
    } catch (error) {
      alert('Failed to submit transfer request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className={className}>
          {activeTransferRequests > 0 
            ? `Request Transfer (${activeTransferRequests} pending)`
            : 'Request Transfer'
          }
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Request Vehicle Transfer</DialogTitle>
            <DialogDescription>
              {activeTransferRequests > 0 
                ? `There are ${activeTransferRequests} other pending transfer requests for this vehicle. Provide your details to submit a competing request.`
                : 'Provide details for the transfer request. The origin dealership will be notified.'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid w-full gap-1.5">
              <Label htmlFor="transferNotes">
                Transfer Notes (Optional)
              </Label>
              <Textarea
                id="transferNotes"
                value={formData.transferNotes}
                onChange={(e) => setFormData({...formData, transferNotes: e.target.value})}
                rows={3}
                placeholder="Add any notes about why you need this vehicle (optional)"
                className="bg-zinc-800 border-zinc-700"
              />
            </div>

            <div className="grid w-full gap-1.5">
              <Label htmlFor="moneyOffer">
                Money Offer (Optional)
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <Input
                  id="moneyOffer"
                  type="text"
                  value={displayMoneyOffer}
                  onChange={handleMoneyOfferChange}
                  placeholder="0"
                  className="bg-zinc-800 border-zinc-700 pl-8"
                  inputMode="numeric"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Optional incentive or trade value to make your request more appealing
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid w-full gap-1.5">
                <Label htmlFor="requestedByDate">
                  Needed By (Optional)
                </Label>
                <DatePicker
                  date={requestedByDateTime}
                  onSelect={setRequestedByDateTime}
                  placeholder="Select date"
                  minDate={new Date()}
                />
              </div>

              <div className="grid w-full gap-1.5">
                <Label htmlFor="priority">
                  Priority Level
                </Label>
                <select
                  id="priority"
                  value={formData.priority}
                  onChange={(e) => setFormData({...formData, priority: e.target.value as 'normal' | 'high' | 'urgent'})}
                  className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm"
                >
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div className="grid w-full gap-1.5">
              <Label htmlFor="pickupDate">
                Requested Pickup Date (Optional)
              </Label>
              <DatePicker
                date={expectedPickupDate}
                onSelect={setExpectedPickupDate}
                placeholder="When would you like to pick up?"
                minDate={new Date()}
              />
              <p className="text-xs text-gray-400 mt-1">
                When you&apos;d ideally like to pick up the vehicle
              </p>
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
              type="button"
              disabled={loading}
              onClick={(e) => {
                e.preventDefault();
                handleSubmit(e as React.FormEvent);
              }}
              className="bg-[#3b82f6] text-white hover:bg-[#2563eb] transition-all duration-200 ease-in-out hover:transform hover:-translate-y-[1px] hover:shadow-[0_4px_12px_rgba(59,130,246,0.3)]"
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}