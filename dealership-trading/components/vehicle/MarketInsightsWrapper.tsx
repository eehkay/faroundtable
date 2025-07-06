'use client';

import { useState } from 'react';
import VehiclePricing from './VehiclePricing';
import MarketInsights from './MarketInsights';
import VinDecodeInfo from './VinDecodeInfo';

interface MarketInsightsWrapperProps {
  price?: number;
  salePrice?: number;
  msrp?: number;
  vehicleInfo: {
    make: string;
    model?: string;
    year?: string;
    vin?: string;
  };
}

export default function MarketInsightsWrapper({ 
  price, 
  salePrice, 
  msrp, 
  vehicleInfo 
}: MarketInsightsWrapperProps) {
  const [marketInsights, setMarketInsights] = useState<any>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [vinDecodeData, setVinDecodeData] = useState<any>(null);
  const [isLoadingVinDecode, setIsLoadingVinDecode] = useState(false);

  const fetchMarketInsights = async () => {
    if (!vehicleInfo.vin) {
      console.error('VIN is required for market insights');
      return;
    }
    
    try {
      setIsLoadingInsights(true);
      
      const response = await fetch('/api/market-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vin: vehicleInfo.vin,
          zipCode: '89104', // Default ZIP code, could be made configurable
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Market insights API error:', response.status, errorText);
        throw new Error(`Failed to fetch market insights: ${response.status}`);
      }

      const data = await response.json();
      setMarketInsights(data);
    } catch (error) {
      console.error('Error fetching market insights:', error);
    } finally {
      setIsLoadingInsights(false);
    }
  };

  const fetchVinDecode = async () => {
    if (!vehicleInfo.vin) return;
    
    try {
      setIsLoadingVinDecode(true);
      
      const response = await fetch('/api/vin-decode', {
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
        console.error('VIN decode API error:', response.status, errorText);
        throw new Error(`Failed to decode VIN: ${response.status}`);
      }

      const data = await response.json();
      setVinDecodeData(data);
    } catch (error) {
      console.error('Error decoding VIN:', error);
    } finally {
      setIsLoadingVinDecode(false);
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
        onCheckVinRecalls={vehicleInfo.vin ? fetchVinDecode : undefined}
        isLoadingVinDecode={isLoadingVinDecode}
      />
      
      {marketInsights && (
        <MarketInsights 
          data={marketInsights}
          currentPrice={salePrice || price || 0}
          vehicleInfo={vehicleInfo}
        />
      )}
      
      {vinDecodeData && vehicleInfo.vin && (
        <VinDecodeInfo 
          data={vinDecodeData}
          vin={vehicleInfo.vin}
        />
      )}
    </>
  );
}