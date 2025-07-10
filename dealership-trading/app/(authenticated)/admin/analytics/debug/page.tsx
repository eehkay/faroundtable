'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Loader2, CheckCircle, BarChart3, TrendingUp, MapPin, FileText } from 'lucide-react'
import { useDealershipLocations } from '@/lib/hooks/useDealershipLocations'
import VehicleSearchInput from '@/components/analytics/VehicleSearchInput'
import { Textarea } from '@/components/ui/textarea'

interface ApiResponse {
  endpoint: string
  status: 'idle' | 'loading' | 'success' | 'error'
  data?: any
  error?: string
  timing?: number
}

export default function AnalyticsDebugPage() {
  const { data: session } = useSession()
  const { locations } = useDealershipLocations()
  
  // Redirect if not admin
  if (session?.user?.role !== 'admin') {
    redirect('/dashboard')
  }

  const [responses, setResponses] = useState<Record<string, ApiResponse>>({})

  // VIN Decode State
  const [vinDecodeVin, setVinDecodeVin] = useState('')

  // Price Prediction State
  const [pricePredictionVin, setPricePredictionVin] = useState('')
  const [pricePredictionMiles, setPricePredictionMiles] = useState('')
  const [pricePredictionZip, setPricePredictionZip] = useState('')

  // Market Day Supply State
  const [mdsVin, setMdsVin] = useState('')
  const [mdsMiles, setMdsMiles] = useState('')
  const [mdsZip, setMdsZip] = useState('')
  const [mdsLocationId, setMdsLocationId] = useState('')
  const [mdsRadius, setMdsRadius] = useState('100')
  const [mdsAutoFilledLocation, setMdsAutoFilledLocation] = useState('')

  // Citywise Sales State
  const [salesYear, setSalesYear] = useState('')
  const [salesMake, setSalesMake] = useState('')
  const [salesModel, setSalesModel] = useState('')
  const [salesTrim, setSalesTrim] = useState('')
  const [salesCityState, setSalesCityState] = useState('')
  const [salesAutoFilledCityState, setSalesAutoFilledCityState] = useState('')

  // Similar Vehicles State
  const [similarVin, setSimilarVin] = useState('')
  const [similarLocationId, setSimilarLocationId] = useState('')
  const [similarRadius, setSimilarRadius] = useState('100')
  const [similarAutoFilledLocation, setSimilarAutoFilledLocation] = useState('')

  // DataForSEO Keywords State
  const [dfsKeywords, setDfsKeywords] = useState('')
  const [dfsLocationCode, setDfsLocationCode] = useState('2840') // US
  const [dfsSelectedVehicle, setDfsSelectedVehicle] = useState<any>(null)
  const [dfsLocationInfo, setDfsLocationInfo] = useState<any>(null)

  // DataForSEO Search History State
  const [dfsHistoryKeywords, setDfsHistoryKeywords] = useState('')
  const [dfsDateFrom, setDfsDateFrom] = useState('2024-01-01')
  const [dfsDateTo, setDfsDateTo] = useState(new Date().toISOString().split('T')[0])

  // DataForSEO Suggestions State
  const [dfsSeedKeyword, setDfsSeedKeyword] = useState('')
  const [dfsIncludeSeed, setDfsIncludeSeed] = useState(true)

  // DataForSEO Locations State
  const [dfsCountry, setDfsCountry] = useState('US')
  const [dfsLocationQuery, setDfsLocationQuery] = useState('')

  const callApi = async (endpoint: string, params: any) => {
    const startTime = Date.now()
    
    setResponses(prev => ({
      ...prev,
      [endpoint]: { endpoint, status: 'loading' }
    }))

    try {
      const response = await fetch(`/api/analytics/debug/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      })

      const data = await response.json()
      const timing = Date.now() - startTime

      if (!response.ok) {
        throw new Error(data.error || 'API call failed')
      }

      setResponses(prev => ({
        ...prev,
        [endpoint]: { endpoint, status: 'success', data, timing }
      }))
    } catch (error) {
      setResponses(prev => ({
        ...prev,
        [endpoint]: { 
          endpoint, 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Unknown error',
          timing: Date.now() - startTime
        }
      }))
    }
  }

  const testVinDecode = () => {
    if (!vinDecodeVin) {
      alert('Please enter a VIN')
      return
    }
    
    callApi('vin-decode', {
      vin: vinDecodeVin
    })
  }

  const testPricePrediction = () => {
    if (!pricePredictionVin || !pricePredictionMiles || !pricePredictionZip) {
      alert('Please select a vehicle and ensure all fields are filled')
      return
    }
    
    callApi('price-prediction', {
      vin: pricePredictionVin,
      miles: parseInt(pricePredictionMiles),
      zip: pricePredictionZip,
      car_type: 'used'
    })
  }

  const testMarketDaySupply = () => {
    if (!mdsVin) {
      alert('Please select a vehicle')
      return
    }
    
    const location = locations.find(l => l.id === mdsLocationId)
    if (!location || !location.latitude || !location.longitude) {
      alert('Please select a location with coordinates')
      return
    }

    callApi('market-day-supply', {
      vin: mdsVin,
      latitude: location.latitude,
      longitude: location.longitude,
      radius: parseInt(mdsRadius),
      exact: true,
      debug: true
    })
  }

  const testCitywiseSales = () => {
    if (!salesYear || !salesMake || !salesModel || !salesCityState) {
      alert('Please select a vehicle and ensure all required fields are filled')
      return
    }
    
    callApi('citywise-sales', {
      year: parseInt(salesYear),
      make: salesMake,
      model: salesModel,
      trim: salesTrim || undefined,
      city_state: salesCityState
    })
  }

  const testSimilarVehicles = () => {
    if (!similarVin) {
      alert('Please select a vehicle')
      return
    }
    
    const location = locations.find(l => l.id === similarLocationId)
    if (!location || !location.latitude || !location.longitude) {
      alert('Please select a location with coordinates')
      return
    }

    callApi('similar-vehicles', {
      vin: similarVin,
      latitude: location.latitude,
      longitude: location.longitude,
      radius: parseInt(similarRadius),
      rows: 50
    })
  }

  const testDataForSEOKeywords = () => {
    const keywordList = dfsKeywords.split('\n').filter(k => k.trim())
    if (keywordList.length === 0) {
      alert('Please enter at least one keyword')
      return
    }

    callApi('dataforseo-keywords', {
      keywords: keywordList,
      location_code: parseInt(dfsLocationCode)
    })
  }

  const testDataForSEOSearchHistory = () => {
    const keywordList = dfsHistoryKeywords.split('\n').filter(k => k.trim())
    if (keywordList.length === 0) {
      alert('Please enter at least one keyword')
      return
    }
    callApi('dataforseo-search-history', {
      keywords: keywordList,
      location_code: parseInt(dfsLocationCode),
      date_from: dfsDateFrom,
      date_to: dfsDateTo
    })
  }

  const testDataForSEOSuggestions = () => {
    if (!dfsSeedKeyword.trim()) {
      alert('Please enter a seed keyword')
      return
    }
    callApi('dataforseo-suggestions', {
      keyword: dfsSeedKeyword.trim(),
      location_code: parseInt(dfsLocationCode),
      include_seed_keyword: dfsIncludeSeed
    })
  }

  const testDataForSEOLocations = async () => {
    const startTime = Date.now()
    
    setResponses(prev => ({
      ...prev,
      ['dataforseo-locations']: { endpoint: 'dataforseo-locations', status: 'loading' }
    }))

    try {
      const params = new URLSearchParams()
      if (dfsCountry) params.append('country', dfsCountry)
      if (dfsLocationQuery) params.append('query', dfsLocationQuery)
      
      const response = await fetch(`/api/analytics/debug/dataforseo-locations?${params}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })

      const data = await response.json()
      const timing = Date.now() - startTime

      if (!response.ok) {
        throw new Error(data.error || 'API call failed')
      }

      setResponses(prev => ({
        ...prev,
        ['dataforseo-locations']: { endpoint: 'dataforseo-locations', status: 'success', data, timing }
      }))
    } catch (error) {
      setResponses(prev => ({
        ...prev,
        ['dataforseo-locations']: { 
          endpoint: 'dataforseo-locations', 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Failed to fetch locations' 
        }
      }))
    }
  }

  const renderResponse = (response?: ApiResponse) => {
    if (!response) return null

    return (
      <div className="mt-4 space-y-2">
        <div className="flex items-center gap-2">
          {response.status === 'loading' && <Loader2 className="h-4 w-4 animate-spin" />}
          {response.status === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
          {response.status === 'error' && <AlertCircle className="h-4 w-4 text-red-500" />}
          <span className="text-sm font-medium">
            Status: <Badge variant={response.status === 'success' ? 'default' : 'destructive'}>
              {response.status}
            </Badge>
          </span>
          {response.timing && (
            <span className="text-sm text-gray-500">
              ({response.timing}ms)
            </span>
          )}
        </div>
        
        {response.error && (
          <div className="p-3 bg-red-950/20 border border-red-900/50 rounded-md">
            <p className="text-sm text-red-400">{response.error}</p>
          </div>
        )}
        
        {response.data && (
          <div className="p-3 bg-zinc-900 rounded-md">
            <pre className="text-xs text-gray-300 overflow-auto max-h-96">
              {JSON.stringify(response.data, null, 2)}
            </pre>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Analytics API Debug</h1>
        <p className="text-gray-400 mt-2">
          Test and debug analytics APIs organized by report type
        </p>
      </div>

      <Tabs defaultValue="vehicle-market-trends" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="vehicle-market-trends" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Vehicle Market Trends
          </TabsTrigger>
          <TabsTrigger value="regional-insights" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Regional Market Insights
          </TabsTrigger>
        </TabsList>

        {/* Vehicle Market Trends APIs */}
        <TabsContent value="vehicle-market-trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Market Trends APIs</CardTitle>
              <CardDescription>
                APIs used to analyze vehicle market trends, pricing, demand, and competitive positioning
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="mc-vin-decode" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-2 text-center">MarketCheck APIs</p>
                    <TabsList className="grid grid-cols-5 gap-1">
                      <TabsTrigger value="mc-vin-decode">VIN Decode</TabsTrigger>
                      <TabsTrigger value="mc-price-prediction">Price Prediction</TabsTrigger>
                      <TabsTrigger value="mc-market-day-supply">Market Day Supply</TabsTrigger>
                      <TabsTrigger value="mc-citywise-sales">Citywise Sales</TabsTrigger>
                      <TabsTrigger value="mc-similar-vehicles">Similar Vehicles</TabsTrigger>
                    </TabsList>
                  </div>
                  
                  <div>
                    <p className="text-xs text-gray-500 mb-2 text-center">DataForSEO APIs</p>
                    <TabsList className="grid grid-cols-4 gap-1">
                      <TabsTrigger value="dfs-keywords">Search Volume</TabsTrigger>
                      <TabsTrigger value="dfs-search-history">Search History</TabsTrigger>
                      <TabsTrigger value="dfs-suggestions">Keyword Suggestions</TabsTrigger>
                      <TabsTrigger value="dfs-locations">Location Codes</TabsTrigger>
                    </TabsList>
                  </div>
                </div>

                {/* VIN Decode */}
                <TabsContent value="mc-vin-decode">
                  <Card>
                    <CardHeader>
                      <CardTitle>MarketCheck VIN Decode API</CardTitle>
                      <CardDescription>
                        Test VIN decoding to get standardized vehicle information
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-4">
                        <VehicleSearchInput
                          label="Search for a vehicle"
                          onVehicleSelect={(vehicle) => {
                            setVinDecodeVin(vehicle.vin)
                          }}
                        />
                        
                        <div className="space-y-2">
                          <Label htmlFor="vd-vin">VIN</Label>
                          <Input
                            id="vd-vin"
                            value={vinDecodeVin}
                            onChange={(e) => setVinDecodeVin(e.target.value)}
                            placeholder="17-character VIN"
                            maxLength={17}
                          />
                        </div>
                      </div>
                      
                      <Button 
                        onClick={testVinDecode}
                        disabled={responses['vin-decode']?.status === 'loading' || !vinDecodeVin}
                      >
                        Test VIN Decode
                      </Button>
                      
                      {renderResponse(responses['vin-decode'])}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Price Prediction */}
                <TabsContent value="mc-price-prediction">
                  <Card>
                    <CardHeader>
                      <CardTitle>MarketCheck Price Prediction API</CardTitle>
                      <CardDescription>
                        Test the /v2/predict/car/price endpoint
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-4">
                        <VehicleSearchInput
                          label="Search for a vehicle"
                          onVehicleSelect={(vehicle) => {
                            setPricePredictionVin(vehicle.vin)
                            setPricePredictionMiles(vehicle.mileage.toString())
                            setPricePredictionZip(vehicle.locationZip || '')
                          }}
                        />
                        
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="pp-vin">VIN</Label>
                            <Input
                              id="pp-vin"
                              value={pricePredictionVin}
                              onChange={(e) => setPricePredictionVin(e.target.value)}
                              placeholder="17-character VIN"
                              disabled
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="pp-miles">Miles</Label>
                            <Input
                              id="pp-miles"
                              type="number"
                              value={pricePredictionMiles}
                              onChange={(e) => setPricePredictionMiles(e.target.value)}
                              placeholder="Current mileage"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="pp-zip">ZIP Code</Label>
                            <Input
                              id="pp-zip"
                              value={pricePredictionZip}
                              onChange={(e) => setPricePredictionZip(e.target.value)}
                              placeholder="5-digit ZIP"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <Button 
                        onClick={testPricePrediction}
                        disabled={responses['price-prediction']?.status === 'loading'}
                      >
                        Test Price Prediction
                      </Button>
                      
                      {renderResponse(responses['price-prediction'])}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Market Day Supply */}
                <TabsContent value="mc-market-day-supply">
                  <Card>
                    <CardHeader>
                      <CardTitle>MarketCheck Market Day Supply API</CardTitle>
                      <CardDescription>
                        Test the /v2/mds/car endpoint
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-4">
                        <VehicleSearchInput
                          label="Search for a vehicle"
                          onVehicleSelect={(vehicle) => {
                            setMdsVin(vehicle.vin)
                            setMdsMiles(vehicle.mileage.toString())
                            setMdsZip(vehicle.locationZip || '')
                            setMdsLocationId(vehicle.locationId)
                            setMdsAutoFilledLocation(vehicle.locationId)
                          }}
                        />
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="mds-vin">VIN</Label>
                            <Input
                              id="mds-vin"
                              value={mdsVin}
                              onChange={(e) => setMdsVin(e.target.value)}
                              placeholder="17-character VIN"
                              disabled
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="mds-radius">Radius (miles)</Label>
                            <Input
                              id="mds-radius"
                              type="number"
                              value={mdsRadius}
                              onChange={(e) => setMdsRadius(e.target.value)}
                              placeholder="Search radius"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="mds-location">
                            Dealership Location 
                            {mdsAutoFilledLocation && mdsLocationId === mdsAutoFilledLocation ? (
                              <span className="text-xs text-blue-400 ml-2 font-normal">
                                (Auto-filled from vehicle location)
                              </span>
                            ) : mdsAutoFilledLocation && mdsLocationId !== mdsAutoFilledLocation ? (
                              <span className="text-xs text-amber-400 ml-2 font-normal">
                                (Manually changed)
                              </span>
                            ) : (
                              <span className="text-xs text-gray-500 ml-2 font-normal">
                                (Select a location)
                              </span>
                            )}
                          </Label>
                          <Select value={mdsLocationId} onValueChange={setMdsLocationId}>
                            <SelectTrigger id="mds-location">
                              <SelectValue placeholder="Select location" />
                            </SelectTrigger>
                            <SelectContent>
                              {locations.map(loc => (
                                <SelectItem key={loc.id} value={loc.id}>
                                  {loc.name} 
                                  {loc.latitude && loc.longitude && 
                                    ` (${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)})`
                                  }
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <Button 
                        onClick={testMarketDaySupply}
                        disabled={responses['market-day-supply']?.status === 'loading' || !mdsLocationId}
                      >
                        Test Market Day Supply
                      </Button>
                      
                      {renderResponse(responses['market-day-supply'])}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Similar Vehicles */}
                <TabsContent value="mc-similar-vehicles">
                  <Card>
                    <CardHeader>
                      <CardTitle>MarketCheck Similar Vehicles Search</CardTitle>
                      <CardDescription>
                        Test the /v2/search/car/active endpoint
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-4">
                        <VehicleSearchInput
                          label="Search for a vehicle"
                          onVehicleSelect={(vehicle) => {
                            setSimilarVin(vehicle.vin)
                            setSimilarLocationId(vehicle.locationId)
                            setSimilarAutoFilledLocation(vehicle.locationId)
                          }}
                        />
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="similar-vin">VIN</Label>
                            <Input
                              id="similar-vin"
                              value={similarVin}
                              onChange={(e) => setSimilarVin(e.target.value)}
                              placeholder="17-character VIN"
                              disabled
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="similar-radius">Radius (miles)</Label>
                            <Input
                              id="similar-radius"
                              type="number"
                              value={similarRadius}
                              onChange={(e) => setSimilarRadius(e.target.value)}
                              placeholder="Search radius"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="similar-location">Dealership Location</Label>
                          <Select value={similarLocationId} onValueChange={setSimilarLocationId}>
                            <SelectTrigger id="similar-location">
                              <SelectValue placeholder="Select location" />
                            </SelectTrigger>
                            <SelectContent>
                              {locations.map(loc => (
                                <SelectItem key={loc.id} value={loc.id}>
                                  {loc.name} 
                                  {loc.latitude && loc.longitude && 
                                    ` (${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)})`
                                  }
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <Button 
                        onClick={testSimilarVehicles}
                        disabled={responses['similar-vehicles']?.status === 'loading' || !similarVin || !similarLocationId}
                      >
                        Search Similar Vehicles
                      </Button>
                      
                      {renderResponse(responses['similar-vehicles'])}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* DataForSEO Keywords */}
                <TabsContent value="dfs-keywords">
                  <Card>
                    <CardHeader>
                      <CardTitle>DataForSEO Keyword Search Volume</CardTitle>
                      <CardDescription>
                        Test keyword search volume and trends data
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-4">
                        <div>
                          <VehicleSearchInput
                            label="Auto-populate from vehicle (optional)"
                            onVehicleSelect={(vehicle) => {
                              setDfsSelectedVehicle(vehicle)
                              // Auto-populate keywords based on vehicle
                              const keywords = [
                                `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
                                `${vehicle.make} ${vehicle.model}`,
                                `${vehicle.make} ${vehicle.model} for sale`,
                                `${vehicle.make} ${vehicle.model} price`,
                                `used ${vehicle.make} ${vehicle.model}`
                              ]
                              setDfsKeywords(keywords.join('\n'))
                            }}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="dfs-keywords">
                            Keywords (one per line)
                            {dfsSelectedVehicle && (
                              <span className="text-xs text-blue-400 ml-2 font-normal">
                                Auto-filled from {dfsSelectedVehicle.year} {dfsSelectedVehicle.make} {dfsSelectedVehicle.model}
                              </span>
                            )}
                          </Label>
                          <Textarea
                            id="dfs-keywords"
                            value={dfsKeywords}
                            onChange={(e) => setDfsKeywords(e.target.value)}
                            placeholder="Enter keywords to test, one per line"
                            rows={6}
                            className="font-mono text-sm"
                          />
                          <p className="text-xs text-gray-500">
                            Examples: &quot;2024 Ford F-150&quot;, &quot;Toyota Camry price&quot;, &quot;best SUV 2024&quot;
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="dfs-location">Location</Label>
                          <Select value={dfsLocationCode} onValueChange={(value) => {
                            setDfsLocationCode(value)
                            // Update location info when changed
                            const locationMap: Record<string, string> = {
                              '9057131': 'Las Vegas, NV - United Kia/Nissan/Toyota',
                              '9058666': 'Reno, NV - Primary location code',
                              '1022620': 'Reno, NV - Secondary location code',
                              '2840': 'United States - National'
                            }
                            setDfsLocationInfo(locationMap[value] || null)
                          }}>
                            <SelectTrigger id="dfs-location">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="2840">United States (2840)</SelectItem>
                              <div className="px-2 py-1 text-xs text-gray-500">Dealership Locations</div>
                              <SelectItem value="9057131">Las Vegas, NV (9057131) - United Kia/Nissan/Toyota</SelectItem>
                              <SelectItem value="9058666">Reno, NV (9058666) - Primary</SelectItem>
                              <SelectItem value="1022620">Reno, NV (1022620) - Secondary</SelectItem>
                              <div className="px-2 py-1 text-xs text-gray-500">Other Cities</div>
                              <SelectItem value="1002003">Las Vegas, NV (1002003)</SelectItem>
                              <SelectItem value="1002419">Salt Lake City, UT (1002419)</SelectItem>
                              <SelectItem value="1001969">Phoenix, AZ (1001969)</SelectItem>
                              <SelectItem value="1001998">Denver, CO (1001998)</SelectItem>
                              <SelectItem value="1002673">Boise, ID (1002673)</SelectItem>
                            </SelectContent>
                          </Select>
                          {dfsLocationInfo && (
                            <p className="text-xs text-blue-400 mt-1">
                              Using: {dfsLocationInfo}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            Note: Reno dealerships should test both 9058666 and 1022620 for complete coverage
                          </p>
                        </div>
                      </div>
                      
                      <Button 
                        onClick={testDataForSEOKeywords}
                        disabled={responses['dataforseo-keywords']?.status === 'loading' || !dfsKeywords.trim()}
                      >
                        Test Keyword Search Volume
                      </Button>
                      
                      {renderResponse(responses['dataforseo-keywords'])}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* DataForSEO Search History */}
                <TabsContent value="dfs-search-history">
                  <Card>
                    <CardHeader>
                      <CardTitle>DataForSEO Search Volume History</CardTitle>
                      <CardDescription>
                        Test historical search volume data with monthly breakdowns
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-4">
                        <div>
                          <VehicleSearchInput
                            label="Auto-populate from vehicle (optional)"
                            onVehicleSelect={(vehicle) => {
                              // Auto-populate keywords based on vehicle
                              const keywords = [
                                `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
                                `${vehicle.make} ${vehicle.model}`,
                                `${vehicle.make} ${vehicle.model} for sale`
                              ]
                              setDfsHistoryKeywords(keywords.join('\n'))
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="dfs-history-keywords">Keywords (one per line)</Label>
                          <Textarea
                            id="dfs-history-keywords"
                            value={dfsHistoryKeywords}
                            onChange={(e) => setDfsHistoryKeywords(e.target.value)}
                            placeholder="Enter keywords to analyze"
                            rows={4}
                            className="font-mono text-sm"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="dfs-date-from">Date From</Label>
                            <Input
                              id="dfs-date-from"
                              type="date"
                              value={dfsDateFrom}
                              onChange={(e) => setDfsDateFrom(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="dfs-date-to">Date To</Label>
                            <Input
                              id="dfs-date-to"
                              type="date"
                              value={dfsDateTo}
                              onChange={(e) => setDfsDateTo(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                      
                      <Button 
                        onClick={testDataForSEOSearchHistory}
                        disabled={responses['dataforseo-search-history']?.status === 'loading' || !dfsHistoryKeywords.trim()}
                      >
                        Test Search History
                      </Button>
                      
                      {renderResponse(responses['dataforseo-search-history'])}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* DataForSEO Keyword Suggestions */}
                <TabsContent value="dfs-suggestions">
                  <Card>
                    <CardHeader>
                      <CardTitle>DataForSEO Keyword Suggestions</CardTitle>
                      <CardDescription>
                        Get keyword suggestions based on a seed keyword
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-4">
                        <div>
                          <VehicleSearchInput
                            label="Auto-populate from vehicle (optional)"
                            onVehicleSelect={(vehicle) => {
                              setDfsSeedKeyword(`${vehicle.make} ${vehicle.model}`)
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="dfs-seed-keyword">Seed Keyword</Label>
                          <Input
                            id="dfs-seed-keyword"
                            value={dfsSeedKeyword}
                            onChange={(e) => setDfsSeedKeyword(e.target.value)}
                            placeholder="e.g., Ford F-150"
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="dfs-include-seed"
                              checked={dfsIncludeSeed}
                              onChange={(e) => setDfsIncludeSeed(e.target.checked)}
                              className="rounded"
                            />
                            <Label htmlFor="dfs-include-seed">Include seed keyword in results</Label>
                          </div>
                        </div>
                      </div>
                      
                      <Button 
                        onClick={testDataForSEOSuggestions}
                        disabled={responses['dataforseo-suggestions']?.status === 'loading' || !dfsSeedKeyword.trim()}
                      >
                        Get Keyword Suggestions
                      </Button>
                      
                      {renderResponse(responses['dataforseo-suggestions'])}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* DataForSEO Location Codes */}
                <TabsContent value="dfs-locations">
                  <Card>
                    <CardHeader>
                      <CardTitle>DataForSEO Location Codes</CardTitle>
                      <CardDescription>
                        Browse and search location codes for targeting
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="dfs-country">Country Code</Label>
                          <Input
                            id="dfs-country"
                            value={dfsCountry}
                            onChange={(e) => setDfsCountry(e.target.value)}
                            placeholder="e.g., US"
                            maxLength={2}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="dfs-location-query">Search Query</Label>
                          <Input
                            id="dfs-location-query"
                            value={dfsLocationQuery}
                            onChange={(e) => setDfsLocationQuery(e.target.value)}
                            placeholder="e.g., Las Vegas"
                          />
                        </div>
                      </div>
                      
                      <Button 
                        onClick={testDataForSEOLocations}
                        disabled={responses['dataforseo-locations']?.status === 'loading'}
                      >
                        Search Locations
                      </Button>
                      
                      {renderResponse(responses['dataforseo-locations'])}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Citywise Sales */}
                <TabsContent value="mc-citywise-sales">
                  <Card>
                    <CardHeader>
                      <CardTitle>MarketCheck Citywise Sales API</CardTitle>
                      <CardDescription>
                        Test the /v2/sales/car endpoint - provides regional sales data
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-4">
                        <VehicleSearchInput
                          label="Search for a vehicle"
                          onVehicleSelect={(vehicle) => {
                            setSalesYear(vehicle.year.toString())
                            setSalesMake(vehicle.make.toLowerCase())
                            setSalesModel(vehicle.model.toLowerCase())
                            setSalesTrim(vehicle.trim || '')
                            
                            const location = locations.find(l => l.id === vehicle.locationId)
                            if (location?.city_state) {
                              setSalesCityState(location.city_state)
                              setSalesAutoFilledCityState(location.city_state)
                            }
                          }}
                        />
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="sales-year">Year</Label>
                            <Input
                              id="sales-year"
                              value={salesYear}
                              onChange={(e) => setSalesYear(e.target.value)}
                              placeholder="e.g., 2024"
                              disabled
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="sales-make">Make</Label>
                            <Input
                              id="sales-make"
                              value={salesMake}
                              onChange={(e) => setSalesMake(e.target.value)}
                              placeholder="e.g., ford"
                              disabled
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="sales-model">Model</Label>
                            <Input
                              id="sales-model"
                              value={salesModel}
                              onChange={(e) => setSalesModel(e.target.value)}
                              placeholder="e.g., f-150"
                              disabled
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="sales-trim">Trim</Label>
                            <Input
                              id="sales-trim"
                              value={salesTrim}
                              onChange={(e) => setSalesTrim(e.target.value)}
                              placeholder="e.g., Lariat"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="sales-citystate">City|State</Label>
                          <Input
                            id="sales-citystate"
                            value={salesCityState}
                            onChange={(e) => setSalesCityState(e.target.value)}
                            placeholder="e.g., las-vegas|NV"
                          />
                          <p className="text-xs text-gray-400">
                            Format: city-name|STATE (e.g., las-vegas|NV, salt-lake-city|UT)
                          </p>
                        </div>
                      </div>
                      
                      <Button 
                        onClick={testCitywiseSales}
                        disabled={responses['citywise-sales']?.status === 'loading'}>
                        Test Citywise Sales
                      </Button>
                      
                      {renderResponse(responses['citywise-sales'])}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Regional Market Insights APIs */}
        <TabsContent value="regional-insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Regional Market Insights APIs</CardTitle>
              <CardDescription>
                APIs used to analyze regional market trends and opportunities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  Regional Market Insights APIs coming soon
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  This will include Market Trends, Dealer Search, and Location-based analytics
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}