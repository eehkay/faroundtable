'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useDealershipLocations } from '@/lib/hooks/useDealershipLocations';

interface VehicleOpportunity {
  make: string;
  model: string;
  year?: number;
  score: number;
  inventory: number;
  searchVolume: number;
  medianPrice: number;
  avgDaysOnMarket: number;
  medianDaysOnMarket: number;
  trend: 'rising' | 'stable' | 'declining';
  buyingGuidance: {
    targetBuyPrice: number;
    maxBuyPrice: number;
    expectedSellPrice: number;
    estimatedProfit: number;
  };
  scoreBreakdown: {
    demandScore: number;      // Market Opportunity
    profitScore: number;      // Profit Potential (was scarcityScore)
    velocityScore: number;    // Turnover Speed
    trendScore: number;       // Market Momentum
  };
  hasCPO: boolean;
  cpoMedianPrice?: number;
  cpoMedianDOM?: number;
}

interface NationalVehicle {
  make: string;
  model: string;
  inventory: number;
  medianPrice: number;
  priceRange: { min: number; max: number };
  avgDaysOnMarket: number;
  medianDaysOnMarket: number;
  medianMileage: number;
  mileageRange: { min: number; max: number };
  avgMileage: number;
}

interface CityVehicle extends NationalVehicle {
  hasCPO?: boolean;
  cpoInventory?: number;
  cpoMedianPrice?: number;
  cpoMedianDOM?: number;
  cpoMedianMileage?: number;
}

interface AnalysisResult {
  generated: string;
  market: string;
  nationalVehicles: NationalVehicle[];
  cityVehicles: CityVehicle[];
  topOpportunities: VehicleOpportunity[];
  cached?: boolean;
  cacheAge?: number; // in minutes
  allOpportunities: VehicleOpportunity[];
  avoidList: VehicleOpportunity[];
}

