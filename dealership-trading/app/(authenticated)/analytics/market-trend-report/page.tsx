'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, TrendingUp, TrendingDown, Minus, Loader2, FileText, DollarSign, Package, Clock, Target, Zap, TrendingUpIcon, Users, BarChart3, Search, Settings2, ChevronDown, ChevronUp, RotateCcw, Bot, Sparkles, MessageSquare, Bug, Copy, Eye, EyeOff, Info, Check, HelpCircle, Car } from 'lucide-react'
import VehicleSearchInput from '@/components/analytics/VehicleSearchInput'
import { useDealershipLocations } from '@/lib/hooks/useDealershipLocations'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import OpportunityScoreStrip from '@/components/analytics/OpportunityScoreStrip'
import SummaryDashboardStrip from '@/components/analytics/SummaryDashboardStrip'
import MetricGauge from '@/components/analytics/MetricGauge'
import CompetitorCard from '@/components/analytics/CompetitorCard'
import ActionCard from '@/components/analytics/ActionCard'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'

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
    vehiclesByDealer?: Record<string, Array<{
      vin: string
      distance: number
      price: number
      dealer: string
      daysOnMarket: number
      year: number
      make: string
      model: string
      vdpUrl?: string
    }>>
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
  demandAnalysis?: {
    totalMonthlySearches: number
    locationName: string
    demandLevel: string
    searchTrend?: string
    topKeywords?: Array<{
      keyword: string
      monthlySearches: number
      competition: number
    }>
    error?: string
    note?: string
    raw?: any
  }
}

interface AISetting {
  id: string
  name: string
  description: string
  model: string
}

