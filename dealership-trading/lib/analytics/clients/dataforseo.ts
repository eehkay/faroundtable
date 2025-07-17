import { 
  DemandData, 
  Keyword, 
  SeasonalPattern,
  VehicleAnalysisRequest 
} from '@/types/analytics';

export interface DataForSEOConfig {
  email: string;
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
}

export interface SearchVolumeResult {
  keyword: string;
  search_volume: number;
  competition: number;
  cpc?: number; // Cost per click (optional)
  trend: number[];
  monthly_searches: Array<{
    year: number;
    month: number;
    search_volume: number;
  }>;
}

export interface KeywordSuggestion {
  keyword: string;
  search_volume: number;
  trend: number;
  relevance: number;
}

export class DataForSEOClient {
  private email: string;
  private apiKey: string;
  private baseUrl: string;
  private timeout: number;

  constructor(config?: DataForSEOConfig) {
    if (config) {
      this.email = config.email;
      this.apiKey = config.apiKey;
      this.baseUrl = config.baseUrl || 'https://api.dataforseo.com';
      this.timeout = config.timeout || 30000;
    } else {
      // Use environment variables as fallback
      this.email = process.env.DATAFORSEO_EMAIL || '';
      this.apiKey = process.env.DATAFORSEO_API_KEY || '';
      this.baseUrl = 'https://api.dataforseo.com';
      this.timeout = 30000;
    }
  }

  private getAuthHeader(): string {
    const credentials = `${this.email}:${this.apiKey}`;
    return `Basic ${Buffer.from(credentials).toString('base64')}`;
  }

  private async request<T>(endpoint: string, data?: any, returnFullResponse: boolean = false): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': this.getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: data ? JSON.stringify([data]) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`DataForSEO API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      // If we want the full response, return it immediately
      if (returnFullResponse) {
        return result as T;
      }
      
      // Check for API-level errors
      if (result.status_code !== 20000) {
        throw new Error(`DataForSEO API error: ${result.status_message || 'Unknown error'}`);
      }

      // Check if we have tasks and they succeeded
      if (!result.tasks || result.tasks.length === 0) {
        return null as any;
      }

      const task = result.tasks[0];
      
      // Check task status
      if (task.status_code !== 20000) {
        throw new Error(`Task failed: ${task.status_message || 'Unknown error'}`);
      }

      // Return the result data
      if (task.result !== undefined) {
        return task.result as T;
      }
      
      // For some endpoints, data might be at tasks[0].data
      if (task.data !== undefined) {
        return task.data as T;
      }
      
