'use client';

import { useState } from 'react';
import { ArrowLeft, Search, TrendingUp, TrendingDown, BarChart3, MapPin, Terminal, Code2, Copy, Check } from 'lucide-react';
import Link from 'next/link';
import './dataforseo.css';

interface SearchResult {
  keyword: string;
  search_volume: number;
  competition: number;
  trend: number[];
}

interface LocationResult {
  locationName: string;
  locationCode: number;
  results: SearchResult[];
  totalVolume: number;
}

interface DebugInfo {
  curlCommand: string;
  rawResponse: any;
  requestData: any;
  endpoint: string;
}

const LOCATION_OPTIONS = [
  { name: 'United States', code: 2840 },
  { name: 'Nevada', code: 1022639 },
  { name: 'California', code: 1014044 },
  { name: 'Las Vegas Metro', code: 1022595 },
  { name: 'San Diego Metro', code: 1014073 },
  { name: 'Los Angeles Metro', code: 1013962 },
];

export default function TestDataForSEOPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<LocationResult[]>([]);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [showRawResponse, setShowRawResponse] = useState(false);
  
  // Form state
  const [keywords, setKeywords] = useState('Toyota Camry, Honda Accord, Ford F150');
  const [selectedLocations, setSelectedLocations] = useState<number[]>([2840]);

  const runTest = async () => {
    setLoading(true);
    setError(null);
    setResults([]);
    setDebugInfo(null);
    setShowRawResponse(false);

    try {
      const response = await fetch('/api/analytics/test-search-volume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
          locationCodes: selectedLocations,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `API error: ${response.status}`);
      }

      setResults(data.results);
      if (data.debug) {
        setDebugInfo(data.debug);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const toggleLocation = (code: number) => {
    setSelectedLocations(prev => 
      prev.includes(code) 
        ? prev.filter(c => c !== code)
        : [...prev, code]
    );
  };

  const copyCurlCommand = () => {
    if (debugInfo?.curlCommand) {
      navigator.clipboard.writeText(debugInfo.curlCommand);
      setCopiedCurl(true);
      setTimeout(() => setCopiedCurl(false), 2000);
    }
  };

  const [copiedResponse, setCopiedResponse] = useState(false);
  const [filterKeyword, setFilterKeyword] = useState('');
  
  const copyRawResponse = () => {
    if (debugInfo?.rawResponse) {
      navigator.clipboard.writeText(JSON.stringify(debugInfo.rawResponse, null, 2));
      setCopiedResponse(true);
      setTimeout(() => setCopiedResponse(false), 2000);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link 
        href="/analytics" 
        className="inline-flex items-center text-gray-400 hover:text-gray-100 mb-6 transition-all duration-200"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Analytics
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">DataForSEO Test</h1>
        <p className="text-gray-400 mt-2">
          Test keyword search volume across different locations
        </p>
      </div>

      {/* Configuration */}
      <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">Configuration</h2>
        
        {/* Keywords Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Keywords (comma-separated)
          </label>
          <input
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            className="w-full px-4 py-2 bg-black border border-[#2a2a2a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent"
            placeholder="Toyota Camry, Honda Accord, Ford F150"
          />
        </div>

        {/* Location Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-400 mb-3">
            <MapPin className="inline w-4 h-4 mr-1" />
            Locations
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {LOCATION_OPTIONS.map((location) => (
              <button
                key={location.code}
                onClick={() => toggleLocation(location.code)}
                className={`p-3 rounded-lg border transition-all duration-200 ${
                  selectedLocations.includes(location.code)
                    ? 'bg-[#3b82f6]/10 border-[#3b82f6] text-[#3b82f6]'
                    : 'border-[#2a2a2a] text-gray-400 hover:border-gray-600'
                }`}
              >
                {location.name}
              </button>
            ))}
          </div>
        </div>

        {/* Run Test Button */}
        <button
          onClick={runTest}
          disabled={loading || selectedLocations.length === 0}
          className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {loading ? (
            <>
              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2" />
              Running Test...
            </>
          ) : (
            <>
              <Search className="w-5 h-5 mr-2" />
              Run Test
            </>
          )}
        </button>

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-4 bg-red-900/20 border border-red-500/20 text-red-300 rounded-lg">
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>

      {/* Debug Information */}
      {debugInfo && (
        <div className="space-y-6 mb-6">
          {/* cURL Command */}
          <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white flex items-center">
                <Terminal className="w-5 h-5 mr-2 text-[#3b82f6]" />
                cURL Command
              </h3>
              <button
                onClick={copyCurlCommand}
                className="flex items-center gap-2 px-3 py-1 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white rounded-lg transition-all duration-200"
              >
                {copiedCurl ? (
                  <>
                    <Check className="w-4 h-4 text-green-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </button>
            </div>
            <div className="bg-black rounded-lg">
              <pre className="p-4 text-sm text-gray-300 font-mono code-scroll" style={{ maxHeight: '200px' }}>
                {debugInfo.curlCommand}
              </pre>
            </div>
          </div>

          {/* Raw Response */}
          <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white flex items-center">
                <Code2 className="w-5 h-5 mr-2 text-[#3b82f6]" />
                Raw Response
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={copyRawResponse}
                  className="flex items-center gap-2 px-3 py-1 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white rounded-lg transition-all duration-200"
                >
                  {copiedResponse ? (
                    <>
                      <Check className="w-4 h-4 text-green-500" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowRawResponse(!showRawResponse)}
                  className="px-3 py-1 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white rounded-lg transition-all duration-200"
                >
                  {showRawResponse ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            {showRawResponse && (
              <div className="relative bg-black rounded-lg">
                <pre className="p-4 text-xs text-gray-300 font-mono code-scroll">
                  {JSON.stringify(debugInfo.rawResponse, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-6">
          {results.map((locationResult) => (
            <div key={locationResult.locationCode} className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-[#3b82f6]" />
                  {locationResult.locationName}
                </h3>
                <div className="text-sm text-gray-400">
                  Total Volume: <span className="text-white font-medium">{locationResult.totalVolume.toLocaleString()}/mo</span>
                </div>
              </div>

              {locationResult.results.length > 0 ? (
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <div className="text-sm text-gray-400">
                      Showing {Math.min(100, locationResult.results.length)} of {locationResult.results.length} keywords
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Filter keywords..."
                        value={filterKeyword}
                        onChange={(e) => setFilterKeyword(e.target.value)}
                        className="px-3 py-1 bg-black border border-[#2a2a2a] rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#3b82f6] focus:border-transparent"
                      />
                      {filterKeyword && (
                        <button
                          onClick={() => setFilterKeyword('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar p-1">
                    {locationResult.results
                      .filter(result => 
                        filterKeyword === '' || 
                        result.keyword.toLowerCase().includes(filterKeyword.toLowerCase())
                      )
                      .slice(0, 100)
                      .map((result, idx) => (
                    <div key={idx} className="bg-black border border-[#2a2a2a] rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-white">{result.keyword}</h4>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
                            <span>
                              Volume: <span className="text-white">{result.search_volume.toLocaleString()}/mo</span>
                            </span>
                            <span>
                              Competition: <span className="text-white">{(result.competition * 100).toFixed(0)}%</span>
                            </span>
                            {result.trend.length > 0 && (
                              <span>
                                Trend: <span className="text-white">{result.trend.length} months</span>
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="ml-4">
                          {result.search_volume > 1000 ? (
                            <TrendingUp className="w-5 h-5 text-green-500" />
                          ) : result.search_volume > 0 ? (
                            <BarChart3 className="w-5 h-5 text-yellow-500" />
                          ) : (
                            <TrendingDown className="w-5 h-5 text-gray-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  </div>
                </div>
              ) : (
                <p className="text-gray-400 text-center py-4">
                  No search volume data found for this location
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}