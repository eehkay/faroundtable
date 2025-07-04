export default {
  name: 'activity',
  title: 'Activity',
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
      name: 'user', 
      title: 'User', 
      type: 'reference', 
      to: [{type: 'user'}],
      validation: (Rule: any) => Rule.required()
    },
    { 
      name: 'action', 
      title: 'Action', 
      type: 'string',
      options: {
        list: [
          { title: 'Claimed', value: 'claimed' },
          { title: 'Released', value: 'released' },
          { title: 'Commented', value: 'commented' },
          { title: 'Status Updated', value: 'status-updated' },
          { title: 'Transfer Started', value: 'transfer-started' },
          { title: 'Transfer Completed', value: 'transfer-completed' }
        ]
      },
      validation: (Rule: any) => Rule.required()
    },
    { name: 'details', title: 'Details', type: 'text' },
    { name: 'metadata', title: 'Metadata', type: 'object', fields: [
      { name: 'fromStatus', type: 'string' },
      { name: 'toStatus', type: 'string' },
      { name: 'fromStore', type: 'string' },
      { name: 'toStore', type: 'string' }
    ]},
    { name: 'createdAt', title: 'Created At', type: 'datetime', readOnly: true, initialValue: () => new Date().toISOString() }
  ],
  orderings: [
    {
      title: 'Recent First',
      name: 'recentFirst',
      by: [{ field: 'createdAt', direction: 'desc' }]
    }
  ]
}