'use client';

import { useState } from 'react';
import VehiclePricing from './VehiclePricing';
import MarketTrendReportCard from './MarketTrendReportCard';
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
  const [vinDecodeData, setVinDecodeData] = useState<VinDecodeResponse | null>(null);
  const [isLoadingVinDecode, setIsLoadingVinDecode] = useState(false);

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
      // Error decoding VIN
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
      
      {marketTrendReport && (
        <MarketTrendReportCard 
          data={marketTrendReport}
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