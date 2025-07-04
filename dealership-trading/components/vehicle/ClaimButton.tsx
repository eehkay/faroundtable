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
import { DatePicker } from '@/components/ui/date-picker';
import { DateTimePicker } from '@/components/ui/date-time-picker';

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
    customerWaiting: false,
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
  if (vehicleLocation === session.user.location?._id) {
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
    console.log('Form submitted!');
    console.log('Form data:', formData);
    console.log('Requested by date:', requestedByDateTime);
    console.log('Expected pickup date:', expectedPickupDate);
    
    // Validate required fields
    if (!formData.transferNotes.trim()) {
      console.error('Missing transfer notes');
      alert('Please provide transfer notes explaining why you need this vehicle.');
      return;
    }
    
    if (!requestedByDateTime) {
      console.error('Missing requested by date');
      alert('Please select when you need this vehicle by.');
      return;
    }
    
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
      
      console.log('Sending payload:', payload);
      
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
          customerWaiting: false,
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
          console.error('Transfer request failed:', error);
          errorMessage = error.details || error.error || errorMessage;
        } catch (e) {
          console.error('Failed to parse error response:', e);
        }
        alert(errorMessage);
      }
    } catch (error) {
      console.error('Error submitting transfer request:', error);
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
        <form onSubmit={handleSubmit} onClick={() => console.log('Form clicked')}>
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
                Transfer Notes <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="transferNotes"
                value={formData.transferNotes}
                onChange={(e) => setFormData({...formData, transferNotes: e.target.value})}
                rows={3}
                placeholder="Explain why you need this vehicle (e.g., customer waiting, specific request, etc.)"
                className="bg-zinc-800 border-zinc-700"
                required
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
                  Needed By <span className="text-red-500">*</span>
                </Label>
                <DateTimePicker
                  date={requestedByDateTime}
                  onSelect={setRequestedByDateTime}
                  placeholder="Select date and time"
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

            <div className="flex items-center space-x-2">
              <Checkbox
                id="customerWaiting"
                checked={formData.customerWaiting}
                onCheckedChange={(checked) => setFormData({...formData, customerWaiting: !!checked})}
              />
              <Label htmlFor="customerWaiting" className="text-sm font-normal">
                Customer is waiting for this vehicle
              </Label>
            </div>

            <div className="grid w-full gap-1.5">
              <Label htmlFor="pickupDate">
                Expected Pickup Date
              </Label>
              <DatePicker
                date={expectedPickupDate}
                onSelect={setExpectedPickupDate}
                placeholder="Select pickup date"
                minDate={new Date()}
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
              type="button"
              disabled={loading}
              onClick={(e) => {
                console.log('Submit button clicked - manual submit');
                e.preventDefault();
                handleSubmit(e as any);
              }}
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}