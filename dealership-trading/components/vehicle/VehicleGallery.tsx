'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Expand } from 'lucide-react';

interface VehicleGalleryProps {
  images: string[];
  vehicleTitle: string;
}

export default function VehicleGallery({ images, vehicleTitle }: VehicleGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Default image if none provided
  const displayImages = images.length > 0 ? images : ['/placeholder-vehicle.jpg'];

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? displayImages.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === displayImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <>
      <div className="bg-[#1f1f1f] rounded-lg shadow-sm overflow-hidden transition-all duration-200">
        {/* Main Image */}
        <div className="relative aspect-[4/3] bg-[#141414]">
          <Image
            src={displayImages[currentIndex]}
            alt={`${vehicleTitle} - Image ${currentIndex + 1}`}
            fill
            className="object-contain"
            priority={currentIndex === 0}
            unoptimized
          />
          
          {/* Navigation Arrows */}
          {displayImages.length > 1 && (
            <>
              <button
                onClick={handlePrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-[#2a2a2a]/80 hover:bg-[#333333] rounded-full p-2 shadow-md transition-all duration-200"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-5 w-5 text-gray-200" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-[#2a2a2a]/80 hover:bg-[#333333] rounded-full p-2 shadow-md transition-all duration-200"
                aria-label="Next image"
              >
                <ChevronRight className="h-5 w-5 text-gray-200" />
              </button>
            </>
          )}

          {/* Fullscreen Button */}
          <button
            onClick={() => setIsFullscreen(true)}
            className="absolute top-4 right-4 bg-[#2a2a2a]/80 hover:bg-[#333333] rounded-full p-2 shadow-md transition-all duration-200"
            aria-label="View fullscreen"
          >
            <Expand className="h-5 w-5 text-gray-200" />
          </button>

          {/* Image Counter */}
          {displayImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
              {currentIndex + 1} / {displayImages.length}
            </div>
          )}
        </div>

        {/* Thumbnail Strip */}
        {displayImages.length > 1 && (
          <div className="p-4 bg-[#141414]">
            <div className="flex gap-2 overflow-x-auto">
              {displayImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`relative flex-shrink-0 w-20 h-20 rounded overflow-hidden transition-all duration-200 ${
                    index === currentIndex
                      ? 'ring-2 ring-blue-500 scale-105'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  <Image
                    src={image}
                    alt={`${vehicleTitle} - Thumbnail ${index + 1}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            aria-label="Close fullscreen"
          >
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="relative w-full h-full flex items-center justify-center p-8">
            <Image
              src={displayImages[currentIndex]}
              alt={`${vehicleTitle} - Fullscreen ${currentIndex + 1}`}
              fill
              className="object-contain"
              unoptimized
            />

            {/* Fullscreen Navigation */}
            {displayImages.length > 1 && (
              <>
                <button
                  onClick={handlePrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-12 w-12" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-12 w-12" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}