interface AIAnalysis {
  analysis: string | any
  metadata: {
    model: string
    temperature: number
    timestamp: string
    aiSetting?: {
      id: string
      name: string
      description: string
    }
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
  const [showHowToUse, setShowHowToUse] = useState(false)
  
  // AI Analysis states
  const [showAIAnalysis, setShowAIAnalysis] = useState(false)
  const [aiSettings, setAiSettings] = useState<AISetting[]>([])
  const [selectedAISetting, setSelectedAISetting] = useState<string>('')
  const [customPrompt, setCustomPrompt] = useState('')
  const [useCustomPrompt, setUseCustomPrompt] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  
  // Debug states
  const [debugMode, setDebugMode] = useState(false)
  const [showDebugData, setShowDebugData] = useState(false)
  const [lastRequestData, setLastRequestData] = useState<any>(null)
  const [autoRunAnalysis, setAutoRunAnalysis] = useState(false) // New state for auto-run preference
  
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
    // Search parameters
    searchRadius: '100'
  })
  const [hasAutoRun, setHasAutoRun] = useState(false)
  const [showDemandDebug, setShowDemandDebug] = useState(false)

  // Fetch AI settings when component mounts
  useEffect(() => {
    fetchAISettings()
  }, [])

  const fetchAISettings = async () => {
    try {
      const response = await fetch('/api/admin/ai-settings')
      const data = await response.json()
      
      if (data.success && data.data) {
        const activeSettings = data.data.filter((s: any) => s.is_active)
        setAiSettings(activeSettings)
        
        // Set default setting
        const defaultSetting = activeSettings.find((s: any) => s.is_default)
        if (defaultSetting) {
          setSelectedAISetting(defaultSetting.id)
        }
      }
    } catch (error) {
      console.error('Failed to fetch AI settings:', error)
    }
  }

  const runAIAnalysis = async () => {
    if (!report) return

    setAiLoading(true)
    setAiAnalysis(null)

    try {
      // First, regenerate the report with raw data for unbiased AI analysis
      const reportRequestBody: any = {
        vin: manualVin || selectedVehicle?.vin,
        currentPrice: overrideFields.currentPrice ? parseFloat(overrideFields.currentPrice) : selectedVehicle?.price,
        locationId: selectedVehicle?.locationId,
        includeRawData: true // This is the key - get raw data without bias
      }

      // Add overrides if manual override is enabled
      if (showManualOverride) {
        reportRequestBody.overrides = {
          vehicle: {},
          location: {},
          searchRadius: parseInt(overrideFields.searchRadius) || 100
        }

        // Vehicle overrides
        if (overrideFields.year) reportRequestBody.overrides.vehicle.year = parseInt(overrideFields.year)
        if (overrideFields.make) reportRequestBody.overrides.vehicle.make = overrideFields.make
        if (overrideFields.model) reportRequestBody.overrides.vehicle.model = overrideFields.model
        if (overrideFields.trim) reportRequestBody.overrides.vehicle.trim = overrideFields.trim
        if (overrideFields.mileage) reportRequestBody.overrides.vehicle.mileage = parseInt(overrideFields.mileage)

        // Location overrides
        if (overrideFields.zipCode) reportRequestBody.overrides.location.zip = overrideFields.zipCode
        if (overrideFields.latitude) reportRequestBody.overrides.location.latitude = parseFloat(overrideFields.latitude)
        if (overrideFields.longitude) reportRequestBody.overrides.location.longitude = parseFloat(overrideFields.longitude)
        if (overrideFields.cityState) reportRequestBody.overrides.location.cityState = overrideFields.cityState
      }

      // Regenerate report with raw data
      const reportResponse = await fetch('/api/analytics/market-trend-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportRequestBody)
      })

      const reportResult = await reportResponse.json()
      
      if (!reportResponse.ok) {
        throw new Error(reportResult.error || 'Failed to generate raw data report for AI analysis')
      }

      const rawDataReport = reportResult.data

      // Now send the raw data report to AI analysis
      const userPrompt = useCustomPrompt ? customPrompt : getDefaultPromptForSetting()
      const selectedSettingDetails = aiSettings.find(s => s.id === selectedAISetting)
      
      const requestBody: any = {
        reportData: rawDataReport, // Use raw data report instead of biased report
        userPrompt: userPrompt
      }

      // Add AI setting ID if not using custom prompt
      if (!useCustomPrompt && selectedAISetting) {
        requestBody.aiSettingId = selectedAISetting
      }

      // Add custom system prompt if using custom prompt
      if (useCustomPrompt && customPrompt) {
        requestBody.userPrompt = customPrompt
      }

      // Capture debug data
      const debugData = {
        timestamp: new Date().toISOString(),
        requestBody,
        selectedSetting: selectedSettingDetails,
        usingRawData: true,
        reportDataSummary: {
          vehicle: rawDataReport.vehicle,
          hasMarketPosition: !!rawDataReport.marketPosition && !rawDataReport.marketPosition.error,
          hasInventoryAnalysis: !!rawDataReport.inventoryAnalysis && !rawDataReport.inventoryAnalysis.error,
          hasRegionalPerformance: !!rawDataReport.regionalPerformance && !rawDataReport.regionalPerformance.error,
          hasCompetitiveLandscape: !!rawDataReport.competitiveLandscape && !rawDataReport.competitiveLandscape.error,
          hasDemandAnalysis: !!rawDataReport.demandAnalysis && !rawDataReport.demandAnalysis.error,
          hasRawData: !!rawDataReport.marketPosition?.raw || !!rawDataReport.inventoryAnalysis?.raw,
          noBiasedScores: !rawDataReport.opportunityScore && !rawDataReport.recommendations
        }
      }
      
      setLastRequestData(debugData)

      // Console logging if debug mode is enabled
      if (debugMode) {
        console.group('🤖 AI Analysis Debug')
        console.log('🔄 Using Raw Data (unbiased):', true)
        console.log('📊 Raw Report Data:', rawDataReport)
        console.log('🎯 Request Body:', requestBody)
        console.log('⚙️ Selected AI Setting:', selectedSettingDetails)
        console.log('💬 User Prompt:', userPrompt)
        console.log('📝 Report Summary:', debugData.reportDataSummary)
        console.log('✅ No Biased Scores:', debugData.reportDataSummary.noBiasedScores)
        console.groupEnd()
      }

      const response = await fetch('/api/analytics/market-trend-report/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to analyze report')
      }

      setAiAnalysis(result.data)
      setShowAIAnalysis(true)
      
      // Log successful response in debug mode
      if (debugMode) {
        console.log('✅ AI Response:', result.data)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to run AI analysis')
      if (debugMode) {
        console.error('❌ AI Analysis Error:', err)
      }
    } finally {
      setAiLoading(false)
    }
  }

  const getDefaultPromptForSetting = () => {
    const setting = aiSettings.find(s => s.id === selectedAISetting)
    
    // Default prompts based on AI setting type
    if (setting?.name.includes('Aggressive')) {
      return 'What aggressive pricing and promotional strategies should I implement to sell this vehicle within 7 days? Be specific with price points and tactics.'
    } else if (setting?.name.includes('Premium')) {
      return 'How can I position this vehicle to maximize profit margins? What premium features or unique aspects justify a higher price point?'
    } else {
      return 'Provide a comprehensive analysis with your top 3 recommendations for this vehicle. Include specific pricing guidance and expected time to sell.'
    }
  }

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

      // Always check for override values (whether manual override is shown or not)
      const hasAnyOverrides = Object.values(overrideFields).some(v => v && v !== '100') // Exclude default searchRadius
      
      if (hasAnyOverrides || showManualOverride) {
        requestBody.overrides = {
          vehicle: {},
          location: {},
          searchRadius: parseInt(overrideFields.searchRadius) || 100
        }

        // Vehicle overrides - use override values if they exist
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
            AI-powered market analysis to help you price competitively and identify sales opportunities
          </p>
        </div>
        
        {/* Welcome Section */}
        <Card className="bg-gradient-to-r from-blue-950/20 to-blue-900/10 border border-blue-800/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Info className="h-5 w-5 text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-white mb-1">What this report provides:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-300">
                  <div className="flex items-center gap-2">
                    <Check className="h-3 w-3 text-green-400 flex-shrink-0" />
                    <span>Competitive pricing recommendations based on similar vehicles</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-3 w-3 text-green-400 flex-shrink-0" />
                    <span>Local search demand and trending keywords</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-3 w-3 text-green-400 flex-shrink-0" />
                    <span>Competitor inventory and pricing analysis</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-3 w-3 text-green-400 flex-shrink-0" />
                    <span>Market timing and opportunity scoring</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* How to Use Section */}
        <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#2a2a2a]">
          <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowHowToUse(!showHowToUse)}>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-[#3b82f6]" />
              How to Use This Report
            </h3>
            {showHowToUse ? <ChevronUp className="h-4 w-4 text-[#737373]" /> : <ChevronDown className="h-4 w-4 text-[#737373]" />}
          </div>
          {showHowToUse && (
            <div className="mt-3 space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-[#3b82f6] rounded-full flex items-center justify-center text-xs font-bold text-white">1</div>
                <div>
                  <p className="text-sm font-medium text-white">Search for a vehicle</p>
                  <p className="text-xs text-[#737373]">Use VIN, stock number, or year/make/model from your inventory</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-[#3b82f6] rounded-full flex items-center justify-center text-xs font-bold text-white">2</div>
                <div>
                  <p className="text-sm font-medium text-white">(Optional) Customize settings</p>
                  <p className="text-xs text-[#737373]">Analyze vehicles not in inventory or different market locations</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-[#3b82f6] rounded-full flex items-center justify-center text-xs font-bold text-white">3</div>
                <div>
                  <p className="text-sm font-medium text-white">Generate analysis</p>
                  <p className="text-xs text-[#737373]">Get comprehensive market insights in 15-30 seconds</p>
                </div>
              </div>
            </div>
          )}
        </div>

      {/* Vehicle Selection */}
      <Card className="bg-[#1f1f1f] border border-[#2a2a2a] transition-all duration-200 ease hover:bg-[#2a2a2a]/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5 text-[#3b82f6]" />
            Select Vehicle for Analysis
          </CardTitle>
          <CardDescription>
            Search for a vehicle in your inventory to generate a comprehensive market analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <VehicleSearchInput
            label="Search for a vehicle"
            placeholder="Enter VIN (17 chars), Stock #, or Year/Make/Model"
            onVehicleSelect={async (vehicle) => {
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
              
              // Auto-populate override fields with vehicle data
              setOverrideFields(prev => ({
                ...prev,
                year: vehicle.year?.toString() || '',
                make: vehicle.make || '',
                model: vehicle.model || '',
                trim: vehicle.trim || '',
                mileage: vehicle.mileage?.toString() || '',
                currentPrice: vehicle.price?.toString() || ''
              }))
              
              // Note: Location data will be fetched by the backend when locationId is provided
              // Users can manually override location data in the form if needed
              
              setReport(null) // Clear previous report
            }}
          />
          <p className="text-xs text-[#737373] -mt-2">
            <span className="font-medium">Examples:</span> 1HGCM82633A123456, MP12345, or 2023 Toyota Camry
          </p>
          
          {selectedVehicle && (
            <div className="p-4 bg-[#141414] rounded-lg border border-[#2a2a2a] transition-all duration-200 ease">
              <p className="text-xs sm:text-sm text-[#a3a3a3]">Selected Vehicle:</p>
              <p className="text-sm sm:text-base text-white font-medium">
                {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model} {selectedVehicle.trim || ''}
              </p>
              <div className="mt-1 space-y-0.5">
                <p className="text-xs sm:text-sm text-[#737373]">VIN: {selectedVehicle.vin}</p>
                <p className="text-xs sm:text-sm text-[#737373]">Current Price: ${selectedVehicle.price?.toLocaleString() || 'N/A'}</p>
              </div>
            </div>
          )}

          {/* Custom Analysis Settings Toggle */}
          <div className="flex items-center justify-between p-3 bg-[#141414] rounded-lg border border-[#2a2a2a]">
            <div className="flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-[#3b82f6]" />
              <span className="text-sm font-medium text-white">Custom Analysis Settings</span>
              <Badge variant="outline" className="text-xs">Optional</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#737373]">Analyze vehicles not in inventory or different markets</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowManualOverride(!showManualOverride)}
                className="text-[#3b82f6] hover:text-[#2563eb]"
              >
                {showManualOverride ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Manual Override Form */}
          {showManualOverride && (
            <div className="space-y-4 p-4 bg-[#141414] rounded-lg border border-[#2a2a2a]">
              {/* Manual VIN Entry */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-white">Manual VIN Entry</label>
                    <div className="group relative">
                      <HelpCircle className="h-3.5 w-3.5 text-[#737373] hover:text-[#3b82f6] cursor-help" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50">
                        <div className="bg-[#2a2a2a] text-white text-xs rounded-lg p-3 max-w-xs whitespace-normal">
                          <p className="font-semibold mb-1">When to use:</p>
                          <ul className="list-disc list-inside space-y-1 text-[#a3a3a3]">
                            <li>Analyzing competitor vehicles</li>
                            <li>Evaluating potential acquisitions</li>
                            <li>Checking market before adding to inventory</li>
                          </ul>
                          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-2">
                            <div className="border-4 border-transparent border-t-[#2a2a2a]"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
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
                <p className="text-xs text-[#737373]">Analyze any vehicle by VIN, even if not in your inventory</p>
              </div>

              {/* Vehicle Information Overrides */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-white flex items-center gap-2">
                  Vehicle Information
                  <div className="group relative">
                    <HelpCircle className="h-3.5 w-3.5 text-[#737373] hover:text-[#3b82f6] cursor-help" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50">
                      <div className="bg-[#2a2a2a] text-white text-xs rounded-lg p-3 max-w-xs whitespace-normal">
                        <p>Override these fields if the vehicle is not in your inventory or if you want to test different configurations</p>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-2">
                          <div className="border-4 border-transparent border-t-[#2a2a2a]"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-[#737373] font-normal">Leave blank to use detected values</span>
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
                  <div className="group relative">
                    <HelpCircle className="h-3.5 w-3.5 text-[#737373] hover:text-[#3b82f6] cursor-help" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50">
                      <div className="bg-[#2a2a2a] text-white text-xs rounded-lg p-3 max-w-xs whitespace-normal">
                        <p className="font-semibold mb-1">Use different location to:</p>
                        <ul className="list-disc list-inside space-y-1 text-[#a3a3a3]">
                          <li>Analyze market in different regions</li>
                          <li>Check demand before transferring vehicles</li>
                          <li>Compare prices across markets</li>
                        </ul>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-2">
                          <div className="border-4 border-transparent border-t-[#2a2a2a]"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-[#737373] font-normal">Default uses vehicle&apos;s dealership location</span>
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
            className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white transition-all duration-200 ease hover:transform hover:-translate-y-0.5 hover:shadow-lg h-12"
          >
            {loading ? (
              <div className="flex flex-col items-center">
                <div className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span className="font-medium">Analyzing Market Data...</span>
                </div>
                <span className="text-xs opacity-80">This typically takes 15-30 seconds</span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <span className="font-medium">Analyze Vehicle</span>
                <span className="text-xs opacity-80">Generate comprehensive market report</span>
              </div>
            )}
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
        <Card className="bg-[#1f1f1f] border border-[#2a2a2a]">
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center">
              <div className="relative">
                <div className="h-16 w-16 animate-spin rounded-full border-4 border-[#2a2a2a] border-t-[#3b82f6]"></div>
                <Loader2 className="absolute top-1/2 left-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 text-[#3b82f6] animate-pulse" />
              </div>
              <p className="mt-4 text-lg font-medium text-white">Analyzing Market Data</p>
              <div className="mt-4 space-y-2 text-center">
                <p className="text-sm text-[#737373] animate-pulse">• Fetching competitive pricing data...</p>
                <p className="text-sm text-[#737373] animate-pulse delay-100">• Analyzing local search demand...</p>
                <p className="text-sm text-[#737373] animate-pulse delay-200">• Comparing similar vehicles...</p>
                <p className="text-sm text-[#737373] animate-pulse delay-300">• Calculating opportunity score...</p>
              </div>
            </div>
          </CardContent>
        </Card>
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
                        ${report.marketPosition.predictedPrice?.toLocaleString() || 'N/A'}
                      </p>
                      <p className="text-xs text-[#737373] mt-1">
                        ${report.marketPosition.priceRange?.lower?.toLocaleString() || 'N/A'} - 
                        ${report.marketPosition.priceRange?.upper?.toLocaleString() || 'N/A'}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-xs text-[#737373] uppercase mb-1">Current Position</p>
                      <div className="flex flex-wrap items-baseline gap-2">
                        <span className="text-xl sm:text-2xl font-bold text-white">
                          ${report.marketPosition.currentPrice?.toLocaleString() || 'N/A'}
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
                            ${report.regionalPerformance.avgPrice?.toLocaleString() || 'N/A'}
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
                            {report.regionalPerformance.topColors.slice(0, 3).map((color: string, index: number) => (
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
                      ${report.competitiveLandscape.avgCompetitorPrice?.toLocaleString() || 'N/A'}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-[#737373] uppercase mb-3">All Competing Dealers</p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-[#2a2a2a]">
                            <th className="text-left py-2 px-3 text-xs font-medium text-[#737373] uppercase">Dealer</th>
                            <th className="text-right py-2 px-3 text-xs font-medium text-[#737373] uppercase">Price</th>
                            <th className="text-right py-2 px-3 text-xs font-medium text-[#737373] uppercase">vs Your Price</th>
                            <th className="text-right py-2 px-3 text-xs font-medium text-[#737373] uppercase">Distance</th>
                            <th className="text-right py-2 px-3 text-xs font-medium text-[#737373] uppercase">Days Listed</th>
                            <th className="text-center py-2 px-3 text-xs font-medium text-[#737373] uppercase">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {report.competitiveLandscape.similarVehicles.map((vehicle: any, index: number) => {
                            const priceDiff = vehicle.price - (report.vehicle.currentPrice || 0)
                            const priceDiffPercent = ((priceDiff / (report.vehicle.currentPrice || 1)) * 100)
                            return (
                              <tr key={index} className="border-b border-[#2a2a2a] hover:bg-[#141414] transition-all duration-200">
                                <td className="py-2 px-3 text-white">{vehicle.dealer}</td>
                                <td className="text-right py-2 px-3 text-white font-medium">
                                  ${vehicle.price.toLocaleString()}
                                </td>
                                <td className={`text-right py-2 px-3 font-medium ${
                                  priceDiff > 0 ? 'text-green-500' : priceDiff < 0 ? 'text-red-500' : 'text-[#737373]'
                                }`}>
                                  {priceDiff > 0 ? '+' : ''}{priceDiff.toLocaleString()} ({priceDiffPercent > 0 ? '+' : ''}{priceDiffPercent.toFixed(1)}%)
                                </td>
                                <td className="text-right py-2 px-3 text-[#a3a3a3]">{vehicle.distance} mi</td>
                                <td className="text-right py-2 px-3 text-[#a3a3a3]">{vehicle.daysOnMarket} days</td>
                                <td className="text-center py-2 px-3">
                                  {vehicle.vdpUrl && (
                                    <a
                                      href={vehicle.vdpUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[#3b82f6] hover:text-[#2563eb] transition-colors duration-200"
                                    >
                                      View
                                    </a>
                                  )}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Summary by Dealer */}
                    {report.competitiveLandscape.vehiclesByDealer && Object.keys(report.competitiveLandscape.vehiclesByDealer).length > 0 && (
                      <div className="mt-6">
                        <p className="text-xs text-[#737373] uppercase mb-3">Inventory by Dealer</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {Object.entries(report.competitiveLandscape.vehiclesByDealer).map(([dealer, vehicles]: [string, any]) => (
                            <div key={dealer} className="bg-[#141414] rounded-lg p-3 border border-[#2a2a2a]">
                              <p className="text-sm text-white font-medium truncate">{dealer}</p>
                              <div className="flex items-center justify-between mt-1">
                                <span className="text-xs text-[#737373]">{vehicles.length} units</span>
                                <span className="text-xs text-[#a3a3a3]">
                                  Avg: ${(vehicles.reduce((sum: number, v: any) => sum + v.price, 0) / vehicles.length).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Demand Analysis - DataForSEO Keywords */}
          {report.demandAnalysis && (
            <Card className="bg-[#1f1f1f] border border-[#2a2a2a] transition-all duration-200 ease hover:bg-[#2a2a2a]/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-lg">
                  <div className="flex items-center gap-2">
                    <Search className="h-5 w-5 text-[#3b82f6]" />
                    Local Search Demand Analysis
                    <Badge variant="outline" className="ml-2 text-xs">
                      {report.demandAnalysis.locationName}
                    </Badge>
                  </div>
                  {/* Debug Mode Toggle */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDemandDebug(!showDemandDebug)}
                    className="text-xs text-[#737373] hover:text-[#3b82f6]"
                  >
                    <Bug className="h-3 w-3 mr-1" />
                    {showDemandDebug ? 'Hide' : 'Show'} Debug
                  </Button>
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
                        {report.demandAnalysis.totalMonthlySearches?.toLocaleString() || '0'}
                      </p>
                      <p className="text-xs text-[#737373] mt-1">
                        searches/month in {report.demandAnalysis.locationName}
                      </p>
                    </div>

                    {/* Top Keywords */}
                    {report.demandAnalysis.topKeywords && report.demandAnalysis.topKeywords.length > 0 && (
                      <div>
                        <p className="text-xs text-[#737373] uppercase mb-3">Top Search Keywords</p>
                        
                        {/* Quick Stats */}
                        <div className="grid grid-cols-3 gap-2 mb-4">
                          <div className="bg-[#141414] rounded-lg p-2 border border-[#2a2a2a]">
                            <p className="text-xs text-[#737373]">Highest</p>
                            <p className="text-sm font-bold text-white">
                              {Math.max(...report.demandAnalysis.topKeywords.map((k: any) => k.monthlySearches)).toLocaleString()}
                            </p>
                          </div>
                          <div className="bg-[#141414] rounded-lg p-2 border border-[#2a2a2a]">
                            <p className="text-xs text-[#737373]">Average</p>
                            <p className="text-sm font-bold text-white">
                              {Math.round(report.demandAnalysis.topKeywords.reduce((sum: number, k: any) => sum + k.monthlySearches, 0) / report.demandAnalysis.topKeywords.length).toLocaleString()}
                            </p>
                          </div>
                          <div className="bg-[#141414] rounded-lg p-2 border border-[#2a2a2a]">
                            <p className="text-xs text-[#737373]">Keywords</p>
                            <p className="text-sm font-bold text-white">{report.demandAnalysis.topKeywords.length}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          {report.demandAnalysis.topKeywords.map((keyword: { keyword: string; monthlySearches: number; competition: number }, index: number) => {
                            const maxVolume = Math.max(...(report.demandAnalysis?.topKeywords?.map((k: any) => k.monthlySearches) || [0]))
                            const volumePercent = (keyword.monthlySearches / maxVolume) * 100
                            
                            // Determine tier colors based on volume
                            const isHighVolume = keyword.monthlySearches >= 100000
                            const isMediumVolume = keyword.monthlySearches >= 30000 && keyword.monthlySearches < 100000
                            const isLowVolume = keyword.monthlySearches < 30000
                            
                            const bgColor = isHighVolume ? 'bg-gradient-to-r from-green-950/50 to-green-900/30' :
                                          isMediumVolume ? 'bg-gradient-to-r from-blue-950/50 to-blue-900/30' :
                                          'bg-gradient-to-r from-[#1a1a1a] to-[#141414]'
                            
                            const borderColor = isHighVolume ? 'border-green-800/50' :
                                              isMediumVolume ? 'border-blue-800/50' :
                                              'border-[#2a2a2a]'
                                              
                            const volumeColor = isHighVolume ? 'text-green-400' :
                                              isMediumVolume ? 'text-blue-400' :
                                              'text-[#737373]'
                            
                            return (
                              <div key={index} className={`${bgColor} rounded-lg p-4 border ${borderColor} hover:scale-[1.02] transition-all duration-200 relative overflow-hidden`}>
                                {/* Progress bar background */}
                                <div className="absolute inset-0 opacity-10">
                                  <div 
                                    className={`h-full ${isHighVolume ? 'bg-green-500' : isMediumVolume ? 'bg-blue-500' : 'bg-gray-500'}`}
                                    style={{ width: `${volumePercent}%` }}
                                  />
                                </div>
                                
                                <div className="relative z-10 flex items-center justify-between">
                                  {/* Left side - Volume */}
                                  <div className="flex items-center gap-4">
                                    <div>
                                      <span className={`text-3xl font-black ${volumeColor}`}>
                                        {keyword.monthlySearches?.toLocaleString() || '0'}
                                      </span>
                                      <p className="text-xs text-[#737373] mt-0.5">searches/month</p>
                                    </div>
                                  </div>
                                  
                                  {/* Center - Keyword */}
                                  <div className="flex-1 mx-6">
                                    <p className="text-base font-semibold text-white">{keyword.keyword}</p>
                                  </div>
                                  
                                  {/* Right side - Competition */}
                                  <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1">
                                      {[...Array(5)].map((_, i: number) => {
                                        const competitionLevel = (keyword.competition || 0) * 5
                                        const isFilled = i < competitionLevel
                                        return (
                                          <div
                                            key={i}
                                            className={`h-2 w-2 rounded-full ${
                                              isFilled 
                                                ? competitionLevel > 3 ? 'bg-red-500' : competitionLevel > 1.5 ? 'bg-orange-500' : 'bg-green-500'
                                                : 'bg-[#2a2a2a]'
                                            }`}
                                          />
                                        )
                                      })}
                                    </div>
                                    <span className="text-xs text-[#737373]">comp</span>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
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

                    {/* Debug Panel */}
                    {showDemandDebug && report.demandAnalysis.raw && (
                      <div className="mt-4 bg-[#0a0a0a] rounded-lg p-4 border border-[#3b82f6]/20">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-medium text-white flex items-center gap-2">
                            <Bug className="h-4 w-4 text-[#3b82f6]" />
                            Raw DataForSEO Response
                          </h4>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              navigator.clipboard.writeText(JSON.stringify(report.demandAnalysis?.raw, null, 2))
                              toast.success('Raw data copied to clipboard')
                            }}
                            className="text-xs text-[#737373] hover:text-white"
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copy
                          </Button>
                        </div>
                        <pre className="text-xs text-[#e5e5e5] overflow-auto bg-black/50 p-3 rounded-lg max-h-96">
                          {JSON.stringify(report.demandAnalysis.raw, null, 2)}
                        </pre>
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

          {/* AI Analysis Section */}
          {report && (
            <div className="mt-8">
              <Card className="bg-[#1f1f1f] border border-[#2a2a2a] transition-all duration-200 ease hover:bg-[#2a2a2a]/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Bot className="h-5 w-5 text-[#3b82f6]" />
                        AI Analysis
                        <Badge variant="outline" className="ml-2 text-xs">
                          <Sparkles className="h-3 w-3 mr-1" />
                          Go Deeper
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        Get AI-powered insights and recommendations based on the market data
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {showAIAnalysis && (
                        <Button
                          size="sm"
                          variant={debugMode ? "default" : "outline"}
                          onClick={() => setDebugMode(!debugMode)}
                          className="text-xs"
                        >
                          <Bug className="h-3 w-3 mr-1" />
                          Debug Mode
                        </Button>
                      )}
                      {!showAIAnalysis && (
                        <Button
                          onClick={() => setShowAIAnalysis(true)}
                          className="bg-[#3b82f6] hover:bg-[#2563eb]"
                        >
                          <Bot className="h-4 w-4 mr-2" />
                          Analyze with AI
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                {showAIAnalysis && (
                  <CardContent className="space-y-4">
                    {/* AI Settings Selection */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* AI Model Selection */}
                        <div>
                          <label className="text-sm font-medium text-white mb-2 block">
                            Analysis Type
                          </label>
                          <select
                            value={selectedAISetting}
                            onChange={(e) => {
                              const newSettingId = e.target.value
                              setSelectedAISetting(newSettingId)
                              setUseCustomPrompt(false)
                              setAiAnalysis(null) // Clear previous analysis when changing selection
                              
                              // Auto-run if enabled and a valid setting is selected
                              if (autoRunAnalysis && newSettingId && report) {
                                // Small delay to ensure state updates
                                setTimeout(() => {
                                  runAIAnalysis()
                                }, 100)
                              }
                            }}
                            disabled={useCustomPrompt}
                            className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/20 focus:outline-none transition-all duration-200 disabled:opacity-50"
                          >
                            <option value="">Select AI analysis type...</option>
                            {aiSettings.map((setting) => (
                              <option key={setting.id} value={setting.id}>
                                {setting.name} - {setting.model}
                              </option>
                            ))}
                          </select>
                          {selectedAISetting && !useCustomPrompt && (
                            <p className="text-xs text-[#737373] mt-1">
                              {aiSettings.find(s => s.id === selectedAISetting)?.description}
                            </p>
                          )}
                          {selectedAISetting && (
                            <div className="flex items-center gap-2 mt-2">
                              <input
                                type="checkbox"
                                id="auto-run-analysis"
                                checked={autoRunAnalysis}
                                onChange={(e) => setAutoRunAnalysis(e.target.checked)}
                                className="h-3 w-3 rounded border-[#2a2a2a] bg-[#0a0a0a] text-[#3b82f6] focus:ring-[#3b82f6]/20"
                              />
                              <label htmlFor="auto-run-analysis" className="text-xs text-[#737373] cursor-pointer">
                                Auto-run when changing selection
                              </label>
                            </div>
                          )}
                        </div>

                        {/* Quick Actions */}
                        <div>
                          <label className="text-sm font-medium text-white mb-2 block">
                            Quick Prompts
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setUseCustomPrompt(true)
                                setCustomPrompt('Should I reduce the price on this vehicle? Give me a YES or NO answer with 3 supporting data points.')
                                setAiAnalysis(null) // Clear previous analysis
                              }}
                              className="text-xs"
                            >
                              Price Decision
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setUseCustomPrompt(true)
                                setCustomPrompt('What are the top 3 actions I should take this week to sell this vehicle?')
                                setAiAnalysis(null) // Clear previous analysis
                              }}
                              className="text-xs"
                            >
                              Action Plan
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setUseCustomPrompt(true)
                                setCustomPrompt('Who is the ideal buyer for this vehicle and how should I market to them?')
                                setAiAnalysis(null) // Clear previous analysis
                              }}
                              className="text-xs"
                            >
                              Target Buyer
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setUseCustomPrompt(true)
                                setCustomPrompt('Compare this vehicle to the top 3 competitors and tell me how to win.')
                                setAiAnalysis(null) // Clear previous analysis
                              }}
                              className="text-xs"
                            >
                              Beat Competition
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Custom Prompt */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-medium text-white">
                            Custom Prompt
                          </label>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setUseCustomPrompt(!useCustomPrompt)
                              setCustomPrompt('')
                            }}
                            className="text-xs text-[#3b82f6] hover:text-[#2563eb]"
                          >
                            {useCustomPrompt ? 'Use AI Setting' : 'Use Custom Prompt'}
                          </Button>
                        </div>
                        <textarea
                          value={customPrompt}
                          onChange={(e) => {
                            setCustomPrompt(e.target.value)
                            setUseCustomPrompt(true)
                          }}
                          placeholder="Ask a specific question about this vehicle's market data..."
                          className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white placeholder-[#737373] focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/20 focus:outline-none transition-all duration-200 min-h-[80px]"
                        />
                      </div>

                      {/* Analyze Button */}
                      <Button
                        onClick={runAIAnalysis}
                        disabled={aiLoading || (!selectedAISetting && !customPrompt)}
                        className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white"
                      >
                        {aiLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Run AI Analysis
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Analysis Update Notice */}
                    {!aiAnalysis && aiSettings.length > 0 && selectedAISetting && (
                      <Alert className="border-[#3b82f6]/20 bg-[#3b82f6]/5">
                        <AlertCircle className="h-4 w-4 text-[#3b82f6]" />
                        <AlertDescription className="text-sm text-[#e5e5e5]">
                          Click &quot;Run AI Analysis&quot; to analyze with <strong>{aiSettings.find(s => s.id === selectedAISetting)?.name}</strong>
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* AI Analysis Results */}
                    {aiAnalysis && (
                      <div className="mt-6 space-y-4">
                        <div className="bg-[#141414] rounded-lg p-6 border border-[#2a2a2a]">
                          {/* Metadata */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <MessageSquare className="h-4 w-4 text-[#3b82f6]" />
                              <span className="text-sm font-medium text-white">
                                {aiAnalysis.metadata.aiSetting?.name || 'Custom Analysis'}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {aiAnalysis.metadata.model}
                              </Badge>
                            </div>
                            <span className="text-xs text-[#737373]">
                              {new Date(aiAnalysis.metadata.timestamp).toLocaleTimeString()}
                            </span>
                          </div>

                          {/* Analysis Content */}
                          <div className="markdown-content prose prose-invert max-w-none">
                            {typeof aiAnalysis.analysis === 'string' ? (
                              <ReactMarkdown
                                components={{
                                  // Custom styling for markdown elements
                                  h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-white mb-4 mt-6" {...props} />,
                                  h2: ({node, ...props}) => <h2 className="text-xl font-semibold text-white mb-3 mt-5" {...props} />,
                                  h3: ({node, ...props}) => <h3 className="text-lg font-medium text-white mb-2 mt-4" {...props} />,
                                  p: ({node, ...props}) => <p className="text-sm text-[#e5e5e5] mb-3 leading-relaxed" {...props} />,
                                  ul: ({node, ...props}) => <ul className="list-disc list-inside space-y-1 mb-3 ml-4" {...props} />,
                                  ol: ({node, ...props}) => <ol className="list-decimal list-inside space-y-1 mb-3 ml-4" {...props} />,
                                  li: ({node, ...props}) => <li className="text-sm text-[#e5e5e5] leading-relaxed" {...props} />,
                                  strong: ({node, ...props}) => <strong className="font-semibold text-white" {...props} />,
                                  em: ({node, ...props}) => <em className="italic text-[#a3a3a3]" {...props} />,
                                  blockquote: ({node, ...props}) => (
                                    <blockquote className="border-l-4 border-[#3b82f6] pl-4 py-2 mb-3 bg-[#0a0a0a] rounded-r-lg" {...props} />
                                  ),
                                  code: ({node, className, children, ...props}) => {
                                    const match = /language-(\w+)/.exec(className || '')
                                    const isInline = !match && node?.position?.start.line === node?.position?.end.line
                                    return isInline ? (
                                      <code className="bg-[#0a0a0a] text-[#3b82f6] px-1.5 py-0.5 rounded text-xs font-mono" {...props}>
                                        {children}
                                      </code>
                                    ) : (
                                      <code className="block bg-[#0a0a0a] text-[#e5e5e5] p-4 rounded-lg overflow-x-auto font-mono text-xs mb-3" {...props}>
                                        {children}
                                      </code>
                                    )
                                  },
                                  pre: ({node, ...props}) => <pre className="mb-3" {...props} />,
                                  hr: ({node, ...props}) => <hr className="border-[#2a2a2a] my-6" {...props} />,
                                  a: ({node, ...props}) => <a className="text-[#3b82f6] hover:text-[#2563eb] underline" {...props} />,
                                  table: ({node, ...props}) => (
                                    <div className="overflow-x-auto mb-4">
                                      <table className="min-w-full divide-y divide-[#2a2a2a]" {...props} />
                                    </div>
                                  ),
                                  thead: ({node, ...props}) => <thead className="bg-[#1a1a1a]" {...props} />,
                                  tbody: ({node, ...props}) => <tbody className="divide-y divide-[#2a2a2a]" {...props} />,
                                  th: ({node, ...props}) => (
                                    <th className="px-4 py-2 text-left text-xs font-medium text-white uppercase tracking-wider" {...props} />
                                  ),
                                  td: ({node, ...props}) => (
                                    <td className="px-4 py-2 text-sm text-[#e5e5e5]" {...props} />
                                  ),
                                }}
                              >
                                {aiAnalysis.analysis}
                              </ReactMarkdown>
                            ) : (
                              <pre className="text-sm text-[#e5e5e5] overflow-auto bg-[#0a0a0a] p-4 rounded-lg">
                                {JSON.stringify(aiAnalysis.analysis, null, 2)}
                              </pre>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[#2a2a2a]">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                navigator.clipboard.writeText(
                                  typeof aiAnalysis.analysis === 'string' 
                                    ? aiAnalysis.analysis 
                                    : JSON.stringify(aiAnalysis.analysis, null, 2)
                                )
                                toast.success('Analysis copied to clipboard')
                              }}
                              className="text-xs text-[#737373] hover:text-white"
                            >
                              Copy Analysis
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setAiAnalysis(null)}
                              className="text-xs text-[#737373] hover:text-white"
                            >
                              Run New Analysis
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Debug Panel */}
                    {debugMode && lastRequestData && (
                      <div className="mt-6 space-y-4">
                        <div className="bg-[#0a0a0a] rounded-lg p-4 border border-[#3b82f6]/20">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-sm font-medium text-white flex items-center gap-2">
                              <Bug className="h-4 w-4 text-[#3b82f6]" />
                              Debug Information
                            </h4>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setShowDebugData(!showDebugData)}
                                className="text-xs text-[#737373] hover:text-white"
                              >
                                {showDebugData ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                {showDebugData ? 'Hide' : 'Show'} Data
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  // Create the exact payload sent to LLM
                                  const llmPayload = {
                                    messages: [
                                      {
                                        role: 'system',
                                        content: lastRequestData.selectedSetting?.system_prompt || 'Default system prompt'
                                      },
                                      {
                                        role: 'user',
                                        content: `${lastRequestData.requestBody.userPrompt}\n\nMarket Trend Report Data:\n${JSON.stringify(lastRequestData.requestBody.reportData, null, 2)}`
                                      }
                                    ],
                                    model: lastRequestData.selectedSetting?.model || 'gpt-4-turbo-preview',
                                    temperature: lastRequestData.selectedSetting?.temperature || 0.7,
                                    max_tokens: lastRequestData.selectedSetting?.max_tokens || 2000
                                  }
                                  
                                  const fullText = JSON.stringify(llmPayload, null, 2)
                                  navigator.clipboard.writeText(fullText)
                                  
                                  // Calculate token estimate
                                  const tokenEstimate = Math.ceil(fullText.length / 4)
                                  toast.success(`LLM payload copied (≈${tokenEstimate.toLocaleString()} tokens)`)
                                }}
                                className="text-xs text-[#737373] hover:text-white"
                              >
                                <Copy className="h-4 w-4 mr-1" />
                                Copy LLM Payload
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  // Download just the report data as JSON
                                  const reportData = lastRequestData.requestBody.reportData
                                  const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
                                  const url = URL.createObjectURL(blob)
                                  const a = document.createElement('a')
                                  a.href = url
                                  a.download = `llm-report-data-${new Date().toISOString().split('T')[0]}.json`
                                  a.click()
                                  URL.revokeObjectURL(url)
                                  toast.success('Report data downloaded')
                                }}
                                className="text-xs text-[#737373] hover:text-white"
                              >
                                <FileText className="h-4 w-4 mr-1" />
                                Download JSON
                              </Button>
                            </div>
                          </div>

                          {/* Token Estimation */}
                          <div className="bg-[#141414] rounded p-3 border border-[#2a2a2a] mb-4">
                            <p className="text-xs text-[#737373] mb-2">Token Usage Estimation</p>
                            <div className="space-y-2">
                              <div className="flex justify-between text-xs">
                                <span className="text-[#737373]">System Prompt:</span>
                                <span className="text-white font-mono">
                                  ≈{Math.ceil((lastRequestData.selectedSetting?.system_prompt || '').length / 4).toLocaleString()} tokens
                                </span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-[#737373]">User Prompt:</span>
                                <span className="text-white font-mono">
                                  ≈{Math.ceil((lastRequestData.requestBody.userPrompt || '').length / 4).toLocaleString()} tokens
                                </span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-[#737373]">Report Data:</span>
                                <span className="text-white font-mono">
                                  ≈{Math.ceil(JSON.stringify(lastRequestData.requestBody.reportData).length / 4).toLocaleString()} tokens
                                </span>
                              </div>
                              <div className="flex justify-between text-xs pt-2 border-t border-[#2a2a2a]">
                                <span className="text-[#737373] font-medium">Total Estimate:</span>
                                <span className={`font-mono font-medium ${
                                  Math.ceil((
                                    (lastRequestData.selectedSetting?.system_prompt || '').length +
                                    (lastRequestData.requestBody.userPrompt || '').length +
                                    JSON.stringify(lastRequestData.requestBody.reportData).length
                                  ) / 4) > 120000 ? 'text-red-500' : 'text-[#3b82f6]'
                                }`}>
                                  ≈{Math.ceil((
                                    (lastRequestData.selectedSetting?.system_prompt || '').length +
                                    (lastRequestData.requestBody.userPrompt || '').length +
                                    JSON.stringify(lastRequestData.requestBody.reportData).length
                                  ) / 4).toLocaleString()} tokens
                                </span>
                              </div>
                              {Math.ceil((
                                (lastRequestData.selectedSetting?.system_prompt || '').length +
                                (lastRequestData.requestBody.userPrompt || '').length +
                                JSON.stringify(lastRequestData.requestBody.reportData).length
                              ) / 4) > 120000 && (
                                <p className="text-xs text-red-500 mt-2">
                                  ⚠️ Warning: Estimated tokens exceed 120k limit
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Debug Summary */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                            <div className="bg-[#141414] rounded p-2 border border-[#2a2a2a]">
                              <p className="text-xs text-[#737373]">Model</p>
                              <p className="text-xs text-white font-medium">
                                {lastRequestData.selectedSetting?.model || 'Default'}
                              </p>
                            </div>
                            <div className="bg-[#141414] rounded p-2 border border-[#2a2a2a]">
                              <p className="text-xs text-[#737373]">Using Raw Data</p>
                              <p className="text-xs text-white font-medium">
                                {lastRequestData.usingRawData ? 'Yes' : 'No'}
                              </p>
                            </div>
                            <div className="bg-[#141414] rounded p-2 border border-[#2a2a2a]">
                              <p className="text-xs text-[#737373]">Vehicle</p>
                              <p className="text-xs text-white font-medium">
                                {lastRequestData.reportDataSummary.vehicle.vin}
                              </p>
                            </div>
                            <div className="bg-[#141414] rounded p-2 border border-[#2a2a2a]">
                              <p className="text-xs text-[#737373]">Timestamp</p>
                              <p className="text-xs text-white font-medium">
                                {new Date(lastRequestData.timestamp).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>

                          {/* Data Availability Check */}
                          <div className="bg-[#141414] rounded p-3 border border-[#2a2a2a] mb-4">
                            <p className="text-xs text-[#737373] mb-2">Data Availability</p>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                              {Object.entries(lastRequestData.reportDataSummary).map(([key, value]) => {
                                if (key === 'vehicle' || key === 'opportunityScore') return null
                                return (
                                  <div key={key} className="flex items-center gap-2">
                                    <div className={`h-2 w-2 rounded-full ${value ? 'bg-green-500' : 'bg-red-500'}`} />
                                    <span className="text-xs text-[#a3a3a3]">
                                      {key.replace(/([A-Z])/g, ' $1').replace('has', '').trim()}
                                    </span>
                                  </div>
                                )
                              })}
                            </div>
                          </div>

                          {/* Full Request Data */}
                          {showDebugData && (
                            <div className="space-y-4">
                              {/* LLM Payload Preview */}
                              <div className="bg-[#141414] rounded p-3 border border-[#2a2a2a]">
                                <p className="text-xs text-[#737373] mb-2">Exact LLM Payload Preview</p>
                                <div className="space-y-3">
                                  <div>
                                    <p className="text-xs text-[#3b82f6] mb-1">System Message:</p>
                                    <pre className="text-xs text-[#a3a3a3] bg-[#0a0a0a] p-2 rounded overflow-auto max-h-32">
                                      {lastRequestData.selectedSetting?.system_prompt || 'Default system prompt'}
                                    </pre>
                                  </div>
                                  <div>
                                    <p className="text-xs text-[#3b82f6] mb-1">User Message:</p>
                                    <pre className="text-xs text-[#a3a3a3] bg-[#0a0a0a] p-2 rounded overflow-auto max-h-32">
                                      {lastRequestData.requestBody.userPrompt}
                                      {'\n\n'}
                                      [Market data follows with detailed context for each section...]
                                    </pre>
                                  </div>
                                  <div>
                                    <p className="text-xs text-[#3b82f6] mb-1">Report Data Structure:</p>
                                    <pre className="text-xs text-[#a3a3a3] bg-[#0a0a0a] p-2 rounded overflow-auto max-h-64">
                                      {JSON.stringify(lastRequestData.requestBody.reportData, null, 2)}
                                    </pre>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Raw Debug Data */}
                              <div className="bg-[#141414] rounded p-3 border border-[#2a2a2a]">
                                <p className="text-xs text-[#737373] mb-2">Full Debug Data</p>
                                <pre className="text-xs text-[#a3a3a3] overflow-auto max-h-96">
                                  {JSON.stringify(lastRequestData, null, 2)}
                                </pre>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            </div>
          )}
        </>
      )}
      </div>
    </div>
  )
}