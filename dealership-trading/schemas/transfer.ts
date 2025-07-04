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
          { title: 'Cancelled', value: 'cancelled' }
        ]
      },
      initialValue: 'requested'
    },
    { name: 'reason', title: 'Reason for Transfer', type: 'text' },
    { name: 'customerWaiting', title: 'Customer Waiting', type: 'boolean', initialValue: false },
    { name: 'priority', title: 'Priority', type: 'boolean', initialValue: false },
    { name: 'expectedPickupDate', title: 'Expected Pickup Date', type: 'date' },
    { name: 'actualPickupDate', title: 'Actual Pickup Date', type: 'date' },
    { name: 'deliveredDate', title: 'Delivered Date', type: 'datetime' },
    { name: 'transportNotes', title: 'Transport Notes', type: 'text' },
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