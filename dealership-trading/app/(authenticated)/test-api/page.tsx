'use client';

import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface MarketInsightsTestResult {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any; // Market insights data or error response
  testData?: {
    make: string;
    model: string;
    year: string;
  } | {
    vin: string;
    zipCode: string;
    endpoint: string;
    params: {
      brandName: string;
      regionName: string;
    };
  };
  note?: string;
  error?: boolean;
}

interface DirectAPITestResult {
  tokenResponse: {
    data?: {
      token?: string;
      [key: string]: any;
    };
    [key: string]: any;
  };
  salePriceResponse?: any;
  jwt?: string;
  status?: number;
  statusText?: string;
  data?: any;
  error?: boolean;
}

type TestAPIResults = MarketInsightsTestResult | DirectAPITestResult;

export default function TestAPIPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<TestAPIResults | null>(null);
  const [error, setError] = useState<string | null>(null);

  const testAPI = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      // Test with a sample vehicle
      const testData = {
        make: 'Toyota',
        model: 'Camry',
        year: '2023',
      };

      const response = await fetch('/api/market-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      });

      const responseText = await response.text();
      
      // Try to parse as JSON, but show raw text if it fails
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
        testData: testData,
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

  const testDirectAPI = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      // Use the market insights API endpoint which has proper credential handling
      const testData = {
        vin: '1G1ZD5ST1LF051547', // Example VIN for testing
        zipCode: '89104',
        endpoint: 'salePrice', // Test specific endpoint
        params: {
          brandName: 'TOYOTA',
          regionName: 'REGION_STATE_CA',
        }
      };

      const response = await fetch('/api/market-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      });

      const responseData = await response.json();

      if (response.ok) {
        setResults({
          status: response.status,
          statusText: response.statusText,
          headers: {},
          data: responseData,
          testData: testData,
          note: 'Using secure server-side API with environment variables',
        });
      } else {
        setError(`API returned status ${response.status}: ${response.statusText}`);
        setResults({ 
          status: response.status,
          statusText: response.statusText,
          headers: {},
          data: responseData,
          error: true 
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Direct API test error:', err);
    } finally {
      setLoading(false);
    }
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

      <h1 className="text-3xl font-bold text-white mb-8">API Test Page</h1>

      <div className="space-y-6">
        <div className="bg-[#1f1f1f] rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Test Market Insights API</h2>
          
          <div className="space-y-4">
            <button
              onClick={testAPI}
              disabled={loading}
              className="bg-[#3b82f6] hover:bg-[#2563eb] text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test Our API Endpoint'}
            </button>

            <button
              onClick={testDirectAPI}
              disabled={loading}
              className="bg-[#10b981] hover:bg-[#059669] text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 ml-4"
            >
              {loading ? 'Testing...' : 'Test Direct API Call'}
            </button>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-900/20 text-red-300 rounded-lg">
              <strong>Error:</strong> {error}
            </div>
          )}

          {results && (
            <div className="mt-6 space-y-4">
              <h3 className="text-lg font-medium text-white">Results:</h3>
              
              <div className="bg-[#0a0a0a] rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                  {JSON.stringify(results, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        <div className="bg-[#1f1f1f] rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">API Configuration</h2>
          <div className="space-y-2 text-sm text-gray-400">
            <p>API URL: https://api.autodealerdata.com</p>
            <p>API Key ID: ID_h-5w8of9sARkyXBpQ_VW9LRIs9NLrBTu1cKj2JOCS4Q</p>
            <p>Test Vehicle: Toyota Camry 2023</p>
          </div>
        </div>
      </div>
    </div>
  );
}