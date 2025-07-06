'use client';

import { useRouter } from 'next/navigation';
import ClaimButton from './ClaimButton';

interface VehicleActionsProps {
  vehicleId: string;
  vehicleStatus: string;
  vehicleLocation?: string;
  activeTransferRequests?: number;
  className?: string;
}

export default function VehicleActions({ vehicleId, vehicleStatus, vehicleLocation, activeTransferRequests = 0, className }: VehicleActionsProps) {
  const router = useRouter();

  const handleSuccess = () => {
    router.refresh();
  };

  return (
    <ClaimButton
      vehicleId={vehicleId}
      vehicleStatus={vehicleStatus}
      vehicleLocation={vehicleLocation || ''}
      activeTransferRequests={activeTransferRequests}
      onSuccess={handleSuccess}
      className={className}
    />
  );
}