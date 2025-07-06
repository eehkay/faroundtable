'use client';

import { useState } from 'react';
import { TrendingUp, Shield } from 'lucide-react';

interface VehiclePricingProps {
  price?: number;
  salePrice?: number;
  msrp?: number;
  onGetMarketInsights?: () => void;
  isLoadingInsights?: boolean;
  onCheckVinRecalls?: () => void;
  isLoadingVinDecode?: boolean;
}

export default function VehiclePricing({ 
  price, 
  salePrice, 
  msrp, 
  onGetMarketInsights, 
  isLoadingInsights,
  onCheckVinRecalls,
  isLoadingVinDecode
}: VehiclePricingProps) {
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const displayPrice = salePrice || price;

  if (!displayPrice) {
    return (
      <div className="bg-tertiary-dark rounded-lg shadow-sm p-6 transition-all duration-200">
        <h2 className="text-xl font-semibold text-white mb-4">Pricing</h2>
        <p className="text-gray-400">Contact for pricing</p>
      </div>
    );
  }

  return (
    <div className="bg-tertiary-dark rounded-lg shadow-sm p-6 transition-all duration-200">
      <h2 className="text-xl font-semibold text-white mb-4">Pricing</h2>
      
      <div className="space-y-4">
        {/* Retail Price (MSRP) */}
        {msrp && (
          <>
            <div className="flex justify-between items-baseline">
              <span className="text-gray-400 text-lg">Retail Price:</span>
              <span className="text-gray-100 text-xl">{formatPrice(msrp)}</span>
            </div>
            <div className="border-b border-zinc-700"></div>
          </>
        )}

        {/* Selling Price */}
        <div className="flex justify-between items-baseline">
          <span className="text-gray-400 text-lg">Selling Price:</span>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-white">
              {formatPrice(displayPrice)}
            </span>
            {salePrice && price && salePrice < price && (
              <span className="text-lg text-gray-400 line-through">
                {formatPrice(price)}
              </span>
            )}
          </div>
        </div>

        {/* Sale Badge */}
        {salePrice && (
          <div className="inline-flex items-center gap-2 bg-red-900/20 text-red-300 px-3 py-1 rounded-full text-sm font-semibold transition-all duration-200">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 5a3 3 0 015-2.236A3 3 0 0114.83 6H16a2 2 0 110 4h-5V9a1 1 0 10-2 0v1H4a2 2 0 110-4h1.17C5.06 5.687 5 5.35 5 5zm4 1V5a1 1 0 10-1 1h1zm3 0a1 1 0 10-1-1v1h1z" clipRule="evenodd" />
              <path d="M9 11H3v5a2 2 0 002 2h4v-7zM11 18h4a2 2 0 002-2v-5h-6v7z" />
            </svg>
            Special Price
          </div>
        )}

        {/* Action Buttons */}
        {(onGetMarketInsights || onCheckVinRecalls) && (
          <div className="pt-4 border-t border-[#2a2a2a] space-y-3">
            <div className={`grid gap-3 ${onGetMarketInsights && onCheckVinRecalls ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {onGetMarketInsights && (
                <button
                  onClick={onGetMarketInsights}
                  disabled={isLoadingInsights}
                  className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white font-semibold py-3 px-4 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoadingInsights ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Loading...</span>
                    </>
                  ) : (
                    <>
                      <TrendingUp className="h-5 w-5" />
                      <span>Market Insights</span>
                    </>
                  )}
                </button>
              )}
              
              {onCheckVinRecalls && (
                <button
                  onClick={onCheckVinRecalls}
                  disabled={isLoadingVinDecode}
                  className="w-full bg-[#10b981] hover:bg-[#059669] text-white font-semibold py-3 px-4 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoadingVinDecode ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Loading...</span>
                    </>
                  ) : (
                    <>
                      <Shield className="h-5 w-5" />
                      <span>Check Recalls</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}