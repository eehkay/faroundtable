'use client';

import React from 'react';
import { Clock, TrendingDown, TrendingUp, MapPin, DollarSign, AlertCircle, CheckCircle, Info, ExternalLink, Car } from 'lucide-react';

interface ListingRecord {
  id: string;
  price: number;
  miles: number;
  seller_name: string;
  city: string;
  state: string;
  first_seen_at_date: string;
  last_seen_at_date: string;
  vdp_url?: string;
  daysOnMarket?: number;
  isCurrentListing?: boolean;
}

interface ListingHistoryData {
  listings: ListingRecord[];
  summary: {
    totalListings: number;
    uniqueDealers: number;
    priceRange: { min: number; max: number; current: number };
    mileageRange: { min: number; max: number; current: number };
    totalDaysListed: number;
    averageDaysPerListing: number;
    priceHistory: Array<{ date: string; price: number; dealer: string; miles: number }>;
    hasMultipleDealers: boolean;
    currentListing: ListingRecord | null;
    oldestListingDate?: string;
    newestListingDate?: string;
  };
  fetchedAt: string;
}

interface ListingHistoryInfoProps {
  data: ListingHistoryData;
  vin: string;
  currentPrice?: number;
}

export default function ListingHistoryInfo({ data, vin, currentPrice }: ListingHistoryInfoProps) {
  const { listings, summary } = data;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const calculateDaysBetween = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getPriceChangeIcon = (currentPrice: number, previousPrice: number) => {
    if (currentPrice < previousPrice) {
      return <TrendingDown className="h-4 w-4 text-green-400" />;
    } else if (currentPrice > previousPrice) {
      return <TrendingUp className="h-4 w-4 text-red-400" />;
    }
    return null;
  };

  const getPriceChangeText = (currentPrice: number, previousPrice: number) => {
    const diff = currentPrice - previousPrice;
    const percent = Math.abs((diff / previousPrice) * 100).toFixed(1);
    
    if (diff < 0) {
      return <span className="text-green-400">↓ {formatPrice(Math.abs(diff))} ({percent}%)</span>;
    } else if (diff > 0) {
      return <span className="text-red-400">↑ {formatPrice(diff)} ({percent}%)</span>;
    }
    return <span className="text-gray-400">No change</span>;
  };

  const getDaysOnMarketColor = (days: number) => {
    if (days <= 30) return 'text-green-400';
    if (days <= 60) return 'text-yellow-400';
    if (days <= 90) return 'text-orange-400';
    return 'text-red-400';
  };

  const hasListings = listings && listings.length > 0;

  return (
    <div className="bg-[#141414] rounded-lg shadow-sm p-6 transition-all duration-200 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <Clock className="h-5 w-5 text-[#9333ea]" />
          Vehicle Listing History
        </h2>
        <span className="text-sm text-gray-400">VIN: {vin}</span>
      </div>

      {!hasListings ? (
        <div className="bg-gray-900/20 border border-gray-900/30 rounded-lg p-4 flex items-center gap-3">
          <Info className="h-5 w-5 text-gray-400" />
          <p className="text-sm text-gray-300">
            No listing history found for this vehicle. This may be a new listing or the vehicle may not have been listed online before.
          </p>
        </div>
      ) : (
        <>
          {/* Summary Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#2a2a2a]">
              <p className="text-xs text-gray-400 uppercase mb-1">Total Listings</p>
              <p className="text-2xl font-bold text-white">{summary.totalListings}</p>
              {summary.hasMultipleDealers && (
                <p className="text-xs text-yellow-400 mt-1">Multiple dealers</p>
              )}
            </div>
            
            <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#2a2a2a]">
              <p className="text-xs text-gray-400 uppercase mb-1">Days Listed</p>
              <p className="text-2xl font-bold text-white">{summary.totalDaysListed}</p>
              <p className="text-xs text-gray-500 mt-1">
                Avg: {summary.averageDaysPerListing} days
              </p>
            </div>
            
            <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#2a2a2a]">
              <p className="text-xs text-gray-400 uppercase mb-1">Price Range</p>
              <p className="text-lg font-bold text-white">
                {formatPrice(summary.priceRange.min)}
              </p>
              <p className="text-xs text-gray-500">
                to {formatPrice(summary.priceRange.max)}
              </p>
            </div>
            
            <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#2a2a2a]">
              <p className="text-xs text-gray-400 uppercase mb-1">Current Price</p>
              <p className="text-2xl font-bold text-white">
                {formatPrice(summary.priceRange.current || currentPrice || 0)}
              </p>
              {summary.priceRange.current !== summary.priceRange.min && (
                <p className="text-xs text-gray-500 mt-1">
                  {summary.priceRange.current < summary.priceRange.max ? '↓' : '↑'} 
                  {' from high'}
                </p>
              )}
            </div>
          </div>

          {/* Price Drop Alert */}
          {listings.length > 1 && listings[0].price < listings[1].price && (
            <div className="bg-green-900/20 border border-green-900/30 rounded-lg p-4 flex items-start gap-3">
              <TrendingDown className="h-5 w-5 text-green-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-300">Recent Price Drop!</p>
                <p className="text-sm text-green-200">
                  Price reduced by {formatPrice(listings[1].price - listings[0].price)} 
                  {' '}({((listings[1].price - listings[0].price) / listings[1].price * 100).toFixed(1)}%)
                </p>
              </div>
            </div>
          )}

          {/* Multiple Dealers Warning */}
          {summary.hasMultipleDealers && (
            <div className="bg-yellow-900/20 border border-yellow-900/30 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-300">Multiple Dealer History</p>
                <p className="text-sm text-yellow-200">
                  This vehicle has been listed by {summary.uniqueDealers} different dealers, 
                  which may indicate transfers between dealerships or wholesale activity.
                </p>
              </div>
            </div>
          )}

          {/* Listing Timeline */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Listing Timeline</h3>
            
            <div className="space-y-3">
              {listings.map((listing, index) => {
                const isFirst = index === 0;
                const isLast = index === listings.length - 1;
                const previousListing = index < listings.length - 1 ? listings[index + 1] : null;
                
                return (
                  <div key={listing.id} className={`relative ${!isLast ? 'pb-3' : ''}`}>
                    {/* Timeline connector */}
                    {!isLast && (
                      <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-[#2a2a2a]" />
                    )}
                    
                    {/* Listing card */}
                    <div className={`relative flex gap-4 ${listing.isCurrentListing ? 'bg-[#9333ea]/10' : 'bg-[#1a1a1a]'} 
                                    rounded-lg p-4 border ${listing.isCurrentListing ? 'border-[#9333ea]/30' : 'border-[#2a2a2a]'} 
                                    transition-all duration-200 hover:bg-[#1f1f1f]`}>
                      
                      {/* Timeline dot */}
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
                                      ${listing.isCurrentListing ? 'bg-[#9333ea]' : 'bg-[#2a2a2a]'}`}>
                        {listing.isCurrentListing ? (
                          <CheckCircle className="h-5 w-5 text-white" />
                        ) : (
                          <Car className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                      
                      {/* Listing details */}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium text-white">
                              {listing.seller_name}
                              {listing.isCurrentListing && (
                                <span className="ml-2 text-xs bg-[#9333ea] text-white px-2 py-1 rounded-full">
                                  Current
                                </span>
                              )}
                            </h4>
                            <p className="text-sm text-gray-400 flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {listing.city}, {listing.state}
                            </p>
                          </div>
                          
                          <div className="text-right">
                            <p className="text-lg font-bold text-white flex items-center gap-2">
                              {formatPrice(listing.price)}
                              {previousListing && getPriceChangeIcon(listing.price, previousListing.price)}
                            </p>
                            {previousListing && (
                              <p className="text-xs">
                                {getPriceChangeText(listing.price, previousListing.price)}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-4">
                            <span className="text-gray-400">
                              {formatDate(listing.first_seen_at_date)} - {formatDate(listing.last_seen_at_date)}
                            </span>
                            <span className={`font-medium ${getDaysOnMarketColor(listing.daysOnMarket || 0)}`}>
                              {listing.daysOnMarket} days
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400">
                              {listing.miles?.toLocaleString()} miles
                            </span>
                            {listing.vdp_url && listing.isCurrentListing && (
                              <a 
                                href={listing.vdp_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-[#9333ea] hover:text-[#7c3aed] transition-colors"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Market Performance Insights */}
          <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#2a2a2a] space-y-3">
            <h4 className="font-medium text-white flex items-center gap-2">
              <Info className="h-4 w-4 text-[#9333ea]" />
              Market Performance Insights
            </h4>
            
            <div className="space-y-2 text-sm">
              {/* Long listing time warning */}
              {summary.averageDaysPerListing > 60 && (
                <p className="text-yellow-300">
                  ⚠️ Average listing duration of {summary.averageDaysPerListing} days is above market average, 
                  suggesting pricing or demand challenges.
                </p>
              )}
              
              {/* Price reduction indicator */}
              {summary.priceRange.current < summary.priceRange.max && (
                <p className="text-green-300">
                  ✓ Price has been reduced {((summary.priceRange.max - summary.priceRange.current) / summary.priceRange.max * 100).toFixed(1)}% 
                  {' '}from the highest listing price.
                </p>
              )}
              
              {/* Multiple dealers insight */}
              {summary.hasMultipleDealers && (
                <p className="text-blue-300">
                  ℹ️ Listed by {summary.uniqueDealers} dealers over {calculateDaysBetween(
                    summary.oldestListingDate || listings[listings.length - 1].first_seen_at_date,
                    summary.newestListingDate || listings[0].last_seen_at_date
                  )} days total.
                </p>
              )}
              
              {/* Quick sale indicator */}
              {summary.averageDaysPerListing <= 30 && listings.length === 1 && (
                <p className="text-green-300">
                  ✓ Quick market performance with only {summary.averageDaysPerListing} days on market.
                </p>
              )}
            </div>
          </div>

          {/* Data Source Disclaimer */}
          <div className="flex items-start gap-2 pt-4 border-t border-[#2a2a2a]">
            <Info className="h-4 w-4 text-gray-400 mt-0.5" />
            <p className="text-xs text-gray-400">
              Listing history data sourced from online marketplaces. Data current as of {formatDate(data.fetchedAt)}.
              Some historical listings may not be captured if they were not indexed by data providers.
            </p>
          </div>
        </>
      )}
    </div>
  );
}