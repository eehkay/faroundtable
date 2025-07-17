'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { X, Save, Loader2, AlertCircle } from 'lucide-react'

interface ModelInfo {
  id: string
  name: string
  description?: string
  info: {
    provider: string
    shortName: string
    pricePerMillionInput: number
    pricePerMillionOutput: number
    contextWindow: string
    features: string[]
  }
  pricing: {
    input: number
    output: number
  }
  contextLength: number
}

interface ModelCategory {
  name: string
  models: ModelInfo[]
}

interface AISettingFormProps {
  setting?: {
    id: string
    name: string
    description: string
    model: string
    system_prompt: string
    temperature: number
    max_tokens: number
    response_format: 'text' | 'json'
    is_active: boolean
    is_default: boolean
  }
  onSave: (data: any) => void
  onCancel: () => void
}

export default function AISettingForm({ setting, onSave, onCancel }: AISettingFormProps) {
  const [formData, setFormData] = useState({
    name: setting?.name || '',
    description: setting?.description || '',
    model: setting?.model || 'gpt-4-turbo-preview',
    system_prompt: setting?.system_prompt || '',
    temperature: setting?.temperature || 0.7,
    max_tokens: setting?.max_tokens || 2000,
    response_format: setting?.response_format || 'text' as 'text' | 'json',
    is_active: setting?.is_active !== false,
    is_default: setting?.is_default || false
  })

  const [modelCategories, setModelCategories] = useState<ModelCategory[]>([])
  const [loadingModels, setLoadingModels] = useState(true)
  const [modelsError, setModelsError] = useState<string | null>(null)
  const [selectedModel, setSelectedModel] = useState<ModelInfo | null>(null)

  // Load models on component mount
  useEffect(() => {
    const loadModels = async () => {
      try {
        setLoadingModels(true)
        const response = await fetch('/api/admin/ai-settings/models')
        const data = await response.json()
        
        if (data.success && data.data) {
          setModelCategories(data.data)
          
          // Find the selected model info
          if (formData.model) {
            for (const category of data.data) {
              const model = category.models.find((m: ModelInfo) => m.id === formData.model)
              if (model) {
                setSelectedModel(model)
                break
              }
            }
          }
        } else {
          setModelsError(data.error || 'Failed to load models')
        }
      } catch (error) {
        console.error('Error loading models:', error)
        setModelsError('Failed to load models')
      } finally {
        setLoadingModels(false)
      }
    }

    loadModels()
  }, [formData.model])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="name" className="text-sm font-medium text-white">
            Prompt Name <span className="text-red-500">*</span>
          </Label>
          <input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="mt-1 w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white placeholder-[#737373] focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/20 focus:outline-none transition-all duration-200"
            placeholder="e.g., Aggressive Sales Strategy"
            required
          />
        </div>

        <div>
          <Label htmlFor="description" className="text-sm font-medium text-white">
            Description
          </Label>
          <input
            id="description"
            type="text"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="mt-1 w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white placeholder-[#737373] focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/20 focus:outline-none transition-all duration-200"
            placeholder="Brief description of this prompt's purpose"
          />
        </div>
      </div>

      {/* Model Selection */}
      <div>
        <Label htmlFor="model" className="text-sm font-medium text-white">
          AI Model <span className="text-red-500">*</span>
        </Label>
        {loadingModels ? (
          <div className="mt-1 flex items-center justify-center py-8 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg">
            <Loader2 className="h-5 w-5 animate-spin text-[#3b82f6]" />
            <span className="ml-2 text-sm text-[#737373]">Loading available models...</span>
          </div>
        ) : modelsError ? (
          <div className="mt-1 p-4 bg-[#0a0a0a] border border-red-500/20 rounded-lg">
            <div className="flex items-center gap-2 text-red-500">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{modelsError}</span>
            </div>
            <p className="mt-2 text-xs text-[#737373]">
              Using fallback model list. Some models may not be available.
            </p>
          </div>
        ) : (
          <>
            <select
              id="model"
              value={formData.model}
              onChange={(e) => {
                const modelId = e.target.value
                setFormData({ ...formData, model: modelId })
                
                // Find and set the selected model info
                for (const category of modelCategories) {
                  const model = category.models.find(m => m.id === modelId)
                  if (model) {
                    setSelectedModel(model)
                    break
                  }
                }
              }}
              className="mt-1 w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/20 focus:outline-none transition-all duration-200"
              required
            >
              <option value="">Select a model...</option>
              {modelCategories.map((category) => (
                <optgroup key={category.name} label={category.name}>
                  {category.models.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name} ({model.info.contextWindow})
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            
            {/* Model Info Display */}
            {selectedModel && (
              <div className="mt-2 p-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-xs text-[#a3a3a3] mb-1">
                      {selectedModel.description || `${selectedModel.info.provider} model`}
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="text-green-500">
                        Input: ${selectedModel.info.pricePerMillionInput.toFixed(2)}/M
                      </span>
                      <span className="text-orange-500">
                        Output: ${selectedModel.info.pricePerMillionOutput.toFixed(2)}/M
                      </span>
                      <span className="text-[#737373]">•</span>
                      <span className="text-[#737373]">
                        Context: {selectedModel.info.contextWindow} tokens
                      </span>
                    </div>
                  </div>
                </div>
                {selectedModel.info.features.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {selectedModel.info.features.map((feature) => (
                      <span
                        key={feature}
                        className="px-2 py-0.5 text-xs bg-[#1a1a1a] border border-[#2a2a2a] rounded text-[#a3a3a3]"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* System Prompt */}
      <div>
        <Label htmlFor="system_prompt" className="text-sm font-medium text-white">
          System Prompt <span className="text-red-500">*</span>
        </Label>
        <textarea
          id="system_prompt"
          value={formData.system_prompt}
          onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
          className="mt-1 w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white placeholder-[#737373] focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/20 focus:outline-none transition-all duration-200 min-h-[200px]"
          placeholder="Enter the system prompt that will guide the AI's analysis..."
          required
        />
        <p className="mt-1 text-xs text-[#737373]">
          This prompt defines how the AI will analyze market trend reports
        </p>
      </div>

      {/* Advanced Settings */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-white">Advanced Settings</h3>
        
        {/* Temperature */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-sm text-[#a3a3a3]">
              Temperature: {formData.temperature}
            </Label>
            <span className="text-xs text-[#737373]">
              {formData.temperature < 0.3 ? 'More Focused' : 
               formData.temperature > 0.7 ? 'More Creative' : 'Balanced'}
            </span>
          </div>
          <Slider
            value={[formData.temperature]}
            onValueChange={(value) => setFormData({ ...formData, temperature: value[0] })}
            min={0}
            max={2}
            step={0.1}
            className="w-full"
          />
          <p className="mt-1 text-xs text-[#737373]">
            Controls randomness in responses. Lower = more deterministic
          </p>
        </div>

        {/* Max Tokens */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-sm text-[#a3a3a3]">
              Max Tokens: {formData.max_tokens}
            </Label>
          </div>
          <Slider
            value={[formData.max_tokens]}
            onValueChange={(value) => setFormData({ ...formData, max_tokens: value[0] })}
            min={500}
            max={4000}
            step={100}
            className="w-full"
          />
          <p className="mt-1 text-xs text-[#737373]">
            Maximum length of AI response (1 token ≈ 0.75 words)
          </p>
        </div>

        {/* Response Format */}
        <div>
          <Label htmlFor="response_format" className="text-sm font-medium text-white">
            Response Format
          </Label>
          <select
            id="response_format"
            value={formData.response_format}
            onChange={(e) => setFormData({ ...formData, response_format: e.target.value as 'text' | 'json' })}
            className="mt-1 w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/20 focus:outline-none transition-all duration-200"
          >
            <option value="text">Text (Human-readable)</option>
            <option value="json">JSON (Structured data)</option>
          </select>
        </div>

        {/* Switches */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="is_active" className="text-sm text-[#a3a3a3]">
              Active
            </Label>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="is_default" className="text-sm text-[#a3a3a3]">
              Set as Default
            </Label>
            <Switch
              id="is_default"
              checked={formData.is_default}
              onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#2a2a2a]">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          className="text-[#737373] hover:text-white"
        >
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button
          type="submit"
          className="bg-[#3b82f6] hover:bg-[#2563eb]"
        >
          <Save className="h-4 w-4 mr-2" />
          {setting ? 'Update' : 'Create'} Setting
        </Button>
      </div>
    </form>
  )
}