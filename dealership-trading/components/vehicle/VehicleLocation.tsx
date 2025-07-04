import { MapPin, Phone, Clock, Navigation } from 'lucide-react';

interface VehicleLocationProps {
  location?: {
    name: string;
    code: string;
    address?: string;
    phone?: string;
    hours?: string;
  };
}

export default function VehicleLocation({ location }: VehicleLocationProps) {
  if (!location) {
    return null;
  }

  const handleGetDirections = () => {
    if (location.address) {
      const encodedAddress = encodeURIComponent(location.address);
      window.open(`https://maps.google.com/maps?q=${encodedAddress}`, '_blank');
    }
  };

  const handleCall = () => {
    if (location.phone) {
      window.open(`tel:${location.phone}`, '_self');
    }
  };

  return (
    <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg shadow-sm p-6 transition-all duration-200">
      <h3 className="font-semibold text-lg mb-4 text-white">Vehicle Location</h3>
      
      <div className="space-y-4">
        {/* Store Name */}
        <div>
          <h4 className="font-medium text-white">{location.name}</h4>
          <p className="text-sm text-gray-400">Store #{location.code}</p>
        </div>

        {/* Address */}
        {location.address && (
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-gray-400">{location.address}</p>
            </div>
          </div>
        )}

        {/* Phone */}
        {location.phone && (
          <div className="flex items-center gap-3">
            <Phone className="h-5 w-5 text-gray-400" />
            <button
              onClick={handleCall}
              className="text-sm text-blue-400 hover:text-blue-300 transition-all duration-200"
            >
              {location.phone}
            </button>
          </div>
        )}

        {/* Hours */}
        {location.hours && (
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
            <p className="text-sm text-gray-400">{location.hours}</p>
          </div>
        )}

        {/* Actions */}
        <div className="pt-4 space-y-2">
          {location.address && (
            <button
              onClick={handleGetDirections}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#3b82f6] text-white rounded-lg hover:bg-[#2563eb] transition-all duration-200"
            >
              <Navigation className="h-4 w-4" />
              Get Directions
            </button>
          )}
          
          {location.phone && (
            <button
              onClick={handleCall}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#141414] text-gray-300 rounded-lg hover:bg-[#1f1f1f] transition-all duration-200"
            >
              <Phone className="h-4 w-4" />
              Call Store
            </button>
          )}
        </div>

        {/* Store Transfer Info */}
        <div className="pt-4">
          <p className="text-xs text-gray-400">
            This vehicle is currently located at this store. To transfer it to your location, click the &quot;Claim Vehicle&quot; button above.
          </p>
        </div>
      </div>
    </div>
  );
}