'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, TrendingUp, TrendingDown, Minus, Loader2, FileText, DollarSign, Package, Clock, Target, Zap, TrendingUpIcon, Users, BarChart3, Search, Settings2, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react'
import VehicleSearchInput from '@/components/analytics/VehicleSearchInput'
import { useDealershipLocations } from '@/lib/hooks/useDealershipLocations'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import OpportunityScoreStrip from '@/components/analytics/OpportunityScoreStrip'
import SummaryDashboardStrip from '@/components/analytics/SummaryDashboardStrip'
import MetricGauge from '@/components/analytics/MetricGauge'
import CompetitorCard from '@/components/analytics/CompetitorCard'
import ActionCard from '@/components/analytics/ActionCard'

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
  const searchParams = useSearchParams()
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [report, setReport] = useState<MarketTrendReport | null>(null)
  const [showManualOverride, setShowManualOverride] = useState(false)
  const [manualVin, setManualVin] = useState('')
  const [overrideFields, setOverrideFields] = useState({
    // Vehicle overrides
    year: '',
    make: '',
    model: '',
    trim: '',
    mileage: '',
    currentPrice: '',
    // Location overrides
    zipCode: '',
    latitude: '',
    longitude: '',
    cityState: '',
    dataforseoLocationCode: '',
    // Search parameters
    searchRadius: '100'
  })
  const [hasAutoRun, setHasAutoRun] = useState(false)

  const generateReport = async () => {
    // Check if we have either a selected vehicle or manual VIN
    if (!selectedVehicle && !manualVin) {
      setError('Please select a vehicle or enter a VIN manually')
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      // Build request body with overrides
      const requestBody: any = {
        vin: manualVin || selectedVehicle?.vin,
        currentPrice: overrideFields.currentPrice ? parseFloat(overrideFields.currentPrice) : selectedVehicle?.price,
        locationId: selectedVehicle?.locationId
      }

      // Add overrides if manual override is enabled
      if (showManualOverride) {
        requestBody.overrides = {
          vehicle: {},
          location: {},
          searchRadius: parseInt(overrideFields.searchRadius) || 100
        }

        // Vehicle overrides
        if (overrideFields.year) requestBody.overrides.vehicle.year = parseInt(overrideFields.year)
        if (overrideFields.make) requestBody.overrides.vehicle.make = overrideFields.make
        if (overrideFields.model) requestBody.overrides.vehicle.model = overrideFields.model
        if (overrideFields.trim) requestBody.overrides.vehicle.trim = overrideFields.trim
        if (overrideFields.mileage) requestBody.overrides.vehicle.mileage = parseInt(overrideFields.mileage)

        // Location overrides
        if (overrideFields.zipCode) requestBody.overrides.location.zip = overrideFields.zipCode
        if (overrideFields.latitude) requestBody.overrides.location.latitude = parseFloat(overrideFields.latitude)
        if (overrideFields.longitude) requestBody.overrides.location.longitude = parseFloat(overrideFields.longitude)
        if (overrideFields.cityState) requestBody.overrides.location.cityState = overrideFields.cityState
        if (overrideFields.dataforseoLocationCode) requestBody.overrides.location.dataforseoLocationCode = parseInt(overrideFields.dataforseoLocationCode)
      }

      const response = await fetch('/api/analytics/market-trend-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
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

  const resetOverrides = () => {
    setOverrideFields({
      year: '',
      make: '',
      model: '',
      trim: '',
      mileage: '',
      currentPrice: '',
      zipCode: '',
      latitude: '',
      longitude: '',
      cityState: '',
      dataforseoLocationCode: '',
      searchRadius: '100'
    })
    setManualVin('')
  }

  // Auto-run functionality when coming from inventory page
  useEffect(() => {
    const vin = searchParams.get('vin')
    const price = searchParams.get('price')
    const locationId = searchParams.get('locationId')
    const autoRun = searchParams.get('autoRun')
    
    if (autoRun === 'true' && vin && !hasAutoRun && !loading && !report) {
      setHasAutoRun(true)
      
      // Set manual VIN
      setManualVin(vin)
      
      // Set current price if provided
      if (price) {
        setOverrideFields(prev => ({
          ...prev,
          currentPrice: price
        }))
      }
      
      // Set selected vehicle with location if provided
      if (locationId) {
        setSelectedVehicle({
          vin: vin,
          price: price ? parseFloat(price) : undefined,
          locationId: locationId
        })
      }
    }
  }, [searchParams, hasAutoRun, loading, report])

  // Trigger report generation when state is ready
  useEffect(() => {
    if (hasAutoRun && manualVin && !loading && !report) {
      generateReport()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAutoRun, manualVin, loading, report])

  return (
    <div className="min-h-screen bg-[#141414]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">Market Trend Report</h1>
          <p className="text-gray-400 mt-2">
            Comprehensive market analysis using real-time data from Market Check
          </p>
        </div>

      {/* Vehicle Selection */}
      <Card className="bg-[#1f1f1f] border border-[#2a2a2a] transition-all duration-200 ease hover:bg-[#2a2a2a]/50">
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
              <p className="text-xs sm:text-sm text-[#a3a3a3]">Selected Vehicle:</p>
              <p className="text-sm sm:text-base text-white font-medium">
                {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model} {selectedVehicle.trim || ''}
              </p>
              <div className="mt-1 space-y-0.5">
                <p className="text-xs sm:text-sm text-[#737373]">VIN: {selectedVehicle.vin}</p>
                <p className="text-xs sm:text-sm text-[#737373]">Current Price: ${selectedVehicle.price.toLocaleString()}</p>
              </div>
            </div>
          )}

          {/* Manual Override Toggle */}
          <div className="flex items-center justify-between p-3 bg-[#141414] rounded-lg border border-[#2a2a2a]">
            <div className="flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-[#3b82f6]" />
              <span className="text-sm font-medium text-white">Manual Override</span>
              <Badge variant="outline" className="text-xs">Advanced</Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowManualOverride(!showManualOverride)}
              className="text-[#3b82f6] hover:text-[#2563eb]"
            >
              {showManualOverride ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>

          {/* Manual Override Form */}
          {showManualOverride && (
            <div className="space-y-4 p-4 bg-[#141414] rounded-lg border border-[#2a2a2a]">
              {/* Manual VIN Entry */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-white">Manual VIN Entry</label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetOverrides}
                    className="text-[#737373] hover:text-white"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Reset All
                  </Button>
                </div>
                <input
                  type="text"
                  value={manualVin}
                  onChange={(e) => setManualVin(e.target.value.toUpperCase())}
                  placeholder="Enter any VIN (e.g., 1HGCM82633A123456)"
                  className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white placeholder-[#737373] focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/20 focus:outline-none transition-all duration-200"
                />
                <p className="text-xs text-[#737373]">Override selected vehicle with any VIN, even if not in inventory</p>
              </div>

              {/* Vehicle Information Overrides */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-white flex items-center gap-2">
                  Vehicle Information
                  <span className="text-xs text-[#737373] font-normal">Leave blank to use defaults</span>
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[#737373] mb-1 block">Year</label>
                    <input
                      type="text"
                      value={overrideFields.year}
                      onChange={(e) => setOverrideFields({...overrideFields, year: e.target.value})}
                      placeholder="e.g., 2023"
                      className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white placeholder-[#737373] focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/20 focus:outline-none transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#737373] mb-1 block">Make</label>
                    <input
                      type="text"
                      value={overrideFields.make}
                      onChange={(e) => setOverrideFields({...overrideFields, make: e.target.value})}
                      placeholder="e.g., Toyota"
                      className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white placeholder-[#737373] focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/20 focus:outline-none transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#737373] mb-1 block">Model</label>
                    <input
                      type="text"
                      value={overrideFields.model}
                      onChange={(e) => setOverrideFields({...overrideFields, model: e.target.value})}
                      placeholder="e.g., Camry"
                      className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white placeholder-[#737373] focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/20 focus:outline-none transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#737373] mb-1 block">Trim</label>
                    <input
                      type="text"
                      value={overrideFields.trim}
                      onChange={(e) => setOverrideFields({...overrideFields, trim: e.target.value})}
                      placeholder="e.g., LE"
                      className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white placeholder-[#737373] focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/20 focus:outline-none transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#737373] mb-1 block">Mileage</label>
                    <input
                      type="text"
                      value={overrideFields.mileage}
                      onChange={(e) => setOverrideFields({...overrideFields, mileage: e.target.value})}
                      placeholder="e.g., 25000"
                      className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white placeholder-[#737373] focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/20 focus:outline-none transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#737373] mb-1 block">Current Price</label>
                    <input
                      type="text"
                      value={overrideFields.currentPrice}
                      onChange={(e) => setOverrideFields({...overrideFields, currentPrice: e.target.value})}
                      placeholder="e.g., 25000"
                      className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white placeholder-[#737373] focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/20 focus:outline-none transition-all duration-200"
                    />
                  </div>
                </div>
              </div>

              {/* Location Overrides */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-white flex items-center gap-2">
                  Location Settings
                  <span className="text-xs text-[#737373] font-normal">Override market analysis location</span>
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[#737373] mb-1 block">ZIP Code</label>
                    <input
                      type="text"
                      value={overrideFields.zipCode}
                      onChange={(e) => setOverrideFields({...overrideFields, zipCode: e.target.value})}
                      placeholder="e.g., 89101"
                      className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white placeholder-[#737373] focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/20 focus:outline-none transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#737373] mb-1 block">City, State</label>
                    <input
                      type="text"
                      value={overrideFields.cityState}
                      onChange={(e) => setOverrideFields({...overrideFields, cityState: e.target.value})}
                      placeholder="e.g., Las Vegas, NV"
                      className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white placeholder-[#737373] focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/20 focus:outline-none transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#737373] mb-1 block">Latitude</label>
                    <input
                      type="text"
                      value={overrideFields.latitude}
                      onChange={(e) => setOverrideFields({...overrideFields, latitude: e.target.value})}
                      placeholder="e.g., 36.1699"
                      className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white placeholder-[#737373] focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/20 focus:outline-none transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#737373] mb-1 block">Longitude</label>
                    <input
                      type="text"
                      value={overrideFields.longitude}
                      onChange={(e) => setOverrideFields({...overrideFields, longitude: e.target.value})}
                      placeholder="e.g., -115.1398"
                      className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white placeholder-[#737373] focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/20 focus:outline-none transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#737373] mb-1 block">DataForSEO Location Code</label>
                    <input
                      type="text"
                      value={overrideFields.dataforseoLocationCode}
                      onChange={(e) => setOverrideFields({...overrideFields, dataforseoLocationCode: e.target.value})}
                      placeholder="e.g., 9057131"
                      className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white placeholder-[#737373] focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/20 focus:outline-none transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#737373] mb-1 block">Search Radius (miles)</label>
                    <input
                      type="text"
                      value={overrideFields.searchRadius}
                      onChange={(e) => setOverrideFields({...overrideFields, searchRadius: e.target.value})}
                      placeholder="e.g., 100"
                      className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white placeholder-[#737373] focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/20 focus:outline-none transition-all duration-200"
                    />
                  </div>
                </div>
              </div>

              {/* Override Summary */}
              {(manualVin || Object.values(overrideFields).some(v => v)) && (
                <div className="p-3 bg-[#0a0a0a] rounded-lg border border-[#3b82f6]/20">
                  <p className="text-xs text-[#3b82f6] font-medium mb-1">Active Overrides:</p>
                  <div className="text-xs text-[#737373] space-y-0.5">
                    {manualVin && <p>• Manual VIN: {manualVin}</p>}
                    {overrideFields.year && <p>• Year: {overrideFields.year}</p>}
                    {overrideFields.make && <p>• Make: {overrideFields.make}</p>}
                    {overrideFields.model && <p>• Model: {overrideFields.model}</p>}
                    {overrideFields.currentPrice && <p>• Price: ${overrideFields.currentPrice}</p>}
                    {overrideFields.zipCode && <p>• ZIP: {overrideFields.zipCode}</p>}
                    {overrideFields.cityState && <p>• Location: {overrideFields.cityState}</p>}
                  </div>
                </div>
              )}
            </div>
          )}

          <Button 
            onClick={generateReport}
            disabled={(!selectedVehicle && !manualVin) || loading}
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

      {/* Loading State */}
      {loading && !report && (
        <div className="mt-8 flex flex-col items-center justify-center py-16">
          <div className="relative">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-[#2a2a2a] border-t-[#3b82f6]"></div>
            <Loader2 className="absolute top-1/2 left-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 text-[#3b82f6] animate-pulse" />
          </div>
          <p className="mt-4 text-lg font-medium text-white">Analyzing Market Data</p>
          <p className="mt-2 text-sm text-[#737373]">This may take a few moments...</p>
        </div>
      )}

      {/* Report Display */}
      {report && !loading && (
        <>
          {/* Summary Dashboard */}
          {report.marketPosition && report.inventoryAnalysis && (
            <SummaryDashboardStrip
              currentPrice={report.vehicle.currentPrice}
              marketPrice={report.marketPosition.predictedPrice}
              daysOnMarket={report.inventoryAnalysis.marketDaySupply}
              demandLevel={
                report.inventoryAnalysis.scarcityScore >= 70 ? 'high' :
                report.inventoryAnalysis.scarcityScore >= 40 ? 'medium' : 'low'
              }
            />
          )}

          {/* Opportunity Score */}
          {report.opportunityScore && (
            <OpportunityScoreStrip
              score={report.opportunityScore.overall}
              breakdown={report.opportunityScore.breakdown}
              recommendation={report.recommendations?.action || 'REVIEW: Consider current market conditions'}
            />
          )}

          {/* Market Analysis Grid - Price Analysis and Regional Performance */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Price Analysis */}
            {report.marketPosition && !report.marketPosition.error && (
              <Card className="bg-[#1f1f1f] border border-[#2a2a2a] transition-all duration-200 ease hover:bg-[#2a2a2a]/50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <DollarSign className="h-5 w-5 text-[#3b82f6]" />
                    Price Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-[#737373] uppercase mb-1">Predicted Market Price</p>
                      <p className="text-xl sm:text-2xl font-bold text-white">
                        ${report.marketPosition.predictedPrice.toLocaleString()}
                      </p>
                      <p className="text-xs text-[#737373] mt-1">
                        ${report.marketPosition.priceRange.lower.toLocaleString()} - 
                        ${report.marketPosition.priceRange.upper.toLocaleString()}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-xs text-[#737373] uppercase mb-1">Current Position</p>
                      <div className="flex flex-wrap items-baseline gap-2">
                        <span className="text-xl sm:text-2xl font-bold text-white">
                          ${report.marketPosition.currentPrice.toLocaleString()}
                        </span>
                        <Badge variant={report.marketPosition.percentile > 70 ? 'destructive' : 
                                       report.marketPosition.percentile < 30 ? 'default' : 'secondary'}
                               className="text-xs">
                          {report.marketPosition.percentile}th %ile
                        </Badge>
                      </div>
                      <p className="text-xs text-[#737373] mt-1 line-clamp-2">
                        {report.marketPosition.recommendation}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Regional Performance */}
            {report.regionalPerformance && (
              <Card className="bg-[#1f1f1f] border border-[#2a2a2a] transition-all duration-200 ease hover:bg-[#2a2a2a]/50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Clock className="h-5 w-5 text-[#3b82f6]" />
                    Regional Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
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
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <p className="text-2xl font-bold text-white">
                            {report.regionalPerformance.citySalesCount}
                          </p>
                          <span className="text-sm text-[#737373]">units sold</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {getTrendIcon(report.regionalPerformance.salesTrend)}
                          <span className="text-sm text-[#a3a3a3]">
                            {report.regionalPerformance.salesTrend}
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-[#141414] rounded-lg p-3">
                          <p className="text-xs text-[#737373] uppercase">Avg Price</p>
                          <p className="text-lg font-semibold text-white">
                            ${report.regionalPerformance.avgPrice.toLocaleString()}
                          </p>
                        </div>
                        <div className="bg-[#141414] rounded-lg p-3">
                          <p className="text-xs text-[#737373] uppercase">Avg DOM</p>
                          <p className="text-lg font-semibold text-white">
                            {report.regionalPerformance.avgDaysOnMarket} days
                          </p>
                        </div>
                      </div>
                      
                      {report.regionalPerformance.topColors && report.regionalPerformance.topColors.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs text-[#737373] uppercase mb-2">Popular Colors</p>
                          <div className="flex flex-wrap gap-1">
                            {report.regionalPerformance.topColors.slice(0, 3).map((color, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
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
          </div>

          {/* Inventory and Competitive Landscape Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Inventory Analysis - Takes 1 column */}
            {report.inventoryAnalysis && !report.inventoryAnalysis.error && (
              <Card className="md:col-span-1 bg-[#1f1f1f] border border-[#2a2a2a] transition-all duration-200 ease hover:bg-[#2a2a2a]/50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Package className="h-5 w-5 text-[#3b82f6]" />
                    Inventory
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center">
                    <MetricGauge
                      value={report.inventoryAnalysis.scarcityScore}
                      label="Scarcity Score"
                      size="md"
                    />
                    <Badge 
                      variant={getScoreBadgeVariant(report.inventoryAnalysis.scarcityScore)}
                      className="mt-2 text-xs"
                    >
                      {report.inventoryAnalysis.scarcityScore >= 70 ? 'High Demand' :
                       report.inventoryAnalysis.scarcityScore >= 40 ? 'Moderate' : 'Low Demand'}
                    </Badge>
                    
                    <div className="grid grid-cols-2 gap-4 mt-4 w-full text-center">
                      <div>
                        <p className="text-xl font-semibold text-white">
                          {report.inventoryAnalysis.marketDaySupply}
                        </p>
                        <p className="text-xs text-[#737373]">Day Supply</p>
                      </div>
                      <div>
                        <p className="text-xl font-semibold text-white">
                          {report.inventoryAnalysis.inventoryCount}
                        </p>
                        <p className="text-xs text-[#737373]">Available</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Competitive Landscape - Takes 2 columns */}
            {report.competitiveLandscape && !report.competitiveLandscape.error && (
              <Card className="md:col-span-2 bg-[#1f1f1f] border border-[#2a2a2a] transition-all duration-200 ease hover:bg-[#2a2a2a]/50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-lg">
                    <span>Competitive Landscape</span>
                    <Badge variant="outline" className="text-xs font-normal">
                      {report.competitiveLandscape.totalNearbyInventory} nearby
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-[#737373] uppercase">Avg Competitor Price</p>
                      <Badge variant={
                        report.competitiveLandscape.pricePosition === 'above' ? 'destructive' :
                        report.competitiveLandscape.pricePosition === 'below' ? 'default' : 'secondary'
                      } className="text-xs">
                        {report.competitiveLandscape.pricePosition} market
                      </Badge>
                    </div>
                    <p className="text-2xl font-bold text-white">
                      ${report.competitiveLandscape.avgCompetitorPrice.toLocaleString()}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-[#737373] uppercase mb-3">Top Competitors</p>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
                      {report.competitiveLandscape.similarVehicles.slice(0, 3).map((vehicle, index) => (
                        <CompetitorCard
                          key={index}
                          distance={vehicle.distance}
                          price={vehicle.price}
                          dealer={vehicle.dealer}
                          daysOnMarket={vehicle.daysOnMarket}
                          vdpUrl={vehicle.vdpUrl}
                          currentPrice={report.vehicle.currentPrice}
                          rank={index + 1}
                        />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Demand Analysis - DataForSEO Keywords */}
          {report.demandAnalysis && (
            <Card className="bg-[#1f1f1f] border border-[#2a2a2a] transition-all duration-200 ease hover:bg-[#2a2a2a]/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Search className="h-5 w-5 text-[#3b82f6]" />
                  Local Search Demand Analysis
                  <Badge variant="outline" className="ml-2 text-xs">
                    {report.demandAnalysis.locationName}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {report.demandAnalysis.error ? (
                  <div className="py-4 text-center">
                    <AlertCircle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                    <p className="text-sm text-yellow-400">{report.demandAnalysis.error}</p>
                    {report.demandAnalysis.note && (
                      <p className="text-xs text-[#737373] mt-2">{report.demandAnalysis.note}</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Total Search Volume */}
                    <div className="bg-[#141414] rounded-lg p-4 border border-[#2a2a2a]">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-[#737373] uppercase">Total Monthly Searches</p>
                        <Badge variant={
                          report.demandAnalysis.demandLevel === 'high' ? 'default' :
                          report.demandAnalysis.demandLevel === 'medium' ? 'secondary' : 'outline'
                        }>
                          {report.demandAnalysis.demandLevel} demand
                        </Badge>
                      </div>
                      <p className="text-3xl font-bold text-white">
                        {report.demandAnalysis.totalMonthlySearches.toLocaleString()}
                      </p>
                      <p className="text-xs text-[#737373] mt-1">
                        searches/month in {report.demandAnalysis.locationName}
                      </p>
                    </div>

                    {/* Top Keywords */}
                    {report.demandAnalysis.topKeywords && report.demandAnalysis.topKeywords.length > 0 && (
                      <div>
                        <p className="text-xs text-[#737373] uppercase mb-3">Top Search Keywords</p>
                        <div className="space-y-2">
                          {report.demandAnalysis.topKeywords.map((keyword, index) => (
                            <div key={index} className="bg-[#141414] rounded-lg p-3 border border-[#2a2a2a] hover:bg-[#1a1a1a] transition-all duration-200">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <p className="text-sm text-white font-medium">{keyword.keyword}</p>
                                  <div className="flex items-center gap-4 mt-1">
                                    <span className="text-xs text-[#737373]">
                                      {keyword.monthlySearches.toLocaleString()} searches/mo
                                    </span>
                                    <span className="text-xs text-[#737373]">
                                      Competition: {(keyword.competition * 100).toFixed(0)}%
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  {[...Array(5)].map((_, i) => (
                                    <div
                                      key={i}
                                      className={`h-1.5 w-1.5 rounded-full ${
                                        i < Math.ceil(keyword.monthlySearches / 200) 
                                          ? 'bg-[#3b82f6]' 
                                          : 'bg-[#2a2a2a]'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Search Trend */}
                    {report.demandAnalysis.searchTrend && (
                      <div className="flex items-center justify-between bg-[#141414] rounded-lg p-3 border border-[#2a2a2a]">
                        <span className="text-xs text-[#737373] uppercase">Search Trend</span>
                        <div className="flex items-center gap-2">
                          {getTrendIcon(report.demandAnalysis.searchTrend)}
                          <span className="text-sm text-[#a3a3a3]">
                            {report.demandAnalysis.searchTrend}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {report.recommendations && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#3b82f6]" />
                Recommended Actions
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <ActionCard
                  icon={DollarSign}
                  title="Pricing Strategy"
                  description={report.recommendations.pricing}
                  impact={report.opportunityScore?.breakdown.priceCompetitiveness && report.opportunityScore.breakdown.priceCompetitiveness >= 80 ? 'low' : 
                          report.opportunityScore?.breakdown.priceCompetitiveness && report.opportunityScore.breakdown.priceCompetitiveness >= 50 ? 'medium' : 'high'}
                  priority={1}
                />
                <ActionCard
                  icon={Package}
                  title="Inventory Management"
                  description={report.recommendations.inventory}
                  impact={report.inventoryAnalysis?.scarcityScore && report.inventoryAnalysis.scarcityScore >= 70 ? 'high' : 'medium'}
                  priority={2}
                />
                <ActionCard
                  icon={Clock}
                  title="Market Timing"
                  description={report.recommendations.timing}
                  impact={report.opportunityScore?.breakdown.marketTiming && report.opportunityScore.breakdown.marketTiming >= 70 ? 'high' : 'medium'}
                  priority={3}
                />
                <ActionCard
                  icon={Zap}
                  title="Next Action"
                  description={report.recommendations.action}
                  impact="high"
                  priority={1}
                />
              </div>
            </div>
          )}
        </>
      )}
      </div>
    </div>
  )
}