export default function RegionalAnalyticsPage() {
  const { data: session } = useSession();
  const { locations, isLoading: locationsLoading } = useDealershipLocations();
  
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [radius, setRadius] = useState(50);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedVehicles, setExpandedVehicles] = useState<Set<string>>(new Set());
  
  // Progressive data state
  const [nationalVehicles, setNationalVehicles] = useState<NationalVehicle[]>([]);
  const [cityVehicles, setCityVehicles] = useState<CityVehicle[]>([]);
  const [analyzedVehicles, setAnalyzedVehicles] = useState<VehicleOpportunity[]>([]);
  
  // Progress tracking
  const [currentStage, setCurrentStage] = useState<'national' | 'city' | 'analysis' | 'finalizing'>('national');
  const [vehicleAnalysisProgress, setVehicleAnalysisProgress] = useState({ current: 0, total: 0 });

  // Set default location when locations are loaded
  useEffect(() => {
    if (locations.length > 0 && !selectedLocationId) {
      // If user has a location, use that; otherwise use the first location
      const userLocation = locations.find(loc => loc.id === session?.user?.location?.id);
      setSelectedLocationId(userLocation?.id || locations[0].id);
    }
  }, [locations, selectedLocationId, session]);

  const startAnalysis = async (forceRefresh = false) => {
    if (!selectedLocationId) return;

    setIsAnalyzing(true);
    setProgress(0);
    setStatusMessage('');
    setResult(null);
    setError(null);
    setNationalVehicles([]);
    setCityVehicles([]);
    setAnalyzedVehicles([]);
    setCurrentStage('national');
    setVehicleAnalysisProgress({ current: 0, total: 0 });

    try {
      const response = await fetch('/api/analytics/regional/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          locationId: selectedLocationId,
          radius,
          forceRefresh,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No response body');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'status') {
                setStatusMessage(data.message || '');
                if (data.progress !== undefined) {
                  setProgress(data.progress);
                }
              } else if (data.type === 'national_data') {
                setNationalVehicles(data.data.nationalVehicles);
                setCurrentStage('city');
                if (data.progress !== undefined) {
                  setProgress(data.progress);
                }
              } else if (data.type === 'city_data') {
                setCityVehicles(data.data.cityVehicles);
                setCurrentStage('analysis');
                if (data.progress !== undefined) {
                  setProgress(data.progress);
                }
              } else if (data.type === 'vehicle_analysis') {
                setAnalyzedVehicles(prev => [...prev, data.data.vehicle]);
                setVehicleAnalysisProgress({
                  current: data.data.completedCount,
                  total: data.data.totalCount
                });
                if (data.data.completedCount === data.data.totalCount) {
                  setCurrentStage('finalizing');
                }
                if (data.progress !== undefined) {
                  setProgress(data.progress);
                }
              } else if (data.type === 'complete') {
                setResult(data.data);
                setIsAnalyzing(false);
              } else if (data.type === 'error') {
                setError(data.message || 'Analysis failed');
                setIsAnalyzing(false);
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Analysis error:', error);
      setError(error instanceof Error ? error.message : 'Analysis failed');
      setIsAnalyzing(false);
    }
  };

  const toggleVehicleExpansion = (vehicleKey: string) => {
    setExpandedVehicles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(vehicleKey)) {
        newSet.delete(vehicleKey);
      } else {
        newSet.add(vehicleKey);
      }
      return newSet;
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getScoreColor = (score: number) => {
    if (score >= 7) return 'text-green-400';
    if (score >= 5) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'rising') return '↗';
    if (trend === 'declining') return '↘';
    return '→';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Regional Market Analysis</h1>
        <p className="text-gray-400 mt-2">
          Discover the best vehicle acquisition opportunities in your market
        </p>
      </div>

      {/* Location Selector */}
      <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-6 mb-8">
        <h2 className="text-lg font-medium text-white mb-4">Analysis Parameters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Dealership Location
            </label>
            <select
              className="w-full px-3 py-2 bg-black border border-[#2a2a2a] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent transition-all duration-200"
              value={selectedLocationId}
              onChange={(e) => setSelectedLocationId(e.target.value)}
              disabled={locationsLoading || isAnalyzing}
            >
              <option value="">Select a location...</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Search Radius (miles)
            </label>
            <input
              type="number"
              value={radius}
              onChange={(e) => setRadius(parseInt(e.target.value) || 50)}
              min="10"
              max="200"
              className="w-full px-3 py-2 bg-black border border-[#2a2a2a] rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent transition-all duration-200"
              disabled={isAnalyzing}
            />
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={() => startAnalysis()}
            disabled={!selectedLocationId || isAnalyzing}
            className={`px-6 py-2 rounded-md font-medium transition-all duration-200 ${
              !selectedLocationId || isAnalyzing
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-[#3b82f6] text-white hover:bg-[#3b82f6]/90'
            }`}
          >
            {isAnalyzing ? 'Analyzing...' : 'Start Regional Analysis'}
          </button>
        </div>
      </div>

      {/* Progress Section */}
      {isAnalyzing && (
        <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-6 mb-8">
          <h3 className="text-lg font-medium text-white mb-4">Analysis Progress</h3>
          
          {/* Stage Indicators */}
          <div className="grid grid-cols-4 gap-2 mb-6">
            <div className={`text-center p-2 rounded ${currentStage === 'national' || ['city', 'analysis', 'finalizing'].includes(currentStage) ? 'bg-[#3b82f6]/20' : 'bg-[#1a1a1a]'}`}>
              <div className="flex items-center justify-center mb-1">
                {['city', 'analysis', 'finalizing'].includes(currentStage) ? (
                  <svg className="w-5 h-5 text-[#3b82f6]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : currentStage === 'national' ? (
                  <div className="w-5 h-5 border-2 border-[#3b82f6] rounded-full animate-pulse" />
                ) : (
                  <div className="w-5 h-5 border-2 border-gray-600 rounded-full" />
                )}
              </div>
              <div className="text-xs text-gray-400">National Data</div>
            </div>
            
            <div className={`text-center p-2 rounded ${currentStage === 'city' || ['analysis', 'finalizing'].includes(currentStage) ? 'bg-[#3b82f6]/20' : 'bg-[#1a1a1a]'}`}>
              <div className="flex items-center justify-center mb-1">
                {['analysis', 'finalizing'].includes(currentStage) ? (
                  <svg className="w-5 h-5 text-[#3b82f6]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : currentStage === 'city' ? (
                  <div className="w-5 h-5 border-2 border-[#3b82f6] rounded-full animate-pulse" />
                ) : (
                  <div className="w-5 h-5 border-2 border-gray-600 rounded-full" />
                )}
              </div>
              <div className="text-xs text-gray-400">Local Data</div>
            </div>
            
            <div className={`text-center p-2 rounded ${currentStage === 'analysis' || currentStage === 'finalizing' ? 'bg-[#3b82f6]/20' : 'bg-[#1a1a1a]'}`}>
              <div className="flex items-center justify-center mb-1">
                {currentStage === 'finalizing' ? (
                  <svg className="w-5 h-5 text-[#3b82f6]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : currentStage === 'analysis' ? (
                  <div className="w-5 h-5 border-2 border-[#3b82f6] rounded-full animate-pulse" />
                ) : (
                  <div className="w-5 h-5 border-2 border-gray-600 rounded-full" />
                )}
              </div>
              <div className="text-xs text-gray-400">Vehicle Analysis</div>
            </div>
            
            <div className={`text-center p-2 rounded ${currentStage === 'finalizing' ? 'bg-[#3b82f6]/20' : 'bg-[#1a1a1a]'}`}>
              <div className="flex items-center justify-center mb-1">
                {currentStage === 'finalizing' ? (
                  <div className="w-5 h-5 border-2 border-[#3b82f6] rounded-full animate-pulse" />
                ) : (
                  <div className="w-5 h-5 border-2 border-gray-600 rounded-full" />
                )}
              </div>
              <div className="text-xs text-gray-400">Finalizing</div>
            </div>
          </div>
          
          {/* Main Progress Bar */}
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">{statusMessage}</span>
                <span className="text-[#3b82f6]">{progress}%</span>
              </div>
              <div className="w-full bg-[#1a1a1a] rounded-full h-2">
                <div
                  className="bg-[#3b82f6] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            
            {/* DataForSEO Progress */}
            {currentStage === 'analysis' && vehicleAnalysisProgress.total > 0 && (
              <div className="mt-4 p-4 bg-[#1a1a1a] rounded-lg">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">
                    DataForSEO Analysis: Vehicle {vehicleAnalysisProgress.current} of {vehicleAnalysisProgress.total}
                  </span>
                  <span className="text-[#3b82f6]">
                    {Math.round((vehicleAnalysisProgress.current / vehicleAnalysisProgress.total) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-[#0a0a0a] rounded-full h-1.5">
                  <div
                    className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${(vehicleAnalysisProgress.current / vehicleAnalysisProgress.total) * 100}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  Analyzing search volume and market trends for each vehicle...
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 mb-8">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* National Popular Vehicles (shows immediately) */}
      {nationalVehicles.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Top 50 National Popular Used Cars</h2>
          <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {nationalVehicles.map((vehicle, index) => (
                <div key={`national-${index}`} className="flex items-center justify-between py-2 border-b border-[#2a2a2a] last:border-0">
                  <div className="flex items-center space-x-3">
                    <span className="text-gray-500 font-medium text-sm">#{index + 1}</span>
                    <div className="flex-1">
                      <span className="text-white font-medium">{vehicle.make} {vehicle.model}</span>
                      <div className="text-xs text-gray-500">
                        {vehicle.inventory} units • {vehicle.medianDaysOnMarket}d DOM • {vehicle.medianMileage.toLocaleString()}mi
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        Price: {formatCurrency(vehicle.priceRange.min)} - {formatCurrency(vehicle.priceRange.max)} • 
                        Miles: {vehicle.mileageRange.min.toLocaleString()} - {vehicle.mileageRange.max.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[#3b82f6] font-medium">
                      {formatCurrency(vehicle.medianPrice)}
                    </div>
                    <div className="text-xs text-gray-500">median</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* City Popular Vehicles (shows after national) */}
      {cityVehicles.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Top 25 Local Market Used Cars</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cityVehicles.map((vehicle, index) => (
              <div key={`city-${index}`} className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-4 hover:border-[#3b82f6]/50 transition-colors">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-[#3b82f6] font-bold text-lg">#{index + 1}</span>
                    <div>
                      <h3 className="text-white font-medium">{vehicle.make} {vehicle.model}</h3>
                      {vehicle.hasCPO && vehicle.cpoInventory && vehicle.cpoInventory > 0 && (
                        <div className="flex items-center space-x-1 mt-1">
                          <div className="w-2 h-2 bg-[#3b82f6] rounded-full"></div>
                          <span className="text-xs text-[#3b82f6]">CPO Available</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Primary Metrics */}
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">Price</div>
                    <div className="text-[#3b82f6] font-bold text-lg">{formatCurrency(vehicle.medianPrice)}</div>
                    <div className="text-xs text-gray-400">
                      {formatCurrency(vehicle.priceRange.min)} - {formatCurrency(vehicle.priceRange.max)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">Inventory</div>
                    <div className="text-white font-medium text-lg">{vehicle.inventory} units</div>
                    {vehicle.cpoInventory && vehicle.cpoInventory > 0 && (
                      <div className="text-xs text-[#3b82f6]">{vehicle.cpoInventory} CPO</div>
                    )}
                  </div>
                </div>

                {/* Secondary Metrics */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">Mileage</div>
                    <div className="text-white">{vehicle.medianMileage.toLocaleString()}mi</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">Days on Market</div>
                    <div className="text-white">{vehicle.medianDaysOnMarket}d</div>
                  </div>
                </div>

                {/* CPO Quick Stats */}
                {vehicle.hasCPO && vehicle.cpoInventory && vehicle.cpoInventory > 0 && (
                  <div className="mt-3 pt-3 border-t border-[#2a2a2a]">
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-gray-500">CPO Price:</span>
                        <span className="text-[#3b82f6] ml-1 font-medium">
                          {vehicle.cpoMedianPrice ? formatCurrency(vehicle.cpoMedianPrice) : 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">CPO DOM:</span>
                        <span className="text-[#3b82f6] ml-1 font-medium">
                          {vehicle.cpoMedianDOM ? `${vehicle.cpoMedianDOM}d` : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live Analysis Updates */}
      {analyzedVehicles.length > 0 && !result && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">
            Market Analysis Progress ({analyzedVehicles.length} vehicles analyzed)
          </h2>
          <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-6">
            <div className="space-y-3">
              {analyzedVehicles
                .sort((a, b) => b.score - a.score)
                .slice(0, 10)
                .map((vehicle, index) => (
                  <div key={`analyzed-${index}`} className="flex items-center justify-between py-2">
                    <div className="flex items-center space-x-4">
                      <div className={`text-2xl font-bold ${getScoreColor(vehicle.score)}`}>
                        {vehicle.score}
                      </div>
                      <div>
                        <span className="text-white font-medium">{vehicle.make} {vehicle.model}</span>
                        <div className="text-xs text-gray-500">
                          {vehicle.searchVolume} searches/mo • {vehicle.inventory} units
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[#3b82f6] font-medium">
                        {formatCurrency(vehicle.medianPrice)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {vehicle.trend === 'rising' ? '↗ Rising' : vehicle.trend === 'declining' ? '↘ Declining' : '→ Stable'}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Results Section */}
      {result && (
        <div className="space-y-8">
          {/* Cache Status */}
          {result.cached && (
            <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-gray-300">
                  Using cached data from {result.cacheAge || 0} minutes ago
                </span>
              </div>
              <button
                onClick={() => startAnalysis(true)}
                className="text-sm text-[#3b82f6] hover:text-[#3b82f6]/80 transition-colors"
              >
                Refresh Data
              </button>
            </div>
          )}

          {/* Score Legend */}
          <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-6">
            <h3 className="text-lg font-medium text-white mb-4">Understanding Opportunity Scores</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-3">Score Ranges</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-3">
                    <span className="text-green-400 font-bold">9-10</span>
                    <span className="text-gray-300">Exceptional - High demand, low supply, strong profits</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-green-400 font-bold">7-8</span>
                    <span className="text-gray-300">Great - Good balance of demand and profitability</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-yellow-400 font-bold">5-6</span>
                    <span className="text-gray-300">Average - Steady sellers with normal margins</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-orange-400 font-bold">3-4</span>
                    <span className="text-gray-300">Below Average - Consider only with right pricing</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-red-400 font-bold">0-2</span>
                    <span className="text-gray-300">Poor - Oversupplied or declining demand</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-3">Score Components</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-white font-medium">Market Opportunity (35%)</span>
                    <span className="text-gray-400 block">Demand-to-supply ratio compared to market</span>
                  </div>
                  <div>
                    <span className="text-white font-medium">Profit Potential (30%)</span>
                    <span className="text-gray-400 block">Price flexibility and margin opportunities</span>
                  </div>
                  <div>
                    <span className="text-white font-medium">Turnover Speed (20%)</span>
                    <span className="text-gray-400 block">How quickly vehicles sell (days on market)</span>
                  </div>
                  <div>
                    <span className="text-white font-medium">Market Momentum (15%)</span>
                    <span className="text-gray-400 block">Search trends and future outlook</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Market Analyzed</h3>
              <p className="text-2xl font-bold text-white">{result.market}</p>
              <p className="text-sm text-gray-500 mt-1">
                {radius} mile radius
              </p>
            </div>
            <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Vehicles Analyzed</h3>
              <p className="text-2xl font-bold text-white">{result.allOpportunities.length}</p>
              <p className="text-sm text-gray-500 mt-1">
                Popular models in your area
              </p>
            </div>
            <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Top Opportunities</h3>
              <p className="text-2xl font-bold text-green-400">
                {result.topOpportunities.filter(v => v.score >= 7).length}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                High-score vehicles
              </p>
            </div>
          </div>

          {/* Top Opportunities */}
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Top Acquisition Opportunities</h2>
            <div className="space-y-4">
              {result.topOpportunities.map((vehicle, index) => {
                const vehicleKey = `${vehicle.make}-${vehicle.model}-${index}`;
                const isExpanded = expandedVehicles.has(vehicleKey);
                
                return (
                  <div
                    key={vehicleKey}
                    className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg overflow-hidden"
                  >
                    {/* Header */}
                    <div
                      className="p-6 cursor-pointer hover:bg-[#0a0a0a]/80 transition-colors"
                      onClick={() => toggleVehicleExpansion(vehicleKey)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`text-3xl font-bold ${getScoreColor(vehicle.score)}`}>
                            {vehicle.score}
                          </div>
                          <div>
                            <h3 className="text-lg font-medium text-white">
                              {vehicle.make} {vehicle.model}
                            </h3>
                            <p className="text-sm text-gray-400">
                              {vehicle.inventory} units • {vehicle.searchVolume} searches/mo • {vehicle.medianDaysOnMarket} day DOM
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="text-sm text-gray-400">Median Price</p>
                            <p className="text-lg font-medium text-white">
                              {formatCurrency(vehicle.medianPrice)}
                            </p>
                          </div>
                          <div className={`text-2xl ${vehicle.trend === 'rising' ? 'text-green-400' : vehicle.trend === 'declining' ? 'text-red-400' : 'text-yellow-400'}`}>
                            {getTrendIcon(vehicle.trend)}
                          </div>
                          <svg
                            className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="border-t border-[#2a2a2a] p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Score Breakdown */}
                          <div>
                            <h4 className="text-sm font-medium text-gray-400 mb-3">Score Breakdown</h4>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-500">Market Opportunity</span>
                                <span className="text-sm text-white">{vehicle.scoreBreakdown.demandScore.toFixed(1)}/10</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-500">Profit Potential</span>
                                <span className="text-sm text-white">{vehicle.scoreBreakdown.profitScore.toFixed(1)}/10</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-500">Turnover Speed</span>
                                <span className="text-sm text-white">{vehicle.scoreBreakdown.velocityScore.toFixed(1)}/10</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-500">Market Momentum</span>
                                <span className="text-sm text-white">{vehicle.scoreBreakdown.trendScore.toFixed(1)}/10</span>
                              </div>
                            </div>
                          </div>

                          {/* Buying Guidance */}
                          <div>
                            <h4 className="text-sm font-medium text-gray-400 mb-3">Buying Guidance</h4>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-500">Target Buy Price</span>
                                <span className="text-sm text-green-400 font-medium">
                                  {formatCurrency(vehicle.buyingGuidance.targetBuyPrice)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-500">Max Buy Price</span>
                                <span className="text-sm text-yellow-400">
                                  {formatCurrency(vehicle.buyingGuidance.maxBuyPrice)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-500">Expected Sell Price</span>
                                <span className="text-sm text-white">
                                  {formatCurrency(vehicle.buyingGuidance.expectedSellPrice)}
                                </span>
                              </div>
                              <div className="flex justify-between pt-2 border-t border-[#2a2a2a]">
                                <span className="text-sm text-gray-500">Estimated Profit</span>
                                <span className="text-sm text-green-400 font-medium">
                                  {formatCurrency(vehicle.buyingGuidance.estimatedProfit)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Additional Info */}
                        {vehicle.hasCPO && (
                          <div className="mt-4 p-3 bg-[#3b82f6]/10 rounded-lg">
                            <p className="text-sm text-[#3b82f6]">
                              CPO Available: {formatCurrency(vehicle.cpoMedianPrice || 0)} median • {vehicle.cpoMedianDOM} day DOM
                            </p>
                          </div>
                        )}

                        {/* Action Button */}
                        <div className="mt-4 flex justify-end">
                          <a
                            href={`/analytics/market-trend-report?make=${vehicle.make}&model=${vehicle.model}`}
                            className="px-4 py-2 bg-[#3b82f6] text-white rounded-md text-sm font-medium hover:bg-[#3b82f6]/90 transition-colors"
                          >
                            View Full Market Analysis →
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Vehicles to Avoid */}
          {result.avoidList.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-white mb-4">Vehicles to Avoid</h2>
              <div className="bg-[#0a0a0a] border border-red-800/50 rounded-lg p-6">
                <p className="text-sm text-gray-400 mb-4">
                  These vehicles scored below 3.0 due to low demand, high inventory, or declining trends
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {result.avoidList.map((vehicle, index) => (
                    <div key={`avoid-${index}`} className="flex items-center justify-between">
                      <span className="text-white">{vehicle.make} {vehicle.model}</span>
                      <span className="text-red-400">Score: {vehicle.score}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Feature Note */}
      {!isAnalyzing && !result && process.env.NEXT_PUBLIC_ENABLE_ADVANCED_ANALYTICS !== 'true' && (
        <div className="mt-8 p-4 bg-[#3b82f6]/10 rounded-lg text-center">
          <p className="text-sm text-[#3b82f6]">
            Regional analytics features require analytics APIs to be configured.
          </p>
        </div>
      )}
    </div>
  );
}