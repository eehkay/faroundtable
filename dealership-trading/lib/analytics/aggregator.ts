import { 
  VehicleAnalysis, 
  VehicleAnalysisRequest,
  RegionalInsights,
  RegionalInsightsRequest,
  Recommendations,
  MarketOpportunity,
  PopularVehicle,
  MarketTrends,
  TrendingModel
} from '@/types/analytics';
import { MarketCheckClient } from './clients/marketcheck';
import { DataForSEOClient } from './clients/dataforseo';
import { CacheManager } from './cache-manager';
import { getDealershipLocation } from '@/lib/queries/locations';

export class AnalyticsAggregator {
  private marketCheckClient: MarketCheckClient;
  private dataForSEOClient: DataForSEOClient;
  private cacheManager: CacheManager;

  constructor(
    marketCheckClient: MarketCheckClient,
    dataForSEOClient: DataForSEOClient,
    cacheManager: CacheManager
  ) {
    this.marketCheckClient = marketCheckClient;
    this.dataForSEOClient = dataForSEOClient;
    this.cacheManager = cacheManager;
  }

  async analyzeVehicle(request: VehicleAnalysisRequest): Promise<VehicleAnalysis> {
    // Check cache first
    const cached = await this.cacheManager.get<VehicleAnalysis>(
      'vehicle_analysis',
      'combined',
      request
    );

    if (cached) {
      return cached;
    }

    try {
      // Get location coordinates if locationId is provided
      let location = request.location;
      if (!location && request.locationId) {
        const dealership = await getDealershipLocation(request.locationId);
        if (dealership?.coordinates) {
          location = {
            lat: dealership.coordinates.lat,
            lng: dealership.coordinates.lng,
          };
        }
      }

      // Default location if none provided
      if (!location) {
        location = { lat: 33.0, lng: -117.0 }; // San Diego area default
      }

      // Parallel API calls
      const [marketData, demandData, competitiveAnalysis] = await Promise.all([
        this.marketCheckClient.getRegionalStats(
          request.make!,
          request.model!,
          location,
          request.radius
        ),
        this.dataForSEOClient.getDemandData(request),
        this.marketCheckClient.getCompetitors(location, request.radius),
      ]);

      // Generate recommendations
      const recommendations = this.generateRecommendations(
        marketData,
        demandData,
        competitiveAnalysis
      );

      const analysis: VehicleAnalysis = {
        id: crypto.randomUUID(),
        vehicle: {
          vin: request.vin,
          make: request.make!,
          model: request.model!,
          year: request.year!,
        },
        marketData,
        demandData,
        competitiveAnalysis,
        recommendations,
        analyzedAt: new Date(),
        cacheExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      };

      // Cache the result
      await this.cacheManager.set(
        'vehicle_analysis',
        'combined',
        request,
        analysis
      );

      return analysis;
    } catch (error) {
      console.error('Error analyzing vehicle:', error);
      throw error;
    }
  }

  async getRegionalInsights(request: RegionalInsightsRequest): Promise<RegionalInsights> {
    // Check cache first
    const cached = await this.cacheManager.get<RegionalInsights>(
      'regional_trends',
      'combined',
      request
    );

    if (cached) {
      return cached;
    }

    try {
      // Get location details
      const dealership = await getDealershipLocation(request.locationId);
      if (!dealership) {
        throw new Error('Invalid location ID');
      }

      const location = dealership.coordinates || { lat: 33.0, lng: -117.0 };

      // Get popular vehicles in the region
      const popularMakes = ['Toyota', 'Honda', 'Ford', 'Chevrolet', 'Nissan'];
      const popularModels = ['Camry', 'Accord', 'F-150', 'Silverado', 'Altima'];

      // Parallel analysis of popular vehicles
      const vehicleAnalyses = await Promise.all(
        popularMakes.slice(0, 3).map(async (make, index) => {
          const model = popularModels[index];
          try {
            const [marketData, demandData] = await Promise.all([
              this.marketCheckClient.getRegionalStats(make, model, location, request.radius),
              this.dataForSEOClient.getDemandData({ make, model }),
            ]);

            return {
              make,
              model,
              marketData,
              demandData,
            };
          } catch (error) {
            console.error(`Error analyzing ${make} ${model}:`, error);
            return null;
          }
        })
      );

      const validAnalyses = vehicleAnalyses.filter(Boolean);

      // Transform to popular vehicles
      const popularVehicles: PopularVehicle[] = validAnalyses.map(analysis => ({
        make: analysis!.make,
        model: analysis!.model,
        averagePrice: analysis!.marketData.averagePrice,
        searchVolume: analysis!.demandData.monthlySearchVolume,
        inventoryCount: analysis!.marketData.inventoryCount,
        demandSupplyRatio: analysis!.demandData.monthlySearchVolume / 
          (analysis!.marketData.inventoryCount || 1),
        trend: analysis!.marketData.marketTrend === 'increasing' ? 'rising' :
               analysis!.marketData.marketTrend === 'decreasing' ? 'declining' : 'stable',
      }));

      // Calculate market overview
      const totalInventoryValue = popularVehicles.reduce(
        (sum, v) => sum + (v.averagePrice * v.inventoryCount), 
        0
      );

      // Identify trends
      const trends = this.identifyMarketTrends(popularVehicles);

      // Find opportunities
      const opportunities = this.identifyOpportunities(popularVehicles, trends);

      const insights: RegionalInsights = {
        location: {
          id: dealership.id,
          name: dealership.name,
          coordinates: location,
        },
        marketOverview: {
          totalInventoryValue,
          uniqueModels: popularVehicles.length,
          averageTurnover: 30, // Default value, would need more data
          competitorDensity: 'medium', // Would need competitor analysis
        },
        popularVehicles,
        trends,
        opportunities,
      };

      // Cache the result
      await this.cacheManager.set(
        'regional_trends',
        'combined',
        request,
        insights
      );

      return insights;
    } catch (error) {
      console.error('Error getting regional insights:', error);
      throw error;
    }
  }

