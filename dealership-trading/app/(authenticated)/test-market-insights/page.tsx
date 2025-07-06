'use client';

import { useState } from 'react';
import { ArrowLeft, TrendingUp, Eye, Code, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import MarketInsights from '@/components/vehicle/MarketInsights';
import type { MarketInsightsData } from '@/components/vehicle/MarketInsights';

interface MarketInsightsTestResult {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: MarketInsightsData | { rawResponse: string; error?: string };
  timestamp: string;
}

interface IndividualEndpointResult {
  status: number;
  statusText: string;
  data: any;
  timestamp: string;
}

type IndividualEndpointResults = Record<string, IndividualEndpointResult>;

export default function TestMarketInsightsPage() {
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: '',
    vin: '',
    zipCode: '',
  });

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<MarketInsightsTestResult | null>(null);
  const [individualResults, setIndividualResults] = useState<IndividualEndpointResults>({});
  const [activeTab, setActiveTab] = useState<'formatted' | 'raw'>('formatted');
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const testFullMarketInsights = async () => {
    if (!formData.vin) {
      setError('VIN is required for market insights');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('/api/market-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const responseText = await response.text();
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        data = { rawResponse: responseText };
      }

      setResults({
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data: data,
        timestamp: new Date().toISOString(),
      });

      if (!response.ok) {
        setError(`API returned status ${response.status}: ${response.statusText}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Test API error:', err);
    } finally {
      setLoading(false);
    }
  };

  const testIndividualEndpoint = async (endpoint: string) => {
    setLoading(true);
    setError(null);

    try {
      let url = '';
      let body: any = {};

      switch (endpoint) {
        case 'similarSalePrice':
          if (!formData.vin) {
            setError('VIN is required for similarSalePrice endpoint');
            setLoading(false);
            return;
          }
          body = {
            endpoint: 'similarSalePrice',
            params: {
              vin: formData.vin,
              zipCode: formData.zipCode || '89104',
              regionName: 'REGION_STATE_CA',
            }
          };
          break;
      }

      const response = await fetch('/api/test-individual-endpoint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const responseText = await response.text();
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        data = { rawResponse: responseText };
      }

      setIndividualResults((prev: any) => ({
        ...prev,
        [endpoint]: {
          status: response.status,
          statusText: response.statusText,
          data: data,
          timestamp: new Date().toISOString(),
        }
      }));

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Individual endpoint test error:', err);
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setResults(null);
    setIndividualResults({});
    setError(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link 
        href="/inventory" 
        className="inline-flex items-center text-gray-400 hover:text-gray-100 mb-6 transition-all duration-200"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Inventory
      </Link>

      <h1 className="text-3xl font-bold text-white mb-8">Market Insights Test Page</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Form */}
        <div className="space-y-6">
          <div className="bg-[#1f1f1f] rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Vehicle Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Make
                </label>
                <input
                  type="text"
                  value={formData.make}
                  onChange={(e) => handleInputChange('make', e.target.value)}
                  placeholder="e.g., Toyota, Ford, Honda"
                  className="w-full bg-[#141414] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#3b82f6]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Model
                </label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => handleInputChange('model', e.target.value)}
                  placeholder="e.g., Camry, F-150, Accord"
                  className="w-full bg-[#141414] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#3b82f6]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Year
                </label>
                <input
                  type="text"
                  value={formData.year}
                  onChange={(e) => handleInputChange('year', e.target.value)}
                  placeholder="e.g., 2023"
                  className="w-full bg-[#141414] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#3b82f6]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  VIN (required for market insights) *
                </label>
                <input
                  type="text"
                  value={formData.vin}
                  onChange={(e) => handleInputChange('vin', e.target.value)}
                  placeholder="17-character VIN"
                  maxLength={17}
                  className="w-full bg-[#141414] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#3b82f6]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  ZIP Code (for market location)
                </label>
                <input
                  type="text"
                  value={formData.zipCode}
                  onChange={(e) => handleInputChange('zipCode', e.target.value)}
                  placeholder="e.g., 89104"
                  maxLength={5}
                  className="w-full bg-[#141414] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#3b82f6]"
                />
              </div>
            </div>
          </div>

          {/* Test Buttons */}
          <div className="bg-[#1f1f1f] rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">API Tests</h2>
            
            <div className="space-y-3">
              <button
                onClick={testFullMarketInsights}
                disabled={loading || !formData.vin}
                className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Testing...</span>
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-5 w-5" />
                    <span>Test Full Market Insights</span>
                  </>
                )}
              </button>

              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => testIndividualEndpoint('similarSalePrice')}
                  disabled={loading || !formData.vin}
                  className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white font-medium py-2 px-3 rounded-lg transition-all duration-200 disabled:opacity-50"
                >
                  Test /similarSalePrice (VIN required)
                </button>
              </div>

              <button
                onClick={clearResults}
                className="w-full bg-gray-600 hover:bg-gray-500 text-white font-medium py-2 px-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Clear Results
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-6">
          {error && (
            <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
              <h3 className="text-red-300 font-semibold mb-2">Error</h3>
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          {results && (
            <div className="space-y-4">
              <div className="bg-[#1f1f1f] rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-white">Full Market Insights Results</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setActiveTab('formatted')}
                      className={`px-3 py-1 rounded text-sm ${activeTab === 'formatted' ? 'bg-[#3b82f6] text-white' : 'bg-[#2a2a2a] text-gray-400'}`}
                    >
                      <Eye className="h-4 w-4 inline mr-1" />
                      Formatted
                    </button>
                    <button
                      onClick={() => setActiveTab('raw')}
                      className={`px-3 py-1 rounded text-sm ${activeTab === 'raw' ? 'bg-[#3b82f6] text-white' : 'bg-[#2a2a2a] text-gray-400'}`}
                    >
                      <Code className="h-4 w-4 inline mr-1" />
                      Raw Data
                    </button>
                  </div>
                </div>

                {activeTab === 'formatted' && results.data && !('error' in results.data) ? (
                  <MarketInsights 
                    data={results.data as MarketInsightsData}
                    currentPrice={50000} // Mock price for testing
                    vehicleInfo={{
                      make: formData.make,
                      model: formData.model,
                      year: formData.year,
                    }}
                  />
                ) : (
                  <div className="bg-[#0a0a0a] rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                      {JSON.stringify(results, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Individual Endpoint Results */}
          {Object.keys(individualResults).length > 0 && (
            <div className="bg-[#1f1f1f] rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Individual Endpoint Results</h2>
              
              <div className="space-y-4">
                {Object.entries(individualResults).map(([endpoint, result]: [string, any]) => (
                  <div key={endpoint} className="border border-[#2a2a2a] rounded-lg p-4">
                    <h3 className="text-lg font-medium text-white mb-2">/{endpoint}</h3>
                    <div className="text-sm text-gray-400 mb-2">
                      Status: {result.status} | Time: {new Date(result.timestamp).toLocaleTimeString()}
                    </div>
                    <div className="bg-[#0a0a0a] rounded p-3 overflow-x-auto">
                      <pre className="text-xs text-gray-300 whitespace-pre-wrap">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}