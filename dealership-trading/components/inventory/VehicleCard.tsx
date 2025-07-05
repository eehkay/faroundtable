"use client"

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { MapPin, Calendar, DollarSign, Gauge, ChevronLeft, ChevronRight } from 'lucide-react';
import TransferStatus from './TransferStatus';
import ClaimButton from '@/components/vehicle/ClaimButton';
import type { Vehicle, DealershipLocation } from '@/types/vehicle';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface VehicleWithTransfers extends Vehicle {
  activeTransferRequests?: any[];
}

interface VehicleCardProps {
  vehicle: VehicleWithTransfers;
  userLocation?: DealershipLocation;
  userRole: string;
  onUpdate?: () => void;
}

export default function VehicleCard({ vehicle, userLocation, userRole, onUpdate }: VehicleCardProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatMileage = (mileage: number) => {
    return new Intl.NumberFormat('en-US').format(mileage);
  };

  const images = vehicle.imageUrls && vehicle.imageUrls.length > 0 ? vehicle.imageUrls : ['/placeholder-vehicle.jpg'];
  const isAtUserLocation = userLocation && vehicle.location && '_id' in vehicle.location && vehicle.location._id === userLocation._id;

  const handlePreviousImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <Link href={`/inventory/${vehicle.stockNumber}`}>
      <Card className="group relative h-[420px] overflow-hidden transition-all duration-300 bg-[#1f1f1f] border border-[#2a2a2a] rounded-xl hover:transform hover:-translate-y-1 hover:shadow-2xl p-0">
        {/* Hero Image Section */}
        <div className="relative h-[280px] bg-[#0a0a0a] overflow-hidden">
          {!imageError ? (
            <>
              {imageLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#141414]">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              )}
              <Image
                src={images[currentImageIndex]}
                alt={vehicle.title || `${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                fill
                className={`object-cover transition-opacity duration-300 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
                onLoad={() => setImageLoading(false)}
                onError={() => {
                  setImageError(true);
                  setImageLoading(false);
                }}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />

              {/* Image Navigation Arrows */}
              {images.length > 1 && !imageLoading && (
                <>
                  <button
                    onClick={handlePreviousImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 backdrop-blur-sm rounded-full p-2 transition-all duration-200 opacity-0 group-hover:opacity-100"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-5 w-5 text-white" />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 backdrop-blur-sm rounded-full p-2 transition-all duration-200 opacity-0 group-hover:opacity-100"
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-5 w-5 text-white" />
                  </button>
                </>
              )}

              {/* Image Counter */}
              {images.length > 1 && (
                <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-medium">
                  {currentImageIndex + 1} / {images.length}
                </div>
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0a]">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="mt-1 text-xs text-gray-500">No image</p>
              </div>
            </div>
          )}

          {/* Status Badge - Top Right */}
          <TransferStatus status={vehicle.status} className="absolute top-4 right-4" />

          {/* Gradient Overlay */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#1f1f1f] via-[#1f1f1f]/60 to-transparent" />
        </div>

        {/* Content Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          {/* Title and Description */}
          <div className="mb-3">
            <h3 className="text-xl font-bold text-white mb-1 line-clamp-1">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </h3>
            <p className="text-sm text-gray-400 line-clamp-2">
              {vehicle.trim || `Stock #${vehicle.stockNumber}`}
              {vehicle.location && '_id' in vehicle.location && ` • ${vehicle.location.name}`}
            </p>
          </div>

          {/* Price and Details Row */}
          <div className="flex items-end justify-between mb-4">
            <div>
              {/* Price */}
              <div className="text-2xl font-bold text-white">
                {vehicle.salePrice && vehicle.salePrice < vehicle.price ? (
                  <>
                    <span>{formatPrice(vehicle.salePrice)}</span>
                    <span className="text-sm text-gray-500 line-through ml-2">
                      {formatPrice(vehicle.price)}
                    </span>
                  </>
                ) : (
                  formatPrice(vehicle.price)
                )}
              </div>
            </div>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
            {vehicle.mileage && (
              <span className="bg-[#3b82f6]/20 px-2.5 py-1 rounded-full text-[#3b82f6] font-medium">
                {formatMileage(vehicle.mileage)} mi
              </span>
            )}

            {vehicle.condition && (
              <span className="bg-[#10b981]/20 px-2.5 py-1 rounded-full text-[#10b981] font-medium capitalize">
                {vehicle.condition}
              </span>
            )}

            {vehicle.daysOnLot !== undefined && (
              <span className="bg-[#f59e0b]/20 px-2.5 py-1 rounded-full text-[#f59e0b] font-medium">
                {vehicle.daysOnLot}d
              </span>
            )}
          </div>

          {/* Claim Button */}
          <div onClick={(e) => e.preventDefault()}>
            <ClaimButton
              vehicleId={vehicle._id || ''}
              vehicleStatus={vehicle.status}
              vehicleLocation={vehicle.location && '_id' in vehicle.location ? vehicle.location._id : ''}
              activeTransferRequests={vehicle.activeTransferRequests?.filter((t: any) => t.status === 'requested').length || 0}
              onSuccess={onUpdate}
              className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white font-semibold py-3 px-6 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl"
            />
          </div>

          {/* Transfer Info */}
          {vehicle.activeTransferRequests && vehicle.activeTransferRequests.length > 0 && (
            <div className="mt-3 text-center">
              <p className="text-xs text-gray-400">
                {vehicle.activeTransferRequests.filter((t: any) => t.status === 'requested').length} pending transfer request(s)
              </p>
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}