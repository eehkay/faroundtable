interface VehicleSpecsProps {
  vehicle: {
    year?: number;
    make?: string;
    model?: string;
    trim?: string;
    vin: string;
    stockNumber: string;
    condition?: string;
    mileage?: number;
    exteriorColor?: string;
    interiorColor?: string;
    bodyStyle?: string;
    fuelType?: string;
    transmission?: string;
    drivetrain?: string;
    engine?: string;
    mpgCity?: number;
    mpgHighway?: number;
  };
}

export default function VehicleSpecs({ vehicle }: VehicleSpecsProps) {
  const formatMileage = (mileage: number) => {
    return mileage.toLocaleString();
  };

  const specs = [
    { label: 'Stock Number', value: vehicle.stockNumber },
    { label: 'VIN', value: vehicle.vin },
    { label: 'Condition', value: vehicle.condition || 'N/A' },
    { 
      label: 'Mileage', 
      value: vehicle.mileage ? `${formatMileage(vehicle.mileage)} miles` : 'N/A' 
    },
    { label: 'Exterior Color', value: vehicle.exteriorColor || 'N/A' },
    { label: 'Interior Color', value: vehicle.interiorColor || 'N/A' },
    { label: 'Body Style', value: vehicle.bodyStyle || 'N/A' },
    { label: 'Fuel Type', value: vehicle.fuelType || 'N/A' },
    { label: 'Transmission', value: vehicle.transmission || 'N/A' },
    { label: 'Drivetrain', value: vehicle.drivetrain || 'N/A' },
    { label: 'Engine', value: vehicle.engine || 'N/A' },
    { 
      label: 'MPG', 
      value: vehicle.mpgCity && vehicle.mpgHighway 
        ? `${vehicle.mpgCity} city / ${vehicle.mpgHighway} hwy` 
        : 'N/A' 
    },
  ];

  return (
    <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg shadow-sm p-6 transition-all duration-200">
      <h2 className="text-xl font-semibold text-white mb-4">Vehicle Specifications</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {specs.map((spec) => (
          <div key={spec.label} className="flex justify-between py-2">
            <span className="text-gray-400 text-sm">{spec.label}:</span>
            <span className="text-gray-100 text-sm font-medium capitalize">{spec.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}