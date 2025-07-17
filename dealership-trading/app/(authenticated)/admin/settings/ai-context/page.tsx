'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Save, RotateCcw, AlertCircle, FileText, Package, BarChart3, Users, Search, Eye } from 'lucide-react'
import { toast } from 'sonner'

interface AIContextSettings {
  market_position_context: string
  inventory_analysis_context: string
  regional_performance_context: string
  competitive_landscape_context: string
  demand_analysis_context: string
  include_context: boolean
}

export default function AIContextSettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<AIContextSettings>({
    market_position_context: '',
    inventory_analysis_context: '',
    regional_performance_context: '',
    competitive_landscape_context: '',
    demand_analysis_context: '',
    include_context: true
  })
  const [originalSettings, setOriginalSettings] = useState<AIContextSettings | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/ai-context-settings')
      const data = await response.json()
      
      if (data.success && data.data) {
        setSettings(data.data)
        setOriginalSettings(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
      toast.error('Failed to load AI context settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/admin/ai-context-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save settings')
      }

      toast.success('AI context settings saved successfully')
      setOriginalSettings(settings)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset all context settings to defaults? This cannot be undone.')) {
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/admin/ai-context-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset settings')
      }

      setSettings(data.data)
      setOriginalSettings(data.data)
      toast.success('AI context settings reset to defaults')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to reset settings')
    } finally {
      setSaving(false)
    }
  }

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings)

  const calculateTokenEstimate = () => {
    const totalLength = 
      settings.market_position_context.length +
      settings.inventory_analysis_context.length +
      settings.regional_performance_context.length +
      settings.competitive_landscape_context.length +
      settings.demand_analysis_context.length +
      200 // Additional formatting characters
    
    return Math.ceil(totalLength / 4)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3b82f6] mx-auto"></div>
            <p className="mt-4 text-[#737373]">Loading AI context settings...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/admin/settings')}
            className="hover:bg-[#2a2a2a]"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">AI Context Settings</h1>
            <p className="text-sm text-[#737373] mt-1">
              Manage context explanations provided to AI for each data section
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowPreview(!showPreview)}
            className="border-[#2a2a2a] hover:bg-[#2a2a2a]"
          >
            <Eye className="h-4 w-4 mr-2" />
            {showPreview ? 'Hide' : 'Show'} Preview
          </Button>
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={saving}
            className="border-[#2a2a2a] hover:bg-[#2a2a2a]"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="bg-[#3b82f6] hover:bg-[#2563eb]"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Token Estimate Alert */}
      <Alert className="mb-6 border-[#2a2a2a] bg-[#1f1f1f]">
        <AlertCircle className="h-4 w-4 text-[#3b82f6]" />
        <AlertDescription className="text-[#a3a3a3]">
          <span className="font-medium">Token Usage:</span> Context adds approximately{' '}
          <span className="font-mono text-white">{calculateTokenEstimate().toLocaleString()}</span> tokens to each AI analysis.
          {settings.include_context ? ' Context is currently enabled.' : ' Context is currently disabled.'}
        </AlertDescription>
      </Alert>

      {/* Main Settings Card */}
      <Card className="bg-[#1f1f1f] border-[#2a2a2a]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Data Section Contexts</CardTitle>
              <CardDescription className="text-[#737373]">
                Edit the explanations provided to AI for each section of the market trend report
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="include-context" className="text-sm text-[#737373]">
                Include Context
              </Label>
              <Switch
                id="include-context"
                checked={settings.include_context}
                onCheckedChange={(checked) => setSettings({ ...settings, include_context: checked })}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Market Position Context */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-white">
              <FileText className="h-4 w-4 text-[#3b82f6]" />
              Market Position (Price Analysis)
            </Label>
            <Textarea
              value={settings.market_position_context}
              onChange={(e) => setSettings({ ...settings, market_position_context: e.target.value })}
              placeholder="Explain what the market position data represents..."
              className="min-h-[100px] bg-[#0a0a0a] border-[#2a2a2a] text-white placeholder-[#737373] focus:border-[#3b82f6]"
            />
            <p className="text-xs text-[#737373]">
              {settings.market_position_context.length} characters
            </p>
          </div>

          {/* Inventory Analysis Context */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-white">
              <Package className="h-4 w-4 text-[#3b82f6]" />
              Inventory Analysis (Supply & Demand)
            </Label>
            <Textarea
              value={settings.inventory_analysis_context}
              onChange={(e) => setSettings({ ...settings, inventory_analysis_context: e.target.value })}
              placeholder="Explain what MDS and inventory metrics mean..."
              className="min-h-[100px] bg-[#0a0a0a] border-[#2a2a2a] text-white placeholder-[#737373] focus:border-[#3b82f6]"
            />
            <p className="text-xs text-[#737373]">
              {settings.inventory_analysis_context.length} characters
            </p>
          </div>

          {/* Regional Performance Context */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-white">
              <BarChart3 className="h-4 w-4 text-[#3b82f6]" />
              Regional Performance (Local Market Stats)
            </Label>
            <Textarea
              value={settings.regional_performance_context}
              onChange={(e) => setSettings({ ...settings, regional_performance_context: e.target.value })}
              placeholder="Explain what regional performance data shows..."
              className="min-h-[100px] bg-[#0a0a0a] border-[#2a2a2a] text-white placeholder-[#737373] focus:border-[#3b82f6]"
            />
            <p className="text-xs text-[#737373]">
              {settings.regional_performance_context.length} characters
            </p>
          </div>

          {/* Competitive Landscape Context */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-white">
              <Users className="h-4 w-4 text-[#3b82f6]" />
              Competitive Landscape (Similar Vehicles)
            </Label>
            <Textarea
              value={settings.competitive_landscape_context}
              onChange={(e) => setSettings({ ...settings, competitive_landscape_context: e.target.value })}
              placeholder="Explain what competitive vehicle data includes..."
              className="min-h-[100px] bg-[#0a0a0a] border-[#2a2a2a] text-white placeholder-[#737373] focus:border-[#3b82f6]"
            />
            <p className="text-xs text-[#737373]">
              {settings.competitive_landscape_context.length} characters
            </p>
          </div>

          {/* Demand Analysis Context */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-white">
              <Search className="h-4 w-4 text-[#3b82f6]" />
              Demand Analysis (Search Trends)
            </Label>
            <Textarea
              value={settings.demand_analysis_context}
              onChange={(e) => setSettings({ ...settings, demand_analysis_context: e.target.value })}
              placeholder="Explain what search volume data represents..."
              className="min-h-[100px] bg-[#0a0a0a] border-[#2a2a2a] text-white placeholder-[#737373] focus:border-[#3b82f6]"
            />
            <p className="text-xs text-[#737373]">
              {settings.demand_analysis_context.length} characters
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Preview Section */}
      {showPreview && (
        <Card className="mt-6 bg-[#1f1f1f] border-[#2a2a2a]">
          <CardHeader>
            <CardTitle className="text-lg">Context Preview</CardTitle>
            <CardDescription className="text-[#737373]">
              This is how the context will appear in the AI prompt
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="text-xs text-[#a3a3a3] bg-[#0a0a0a] p-4 rounded-lg overflow-auto max-h-96">
{`Market Trend Report Data with Context:

VEHICLE INFORMATION:
[Vehicle data will appear here]

LOCATION CONTEXT:
[Location data will appear here]

MARKET POSITION (Price Analysis):
- ${settings.market_position_context}
[Market position data will appear here]

INVENTORY ANALYSIS (Supply & Demand):
- ${settings.inventory_analysis_context}
[Inventory data will appear here]

REGIONAL PERFORMANCE (Local Market Stats):
- ${settings.regional_performance_context}
[Regional data will appear here]

COMPETITIVE LANDSCAPE (Similar Vehicles):
- ${settings.competitive_landscape_context}
[Competitive data will appear here]

DEMAND ANALYSIS (Search Trends):
- ${settings.demand_analysis_context}
[Demand data will appear here]

Note: When 'raw' data is present, it contains unbiased API responses. The 'processed' data contains our calculations for reference but the AI should form its own conclusions from the raw data.`}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}