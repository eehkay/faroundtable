'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Plus, Settings, Bot, Trash2, Edit, Check, X, AlertCircle, Copy, CheckCircle, FileText } from 'lucide-react'
import { toast } from 'sonner'
import AISettingForm from '@/components/admin/settings/AISettingForm'

interface AISetting {
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
  created_at: string
  updated_at: string
}

export default function AdminSettingsPage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [aiSettings, setAiSettings] = useState<AISetting[]>([])
  const [selectedSetting, setSelectedSetting] = useState<AISetting | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    fetchAISettings()
  }, [])

  const fetchAISettings = async () => {
    try {
      const response = await fetch('/api/admin/ai-settings')
      const data = await response.json()
      
      if (data.success) {
        setAiSettings(data.data)
      } else {
        toast.error('Failed to load AI settings')
      }
    } catch (error) {
      console.error('Error fetching AI settings:', error)
      toast.error('Failed to load AI settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (formData: Partial<AISetting>) => {
    try {
      const url = editingId 
        ? `/api/admin/ai-settings/${editingId}`
        : '/api/admin/ai-settings'
      
      const response = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success(editingId ? 'AI setting updated' : 'AI setting created')
        fetchAISettings()
        setShowForm(false)
        setEditingId(null)
      } else {
        toast.error(data.error || 'Failed to save AI setting')
      }
    } catch (error) {
      console.error('Error saving AI setting:', error)
      toast.error('Failed to save AI setting')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this AI setting?')) return

    try {
      const response = await fetch(`/api/admin/ai-settings/${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success('AI setting deleted')
        fetchAISettings()
      } else {
        toast.error(data.error || 'Failed to delete AI setting')
      }
    } catch (error) {
      console.error('Error deleting AI setting:', error)
      toast.error('Failed to delete AI setting')
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/ai-settings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_default: true })
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success('Default AI setting updated')
        fetchAISettings()
      } else {
        toast.error(data.error || 'Failed to update default setting')
      }
    } catch (error) {
      console.error('Error updating default setting:', error)
      toast.error('Failed to update default setting')
    }
  }

  const copyPrompt = (id: string, prompt: string) => {
    navigator.clipboard.writeText(prompt)
    setCopiedId(id)
    toast.success('System prompt copied to clipboard')
    setTimeout(() => setCopiedId(null), 2000)
  }

  const getModelBadgeVariant = (model: string): "default" | "secondary" | "outline" => {
    if (model.includes('gpt-4')) return 'default'
    if (model.includes('gpt-3.5')) return 'secondary'
    return 'outline'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#3b82f6]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-[#a3a3a3] mt-1">Manage system configuration and preferences</p>
        </div>
      </div>

      <Tabs defaultValue="ai" className="space-y-4">
        <TabsList className="bg-[#1f1f1f] border border-[#2a2a2a]">
          <TabsTrigger value="ai" className="data-[state=active]:bg-[#3b82f6]">
            <Bot className="h-4 w-4 mr-2" />
            AI Settings
          </TabsTrigger>
          <TabsTrigger value="general" disabled>
            <Settings className="h-4 w-4 mr-2" />
            General
            <Badge variant="outline" className="ml-2 text-xs">Soon</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ai" className="space-y-4">
          <Card className="bg-[#1f1f1f] border border-[#2a2a2a]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-[#3b82f6]" />
                    AI Analysis Settings
                  </CardTitle>
                  <CardDescription>
                    Configure AI models and system prompts for market trend analysis
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => window.location.href = '/admin/settings/ai-context'}
                    variant="outline"
                    className="border-[#2a2a2a] hover:bg-[#2a2a2a]"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Context Settings
                  </Button>
                  <Button
                    onClick={() => {
                      setShowForm(true)
                      setEditingId(null)
                    }}
                    className="bg-[#3b82f6] hover:bg-[#2563eb]"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Prompt
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {showForm ? (
                <AISettingForm
                  setting={editingId ? aiSettings.find(s => s.id === editingId) : undefined}
                  onSave={handleSave}
                  onCancel={() => {
                    setShowForm(false)
                    setEditingId(null)
                  }}
                />
              ) : (
                <div className="space-y-4">
                  {aiSettings.length === 0 ? (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        No AI settings configured. Add one to get started.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    aiSettings.map((setting) => (
                      <div
                        key={setting.id}
                        className="p-4 bg-[#141414] rounded-lg border border-[#2a2a2a] hover:bg-[#1a1a1a] transition-all duration-200"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-semibold text-white">
                                {setting.name}
                              </h3>
                              {setting.is_default && (
                                <Badge variant="default" className="text-xs">
                                  Default
                                </Badge>
                              )}
                              {!setting.is_active && (
                                <Badge variant="outline" className="text-xs">
                                  Inactive
                                </Badge>
                              )}
                              <Badge variant={getModelBadgeVariant(setting.model)} className="text-xs">
                                {setting.model}
                              </Badge>
                            </div>
                            
                            {setting.description && (
                              <p className="text-sm text-[#a3a3a3] mb-3">
                                {setting.description}
                              </p>
                            )}
                            
                            <div className="space-y-2">
                              <div className="flex items-center gap-4 text-xs text-[#737373]">
                                <span>Temperature: {setting.temperature}</span>
                                <span>Max Tokens: {setting.max_tokens}</span>
                                <span>Format: {setting.response_format}</span>
                              </div>
                              
                              <div className="relative">
                                <p className="text-xs text-[#737373] mb-1">System Prompt:</p>
                                <div className="bg-[#0a0a0a] p-3 rounded-lg border border-[#2a2a2a]">
                                  <p className="text-xs text-[#a3a3a3] whitespace-pre-wrap line-clamp-3">
                                    {setting.system_prompt}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 ml-4">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyPrompt(setting.id, setting.system_prompt)}
                              className="text-[#737373] hover:text-white"
                            >
                              {copiedId === setting.id ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                            {!setting.is_default && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleSetDefault(setting.id)}
                                className="text-[#737373] hover:text-white"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingId(setting.id)
                                setShowForm(true)
                              }}
                              className="text-[#737373] hover:text-white"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {!setting.is_default && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDelete(setting.id)}
                                className="text-red-400 hover:text-red-500"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* API Key Status */}
          <Card className="bg-[#1f1f1f] border border-[#2a2a2a]">
            <CardHeader>
              <CardTitle className="text-lg">API Configuration</CardTitle>
              <CardDescription>
                Status of required API keys for AI analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-[#141414] rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${process.env.OPENAI_API_KEY ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-sm font-medium text-white">OpenAI API Key</span>
                  </div>
                  <Badge variant={process.env.OPENAI_API_KEY ? 'default' : 'destructive'} className="text-xs">
                    {process.env.OPENAI_API_KEY ? 'Configured' : 'Missing'}
                  </Badge>
                </div>
                
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    API keys are managed through environment variables. Contact your system administrator to update them.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}