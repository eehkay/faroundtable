'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { UserCheck, X, AlertCircle } from 'lucide-react'
import { canImpersonate } from '@/lib/permissions'

interface User {
  id: string
  name: string
  email: string
  role: string
  location?: {
    id: string
    name: string
    code: string
  }
}

export default function ImpersonationSelector() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(true)

  useEffect(() => {
    if (session && canImpersonate(session.user.role)) {
      fetchUsers()
    }
  }, [session])

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          name,
          email,
          role,
          location:location_id(
            id,
            name,
            code
          )
        `)
        .eq('active', true)
        .neq('role', 'admin') // Cannot impersonate admins
        .order('name')

      if (!error && data) {
        // Map and validate the data
        const validUsers: User[] = data.map((user: any) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          location: user.location && !Array.isArray(user.location) ? {
            id: user.location.id,
            name: user.location.name,
            code: user.location.code
          } : undefined
        }))
        setUsers(validUsers)
      }
    } catch (error) {
      // Error fetching users
    } finally {
      setLoadingUsers(false)
    }
  }

  const startImpersonation = async () => {
    if (!selectedUserId) return

    setLoading(true)
    try {
      const response = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUserId })
      })

      if (response.ok) {
        // Force session update
        await update()
        // Reload the page to apply impersonation
        router.refresh()
        window.location.reload()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to start impersonation')
      }
    } catch (error) {
      alert('Failed to start impersonation')
    } finally {
      setLoading(false)
    }
  }

  const stopImpersonation = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/impersonate', {
        method: 'DELETE'
      })

      if (response.ok) {
        // Force session update
        await update()
        // Reload the page to restore original session
        router.refresh()
        window.location.reload()
      } else {
        alert('Failed to stop impersonation')
      }
    } catch (error) {
      alert('Failed to stop impersonation')
    } finally {
      setLoading(false)
    }
  }

  if (!session || !canImpersonate(session.user.role)) {
    return null
  }

  // Currently impersonating
  if (session.impersonating?.active) {
    return (
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-yellow-500">Impersonation Active</h3>
            <p className="text-xs text-gray-400 mt-1">
              You are viewing as: <span className="font-medium text-white">{session.user.email}</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Your account: {session.impersonating.originalUser.email}
            </p>
          </div>
          <Button
            onClick={stopImpersonation}
            disabled={loading}
            size="sm"
            variant="destructive"
            className="bg-yellow-600 hover:bg-yellow-700"
          >
            {loading ? 'Stopping...' : 'Stop Impersonation'}
          </Button>
        </div>
      </div>
    )
  }

  // Impersonation selector
  return (
    <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg p-4">
      <h3 className="text-sm font-medium text-white mb-3">User Impersonation</h3>
      <div className="flex gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              className="flex-1 justify-between bg-zinc-800 border-zinc-700 text-left"
              disabled={loadingUsers || loading}
            >
              {selectedUserId ? (
                users.find(u => u.id === selectedUserId)?.name || 'Select user'
              ) : (
                loadingUsers ? "Loading users..." : "Select a user to impersonate"
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80">
            {['manager', 'sales', 'transport'].map(role => {
              const roleUsers = users.filter(u => u.role === role)
              if (roleUsers.length === 0) return null
              
              return (
                <div key={role}>
                  <DropdownMenuLabel className="text-xs font-medium text-gray-400 uppercase">
                    {role}s
                  </DropdownMenuLabel>
                  {roleUsers.map(user => (
                    <DropdownMenuItem 
                      key={user.id} 
                      onClick={() => setSelectedUserId(user.id)}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span>{user.name || user.email}</span>
                        {user.location && (
                          <span className="text-xs text-gray-400">
                            ({user.location.name})
                          </span>
                        )}
                      </div>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                </div>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          onClick={startImpersonation}
          disabled={!selectedUserId || loading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <UserCheck className="h-4 w-4 mr-1" />
          {loading ? 'Starting...' : 'Impersonate'}
        </Button>
      </div>
      <p className="text-xs text-gray-400 mt-2">
        Debug and test the application as different users. Sessions expire after 1 hour.
      </p>
    </div>
  )
}