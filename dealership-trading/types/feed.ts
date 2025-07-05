export interface BaseFeedItem {
  id: string
  timestamp: string
  type: 'activity' | 'comment' | 'transfer'
}

export interface ActivityFeedItem extends BaseFeedItem {
  type: 'activity'
  action: string
  details?: string
  metadata?: any
  user?: {
    _id: string
    name: string
    email: string
    image?: string
  }
}

export interface CommentFeedItem extends BaseFeedItem {
  type: 'comment'
  text: string
  edited: boolean
  editedAt?: string
  author: {
    _id: string
    name: string
    email: string
    image?: string
  }
  mentions?: string[]
}

export interface TransferFeedItem extends BaseFeedItem {
  type: 'transfer'
  transferId: string
  status: 'requested' | 'approved' | 'rejected' | 'cancelled' | 'in-transit' | 'delivered'
  reason?: string
  transferNotes: string
  moneyOffer?: number
  requestedByDate: string
  customerWaiting: boolean
  priority: 'normal' | 'high' | 'urgent'
  expectedPickupDate?: string
  actualPickupDate?: string
  deliveredDate?: string
  approvedAt?: string
  rejectedAt?: string
  rejectionReason?: string
  cancelledAt?: string
  transportNotes?: string
  competingRequestsCount: number
  fromLocation: {
    _id: string
    name: string
    code: string
  }
  toLocation: {
    _id: string
    name: string
    code: string
  }
  requestedBy: {
    _id: string
    name: string
    email: string
  }
  approvedBy?: {
    _id: string
    name: string
    email: string
  }
  rejectedBy?: {
    _id: string
    name: string
    email: string
  }
  cancelledBy?: {
    _id: string
    name: string
    email: string
  }
}

export type UnifiedFeedItem = ActivityFeedItem | CommentFeedItem | TransferFeedItem

export interface UnifiedFeedResponse {
  items: UnifiedFeedItem[]
  hasMore: boolean
  cursor?: string
}