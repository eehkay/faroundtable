'use client'

import { useState } from 'react'
import { Search, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RangeSlider } from '@/components/ui/range-slider'
import { useSession } from 'next-auth/react'
import { useDealershipLocations } from '@/lib/hooks/useDealershipLocations'

export interface VehicleSearchParams {
  searchType: 'vin' | 'makeModel'
  vin?: string
  make?: string
  model?: string
  year?: number
  locationId?: string
  radius: number
}

interface VehicleSearchFormProps {
  onSearch: (params: VehicleSearchParams) => void
  isLoading?: boolean
}

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 30 }, (_, i) => CURRENT_YEAR - i)

export function VehicleSearchForm({ onSearch, isLoading = false }: VehicleSearchFormProps) {
  const { data: session } = useSession()
  const { locations } = useDealershipLocations()
  
  const [searchType, setSearchType] = useState<'vin' | 'makeModel'>('vin')
  const [vin, setVin] = useState('')
  const [make, setMake] = useState('')
  const [model, setModel] = useState('')
  const [year, setYear] = useState<number | undefined>()
  const [locationId, setLocationId] = useState(session?.user?.location?.id || '')
  const [radius, setRadius] = useState(50)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const params: VehicleSearchParams = {
      searchType,
      radius,
      locationId: locationId || undefined
    }

    if (searchType === 'vin') {
      if (!vin || vin.length !== 17) {
        alert('Please enter a valid 17-character VIN')
        return
      }
      params.vin = vin.toUpperCase()
    } else {
      if (!make || !model) {
        alert('Please enter both make and model')
        return
      }
      params.make = make
      params.model = model
      params.year = year
    }

    onSearch(params)
  }

  const isFormValid = () => {
    if (searchType === 'vin') {
      return vin.length === 17
    }
    return make && model
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Search Type Toggle */}
      <div className="flex gap-2 p-1 bg-zinc-900 rounded-lg">
        <Button
          type="button"
          variant={searchType === 'vin' ? 'default' : 'ghost'}
          className={searchType === 'vin' ? 'bg-blue-600 hover:bg-blue-700' : ''}
          onClick={() => setSearchType('vin')}
        >
          Search by VIN
        </Button>
        <Button
          type="button"
          variant={searchType === 'makeModel' ? 'default' : 'ghost'}
          className={searchType === 'makeModel' ? 'bg-blue-600 hover:bg-blue-700' : ''}
          onClick={() => setSearchType('makeModel')}
        >
          Search by Make/Model
        </Button>
      </div>

      {/* Search Inputs */}
      {searchType === 'vin' ? (
        <div className="space-y-2">
          <Label htmlFor="vin">Vehicle Identification Number (VIN)</Label>
          <Input
            id="vin"
            type="text"
            placeholder="Enter 17-character VIN"
            value={vin}
            onChange={(e) => setVin(e.target.value.toUpperCase())}
            maxLength={17}
            className="font-mono uppercase"
          />
          <p className="text-xs text-zinc-400">
            {vin.length}/17 characters
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="make">Make</Label>
            <Input
              id="make"
              type="text"
              placeholder="e.g., Toyota"
              value={make}
              onChange={(e) => setMake(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            <Input
              id="model"
              type="text"
              placeholder="e.g., Camry"
              value={model}
              onChange={(e) => setModel(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="year">Year (Optional)</Label>
            <Select value={year ? year.toString() : "any"} onValueChange={(v) => setYear(v === "any" ? undefined : parseInt(v))}>
              <SelectTrigger id="year">
                <SelectValue placeholder="Any year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any year</SelectItem>
                {YEARS.map(y => (
                  <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Location and Radius */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Analysis Location
            </Label>
            <Select value={locationId} onValueChange={setLocationId}>
              <SelectTrigger id="location">
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                {locations?.map(loc => (
                  <SelectItem key={loc.id} value={loc.id}>
                    {loc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="radius">
              Search Radius: {radius} miles
            </Label>
            <RangeSlider
              id="radius"
              min={10}
              max={500}
              step={10}
              value={[radius]}
              defaultValue={[50]}
              onValueChange={(values) => setRadius(values[0] || 50)}
              className="mt-2"
            />
            <div className="flex justify-between text-xs text-zinc-400">
              <span>10 mi</span>
              <span>500 mi</span>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={!isFormValid() || isLoading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
      >
        {isLoading ? (
          <>Analyzing Market...</>
        ) : (
          <>
            <Search className="w-4 h-4 mr-2" />
            Analyze Vehicle Market
          </>
        )}
      </Button>
    </form>
  )
}