      return null as any;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('DataForSEO API request timeout');
      }
      
      throw error;
    }
  }

  async getSearchVolume(keywords: string[], locationCode: number = 2840): Promise<SearchVolumeResult[]> {
    try {
      // Use Google Ads endpoint for better location support
      const requestData = {
        keywords: keywords,
        location_code: locationCode,
        language_code: 'en',
        sort_by: 'relevance',
        limit: 1000, // Increased limit to get more results
      };

      const response = await this.request<any>(
        '/v3/keywords_data/google_ads/keywords_for_keywords/live',
        requestData
      );

      // Parse the response - Google Ads returns results directly as an array
      let items: any[] = [];
      
      if (response && Array.isArray(response)) {
        items = response;
      }

      if (items.length === 0) {
        return keywords.map(keyword => ({
          keyword,
          search_volume: 0,
          competition: 0,
          trend: [],
          monthly_searches: [],
        }));
      }

      // Process ALL results returned by the API
      const results: SearchVolumeResult[] = [];

      for (const item of items) {
        const keyword = item.keyword;
        if (!keyword) continue;
        
        // Convert competition string to number (0-1 scale)
        let competitionValue = 0;
        if (item.competition === 'HIGH') competitionValue = 1;
        else if (item.competition === 'MEDIUM') competitionValue = 0.5;
        else if (item.competition === 'LOW') competitionValue = 0.25;
        
        // Extract trend from monthly searches
        const trend = item.monthly_searches?.map((m: any) => m.search_volume) || [];
        
        results.push({
          keyword: keyword,
          search_volume: item.search_volume || 0,
          competition: competitionValue,
          trend: trend,
          monthly_searches: item.monthly_searches || [],
        });
      }

      return results;
    } catch (error) {
      return keywords.map(keyword => ({
        keyword,
        search_volume: 0,
        competition: 0,
        trend: [],
        monthly_searches: [],
      }));
    }
  }

  /**
   * Get search volume for multiple location codes and aggregate results
   * Useful for locations like Reno that have multiple DataForSEO codes
   */
  /**
   * Get search volume using latitude, longitude, and radius
   * @param keywords - Array of keywords to analyze
   * @param latitude - Latitude coordinate
   * @param longitude - Longitude coordinate
   * @param radiusMiles - Radius in miles (default 50)
   * @param negativeKeywords - Keywords to exclude from results
   */
  async getSearchVolumeByCoordinate(
    keywords: string[],
    latitude: number,
    longitude: number,
    radiusMiles: number = 50,
    negativeKeywords: string[] = [],
    includeRawResponse: boolean = false
  ): Promise<SearchVolumeResult[] | { results: SearchVolumeResult[], raw: any }> {
    try {
      // Format: "latitude,longitude,radius_in_miles"
      const locationCoordinate = `${latitude},${longitude},${radiusMiles}`;
      
      const requestData = {
        keywords: keywords,
        location_coordinate: locationCoordinate,
        language_code: 'en',
        sort_by: 'search_volume',
        keywords_negative: negativeKeywords.length > 0 ? negativeKeywords : undefined
      };

      // First get the full response for debugging if requested
      const fullResponse = includeRawResponse ? await this.request<any>(
        '/v3/keywords_data/google_ads/keywords_for_keywords/live',
        requestData,
        true
      ) : null;
      
      const response = await this.request<any>(
        '/v3/keywords_data/google_ads/keywords_for_keywords/live',
        requestData
      );

      // Parse the response - Google Ads returns results directly as an array
      let items: any[] = [];
      
      if (response && Array.isArray(response)) {
        items = response;
      }

      if (items.length === 0) {
        return keywords.map(keyword => ({
          keyword,
          search_volume: 0,
          competition: 0,
          cpc: 0,
          trend: [],
          monthly_searches: [],
        }));
      }

      // Process ALL results returned by the API
      const results: SearchVolumeResult[] = [];

      for (const item of items) {
        const keyword = item.keyword;
        if (!keyword) continue;
        
        // Convert competition string to number (0-1 scale)
        let competitionValue = 0;
        if (item.competition === 'HIGH') competitionValue = 1;
        else if (item.competition === 'MEDIUM') competitionValue = 0.5;
        else if (item.competition === 'LOW') competitionValue = 0.25;
        
        // Extract trend from monthly searches
        const trend = item.monthly_searches?.map((m: any) => m.search_volume) || [];
        
        results.push({
          keyword: keyword,
          search_volume: item.search_volume || 0,
          competition: competitionValue,
          cpc: item.cpc || 0,
          trend: trend,
          monthly_searches: item.monthly_searches || [],
        });
      }

      return includeRawResponse ? { results, raw: fullResponse } : results;
    } catch (error) {
      console.error('Error fetching search volume by coordinate:', error);
      return keywords.map(keyword => ({
        keyword,
        search_volume: 0,
        competition: 0,
        cpc: 0,
        trend: [],
        monthly_searches: [],
      }));
    }
  }

  async getSearchVolumeMultiLocation(keywords: string[], locationCodes: number[]): Promise<SearchVolumeResult[]> {
    try {
      // Get search volume for each location
      const allResults = await Promise.all(
        locationCodes.map(locationCode => this.getSearchVolume(keywords, locationCode))
      );

      // Aggregate results by keyword
      const aggregatedMap = new Map<string, SearchVolumeResult>();

      for (const locationResults of allResults) {
        for (const result of locationResults) {
          const existing = aggregatedMap.get(result.keyword);
          
          if (!existing) {
            aggregatedMap.set(result.keyword, { ...result });
          } else {
            // Sum search volumes and average competition
            existing.search_volume += result.search_volume;
            existing.competition = (existing.competition + result.competition) / 2;
            
            // Merge monthly searches
            if (result.monthly_searches.length > 0) {
              existing.monthly_searches = result.monthly_searches;
            }
            
            // Keep the trend from the location with higher volume
            if (result.search_volume > 0 && result.trend.length > 0) {
              existing.trend = result.trend;
            }
          }
        }
      }

      return Array.from(aggregatedMap.values());
    } catch (error) {
      return keywords.map(keyword => ({
        keyword,
        search_volume: 0,
        competition: 0,
        trend: [],
        monthly_searches: [],
      }));
    }
  }

  /**
   * Get search volume with debug information for testing
   */
  async getSearchVolumeWithDebug(keywords: string[], locationCode: number = 2840): Promise<{
    results: SearchVolumeResult[];
    debug: {
      locationCode: number;
      keywordsCount: number;
      resultsCount: number;
      apiUrl: string;
      requestBody: any;
    };
  }> {
    const requestData = {
      keywords: keywords,
      location_code: locationCode,
      language_code: 'en',
      sort_by: 'relevance',
      limit: 1000,
    };

    const results = await this.getSearchVolume(keywords, locationCode);

    return {
      results,
      debug: {
        locationCode,
        keywordsCount: keywords.length,
        resultsCount: results.length,
        apiUrl: '/v3/keywords_data/google_ads/keywords_for_keywords/live',
        requestBody: requestData,
      },
    };
  }

  async getKeywordSuggestions(seed: string, locationCode: number = 2840): Promise<KeywordSuggestion[]> {
    try {
      const data = {
        keywords: [seed],
        location_code: locationCode,
        language_code: 'en',
        sort_by: 'relevance',
        limit: 20,
      };

      const response = await this.request<any>(
        '/v3/keywords_data/google_ads/keywords_for_keywords/live',
        data
      );

      // Parse response - same structure as search volume
      let items: any[] = [];
      
      if (response && Array.isArray(response)) {
        items = response;
      }
      
      return items.map((item: any) => ({
        keyword: item.keyword,
        search_volume: item.search_volume || 0,
        trend: item.search_volume || 0,
        relevance: 1, // Google Ads API doesn't provide relevance score
      }));
    } catch (error) {
      return [];
    }
  }

  async getDemandData(vehicle: VehicleAnalysisRequest, locationCodes?: number[]): Promise<DemandData> {
    try {
      // Create search keywords based on vehicle
      const baseKeyword = `${vehicle.make} ${vehicle.model}`;
      const yearKeyword = vehicle.year ? `${vehicle.year} ${baseKeyword}` : baseKeyword;
      const keywords = [
        baseKeyword,
        yearKeyword,
        `${baseKeyword} for sale`,
        `${baseKeyword} price`,
        `used ${baseKeyword}`,
      ].filter(Boolean);

      // Get search volume data
      // Use provided location codes or default to US
      const codes = locationCodes && locationCodes.length > 0 ? locationCodes : [2840];
      
      // Use multi-location search if multiple codes provided
      const volumeResults = codes.length > 1 
        ? await this.getSearchVolumeMultiLocation(keywords, codes)
        : await this.getSearchVolume(keywords, codes[0]);
      
      // Get related keywords (use first location code for suggestions)
      const suggestions = await this.getKeywordSuggestions(baseKeyword, codes[0]);

      // Calculate total monthly search volume
      const monthlySearchVolume = volumeResults.reduce(
        (sum, result) => sum + (result.search_volume || 0), 
        0
      );

      // Since Google Ads API doesn't provide historical data, we can't calculate YoY growth
      const yearOverYearGrowth = 0;

      // Determine trend direction based on current volume
      let trendDirection: 'increasing' | 'stable' | 'decreasing' = 'stable';
      
      // Extract related keywords
      const relatedKeywords: Keyword[] = suggestions
        .filter(s => s.keyword.toLowerCase() !== baseKeyword.toLowerCase())
        .slice(0, 10)
        .map(suggestion => ({
          term: suggestion.keyword,
          volume: suggestion.search_volume,
          trend: suggestion.search_volume > monthlySearchVolume / keywords.length ? 'up' : 'stable',
        }));

      return {
        monthlySearchVolume,
        yearOverYearGrowth,
        trendDirection,
        relatedKeywords,
        seasonality: undefined, // Google Ads API doesn't provide seasonality data
      };
    } catch (error) {
      return {
        monthlySearchVolume: 0,
        trendDirection: 'stable',
        relatedKeywords: [],
      };
    }
  }

  private analyzeSeasonality(monthlySearches: Array<{ year: number; month: number; search_volume: number }>): SeasonalPattern | undefined {
    if (monthlySearches.length < 12) return undefined;

    // Group by month across all years
    const monthlyAverages = new Map<number, number[]>();
    
    monthlySearches.forEach(data => {
      if (!monthlyAverages.has(data.month)) {
        monthlyAverages.set(data.month, []);
      }
      monthlyAverages.get(data.month)!.push(data.search_volume);
    });

    // Calculate average for each month
    const monthlyAvgVolume = Array.from(monthlyAverages.entries()).map(([month, volumes]) => ({
      month,
      avgVolume: volumes.reduce((sum, v) => sum + v, 0) / volumes.length,
    }));

    // Find peak and low months
    const sortedByVolume = [...monthlyAvgVolume].sort((a, b) => b.avgVolume - a.avgVolume);
    const peakMonths = sortedByVolume.slice(0, 3).map(m => m.month);
    const lowMonths = sortedByVolume.slice(-3).map(m => m.month);

    // Convert to month names
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const peakMonthNames = peakMonths.map(m => monthNames[m - 1]);
    const lowMonthNames = lowMonths.map(m => monthNames[m - 1]);

    // Determine current season
    const currentMonth = new Date().getMonth() + 1;
    let currentSeason: 'peak' | 'normal' | 'low' = 'normal';
    
    if (peakMonths.includes(currentMonth)) currentSeason = 'peak';
    else if (lowMonths.includes(currentMonth)) currentSeason = 'low';

    return {
      peak: peakMonthNames.join('-'),
      low: lowMonthNames.join('-'),
      currentSeason,
    };
  }
}