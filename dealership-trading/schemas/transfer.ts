export default {
  name: 'transfer',
  title: 'Transfer',
  type: 'document',
  fields: [
    { 
      name: 'vehicle', 
      title: 'Vehicle', 
      type: 'reference', 
      to: [{type: 'vehicle'}],
      validation: (Rule: any) => Rule.required()
    },
    { 
      name: 'fromStore', 
      title: 'From Store', 
      type: 'reference', 
      to: [{type: 'dealershipLocation'}],
      validation: (Rule: any) => Rule.required()
    },
    { 
      name: 'toStore', 
      title: 'To Store', 
      type: 'reference', 
      to: [{type: 'dealershipLocation'}],
      validation: (Rule: any) => Rule.required()
    },
    { 
      name: 'requestedBy', 
      title: 'Requested By', 
      type: 'reference', 
      to: [{type: 'user'}],
      validation: (Rule: any) => Rule.required()
    },
    { 
      name: 'status', 
      title: 'Status', 
      type: 'string',
      options: {
        list: [
          { title: 'Requested', value: 'requested' },
          { title: 'Approved', value: 'approved' },
          { title: 'In Transit', value: 'in-transit' },
          { title: 'Delivered', value: 'delivered' },
          { title: 'Cancelled', value: 'cancelled' },
          { title: 'Rejected', value: 'rejected' }
        ]
      },
      initialValue: 'requested'
    },
    { name: 'reason', title: 'Reason for Transfer', type: 'text' },
    
    // Enhanced request fields
    { 
      name: 'transferNotes', 
      title: 'Transfer Notes', 
      type: 'text',
      description: 'Detailed explanation for this transfer request',
      validation: (Rule: any) => Rule.required()
    },
    { 
      name: 'moneyOffer', 
      title: 'Money Offer', 
      type: 'number',
      description: 'Optional monetary incentive or trade value offered'
    },
    { 
      name: 'requestedByDate', 
      title: 'Requested By Date', 
      type: 'datetime',
      description: 'When the vehicle is needed by',
      validation: (Rule: any) => Rule.required()
    },
    { name: 'customerWaiting', title: 'Customer Waiting', type: 'boolean', initialValue: false },
    { 
      name: 'priority', 
      title: 'Priority Level', 
      type: 'string',
      options: {
        list: [
          { title: 'Normal', value: 'normal' },
          { title: 'High', value: 'high' },
          { title: 'Urgent', value: 'urgent' }
        ]
      },
      initialValue: 'normal'
    },
    { name: 'expectedPickupDate', title: 'Expected Pickup Date', type: 'date' },
    { name: 'actualPickupDate', title: 'Actual Pickup Date', type: 'date' },
    { name: 'deliveredDate', title: 'Delivered Date', type: 'datetime' },
    { name: 'transportNotes', title: 'Transport Notes', type: 'text' },
    
    // Rejection tracking
    { name: 'rejectedAt', title: 'Rejected At', type: 'datetime', readOnly: true },
    { name: 'rejectedBy', title: 'Rejected By', type: 'reference', to: [{type: 'user'}] },
    { name: 'rejectionReason', title: 'Rejection Reason', type: 'text' },
    
    // Competition tracking
    { name: 'competingRequestsCount', title: 'Competing Requests Count', type: 'number', description: 'Number of other requests at time of submission' },
    { 
      name: 'approvedOver', 
      title: 'Approved Over', 
      type: 'array', 
      of: [{type: 'reference', to: [{type: 'transfer'}]}],
      description: 'Other transfer requests that were rejected when this was approved'
    },
    { name: 'createdAt', title: 'Created At', type: 'datetime', readOnly: true, initialValue: () => new Date().toISOString() },
    { name: 'updatedAt', title: 'Updated At', type: 'datetime', readOnly: true }
  ],
  preview: {
    select: {
      vehicleTitle: 'vehicle.title',
      fromStore: 'fromStore.name',
      toStore: 'toStore.name',
      status: 'status'
    },
    prepare({ vehicleTitle, fromStore, toStore, status }: any) {
      return {
        title: vehicleTitle || 'Vehicle Transfer',
        subtitle: `${fromStore} → ${toStore} (${status})`
      }
    }
  }
}