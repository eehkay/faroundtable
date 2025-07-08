'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Building2, CheckCircle2 } from 'lucide-react'
import Image from 'next/image'

interface DealershipLocation {
  _id: string
  name: string
  code: string
  address?: string
  city?: string
  state?: string
}

export default function OnboardingPage() {
  const { data: session, update: updateSession } = useSession()
  const router = useRouter()
  const [locations, setLocations] = useState<DealershipLocation[]>([])
  const [selectedLocation, setSelectedLocation] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // If user already has a location, redirect to dashboard
    if (session?.user?.location) {
      router.push('/dashboard')
      return
    }
    
    fetchLocations()
  }, [session, router])

  const fetchLocations = async () => {
    try {
      const response = await fetch('/api/dealerships')
      if (response.ok) {
        const data = await response.json()
        setLocations(data)
        
        // If there's only one location, pre-select it
        if (data.length === 1) {
          setSelectedLocation(data[0]._id)
        }
      } else {
        setError('Failed to load dealership locations')
      }
    } catch (error) {
      console.error('Error fetching locations:', error)
      setError('Failed to load dealership locations')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedLocation) {
      setError('Please select a dealership location')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/users/${session?.user?.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          location: selectedLocation
        }),
      })

      if (response.ok) {
        // Update the session with the new location
        const selectedDealership = locations.find(loc => loc._id === selectedLocation)
        if (selectedDealership) {
          await updateSession({
            user: {
              location: {
                id: selectedDealership._id,
                name: selectedDealership.name,
                code: selectedDealership.code
              }
            }
          })
        }
        
        // Redirect to dashboard
        router.push('/dashboard')
      } else {
        const errorText = await response.text()
        setError(`Failed to update location: ${errorText}`)
      }
    } catch (error) {
      console.error('Error updating location:', error)
      setError('Failed to update location. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3b82f6]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg p-8 md:p-12">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mb-6">
              <Image
                src="https://vchtbaawxxruwtvebxlg.supabase.co/storage/v1/object/public/logos/roundtable-logo-stacked.png"
                alt="Round Table Logo"
                width={150}
                height={150}
                className="mx-auto"
                priority
              />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Welcome to Round Table!</h1>
            <p className="text-[#a3a3a3]">
              Please select your primary dealership location to get started.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Select Your Dealership
              </label>
              <div className="space-y-3">
                {locations.map((location) => (
                  <label
                    key={location._id}
                    className={`
                      relative flex items-center p-4 border rounded-lg cursor-pointer
                      transition-all duration-200 hover:bg-[#2a2a2a]
                      ${selectedLocation === location._id 
                        ? 'border-[#3b82f6] bg-[#3b82f6]/10' 
                        : 'border-[#2a2a2a] bg-[#141414]'
                      }
                    `}
                  >
                    <input
                      type="radio"
                      name="location"
                      value={location._id}
                      checked={selectedLocation === location._id}
                      onChange={(e) => setSelectedLocation(e.target.value)}
                      className="sr-only"
                    />
                    <Building2 className={`
                      h-5 w-5 mr-3 flex-shrink-0
                      ${selectedLocation === location._id ? 'text-[#3b82f6]' : 'text-gray-400'}
                    `} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-white">
                            {location.name}
                          </p>
                          <p className="text-sm text-[#737373]">
                            {location.code}
                            {location.city && location.state && ` • ${location.city}, ${location.state}`}
                          </p>
                        </div>
                        {selectedLocation === location._id && (
                          <CheckCircle2 className="h-5 w-5 text-[#3b82f6] flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={!selectedLocation || saving}
                className={`
                  w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg
                  font-medium transition-all duration-200
                  ${!selectedLocation || saving
                    ? 'bg-[#2a2a2a] text-gray-500 cursor-not-allowed'
                    : 'bg-[#3b82f6] text-white hover:bg-[#2563eb] transform hover:scale-[1.02]'
                  }
                `}
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  'Continue to Dashboard'
                )}
              </button>
            </div>
          </form>

          {/* Info */}
          <div className="mt-8 p-4 bg-[#141414] border border-[#2a2a2a] rounded-lg">
            <p className="text-sm text-[#a3a3a3]">
              <span className="font-medium text-white">Note:</span> Your primary location determines 
              which inventory you see by default. You can view vehicles from other locations at any time.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}