  private generateRecommendations(
    marketData: any,
    demandData: any,
    competitiveAnalysis: any
  ): Recommendations {
    const recommendations: Recommendations = {
      action: '',
      confidence: 'medium',
    };

    // Pricing recommendation
    if (marketData.averagePrice > 0) {
      const pricePosition = competitiveAnalysis.competitivePricing || 'at';
      if (pricePosition === 'above') {
        recommendations.pricing = 'Your pricing is above market average. Consider reducing by 3-5%.';
      } else if (pricePosition === 'below') {
        recommendations.pricing = 'Your pricing is below market average. You have room to increase by 3-5%.';
      } else {
        recommendations.pricing = 'Your pricing is aligned with market average.';
      }
    }

    // Demand recommendation
    if (demandData.monthlySearchVolume > 10000) {
      recommendations.demand = 'High demand in your region. Good time to stock this vehicle.';
      recommendations.confidence = 'high';
    } else if (demandData.monthlySearchVolume < 1000) {
      recommendations.demand = 'Low demand in your region. Consider alternative models.';
      recommendations.confidence = 'high';
    } else {
      recommendations.demand = 'Moderate demand in your region.';
    }

    // Action recommendation
    if (demandData.trendDirection === 'increasing' && marketData.inventoryCount < 10) {
      recommendations.action = 'Demand is rising with low inventory. Excellent opportunity to acquire more units.';
      recommendations.confidence = 'high';
    } else if (demandData.trendDirection === 'decreasing' && marketData.inventoryCount > 50) {
      recommendations.action = 'Demand is falling with high inventory. Consider promotional pricing or transfers.';
      recommendations.confidence = 'high';
    } else {
      recommendations.action = 'Market conditions are stable. Monitor trends for opportunities.';
    }

    return recommendations;
  }

  private identifyMarketTrends(vehicles: PopularVehicle[]): MarketTrends {
    const risingModels: TrendingModel[] = vehicles
      .filter(v => v.trend === 'rising')
      .map(v => ({
        make: v.make,
        model: v.model,
        changePercent: 15, // Would need historical data for accurate calculation
        currentVolume: v.searchVolume,
      }));

    const decliningModels: TrendingModel[] = vehicles
      .filter(v => v.trend === 'declining')
      .map(v => ({
        make: v.make,
        model: v.model,
        changePercent: -10, // Would need historical data for accurate calculation
        currentVolume: v.searchVolume,
      }));

    return {
      risingModels,
      decliningModels,
      seasonalPatterns: {}, // Would need more data
      priceMovements: [], // Would need historical pricing data
    };
  }

  private identifyOpportunities(
    vehicles: PopularVehicle[],
    trends: MarketTrends
  ): MarketOpportunity[] {
    const opportunities: MarketOpportunity[] = [];

    // High demand, low supply opportunities
    vehicles.forEach(vehicle => {
      if (vehicle.demandSupplyRatio > 100) {
        opportunities.push({
          type: 'high-demand',
          description: `${vehicle.make} ${vehicle.model} has high demand relative to supply`,
          potential: 'high',
          vehicles: [`${vehicle.make} ${vehicle.model}`],
          estimatedValue: vehicle.averagePrice * 5, // Potential revenue from 5 units
        });
      }
    });

    // Rising trend opportunities
    trends.risingModels.forEach(model => {
      opportunities.push({
        type: 'emerging-trend',
        description: `${model.make} ${model.model} showing ${model.changePercent}% growth`,
        potential: 'medium',
        vehicles: [`${model.make} ${model.model}`],
      });
    });

    return opportunities.slice(0, 5); // Top 5 opportunities
  }
}