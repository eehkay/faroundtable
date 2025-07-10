'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, TrendingUp, TrendingDown, Minus, Loader2, FileText, DollarSign, Package, Clock, Target } from 'lucide-react'
import VehicleSearchInput from '@/components/analytics/VehicleSearchInput'
import { useDealershipLocations } from '@/lib/hooks/useDealershipLocations'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'

interface MarketTrendReport {
  vehicle: {
    vin: string
    year: number
    make: string
    model: string
    trim?: string
    mileage: number
    currentPrice: number
  }
  location: {
    dealership: string
    coordinates: { lat: number; lng: number }
    cityState: string
  }
  marketPosition?: {
    predictedPrice: number
    priceRange: { lower: number; upper: number }
    currentPrice: number
    percentile: number
    recommendation: string
    error?: string
  }
  inventoryAnalysis?: {
    marketDaySupply: number
    inventoryCount: number
    salesCount: number
    scarcityScore: number
    error?: string
  }
  regionalPerformance?: {
    citySalesCount: number
    avgPrice: number
    avgMiles: number
    avgDaysOnMarket: number
    topColors: string[]
    salesTrend: string
    error?: string
    debugInfo?: {
      requestParams: any
      errorReason?: string
    }
  }
  competitiveLandscape?: {
    similarVehicles: Array<{
      vin: string
      distance: number
      price: number
      dealer: string
      daysOnMarket: number
      year: number
      make: string
      model: string
      vdpUrl?: string
    }>
    totalNearbyInventory: number
    avgCompetitorPrice: number
    pricePosition: 'above' | 'at' | 'below'
    error?: string
  }
  opportunityScore?: {
    overall: number
    breakdown: {
      priceCompetitiveness: number
      inventoryScarcity: number
      regionalDemand: number
      marketTiming: number
    }
  }
  recommendations?: {
    pricing: string
    inventory: string
    timing: string
    action: string
  }
}

