import { Vehicle, DealershipLocation } from './vehicle'
import { User } from './user'

export interface Transfer {
  _id?: string
  _type: 'transfer'
  vehicle: { _ref: string } | Vehicle
  fromStore: { _ref: string } | DealershipLocation
  toStore: { _ref: string } | DealershipLocation
  requestedBy: { _ref: string } | User
  status: 'requested' | 'approved' | 'in-transit' | 'delivered' | 'cancelled'
  reason?: string
  customerWaiting: boolean
  priority: boolean
  expectedPickupDate?: string
  actualPickupDate?: string
  deliveredDate?: string
  transportNotes?: string
  createdAt: string
  updatedAt?: string
}

export interface Activity {
  _id: string
  _type: 'activity'
  vehicle: { _ref: string }
  user: { _ref: string } | User
  action: 'claimed' | 'released' | 'commented' | 'status-updated' | 'transfer-started' | 'transfer-completed'
  details?: string
  metadata?: {
    fromStatus?: string
    toStatus?: string
    fromStore?: string
    toStore?: string
  }
  createdAt: string
}

export interface Comment {
  _id: string
  _type: 'comment'
  vehicle: { _ref: string }
  author: { _ref: string } | User
  text: string
  mentions?: Array<{ _ref: string }>
  edited: boolean
  editedAt?: string
  createdAt: string
}