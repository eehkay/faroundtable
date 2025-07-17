"use client"

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { Search, Bell, Menu } from 'lucide-react'
import { supabase } from '@/lib/supabase-client'
import type { UnifiedFeedItem, ActivityFeedItem, CommentFeedItem, TransferFeedItem } from '@/types/feed'

interface UnifiedActivityFeedProps {
  vehicleId: string
}

export default function UnifiedActivityFeed({ vehicleId }: UnifiedActivityFeedProps) {
  const { data: session } = useSession()
  const [feedItems, setFeedItems] = useState<UnifiedFeedItem[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({})
  const [error, setError] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)
  const [maxItems] = useState(6)

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        setError(null)
        
        const response = await fetch(`/api/vehicle/${vehicleId}/feed`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const { items } = await response.json()
        setFeedItems(items || [])
      } catch (error) {
        setError('Failed to load activity feed. Please check your connection.')
        setFeedItems([])
      } finally {
        setLoading(false)
      }
    }

    fetchFeed()
    
    // Subscribe to real-time updates for all relevant tables
    const activitiesChannel = supabase
      .channel(`activities-${vehicleId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activities',
          filter: `vehicle_id=eq.${vehicleId}`
        },
        () => {
          fetchFeed()
        }
      )
      .subscribe()

    const commentsChannel = supabase
      .channel(`comments-${vehicleId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `vehicle_id=eq.${vehicleId}`
        },
        () => {
          fetchFeed()
        }
      )
      .subscribe()

    const transfersChannel = supabase
      .channel(`transfers-${vehicleId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transfers',
          filter: `vehicle_id=eq.${vehicleId}`
        },
        () => {
          fetchFeed()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(activitiesChannel)
      supabase.removeChannel(commentsChannel)
      supabase.removeChannel(transfersChannel)
    }
  }, [vehicleId])

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !session?.user) return

    setPosting(true)
    setError(null)

    try {
      const response = await fetch('/api/comment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vehicleId,
          text: newComment.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`)
      }

      setNewComment('')
      
      // Refetch the entire feed to include the new comment
      const feedResponse = await fetch(`/api/vehicle/${vehicleId}/feed`)
      const { items } = await feedResponse.json()
      setFeedItems(items || [])
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to post comment. Please try again.')
    } finally {
      setPosting(false)
    }
  }

  const handleImageError = (itemId: string) => {
    setImageErrors(prev => ({ ...prev, [itemId]: true }))
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatTimeAgo = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
    
    if (seconds < 60) return 'now'
    
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m`
    
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h`
    
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d`
    
    const weeks = Math.floor(days / 7)
    if (weeks < 4) return `${weeks}w`
    
    const months = Math.floor(days / 30)
    if (months < 12) return `${months}mo`
    
    const years = Math.floor(days / 365)
    return `${years}y`
  }

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'claimed': return '🚚'
      case 'released': return '↩️'
      case 'commented': return '💬'
      case 'status-updated': return '📝'
      case 'transfer-started': return '🚗'
      case 'transfer-completed': return '✅'
      case 'transfer-approved': return '✅'
      case 'transfer-rejected': return '❌'
      case 'transfer-cancelled': return '🚫'
      default: return '📌'
    }
  }

  const getTransferIcon = (status: string) => {
    switch (status) {
      case 'requested': return '📋'
      case 'approved': return '✅'
      case 'rejected': return '❌'
      case 'cancelled': return '🚫'
      case 'in-transit': return '🚛'
      case 'delivered': return '📦'
      default: return '📋'
    }
  }

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const renderActivityItem = (item: ActivityFeedItem) => {
    const userName = item.user?.name || 'Someone'
    
    let description = item.details || 'Activity recorded'
    let emoji = '📌'
    let accentColor = 'border-[#333333]' // default
    let bgColor = 'bg-[#141414]' // slightly elevated background
    
    switch (item.action) {
      case 'claimed':
        description = `claimed this vehicle for transfer`
        emoji = '📦'
        accentColor = 'border-[#3b82f6]/50' // blue accent
        break
      case 'released':
        description = `released the transfer claim`
        emoji = '↩️'
        accentColor = 'border-[#737373]/50' // gray accent
        break
      case 'commented':
        description = `added a comment`
        emoji = '💬'
        accentColor = 'border-[#3b82f6]/50' // blue accent
        break
      case 'status-updated':
        description = `updated the status`
        emoji = '📝'
        accentColor = 'border-[#f59e0b]/50' // orange accent
        break
      case 'transfer-started':
        description = `started the transfer`
        emoji = '🚗'
        accentColor = 'border-[#3b82f6]/50' // blue accent
        break
      case 'transfer-completed':
        description = `completed the transfer`
        emoji = '✅'
        accentColor = 'border-[#10b981]/50' // green accent
        break
      case 'transfer-approved':
        description = `approved the transfer`
        emoji = '✅'
        accentColor = 'border-[#10b981]/50' // green accent
        break
      case 'transfer-rejected':
        description = `rejected the transfer`
        emoji = '❌'
        accentColor = 'border-[#ef4444]/50' // red accent
        break
      case 'transfer-cancelled':
        description = `cancelled the transfer`
        emoji = '🚫'
        accentColor = 'border-[#ef4444]/50' // red accent
        break
      case 'transfer-in-transit':
        description = `marked transfer as in-transit`
        emoji = '🚚'
        accentColor = 'border-[#f59e0b]/50' // orange accent
        break
      case 'transfer-delivered':
        description = `marked transfer as delivered`
        emoji = '✔️'
        accentColor = 'border-[#8b5cf6]/50' // purple accent
        break
      default:
        description = item.details || 'Activity recorded'
    }

    return (
      <div className={`${bgColor} border ${accentColor} rounded-lg p-3 hover:border-[#404040] transition-all duration-200`}>
        <div className="flex items-start gap-3">
          <div className="text-lg flex-shrink-0">{emoji}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-200">
              <span className="font-medium text-white">{userName}</span>
              <span className="text-gray-300"> {description}</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {formatTimeAgo(new Date(item.timestamp))}
            </p>
          </div>
        </div>
      </div>
    )
  }

  const renderCommentItem = (item: CommentFeedItem) => {
    return (
      <div className="bg-[#2a2a2a] border border-[#333333] rounded-xl p-4 hover:border-[#404040] transition-all duration-200">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            {item.author.image && !imageErrors[item.id] ? (
              <Image
                src={item.author.image}
                alt={item.author.name || 'User'}
                width={40}
                height={40}
                className="rounded-full"
                onError={() => handleImageError(item.id)}
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-medium">
                {getInitials(item.author.name || item.author.email || 'U')}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-semibold text-white">{item.author.name || 'Unknown User'}</span>
              <span className="text-sm text-gray-400">
                {formatTimeAgo(new Date(item.timestamp))}
              </span>
              {item.edited && (
                <span className="text-sm text-gray-500">(edited)</span>
              )}
            </div>
            <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap break-words">
              {item.text}
            </p>
          </div>
        </div>
      </div>
    )
  }

  const renderTransferItem = (item: TransferFeedItem) => {
    const getTransferDescription = () => {
      const requesterName = item.requestedBy?.name || 'Someone'
      const fromLocation = item.fromLocation?.name || 'Unknown Location'
      const toLocation = item.toLocation?.name || 'Unknown Location'
      
      switch (item.status) {
        case 'requested':
          return `📦 ${requesterName} claimed this vehicle for transfer from ${fromLocation} to ${toLocation}`
        case 'approved':
          const approverName = item.approvedBy?.name || 'Someone'
          return `✅ ${approverName} approved transfer request from ${fromLocation} to ${toLocation}`
        case 'rejected':
          const rejecterName = item.rejectedBy?.name || 'Someone'
          return `${rejecterName} rejected transfer request from ${fromLocation} to ${toLocation}`
        case 'cancelled':
          const cancellerName = item.cancelledBy?.name || 'Someone'
          return `${cancellerName} cancelled transfer from ${fromLocation} to ${toLocation}`
        case 'in-transit':
          return `🚚 Vehicle is in transit from ${fromLocation} to ${toLocation}`
        case 'delivered':
          return `✔️ Vehicle delivered from ${fromLocation} to ${toLocation}`
        default:
          return `Transfer ${item.status}: ${fromLocation} → ${toLocation}`
      }
    }

    return (
      <div className="bg-[#141414] border border-[#2a2a2a] rounded-lg p-3 hover:border-[#333333] transition-all duration-200">
        <div className="flex gap-3">
          <div className="text-lg">{getTransferIcon(item.status)}</div>
          <div className="flex-1">
            <p className="text-sm text-gray-200 font-medium">{getTransferDescription()}</p>
            
            {/* Transfer details */}
            <div className="mt-2 space-y-1">
              {item.moneyOffer && (
                <p className="text-xs text-green-400">💰 Offer: {formatMoney(item.moneyOffer)}</p>
              )}
              {item.requestedByDate && (
                <p className="text-xs text-blue-400">📅 Requested by: {new Date(item.requestedByDate).toLocaleDateString()}</p>
              )}
              {item.customerWaiting && (
                <p className="text-xs text-yellow-400">⏰ Customer waiting</p>
              )}
              {item.priority !== 'normal' && (
                <p className="text-xs text-red-400">🔥 Priority: {item.priority}</p>
              )}
            </div>
            
            <p className="text-xs text-gray-500 mt-2">
              {formatTimeAgo(new Date(item.timestamp))}
            </p>
          </div>
        </div>
      </div>
    )
  }

  const renderFeedItem = (item: UnifiedFeedItem) => {
    switch (item.type) {
      case 'activity':
        return renderActivityItem(item)
      case 'comment':
        return renderCommentItem(item)
      case 'transfer':
        return renderTransferItem(item)
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="bg-black rounded-lg border border-gray-800/50 overflow-hidden">
        {/* Header Section */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800/50">
          <h3 className="text-xl font-semibold text-white">Activity</h3>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 bg-gray-700 rounded animate-pulse" />
            <div className="w-5 h-5 bg-gray-700 rounded animate-pulse" />
            <div className="w-5 h-5 bg-gray-700 rounded animate-pulse" />
          </div>
        </div>
        
        <div className="p-4 space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-[#2a2a2a] border border-[#333333] rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gray-700 rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-700 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-700 rounded w-1/2" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#1f1f1f] rounded-lg border border-[#2a2a2a] transition-all duration-200">
      {/* Header Section */}
      <div className="p-6 border-b border-[#2a2a2a]">
        <h3 className="text-xl font-semibold text-white">Activity</h3>
      </div>

      {/* Show More/Less Button */}
      {feedItems.length > maxItems && (
        <div className="px-4 pt-4">
          <button 
            onClick={() => setShowAll(!showAll)}
            className="flex items-center text-gray-400 hover:text-white transition-colors text-sm"
          >
            <svg 
              className={`w-4 h-4 mr-2 transition-transform duration-200 ${showAll ? 'rotate-90' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            {showAll ? 'Show less' : 'Show more'}
          </button>
        </div>
      )}
      
      {error && (
        <div className="mx-4 my-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}
      
      {/* Feed Items */}
      <div className="p-4 space-y-4">
        {feedItems.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400 text-sm">No activity yet</p>
          </div>
        ) : (
          (showAll ? feedItems : feedItems.slice(0, maxItems)).map((item) => (
            <div key={`${item.type}-${item.id}`}>
              {renderFeedItem(item)}
            </div>
          ))
        )}
      </div>

      {/* Comment Form */}
      <div className="p-4 border-t border-[#2a2a2a]">
        <form onSubmit={handleCommentSubmit}>
          <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-xl p-3 focus-within:border-[#3b82f6] transition-colors">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  if (newComment.trim() && !posting) {
                    handleCommentSubmit(e)
                  }
                }
              }}
              placeholder="Write a comment..."
              className="w-full bg-transparent text-white placeholder-gray-400 resize-none border-none outline-none"
              rows={3}
            />
            <div className="flex justify-end mt-2">
              <button
                type="submit"
                disabled={!newComment.trim() || posting}
                className="px-6 py-2 bg-[#3b82f6] text-white rounded-lg hover:bg-[#2563eb] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
              >
                {posting ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}