'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Minus, AlertCircle, DollarSign, Calendar, MapPin, BarChart3 } from 'lucide-react';

export interface MarketInsightsData {
  vin: string;
  zipCode: string;
  regionName: string;
  timeframe: {
    daysBack: number;
    startDate: string;
    endDate: string;
  };
  newVehicles: {
    averagePrice: number;
    standardDeviation: number;
    sampleSize: number;
  };
  usedVehicles: {
    averagePrice: number;
    standardDeviation: number;
    sampleSize: number;
  };
  mileage: {
    average: number;
    standardDeviation: number;
    sampleSize: number;
  };
  dataDate: string;
}

interface MarketInsightsProps {
  data: MarketInsightsData;
  currentPrice: number;
  vehicleInfo: {
    make: string;
    model?: string;
    year?: string;
  };
}

export default function MarketInsights({ data, currentPrice, vehicleInfo }: MarketInsightsProps) {
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatMileage = (miles: number) => {
    return new Intl.NumberFormat('en-US').format(Math.round(miles));
  };

  const getPriceComparison = (marketPrice: number) => {
    if (!marketPrice || marketPrice === 0) return null;
    
    const difference = currentPrice - marketPrice;
    const percentDiff = Math.abs((difference / marketPrice) * 100);
    
    if (Math.abs(percentDiff) < 3) {
      return {
        icon: <Minus className="h-5 w-5" />,
        text: 'Priced at market',
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-900/20',
      };
    } else if (difference < 0) {
      return {
        icon: <TrendingDown className="h-5 w-5" />,
        text: `${percentDiff.toFixed(1)}% below market`,
        color: 'text-green-400',
        bgColor: 'bg-green-900/20',
      };
    } else {
      return {
        icon: <TrendingUp className="h-5 w-5" />,
        text: `${percentDiff.toFixed(1)}% above market`,
        color: 'text-red-400',
        bgColor: 'bg-red-900/20',
      };
    }
  };

  const getConfidenceBadge = (sampleSize: number) => {
    if (sampleSize >= 20) {
      return { text: 'High confidence', color: 'bg-green-900/20 text-green-400' };
    } else if (sampleSize >= 10) {
      return { text: 'Medium confidence', color: 'bg-yellow-900/20 text-yellow-400' };
    } else {
      return { text: 'Low confidence', color: 'bg-orange-900/20 text-orange-400' };
    }
  };

  return (
    <div className="bg-[#141414] rounded-lg shadow-sm p-6 transition-all duration-200 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Market Insights</h2>
        <div className="text-right">
          <span className="text-sm text-gray-400 block">
            Updated {new Date(data.dataDate).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Location and Time Context */}
      <div className="flex items-center gap-4 text-sm text-gray-400">
        <div className="flex items-center gap-1">
          <MapPin className="h-4 w-4" />
          <span>ZIP {data.zipCode}</span>
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="h-4 w-4" />
          <span>Last {data.timeframe.daysBack} days</span>
        </div>
      </div>

      {/* Used Vehicles Section (Primary) */}
      {data.usedVehicles && data.usedVehicles.sampleSize > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-medium text-white flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-[#3b82f6]" />
            Similar Used Vehicles
          </h3>
          
          <div className="bg-[#1f1f1f] rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-400 mb-1">Average Sale Price</p>
                <p className="text-2xl font-bold text-white">{formatPrice(data.usedVehicles.averagePrice)}</p>
                {currentPrice && (
                  <div className={`flex items-center gap-1 mt-2 ${getPriceComparison(data.usedVehicles.averagePrice)?.color || ''}`}>
                    {getPriceComparison(data.usedVehicles.averagePrice)?.icon}
                    <span className="text-sm">{getPriceComparison(data.usedVehicles.averagePrice)?.text}</span>
                  </div>
                )}
              </div>
              
              <div>
                <p className="text-sm text-gray-400 mb-1">Price Range</p>
                <p className="text-lg font-semibold text-white">
                  {formatPrice(data.usedVehicles.averagePrice - data.usedVehicles.standardDeviation)} - {formatPrice(data.usedVehicles.averagePrice + data.usedVehicles.standardDeviation)}
                </p>
                <p className="text-xs text-gray-500 mt-1">±{formatPrice(data.usedVehicles.standardDeviation)} std dev</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getConfidenceBadge(data.usedVehicles.sampleSize).color}`}>
                {getConfidenceBadge(data.usedVehicles.sampleSize).text}
              </span>
              <span className="text-xs text-gray-400">
                Based on {data.usedVehicles.sampleSize} used vehicle sales
              </span>
            </div>
          </div>
        </div>
      )}

      {/* New Vehicles Section (Secondary) */}
      {data.newVehicles && data.newVehicles.sampleSize > 0 && (
        <div className="space-y-3 border-t border-[#2a2a2a] pt-6">
          <h3 className="text-lg font-medium text-white flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-400" />
            New Vehicle Benchmark
          </h3>
          
          <div className="bg-[#1f1f1f] rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-400 mb-1">Average New Price</p>
                <p className="text-xl font-bold text-green-400">{formatPrice(data.newVehicles.averagePrice)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400 mb-1">Sample Size</p>
                <p className="text-lg text-white">{data.newVehicles.sampleSize} sales</p>
              </div>
            </div>
            
            {currentPrice && (
              <div className="mt-3 text-sm text-gray-400">
                This vehicle is {formatPrice(Math.abs(currentPrice - data.newVehicles.averagePrice))} {currentPrice < data.newVehicles.averagePrice ? 'below' : 'above'} new vehicle average
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mileage Analysis */}
      {data.mileage && data.mileage.sampleSize > 0 && (
        <div className="space-y-3 border-t border-[#2a2a2a] pt-6">
          <h3 className="text-lg font-medium text-white">Mileage Analysis</h3>
          
          <div className="bg-[#1f1f1f] rounded-lg p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-400 mb-1">Average Mileage</p>
                <p className="text-lg font-semibold text-white">{formatMileage(data.mileage.average)}</p>
                <p className="text-xs text-gray-500">miles</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Mileage Range</p>
                <p className="text-sm text-white">
                  {formatMileage(Math.max(0, data.mileage.average - data.mileage.standardDeviation))} - {formatMileage(data.mileage.average + data.mileage.standardDeviation)}
                </p>
                <p className="text-xs text-gray-500">typical range</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Data Points</p>
                <p className="text-lg font-semibold text-white">{data.mileage.sampleSize}</p>
                <p className="text-xs text-gray-500">vehicles</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No Data Message */}
      {(!data.usedVehicles || data.usedVehicles.sampleSize === 0) && (!data.newVehicles || data.newVehicles.sampleSize === 0) && (
        <div className="bg-yellow-900/20 border border-yellow-900/30 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-400" />
          <div>
            <p className="text-yellow-300 font-medium">Limited Market Data</p>
            <p className="text-yellow-200 text-sm">
              No recent sales found for similar vehicles in this area. Try expanding your search radius or check back later.
            </p>
          </div>
        </div>
      )}

      {/* Data Disclaimer */}
      <div className="flex items-start gap-2 pt-4 border-t border-[#2a2a2a]">
        <AlertCircle className="h-4 w-4 text-gray-400 mt-0.5" />
        <p className="text-xs text-gray-400">
          Market data shows recent sales of similar vehicles in {data.regionName}. 
          Actual values may vary based on specific condition, equipment, and local demand.
        </p>
      </div>
    </div>
  );
}