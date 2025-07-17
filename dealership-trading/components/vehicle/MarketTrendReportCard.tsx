'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Minus, DollarSign, Package, Search, MapPin, ExternalLink, AlertCircle, Target } from 'lucide-react';

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
      locationId: vehicleInfo.locationId || '',
      autoRun: 'true'
    });
    window.open(`/analytics/market-trend-report?${params.toString()}`, '_blank');
  };

  return (
    <div className="bg-gradient-to-br from-[#0a0a0a] to-[#141414] border border-[#2a2a2a] rounded-xl shadow-xl p-8 transition-all duration-200 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#2a2a2a] pb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Market Analysis</h2>
          <p className="text-sm text-[#737373] mt-1">Real-time market intelligence and pricing insights</p>
        </div>
        <button
          onClick={openFullReport}
          className="flex items-center gap-2 px-4 py-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-lg transition-colors text-sm font-medium shadow-lg hover:shadow-xl"
        >
          View Full Report
          <ExternalLink className="h-4 w-4" />
        </button>
      </div>

      {/* Opportunity Score */}
      {data.opportunityScore && (
        <div className="bg-[#141414] rounded-lg p-6 border border-[#2a2a2a]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm text-[#737373] uppercase tracking-wider">Opportunity Score</h3>
              <p className="text-xs text-[#525252] mt-1">Overall market opportunity assessment</p>
            </div>
            <div className="text-right">
              <span className={`text-4xl font-bold ${getScoreColor(data.opportunityScore.overall)}`}>
                {data.opportunityScore.overall}
              </span>
              <span className="text-xl text-[#737373] ml-1">%</span>
            </div>
          </div>
          
          {/* Score Breakdown with Progress Bars */}
          <div className="space-y-4">
            {/* Price Position */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#a3a3a3] flex items-center gap-2">
                  <DollarSign className="h-3 w-3 text-[#3b82f6]" />
                  Price Position
                </span>
                <span className="text-white font-medium">{data.opportunityScore.breakdown.priceCompetitiveness}%</span>
              </div>
              <div className="w-full bg-[#2a2a2a] rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    data.opportunityScore.breakdown.priceCompetitiveness >= 80 ? 'bg-green-500' :
                    data.opportunityScore.breakdown.priceCompetitiveness >= 60 ? 'bg-blue-500' :
                    data.opportunityScore.breakdown.priceCompetitiveness >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${data.opportunityScore.breakdown.priceCompetitiveness}%` }}
                />
              </div>
            </div>

            {/* Inventory */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#a3a3a3] flex items-center gap-2">
                  <Package className="h-3 w-3 text-[#3b82f6]" />
                  Inventory Scarcity
                </span>
                <span className="text-white font-medium">{data.opportunityScore.breakdown.inventoryScarcity}%</span>
              </div>
              <div className="w-full bg-[#2a2a2a] rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    data.opportunityScore.breakdown.inventoryScarcity >= 80 ? 'bg-green-500' :
                    data.opportunityScore.breakdown.inventoryScarcity >= 60 ? 'bg-blue-500' :
                    data.opportunityScore.breakdown.inventoryScarcity >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${data.opportunityScore.breakdown.inventoryScarcity}%` }}
                />
              </div>
            </div>

            {/* Regional Demand */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#a3a3a3] flex items-center gap-2">
                  <Search className="h-3 w-3 text-[#3b82f6]" />
                  Regional Demand
                </span>
                <span className="text-white font-medium">{data.opportunityScore.breakdown.regionalDemand}%</span>
              </div>
              <div className="w-full bg-[#2a2a2a] rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    data.opportunityScore.breakdown.regionalDemand >= 80 ? 'bg-green-500' :
                    data.opportunityScore.breakdown.regionalDemand >= 60 ? 'bg-blue-500' :
                    data.opportunityScore.breakdown.regionalDemand >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${data.opportunityScore.breakdown.regionalDemand}%` }}
                />
              </div>
            </div>

            {/* Market Timing */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#a3a3a3] flex items-center gap-2">
                  <TrendingUp className="h-3 w-3 text-[#3b82f6]" />
                  Market Timing
                </span>
                <span className="text-white font-medium">{data.opportunityScore.breakdown.marketTiming}%</span>
              </div>
              <div className="w-full bg-[#2a2a2a] rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    data.opportunityScore.breakdown.marketTiming >= 80 ? 'bg-green-500' :
                    data.opportunityScore.breakdown.marketTiming >= 60 ? 'bg-blue-500' :
                    data.opportunityScore.breakdown.marketTiming >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${data.opportunityScore.breakdown.marketTiming}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Price Analysis */}
      {data.marketPosition && !data.marketPosition.error && (
        <div className="bg-[#141414] rounded-lg p-5 border border-[#2a2a2a] hover:border-[#3a3a3a] transition-all duration-200">
          <h3 className="text-sm font-medium text-white flex items-center gap-2 mb-4">
            <DollarSign className="h-4 w-4 text-[#3b82f6]" />
            Price Analysis
          </h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-[#737373] uppercase mb-2">Market Price</p>
              <p className="text-2xl font-bold text-white">
                {formatPrice(data.marketPosition.predictedPrice)}
              </p>
              <div className="mt-2 text-xs text-[#525252]">
                <span className="inline-block px-2 py-1 bg-[#2a2a2a] rounded">
                  {formatPrice(data.marketPosition.priceRange.lower)} - {formatPrice(data.marketPosition.priceRange.upper)}
                </span>
              </div>
            </div>
            <div>
              <p className="text-xs text-[#737373] uppercase mb-2">Current Position</p>
              <div className="flex items-center gap-2 mb-2">
                {getTrendIcon(data.competitiveLandscape?.pricePosition)}
                <span className="text-2xl font-bold text-white">
                  {data.marketPosition.percentile}
                  <span className="text-sm font-normal text-[#737373]">th percentile</span>
                </span>
              </div>
              <p className="text-xs text-[#a3a3a3] leading-relaxed">
                {data.marketPosition.recommendation}
              </p>
            </div>
          </div>
          
          {/* Visual Percentile Bar */}
          <div className="mt-4 pt-4 border-t border-[#2a2a2a]">
            <div className="relative h-3 bg-[#2a2a2a] rounded-full overflow-hidden">
              <div 
                className="absolute h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 opacity-20"
                style={{ width: '100%' }}
              />
              <div 
                className="absolute top-1/2 -translate-y-1/2 w-1 h-5 bg-white rounded-full shadow-lg"
                style={{ left: `${data.marketPosition.percentile}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-[#525252]">
              <span>Below Market</span>
              <span>At Market</span>
              <span>Above Market</span>
            </div>
          </div>
        </div>
      )}

      {/* Market Supply */}
      {data.inventoryAnalysis && !data.inventoryAnalysis.error && (
        <div className="bg-[#141414] rounded-lg p-5 border border-[#2a2a2a] hover:border-[#3a3a3a] transition-all duration-200">
          <h3 className="text-sm font-medium text-white flex items-center gap-2 mb-4">
            <Package className="h-4 w-4 text-[#3b82f6]" />
            Market Supply
          </h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-[#737373] uppercase mb-2">Days Supply</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-white">
                  {data.inventoryAnalysis.marketDaySupply}
                </p>
                <span className="text-sm text-[#737373]">days</span>
              </div>
              <div className="mt-3">
                <div className={`inline-flex px-3 py-1.5 rounded-full text-xs font-medium ${getScoreBadgeColor(data.inventoryAnalysis.scarcityScore)}`}>
                  Scarcity Score: {data.inventoryAnalysis.scarcityScore}%
                </div>
              </div>
            </div>
            <div>
              <p className="text-xs text-[#737373] uppercase mb-2">Market Activity</p>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#a3a3a3]">Inventory</span>
                  <span className="text-lg font-semibold text-white">{data.inventoryAnalysis.inventoryCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#a3a3a3]">Monthly Sales</span>
                  <span className="text-lg font-semibold text-white">{data.inventoryAnalysis.salesCount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Competition */}
      {data.competitiveLandscape && !data.competitiveLandscape.error && (
        <div className="bg-[#141414] rounded-lg p-5 border border-[#2a2a2a] hover:border-[#3a3a3a] transition-all duration-200">
          <h3 className="text-sm font-medium text-white flex items-center gap-2 mb-4">
            <MapPin className="h-4 w-4 text-[#3b82f6]" />
            Local Competition
          </h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-[#737373] uppercase mb-2">Nearby Inventory</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-white">
                  {data.competitiveLandscape.totalNearbyInventory}
                </p>
                <span className="text-sm text-[#737373]">vehicles</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-[#737373] uppercase mb-2">Avg Competitor Price</p>
              <p className="text-2xl font-bold text-white">
                {formatPrice(data.competitiveLandscape.avgCompetitorPrice)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Demand Analysis */}
      {data.demandAnalysis && !data.demandAnalysis.error && (
        <div className="bg-[#141414] rounded-lg p-5 border border-[#2a2a2a] hover:border-[#3a3a3a] transition-all duration-200">
          <h3 className="text-sm font-medium text-white flex items-center gap-2 mb-4">
            <Search className="h-4 w-4 text-[#3b82f6]" />
            Local Demand Analysis
          </h3>
          <div className="space-y-4">
            {/* Total Search Volume */}
            <div>
              <p className="text-xs text-[#737373] uppercase mb-2">Monthly Search Volume</p>
              <div className="flex items-center gap-3 mb-3">
                <p className="text-3xl font-bold text-white">
                  {data.demandAnalysis.totalMonthlySearches.toLocaleString()}
                </p>
                <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                  data.demandAnalysis.demandLevel === 'high' ? 'bg-green-900/20 text-green-400' :
                  data.demandAnalysis.demandLevel === 'medium' ? 'bg-yellow-900/20 text-yellow-400' :
                  'bg-gray-900/20 text-gray-400'
                }`}>
                  {data.demandAnalysis.demandLevel.charAt(0).toUpperCase() + data.demandAnalysis.demandLevel.slice(1)} Demand
                </span>
              </div>
              <p className="text-sm text-[#a3a3a3]">
                <MapPin className="h-3 w-3 inline mr-1" />
                {data.demandAnalysis.locationName}
              </p>
            </div>

            {/* Top Keywords */}
            {data.demandAnalysis.topKeywords && data.demandAnalysis.topKeywords.length > 0 && (
              <div className="pt-4 border-t border-[#2a2a2a]">
                <p className="text-xs text-[#737373] uppercase mb-3">Top Search Keywords</p>
                <div className="space-y-2">
                  {data.demandAnalysis.topKeywords.slice(0, 5).map((keyword: any, index: number) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-xs text-[#525252] w-4">{index + 1}.</span>
                        <span className="text-sm text-[#e5e5e5] truncate">{keyword.keyword}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-white">
                          {keyword.monthlySearches.toLocaleString()}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          keyword.competition === 'LOW' ? 'bg-green-900/20 text-green-400' :
                          keyword.competition === 'MEDIUM' ? 'bg-yellow-900/20 text-yellow-400' :
                          'bg-red-900/20 text-red-400'
                        }`}>
                          {keyword.competition}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                {data.demandAnalysis.topKeywords.length > 5 && (
                  <p className="text-xs text-[#525252] mt-3">
                    +{data.demandAnalysis.topKeywords.length - 5} more keywords analyzed
                  </p>
                )}
              </div>
            )}

            {/* Search Trend */}
            {data.demandAnalysis.searchTrend && (
              <div className="flex items-center gap-2 pt-2">
                <span className="text-xs text-[#737373]">Search Trend:</span>
                <div className="flex items-center gap-1">
                  {data.demandAnalysis.searchTrend === 'rising' ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : data.demandAnalysis.searchTrend === 'declining' ? (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  ) : (
                    <Minus className="h-3 w-3 text-gray-500" />
                  )}
                  <span className={`text-xs font-medium ${
                    data.demandAnalysis.searchTrend === 'rising' ? 'text-green-500' :
                    data.demandAnalysis.searchTrend === 'declining' ? 'text-red-500' :
                    'text-gray-500'
                  }`}>
                    {data.demandAnalysis.searchTrend.charAt(0).toUpperCase() + data.demandAnalysis.searchTrend.slice(1)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Key Recommendations */}
      {data.recommendations && (
        <div className="bg-gradient-to-br from-[#141414] to-[#1a1a1a] rounded-lg p-5 border border-[#2a2a2a]">
          <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
            <Target className="h-4 w-4 text-[#3b82f6]" />
            Key Recommendations
          </h3>
          <div className="space-y-3">
            {data.recommendations.action && (
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-[#3b82f6] mt-1.5 flex-shrink-0"></div>
                <p className="text-sm text-[#e5e5e5] leading-relaxed">{data.recommendations.action}</p>
              </div>
            )}
            {data.recommendations.pricing && (
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-[#3b82f6] mt-1.5 flex-shrink-0"></div>
                <p className="text-sm text-[#e5e5e5] leading-relaxed">{data.recommendations.pricing}</p>
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