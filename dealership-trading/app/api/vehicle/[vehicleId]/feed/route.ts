import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getVehicleActivity, getVehicleComments, getVehicleTransfers } from '@/lib/queries-supabase'
import type { UnifiedFeedItem, ActivityFeedItem, CommentFeedItem, TransferFeedItem } from '@/types/feed'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ vehicleId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { vehicleId } = await params
    
    if (!vehicleId) {
      return NextResponse.json({ error: 'Vehicle ID is required' }, { status: 400 })
    }

    // Fetch all data in parallel
    const [activities, comments, transfers] = await Promise.all([
      getVehicleActivity(vehicleId),
      getVehicleComments(vehicleId),
      getVehicleTransfers(vehicleId)
    ])

    // Transform activities to feed items (exclude 'commented' activities since comments are shown separately)
    const activityItems: ActivityFeedItem[] = activities
      .filter(activity => activity.action !== 'commented')
      .map(activity => ({
        id: activity._id,
        type: 'activity' as const,
        timestamp: activity.createdAt,
        action: activity.action,
        details: activity.details,
        metadata: activity.metadata,
        user: activity.user ? {
          _id: activity.user.name || 'unknown',
          name: activity.user.name,
          email: activity.user.email,
          image: activity.user.image
        } : undefined
      }))

    // Transform comments to feed items
    const commentItems: CommentFeedItem[] = comments
      .filter(comment => comment.author && '_id' in comment.author)
      .map(comment => {
        const author = comment.author as { _id: string; name: string; email: string; image?: string }
        return {
          id: comment._id,
          type: 'comment' as const,
          timestamp: comment.createdAt,
          text: comment.text,
          edited: comment.edited,
          editedAt: comment.editedAt,
          author: {
            _id: author._id,
            name: author.name,
            email: author.email,
            image: author.image
          },
          mentions: comment.mentions || []
        }
      })

    // Transform transfers to feed items
    const transferItems: TransferFeedItem[] = transfers
      .filter(transfer => transfer.fromLocation && transfer.toLocation && transfer.requestedBy)
      .map(transfer => ({
        id: transfer._id,
        type: 'transfer' as const,
        timestamp: transfer.createdAt,
        transferId: transfer._id,
        status: transfer.status,
        reason: transfer.reason,
        transferNotes: transfer.transferNotes,
        moneyOffer: transfer.moneyOffer,
        requestedByDate: transfer.requestedByDate,
        customerWaiting: transfer.customerWaiting,
        priority: transfer.priority,
        expectedPickupDate: transfer.expectedPickupDate,
        actualPickupDate: transfer.actualPickupDate,
        deliveredDate: transfer.deliveredDate,
        approvedAt: transfer.approvedAt,
        rejectedAt: transfer.rejectedAt,
        rejectionReason: transfer.rejectionReason,
        cancelledAt: transfer.cancelledAt,
        transportNotes: transfer.transportNotes,
        competingRequestsCount: transfer.competingRequestsCount,
        fromLocation: transfer.fromLocation!,
        toLocation: transfer.toLocation!,
        requestedBy: transfer.requestedBy!,
        approvedBy: transfer.approvedBy,
        rejectedBy: transfer.rejectedBy,
        cancelledBy: transfer.cancelledBy
      }))

    // Combine all items and sort by timestamp (newest first)
    const allItems: UnifiedFeedItem[] = [
      ...activityItems,
      ...commentItems,
      ...transferItems
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    return NextResponse.json({
      items: allItems,
      hasMore: false // Pagination not implemented as feed is limited to 20 most recent items
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch feed data' },
      { status: 500 }
    )
  }
}