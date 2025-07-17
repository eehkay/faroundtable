'use client';

import { useState } from 'react';
import VehiclePricing from './VehiclePricing';
import MarketTrendReportCard from './MarketTrendReportCard';
import ListingHistoryInfo from './ListingHistoryInfo';

interface ListingHistoryResponse {
  listings: any[];
  summary: {
    totalListings: number;
    uniqueDealers: number;
    priceRange: { min: number; max: number; current: number };
    mileageRange: { min: number; max: number; current: number };
    totalDaysListed: number;
    averageDaysPerListing: number;
    priceHistory: any[];
    hasMultipleDealers: boolean;
    currentListing: any;
    oldestListingDate?: string;
    newestListingDate?: string;
  };
  fetchedAt: string;
}

interface MarketInsightsWrapperProps {
  price?: number;
  salePrice?: number;
  msrp?: number;
  vehicleInfo: {
    make: string;
    model?: string;
    year?: string;
    vin?: string;
    locationId?: string;
  };
}

export default function MarketInsightsWrapper({ 
  price, 
  salePrice, 
  msrp, 
  vehicleInfo 
}: MarketInsightsWrapperProps) {
  const [marketTrendReport, setMarketTrendReport] = useState<any>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [listingHistoryData, setListingHistoryData] = useState<ListingHistoryResponse | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const fetchMarketInsights = async () => {
    if (!vehicleInfo.vin || !vehicleInfo.locationId) {
      return;
    }
    
    try {
      setIsLoadingInsights(true);
      
      const response = await fetch('/api/analytics/market-trend-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vin: vehicleInfo.vin,
          currentPrice: salePrice || price,
          locationId: vehicleInfo.locationId,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch market analysis: ${response.status}`);
      }

      const result = await response.json();
      setMarketTrendReport(result.data);
    } catch (error) {
      // Error fetching market analysis
    } finally {
      setIsLoadingInsights(false);
    }
  };

  const fetchListingHistory = async () => {
    if (!vehicleInfo.vin) return;
    
    try {
      setIsLoadingHistory(true);
      
      const response = await fetch('/api/vehicle-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vin: vehicleInfo.vin,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch listing history: ${response.status}`);
      }

      const data = await response.json();
      setListingHistoryData(data);
    } catch (error) {
      // Error fetching listing history
    } finally {
      setIsLoadingHistory(false);
    }
  };

  return (
    <>
      <VehiclePricing 
        price={price}
        salePrice={salePrice}
        msrp={msrp}
        onGetMarketInsights={vehicleInfo.vin ? fetchMarketInsights : undefined}
        isLoadingInsights={isLoadingInsights}
        onCheckListingHistory={vehicleInfo.vin ? fetchListingHistory : undefined}
        isLoadingHistory={isLoadingHistory}
      />
      
      {marketTrendReport && (
        <MarketTrendReportCard 
          data={marketTrendReport}
          currentPrice={salePrice || price || 0}
          vehicleInfo={vehicleInfo}
        />
      )}
      
      {listingHistoryData && vehicleInfo.vin && (
        <ListingHistoryInfo 
          data={listingHistoryData}
          vin={vehicleInfo.vin}
          currentPrice={salePrice || price}
        />
      )}
    </>
  );
}