export default function MarketTrendReportPage() {
  const { data: session } = useSession()
  const { locations } = useDealershipLocations()
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [report, setReport] = useState<MarketTrendReport | null>(null)

  const generateReport = async () => {
    if (!selectedVehicle) return

    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/analytics/market-trend-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vin: selectedVehicle.vin,
          currentPrice: selectedVehicle.price,
          locationId: selectedVehicle.locationId
        })
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate report')
      }

      setReport(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500'
    if (score >= 60) return 'text-blue-500'
    if (score >= 40) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" | "outline" => {
    if (score >= 80) return 'default'
    if (score >= 60) return 'secondary'
    if (score >= 40) return 'outline'
    return 'destructive'
  }

  const getTrendIcon = (trend: string) => {
    if (trend === 'increasing' || trend === 'rising') return <TrendingUp className="h-4 w-4 text-green-500" />
    if (trend === 'decreasing' || trend === 'declining') return <TrendingDown className="h-4 w-4 text-red-500" />
    return <Minus className="h-4 w-4 text-gray-500" />
  }

  return (
    <div className="space-y-6 min-h-screen bg-[#141414]">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Market Trend Report</h1>
        <p className="text-gray-400 mt-2">
          Comprehensive market analysis using real-time data from Market Check
        </p>
      </div>

      {/* Vehicle Selection */}
      <Card className="bg-[#1f1f1f] border border-[#2a2a2a] transition-all duration-200 ease hover:bg-[#333333] hover:transform hover:-translate-y-0.5 hover:shadow-lg">
        <CardHeader>
          <CardTitle>Select Vehicle for Analysis</CardTitle>
          <CardDescription>
            Search for a vehicle in your inventory to generate a market trend report
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <VehicleSearchInput
            label="Search for a vehicle"
            onVehicleSelect={(vehicle) => {
              setSelectedVehicle({
                vin: vehicle.vin,
                year: vehicle.year,
                make: vehicle.make,
                model: vehicle.model,
                trim: vehicle.trim,
                mileage: vehicle.mileage,
                price: vehicle.price,
                locationId: vehicle.locationId
              })
              setReport(null) // Clear previous report
            }}
          />
          
          {selectedVehicle && (
            <div className="p-4 bg-[#141414] rounded-lg border border-[#2a2a2a] transition-all duration-200 ease">
              <p className="text-sm text-[#a3a3a3]">Selected Vehicle:</p>
              <p className="text-white font-medium">
                {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model} {selectedVehicle.trim || ''}
              </p>
              <p className="text-sm text-[#737373]">VIN: {selectedVehicle.vin}</p>
              <p className="text-sm text-[#737373]">Current Price: ${selectedVehicle.price.toLocaleString()}</p>
            </div>
          )}

          <Button 
            onClick={generateReport}
            disabled={!selectedVehicle || loading}
            className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white transition-all duration-200 ease hover:transform hover:-translate-y-0.5 hover:shadow-lg"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? 'Generating Report...' : 'Generate Market Trend Report'}
          </Button>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Report Display */}
      {report && (
        <>
          {/* Opportunity Score */}
          {report.opportunityScore && (
            <Card className="bg-[#1f1f1f] border border-[#2a2a2a] transition-all duration-200 ease hover:bg-[#333333] hover:transform hover:-translate-y-0.5 hover:shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-[#3b82f6]" />
                  Opportunity Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-6">
                  <div className={`text-6xl font-bold ${getScoreColor(report.opportunityScore.overall)}`}>
                    {report.opportunityScore.overall}
                  </div>
                  <Badge variant={getScoreBadgeVariant(report.opportunityScore.overall)} className="mt-2">
                    {report.recommendations?.action}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-[#a3a3a3]">Price Position</p>
                    <p className="text-2xl font-semibold text-white">
                      {report.opportunityScore.breakdown.priceCompetitiveness}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-[#a3a3a3]">Inventory Scarcity</p>
                    <p className="text-2xl font-semibold text-white">
                      {report.opportunityScore.breakdown.inventoryScarcity}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-[#a3a3a3]">Regional Demand</p>
                    <p className="text-2xl font-semibold text-white">
                      {report.opportunityScore.breakdown.regionalDemand}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-[#a3a3a3]">Market Timing</p>
                    <p className="text-2xl font-semibold text-white">
                      {report.opportunityScore.breakdown.marketTiming}%
                    </p>
                  </div>
                </div>
                
                {/* Metric Explanations */}
                <div className="mt-6 p-4 bg-[#141414] rounded-lg border border-[#2a2a2a]">
                  <h4 className="text-sm font-medium text-[#a3a3a3] mb-3">Understanding Your Metrics</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="font-medium text-[#3b82f6]">Price Position:</span>
                      <span className="text-[#a3a3a3] ml-1">How competitively your vehicle is priced compared to market predictions (50% is optimal)</span>
                    </div>
                    <div>
                      <span className="font-medium text-[#3b82f6]">Inventory Scarcity:</span>
                      <span className="text-[#a3a3a3] ml-1">Market availability of similar vehicles (higher score = lower supply = higher demand)</span>
                    </div>
                    <div>
                      <span className="font-medium text-[#3b82f6]">Regional Demand:</span>
                      <span className="text-[#a3a3a3] ml-1">Local market activity and sales volume for this vehicle type in your area</span>
                    </div>
                    <div>
                      <span className="font-medium text-[#3b82f6]">Market Timing:</span>
                      <span className="text-[#a3a3a3] ml-1">How quickly similar vehicles sell in the market (higher score = faster sales)</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Market Analysis Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Price Analysis */}
            {report.marketPosition && !report.marketPosition.error && (
              <Card className="bg-[#1f1f1f] border border-[#2a2a2a] transition-all duration-200 ease hover:bg-[#333333] hover:transform hover:-translate-y-0.5 hover:shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-[#3b82f6]" />
                    Price Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-[#a3a3a3]">Predicted Market Price</p>
                    <p className="text-3xl font-bold text-white">
                      ${report.marketPosition.predictedPrice.toLocaleString()}
                    </p>
                    <p className="text-sm text-[#737373] mt-1">
                      Range: ${report.marketPosition.priceRange.lower.toLocaleString()} - 
                      ${report.marketPosition.priceRange.upper.toLocaleString()}
                    </p>
                  </div>
                  
                  <div className="pt-4 border-t border-[#2a2a2a]">
                    <p className="text-sm text-[#a3a3a3]">Current Price Position</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-lg font-semibold text-white">
                        ${report.marketPosition.currentPrice.toLocaleString()}
                      </span>
                      <Badge variant={report.marketPosition.percentile > 70 ? 'destructive' : 
                                     report.marketPosition.percentile < 30 ? 'default' : 'secondary'}>
                        {report.marketPosition.percentile}th percentile
                      </Badge>
                    </div>
                    <p className="text-sm text-[#737373] mt-2">
                      {report.marketPosition.recommendation}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Inventory Analysis */}
            {report.inventoryAnalysis && !report.inventoryAnalysis.error && (
              <Card className="bg-[#1f1f1f] border border-[#2a2a2a] transition-all duration-200 ease hover:bg-[#333333] hover:transform hover:-translate-y-0.5 hover:shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-[#3b82f6]" />
                    Inventory Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-[#a3a3a3]">Market Day Supply</p>
                    <p className="text-3xl font-bold text-white">
                      {report.inventoryAnalysis.marketDaySupply} days
                    </p>
                    <div className="mt-2">
                      <div className="w-full bg-[#1f1f1f] rounded-full h-2">
                        <div 
                          className="bg-[#3b82f6] h-2 rounded-full transition-all duration-500"
                          style={{ width: `${100 - Math.min(100, report.inventoryAnalysis.marketDaySupply)}%` }}
                        />
                      </div>
                      <p className="text-xs text-[#737373] mt-1">
                        Lower is better (high demand)
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#2a2a2a]">
                    <div>
                      <p className="text-sm text-[#a3a3a3]">Inventory Count</p>
                      <p className="text-xl font-semibold text-white">
                        {report.inventoryAnalysis.inventoryCount}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-[#a3a3a3]">Recent Sales</p>
                      <p className="text-xl font-semibold text-white">
                        {report.inventoryAnalysis.salesCount}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-[#a3a3a3]">Scarcity Score</p>
                    <div className="flex items-center gap-2">
                      <span className={`text-2xl font-bold ${getScoreColor(report.inventoryAnalysis.scarcityScore)}`}>
                        {report.inventoryAnalysis.scarcityScore}%
                      </span>
                      <Badge variant={getScoreBadgeVariant(report.inventoryAnalysis.scarcityScore)}>
                        {report.inventoryAnalysis.scarcityScore >= 70 ? 'High Demand' :
                         report.inventoryAnalysis.scarcityScore >= 40 ? 'Moderate' : 'Low Demand'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Regional Performance */}
            {report.regionalPerformance && (
              <Card className="bg-[#1f1f1f] border border-[#2a2a2a] transition-all duration-200 ease hover:bg-[#333333] hover:transform hover:-translate-y-0.5 hover:shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-[#3b82f6]" />
                    Regional Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {report.regionalPerformance.error ? (
                    <div className="py-4">
                      <div className="text-center mb-4">
                        <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                        <p className="text-sm text-red-400">{report.regionalPerformance.error}</p>
                      </div>
                      
                      {report.regionalPerformance.debugInfo && (
                        <div className="bg-[#141414] rounded-lg p-3 border border-[#2a2a2a]">
                          <p className="text-xs text-[#a3a3a3] mb-2 font-medium">Debug Information:</p>
                          <div className="space-y-1 text-xs">
                            <div>
                              <span className="text-[#737373]">Request Parameters:</span>
                              <pre className="text-[#a3a3a3] mt-1 ml-2">
                                {JSON.stringify(report.regionalPerformance.debugInfo.requestParams, null, 2)}
                              </pre>
                            </div>
                            {report.regionalPerformance.debugInfo.errorReason && (
                              <div>
                                <span className="text-[#737373]">Error Reason:</span>
                                <p className="text-red-400 mt-1 ml-2">{report.regionalPerformance.debugInfo.errorReason}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-[#a3a3a3]">City Sales Volume</p>
                          <p className="text-2xl font-bold text-white">
                            {report.regionalPerformance.citySalesCount} units
                          </p>
                        </div>
                    <div className="flex items-center gap-2">
                      {getTrendIcon(report.regionalPerformance.salesTrend)}
                      <span className="text-sm text-[#a3a3a3]">
                        {report.regionalPerformance.salesTrend}
                      </span>
                    </div>
                  </div>
                  
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#2a2a2a]">
                        <div>
                          <p className="text-sm text-[#a3a3a3]">Avg Price</p>
                          <p className="text-lg font-semibold text-white">
                            ${report.regionalPerformance.avgPrice.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-[#a3a3a3]">Avg Days on Market</p>
                          <p className="text-lg font-semibold text-white">
                            {report.regionalPerformance.avgDaysOnMarket} days
                          </p>
                        </div>
                      </div>
                      
                      {report.regionalPerformance.topColors && report.regionalPerformance.topColors.length > 0 && (
                        <div>
                          <p className="text-sm text-[#a3a3a3] mb-2">Popular Colors</p>
                          <div className="flex flex-wrap gap-2">
                            {report.regionalPerformance.topColors.map((color, index) => (
                              <Badge key={index} variant="outline">
                                {color}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Competitive Landscape */}
            {report.competitiveLandscape && !report.competitiveLandscape.error && (
              <Card className="bg-[#1f1f1f] border border-[#2a2a2a] transition-all duration-200 ease hover:bg-[#333333] hover:transform hover:-translate-y-0.5 hover:shadow-lg">
                <CardHeader>
                  <CardTitle>Competitive Landscape</CardTitle>
                  <CardDescription>
                    {report.competitiveLandscape.totalNearbyInventory} similar vehicles within 100 miles
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-[#a3a3a3]">Average Competitor Price</p>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-bold text-white">
                        ${report.competitiveLandscape.avgCompetitorPrice.toLocaleString()}
                      </p>
                      <Badge variant={
                        report.competitiveLandscape.pricePosition === 'above' ? 'destructive' :
                        report.competitiveLandscape.pricePosition === 'below' ? 'default' : 'secondary'
                      }>
                        {report.competitiveLandscape.pricePosition} market
                      </Badge>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-[#a3a3a3] mb-2">Nearby Competitors (Top 5)</p>
                    <div className="space-y-2">
                      {report.competitiveLandscape.similarVehicles.slice(0, 5).map((vehicle, index) => (
                        <div key={index} className="flex items-center justify-between text-sm group">
                          <div className="flex items-center gap-2">
                            <span className="text-[#a3a3a3]">
                              {vehicle.distance}mi - {vehicle.dealer}
                            </span>
                            {vehicle.vdpUrl && (
                              <a 
                                href={vehicle.vdpUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-[#3b82f6] hover:text-[#60a5fa] transition-colors duration-200"
                                title="View vehicle details"
                              >
                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </a>
                            )}
                          </div>
                          <span className="text-white font-medium">
                            ${vehicle.price.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Recommendations */}
          {report.recommendations && (
            <Card className="bg-[#1f1f1f] border border-[#2a2a2a] transition-all duration-200 ease hover:bg-[#333333] hover:transform hover:-translate-y-0.5 hover:shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[#3b82f6]" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-[#141414] rounded-lg border border-[#2a2a2a] transition-all duration-200 ease hover:bg-[#2a2a2a]">
                    <p className="text-sm font-medium text-[#3b82f6] mb-1">Pricing Strategy</p>
                    <p className="text-sm text-[#a3a3a3]">{report.recommendations.pricing}</p>
                  </div>
                  <div className="p-4 bg-[#141414] rounded-lg border border-[#2a2a2a] transition-all duration-200 ease hover:bg-[#2a2a2a]">
                    <p className="text-sm font-medium text-[#3b82f6] mb-1">Inventory Management</p>
                    <p className="text-sm text-[#a3a3a3]">{report.recommendations.inventory}</p>
                  </div>
                  <div className="p-4 bg-[#141414] rounded-lg border border-[#2a2a2a] transition-all duration-200 ease hover:bg-[#2a2a2a]">
                    <p className="text-sm font-medium text-[#3b82f6] mb-1">Market Timing</p>
                    <p className="text-sm text-[#a3a3a3]">{report.recommendations.timing}</p>
                  </div>
                  <div className="p-4 bg-[#141414] rounded-lg border border-[#2a2a2a] transition-all duration-200 ease hover:bg-[#2a2a2a]">
                    <p className="text-sm font-medium text-[#3b82f6] mb-1">Action Required</p>
                    <p className="text-sm text-[#a3a3a3] font-semibold">{report.recommendations.action}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}