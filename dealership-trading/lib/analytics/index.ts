import { MarketCheckClient } from './clients/marketcheck';
import { DataForSEOClient } from './clients/dataforseo';
import { CacheManager } from './cache-manager';
import { AnalyticsAggregator } from './aggregator';

// Initialize clients
const getAnalyticsClients = () => {
  const marketCheckClient = new MarketCheckClient({
    apiKey: process.env.MARKETCHECK_API_KEY || '',
  });

  const dataForSEOClient = new DataForSEOClient({
    email: process.env.DATAFORSEO_EMAIL || '',
    apiKey: process.env.DATAFORSEO_API_KEY || '',
  });

  const cacheManager = new CacheManager(
    parseInt(process.env.ANALYTICS_CACHE_TTL_HOURS || '24')
  );

  const aggregator = new AnalyticsAggregator(
    marketCheckClient,
    dataForSEOClient,
    cacheManager
  );

  return {
    marketCheckClient,
    dataForSEOClient,
    cacheManager,
    aggregator,
  };
};

// Export singleton instances
export const {
  marketCheckClient,
  dataForSEOClient,
  cacheManager,
  aggregator,
} = getAnalyticsClients();

// Re-export types and constants
export * from './constants';
export { CacheManager } from './cache-manager';
export { AnalyticsAggregator } from './aggregator';
export { MarketCheckClient } from './clients/marketcheck';
export { DataForSEOClient } from './clients/dataforseo';