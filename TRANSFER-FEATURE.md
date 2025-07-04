# Transfer Request System Enhancement

## Feature Overview
Enable multiple concurrent transfer requests for the same vehicle, allowing stores to submit competing requests with transparent offers visible to all parties involved.

## Current System Analysis
- Single transfer request per vehicle
- Vehicle status changes to "claimed" immediately upon request
- Only one store can request a vehicle at a time
- Basic approval/rejection workflow

## Enhanced System Design

### Core Concepts

#### 1. Multiple Concurrent Requests
- Multiple stores can request the same vehicle simultaneously
- Vehicle remains "available" until a transfer is approved
- All pending requests are visible to relevant parties

#### 2. Enhanced Transfer Request Data
Each transfer request will include:
- **Transfer Notes**: Reason for the request
- **Money Offer**: Optional monetary incentive/trade value
- **Requested By Date**: Deadline for when the vehicle is needed
- **Customer Waiting**: Boolean flag if a customer is waiting
- **Priority Level**: Urgency indicator

#### 3. Transparency Rules
- All stores involved in requests can see competing offers
- Managers can see all requests for vehicles in their inventory
- Activity history shows all request attempts

### User Flows

#### Store Personnel (Sales/Manager)
1. Views available vehicle from another store
2. Clicks "Request Transfer"
3. Fills out request form:
   - Transfer notes (required)
   - Money offer (optional)
   - Requested by date (required)
   - Customer waiting checkbox
4. Submits request
5. Can view status of their requests
6. Receives notifications about competing requests
7. Gets notified of approval/rejection

#### Vehicle Owner Store (Manager)
1. Receives notification of transfer request
2. Views all pending requests for the vehicle
3. Sees side-by-side comparison:
   - Requesting store details
   - Offer amounts
   - Urgency/deadlines
   - Customer waiting status
4. Can approve one request (auto-rejects others)
5. Can explicitly reject requests with reason
6. Can communicate via comments

### Schema Updates

#### Vehicle Schema Changes
```typescript
// Remove
currentTransfer?: Reference<Transfer>

// Add
activeTransferRequests?: Array<Reference<Transfer>>
```

#### Transfer Schema Enhancements
```typescript
{
  // Existing fields
  requestingStore: Reference<DealershipLocation>
  requestedVehicle: Reference<Vehicle>
  status: 'requested' | 'approved' | 'rejected' | 'in-transit' | 'delivered'
  
  // New fields
  transferNotes: string // Required explanation
  moneyOffer?: number // Optional monetary offer
  requestedByDate: datetime // When vehicle is needed
  customerWaiting: boolean // Customer waiting flag
  priority: 'normal' | 'high' | 'urgent'
  
  // Rejection tracking
  rejectedAt?: datetime
  rejectedBy?: Reference<User>
  rejectionReason?: string
  
  // Competition tracking
  competingRequests?: number // Count at time of request
  approvedOver?: Array<Reference<Transfer>> // Other requests that were rejected
}
```

### API Endpoints

#### POST /api/transfer/request
Creates a new transfer request with enhanced data:
```typescript
{
  vehicleId: string
  transferNotes: string
  moneyOffer?: number
  requestedByDate: string
  customerWaiting: boolean
  priority?: 'normal' | 'high' | 'urgent'
}
```

#### GET /api/transfer/vehicle/[vehicleId]/requests
Returns all active transfer requests for a vehicle

#### PUT /api/transfer/[transferId]/approve
- Approves selected transfer
- Auto-rejects all other pending transfers
- Updates vehicle status to "claimed"

#### PUT /api/transfer/[transferId]/reject
Explicitly rejects a transfer with reason:
```typescript
{
  rejectionReason: string
}
```

### Notification System

#### New Notification Types
1. **New Competing Request**: When another store requests same vehicle
2. **Request Approved**: Your request was approved
3. **Request Rejected**: Your request was rejected (with reason)
4. **Request Auto-Rejected**: Another request was chosen
5. **Multiple Requests Pending**: For managers with decisions to make

#### Notification Recipients
- All users at stores with pending requests
- Managers at the vehicle owner store
- Transport team when request approved

### UI Components

#### Enhanced Request Modal
- Transfer notes textarea (required)
- Money offer input (optional)
- Date picker for "needed by"
- Customer waiting checkbox
- Priority selector
- Shows count of existing requests

#### Transfer Requests Panel
- Displays all pending requests
- Sort by: date submitted, money offer, priority
- Quick comparison view
- One-click approve/reject actions
- Rejection reason modal

#### Vehicle Detail Updates
- Shows "X stores interested" badge
- Lists all pending transfer requests
- Timeline of all request activity

### Activity Tracking

Track all transfer-related activities:
- Transfer requested by [User] from [Store]
- Offered $[Amount] for transfer
- Set priority: [Priority Level]
- Transfer approved by [Manager]
- Transfer rejected: [Reason]
- [X] other requests auto-rejected

### Business Rules

1. **Request Limits**: No limit on concurrent requests per vehicle
2. **Visibility**: Only involved stores see request details
3. **Auto-Rejection**: When one request is approved, others are auto-rejected
4. **Notification Timing**: Real-time for new requests, batched for updates
5. **Historical Data**: All requests preserved for analytics

### Analytics & Reporting

Track metrics for:
- Average requests per vehicle
- Approval rates by store
- Average money offers
- Time to decision
- Most common rejection reasons
- Transfer success rates

### Migration Strategy

1. Existing transfers maintain current status
2. New transfers use enhanced schema
3. Gradual rollout by store if needed
4. Training materials for new workflow

### Future Enhancements

1. **Automated Approval Rules**: Auto-approve based on criteria
2. **Transfer Credits System**: Track give/take balance between stores
3. **Predictive Analytics**: Suggest optimal transfer decisions
4. **Mobile App Integration**: Request transfers from mobile
5. **Integration with Finance**: Automatic inter-store billing

## Implementation Phases

### Phase 1: Core Multiple Requests
- Schema updates
- API modifications
- Basic UI for multiple requests

### Phase 2: Enhanced Features
- Money offers
- Priority levels
- Requested by dates
- Rejection reasons

### Phase 3: Advanced Features
- Analytics dashboard
- Notification preferences
- Automated workflows

## Success Metrics

1. **Efficiency**: Reduction in time to transfer decision
2. **Fairness**: Even distribution of approved transfers
3. **Transparency**: User satisfaction with visibility
4. **Utilization**: Increase in successful transfers
5. **Revenue**: Impact of money offers on decisions