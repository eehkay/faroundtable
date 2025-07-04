'use client';

import { useRouter } from 'next/navigation';
import ClaimButton from './ClaimButton';

interface VehicleActionsProps {
  vehicleId: string;
  vehicleStatus: string;
  vehicleLocation?: string;
}

export default function VehicleActions({ vehicleId, vehicleStatus, vehicleLocation }: VehicleActionsProps) {
  const router = useRouter();

  const handleSuccess = () => {
    router.refresh();
  };

  return (
    <ClaimButton
      vehicleId={vehicleId}
      vehicleStatus={vehicleStatus}
      vehicleLocation={vehicleLocation}
      onSuccess={handleSuccess}
    />
  );
}