"use client"

import { useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Loader2 } from 'lucide-react'
import Image from 'next/image'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'

interface BugReportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function BugReportModal({ open, onOpenChange }: BugReportModalProps) {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('Screenshot must be less than 5MB')
        return
      }
      setScreenshot(file)
      setError('')
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setScreenshotPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    maxFiles: 1,
    multiple: false
  })

  const removeScreenshot = () => {
    setScreenshot(null)
    setScreenshotPreview(null)
  }

  const resetForm = () => {
    setMessage('')
    setScreenshot(null)
    setScreenshotPreview(null)
    setError('')
    setSuccess(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!message.trim()) {
      setError('Please describe the bug')
      return
    }

    setLoading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('message', message)
      formData.append('userEmail', session?.user?.email || '')
      formData.append('userName', session?.user?.name || '')
      formData.append('userRole', session?.user?.role || '')
      formData.append('userLocation', session?.user?.location?.name || 'N/A')
      
      if (screenshot) {
        formData.append('screenshot', screenshot)
      }

      const response = await fetch('/api/bug-report', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send bug report')
      }

      setSuccess(true)
      setTimeout(() => {
        onOpenChange(false)
        resetForm()
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send bug report')
    } finally {
      setLoading(false)
    }
  }

  if (!session) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Report a Bug</DialogTitle>
            <DialogDescription>
              Help us improve by reporting any issues you encounter. We&apos;ll review and address your report as soon as possible.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* User Info Display */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-[#1a1a1a] rounded-lg">
              <div>
                <Label className="text-xs text-gray-500 dark:text-gray-400">Reporter</Label>
                <p className="text-sm font-medium">{session.user.name}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500 dark:text-gray-400">Email</Label>
                <p className="text-sm font-medium">{session.user.email}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500 dark:text-gray-400">Role</Label>
                <p className="text-sm font-medium capitalize">{session.user.role}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500 dark:text-gray-400">Location</Label>
                <p className="text-sm font-medium">{session.user.location?.name || 'N/A'}</p>
              </div>
            </div>

            {/* Bug Description */}
            <div className="space-y-2">
              <Label htmlFor="message">Bug Description</Label>
              <Textarea
                id="message"
                placeholder="Please describe the issue you&apos;re experiencing..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[100px]"
                required
              />
            </div>

            {/* Screenshot Upload */}
            <div className="space-y-2">
              <Label>Screenshot (optional)</Label>
              {!screenshot ? (
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    isDragActive 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' 
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {isDragActive 
                      ? 'Drop the screenshot here' 
                      : 'Drag & drop a screenshot here, or click to select'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    PNG, JPG, GIF up to 5MB
                  </p>
                </div>
              ) : (
                <div className="relative rounded-lg border border-gray-200 dark:border-gray-700 p-2">
                  <div className="relative h-40 bg-gray-100 dark:bg-[#1a1a1a] rounded">
                    {screenshotPreview && (
                      <Image
                        src={screenshotPreview}
                        alt="Screenshot preview"
                        fill
                        className="object-contain rounded"
                      />
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {screenshot.name}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeScreenshot}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}
            
            {success && (
              <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-sm text-green-600 dark:text-green-400">Bug report sent successfully!</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || success}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Report'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}