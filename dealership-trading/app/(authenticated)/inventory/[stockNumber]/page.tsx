import { notFound } from 'next/navigation';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getVehicleByStockNumber } from "@/lib/queries-supabase";
import VehicleGallery from "@/components/vehicle/VehicleGallery";
import VehicleSpecs from "@/components/vehicle/VehicleSpecs";
import MarketInsightsWrapper from "@/components/vehicle/MarketInsightsWrapper";
import VehicleFeatures from "@/components/vehicle/VehicleFeatures";
import VehicleLocation from "@/components/vehicle/VehicleLocation";
import VehicleActions from "@/components/vehicle/VehicleActions";
import UnifiedActivityFeed from "@/components/vehicle/UnifiedActivityFeed";
import TransferStatus from "@/components/inventory/TransferStatus";
import TransferRequestsPanel from "@/components/vehicle/TransferRequestsPanel";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{
    stockNumber: string;
  }>;
}

export default async function VehicleDetailPage({ params }: PageProps) {
  // Check authentication
  const session = await getServerSession(authOptions);
  if (!session) {
    notFound();
  }

  // Await the params to get the stockNumber
  const { stockNumber } = await params;


  // Fetch vehicle details
  const vehicle = await getVehicleByStockNumber(stockNumber);


  if (!vehicle) {
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <Link 
        href="/inventory" 
        className="inline-flex items-center text-gray-400 hover:text-gray-100 mb-6 transition-all duration-200"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Inventory
      </Link>

      {/* Vehicle Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </h1>
            {vehicle.trim && (
              <p className="text-lg text-gray-400 mt-1">{vehicle.trim}</p>
            )}
            <div className="flex items-center gap-4 mt-2">
              <span className="text-sm text-gray-400">Stock #{vehicle.stockNumber}</span>
              <span className="text-sm text-gray-400">VIN: {vehicle.vin}</span>
              <TransferStatus status={vehicle.status} />
            </div>
          </div>
          
          {/* Action Button */}
          <div className="flex items-center gap-4">
            <VehicleActions
              vehicleId={vehicle._id}
              vehicleStatus={vehicle.status}
              vehicleLocation={vehicle.location?._id}
              activeTransferRequests={vehicle.activeTransferRequests?.length || 0}
              className="bg-[#3b82f6] hover:bg-[#2563eb] text-white font-semibold py-3 px-6 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Gallery and Details */}
        <div className="lg:col-span-2 space-y-8">
          {/* Image Gallery */}
          <VehicleGallery 
            images={vehicle.imageUrls || []} 
            vehicleTitle={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
          />

          {/* Pricing & Market Insights */}
          <MarketInsightsWrapper
            price={vehicle.price}
            salePrice={vehicle.salePrice}
            msrp={vehicle.msrp}
            vehicleInfo={{
              make: vehicle.make,
              model: vehicle.model,
              year: vehicle.year,
              vin: vehicle.vin,
              locationId: vehicle.location?._id,
            }}
          />

          {/* Specifications */}
          <VehicleSpecs vehicle={vehicle} />

          {/* Features */}
          {vehicle.features && vehicle.features.length > 0 && (
            <VehicleFeatures features={vehicle.features} />
          )}

          {/* Description */}
          {vehicle.description && (
            <div className="bg-[#1f1f1f] rounded-lg shadow-sm p-6 transition-all duration-200">
              <h2 className="text-xl font-semibold text-white mb-4">Description</h2>
              <p className="text-gray-300 whitespace-pre-wrap">{vehicle.description}</p>
            </div>
          )}
        </div>

        {/* Right Column - Location, Activity, Comments */}
        <div className="space-y-8">
          {/* Location Info */}
          <VehicleLocation location={vehicle.location} />

          {/* Transfer Requests Panel */}
          {vehicle.activeTransferRequests && vehicle.activeTransferRequests.length > 0 && (
            <TransferRequestsPanel 
              vehicleId={vehicle._id}
              vehicleLocation={vehicle.location?._id}
            />
          )}

          {/* Unified Activity Feed (Activities, Comments, Transfers) */}
          <UnifiedActivityFeed vehicleId={vehicle._id} />
        </div>
      </div>
    </div>
  );
}