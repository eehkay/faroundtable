'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { X, UserX, AlertCircle } from 'lucide-react'

export default function ImpersonationIndicator() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  if (!session?.impersonating?.active) {
    return null
  }

  const stopImpersonation = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/impersonate', {
        method: 'DELETE'
      })

      if (response.ok) {
        await update()
        router.refresh()
        window.location.reload()
      }
    } catch (error) {
      console.error('Error stopping impersonation:', error)
    } finally {
      setLoading(false)
    }
  }

  const timeRemaining = () => {
    if (!session.impersonating) return ''
    
    const expiresAt = new Date(session.impersonating.expiresAt)
    const now = new Date()
    const diff = expiresAt.getTime() - now.getTime()
    
    if (diff <= 0) return 'Expired'
    
    const minutes = Math.floor(diff / 60000)
    if (minutes < 60) return `${minutes}m remaining`
    
    const hours = Math.floor(minutes / 60)
    return `${hours}h ${minutes % 60}m remaining`
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500/95 backdrop-blur-sm border-b border-yellow-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-900" />
            <div className="text-sm">
              <p className="font-medium text-yellow-900">
                Impersonating: {session.user.email}
              </p>
              <p className="text-xs text-yellow-800">
                Your account: {session.impersonating.originalUser.email} • {timeRemaining()}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={stopImpersonation}
            disabled={loading}
            className="text-yellow-900 hover:bg-yellow-600/20"
          >
            <UserX className="h-4 w-4 mr-1" />
            {loading ? 'Stopping...' : 'Exit Impersonation'}
          </Button>
        </div>
      </div>
    </div>
  )
}