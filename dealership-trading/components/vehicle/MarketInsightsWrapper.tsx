'use client';

import { useState } from 'react';
import VehiclePricing from './VehiclePricing';
import MarketInsights from './MarketInsights';
import type { MarketInsightsData } from './MarketInsights';
import VinDecodeInfo from './VinDecodeInfo';

interface VinDecodeResponse {
  vehicleInfo: {
    [key: string]: string | number | undefined;
  };
  recalls?: any[];
  complaints?: any[];
  investigations?: any[];
  decodedAt?: string;
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
  };
}

export default function MarketInsightsWrapper({ 
  price, 
  salePrice, 
  msrp, 
  vehicleInfo 
}: MarketInsightsWrapperProps) {
  const [marketInsights, setMarketInsights] = useState<MarketInsightsData | null>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [vinDecodeData, setVinDecodeData] = useState<VinDecodeResponse | null>(null);
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
      // Add decodedAt timestamp if not present
      const vinData = {
        ...data,
        decodedAt: data.decodedAt || new Date().toISOString()
      };
      setVinDecodeData(vinData);
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
          data={{
            vehicleInfo: vinDecodeData.vehicleInfo,
            recalls: vinDecodeData.recalls || [],
            decodedAt: vinDecodeData.decodedAt || new Date().toISOString()
          }}
          vin={vehicleInfo.vin}
        />
      )}
    </>
  );
}