'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Minus, DollarSign, Package, Search, MapPin, ExternalLink, AlertCircle } from 'lucide-react';

interface MarketTrendReportCardProps {
  data: any; // We'll use the full Market Trend Report data structure
  currentPrice: number;
  vehicleInfo: {
    make: string;
    model?: string;
    year?: string;
    vin?: string;
    locationId?: string;
  };
}

export default function MarketTrendReportCard({ data, currentPrice, vehicleInfo }: MarketTrendReportCardProps) {
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-blue-500';
    if (score >= 40) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return 'bg-green-900/20 text-green-400';
    if (score >= 60) return 'bg-blue-900/20 text-blue-400';
    if (score >= 40) return 'bg-yellow-900/20 text-yellow-400';
    return 'bg-red-900/20 text-red-400';
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'above') return <TrendingUp className="h-4 w-4 text-red-500" />;
    if (trend === 'below') return <TrendingDown className="h-4 w-4 text-green-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  const openFullReport = () => {
    const params = new URLSearchParams({
      vin: vehicleInfo.vin || '',
      price: currentPrice.toString(),
      locationId: vehicleInfo.locationId || ''
    });
    window.open(`/analytics/market-trend-report?${params.toString()}`, '_blank');
  };

  return (
    <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg shadow-sm p-6 transition-all duration-200 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Market Analysis</h2>
        <button
          onClick={openFullReport}
          className="flex items-center gap-1 text-sm text-[#3b82f6] hover:text-[#2563eb] transition-colors"
        >
          View Full Report
          <ExternalLink className="h-3 w-3" />
        </button>
      </div>

      {/* Opportunity Score */}
      {data.opportunityScore && (
        <div className="bg-[#141414] rounded-lg p-4 border border-[#2a2a2a]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[#737373] uppercase">Opportunity Score</span>
            <span className={`text-2xl font-bold ${getScoreColor(data.opportunityScore.overall)}`}>
              {data.opportunityScore.overall}%
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between">
              <span className="text-[#737373]">Price Position:</span>
              <span className="text-white">{data.opportunityScore.breakdown.priceCompetitiveness}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#737373]">Inventory:</span>
              <span className="text-white">{data.opportunityScore.breakdown.inventoryScarcity}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#737373]">Regional Demand:</span>
              <span className="text-white">{data.opportunityScore.breakdown.regionalDemand}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#737373]">Market Timing:</span>
              <span className="text-white">{data.opportunityScore.breakdown.marketTiming}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Price Analysis */}
      {data.marketPosition && !data.marketPosition.error && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-white flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-[#3b82f6]" />
            Price Analysis
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-[#737373] uppercase mb-1">Market Price</p>
              <p className="text-lg font-semibold text-white">
                {formatPrice(data.marketPosition.predictedPrice)}
              </p>
              <p className="text-xs text-[#737373]">
                {formatPrice(data.marketPosition.priceRange.lower)} - {formatPrice(data.marketPosition.priceRange.upper)}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#737373] uppercase mb-1">Current Position</p>
              <div className="flex items-center gap-2">
                {getTrendIcon(data.competitiveLandscape?.pricePosition)}
                <span className="text-lg font-semibold text-white">
                  {data.marketPosition.percentile}th %ile
                </span>
              </div>
              <p className="text-xs text-[#737373] mt-1">
                {data.marketPosition.recommendation}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Market Supply */}
      {data.inventoryAnalysis && !data.inventoryAnalysis.error && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-white flex items-center gap-2">
            <Package className="h-4 w-4 text-[#3b82f6]" />
            Market Supply
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-[#737373] uppercase mb-1">Days Supply</p>
              <p className="text-lg font-semibold text-white">
                {data.inventoryAnalysis.marketDaySupply} days
              </p>
              <div className={`inline-flex px-2 py-1 rounded-full text-xs mt-1 ${getScoreBadgeColor(data.inventoryAnalysis.scarcityScore)}`}>
                Scarcity: {data.inventoryAnalysis.scarcityScore}%
              </div>
            </div>
            <div>
              <p className="text-xs text-[#737373] uppercase mb-1">Market Inventory</p>
              <p className="text-lg font-semibold text-white">
                {data.inventoryAnalysis.inventoryCount} units
              </p>
              <p className="text-xs text-[#737373] mt-1">
                {data.inventoryAnalysis.salesCount} sold/month
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Competition */}
      {data.competitiveLandscape && !data.competitiveLandscape.error && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-white flex items-center gap-2">
            <MapPin className="h-4 w-4 text-[#3b82f6]" />
            Local Competition
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-[#737373] uppercase mb-1">Nearby Inventory</p>
              <p className="text-lg font-semibold text-white">
                {data.competitiveLandscape.totalNearbyInventory} vehicles
              </p>
            </div>
            <div>
              <p className="text-xs text-[#737373] uppercase mb-1">Avg Competitor Price</p>
              <p className="text-lg font-semibold text-white">
                {formatPrice(data.competitiveLandscape.avgCompetitorPrice)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Demand Analysis */}
      {data.demandAnalysis && !data.demandAnalysis.error && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-white flex items-center gap-2">
            <Search className="h-4 w-4 text-[#3b82f6]" />
            Local Demand
          </h3>
          <div>
            <p className="text-xs text-[#737373] uppercase mb-1">Monthly Searches</p>
            <div className="flex items-baseline gap-3">
              <p className="text-lg font-semibold text-white">
                {data.demandAnalysis.totalMonthlySearches.toLocaleString()}
              </p>
              <span className={`px-2 py-1 rounded-full text-xs ${
                data.demandAnalysis.demandLevel === 'high' ? 'bg-green-900/20 text-green-400' :
                data.demandAnalysis.demandLevel === 'medium' ? 'bg-yellow-900/20 text-yellow-400' :
                'bg-gray-900/20 text-gray-400'
              }`}>
                {data.demandAnalysis.demandLevel} demand
              </span>
            </div>
            <p className="text-xs text-[#737373] mt-1">
              in {data.demandAnalysis.locationName}
            </p>
          </div>
        </div>
      )}

      {/* Key Recommendations */}
      {data.recommendations && (
        <div className="pt-4 border-t border-[#2a2a2a]">
          <h3 className="text-sm font-medium text-white mb-3">Key Recommendations</h3>
          <div className="space-y-2">
            {data.recommendations.action && (
              <div className="flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-[#3b82f6] mt-2 flex-shrink-0"></div>
                <p className="text-sm text-[#a3a3a3]">{data.recommendations.action}</p>
              </div>
            )}
            {data.recommendations.pricing && (
              <div className="flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-[#3b82f6] mt-2 flex-shrink-0"></div>
                <p className="text-sm text-[#a3a3a3]">{data.recommendations.pricing}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error States */}
      {data.marketPosition?.error && (
        <div className="flex items-center gap-2 p-3 bg-yellow-900/20 rounded-lg">
          <AlertCircle className="h-4 w-4 text-yellow-400" />
          <p className="text-sm text-yellow-400">Price analysis unavailable</p>
        </div>
      )}
    </div>
  );
}