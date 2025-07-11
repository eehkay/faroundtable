'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { X, Save } from 'lucide-react'

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

const AI_MODELS = [
  // GPT-4 Models
  { value: 'gpt-4-turbo-preview', label: 'GPT-4 Turbo Preview (Latest, Recommended)', category: 'GPT-4' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo (Stable)', category: 'GPT-4' },
  { value: 'gpt-4', label: 'GPT-4 (Original)', category: 'GPT-4' },
  { value: 'gpt-4-32k', label: 'GPT-4 32K (Extended Context)', category: 'GPT-4' },
  
  // GPT-3.5 Models
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (Fast & Affordable)', category: 'GPT-3.5' },
  { value: 'gpt-3.5-turbo-16k', label: 'GPT-3.5 Turbo 16K (Extended Context)', category: 'GPT-3.5' },
  
  // GPT-4o Models
  { value: 'gpt-4o', label: 'GPT-4o (Optimized for Speed)', category: 'GPT-4o' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Faster, Lower Cost)', category: 'GPT-4o' },
  
  // Specialized Models
  { value: 'o1-preview', label: 'O1 Preview (Advanced Reasoning)', category: 'Specialized' },
  { value: 'o1-mini', label: 'O1 Mini (Reasoning, Lower Cost)', category: 'Specialized' },
]

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
        <select
          id="model"
          value={formData.model}
          onChange={(e) => setFormData({ ...formData, model: e.target.value })}
          className="mt-1 w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/20 focus:outline-none transition-all duration-200"
          required
        >
          <option value="">Select a model...</option>
          {/* Group models by category */}
          {['GPT-4', 'GPT-3.5', 'GPT-4o', 'Specialized'].map((category) => (
            <optgroup key={category} label={category}>
              {AI_MODELS.filter(model => model.category === category).map((model) => (
                <option key={model.value} value={model.value}>
                  {model.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <p className="mt-1 text-xs text-[#737373]">
          {formData.model.includes('gpt-4') && !formData.model.includes('gpt-4o') && 'Best quality, slower response time'}
          {formData.model.includes('gpt-3.5') && 'Fast and affordable, good for simple analysis'}
          {formData.model.includes('gpt-4o') && 'Optimized balance of speed and quality'}
          {formData.model.includes('o1') && 'Advanced reasoning for complex analysis'}
          {!formData.model && 'Choose based on your speed vs quality needs'}
        </p>
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