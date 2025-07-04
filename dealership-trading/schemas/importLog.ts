export default {
  name: 'importLog',
  title: 'Import Log',
  type: 'document',
  fields: [
    { name: 'timestamp', title: 'Timestamp', type: 'datetime', readOnly: true },
    { name: 'success', title: 'Success', type: 'boolean' },
    { 
      name: 'results', 
      title: 'Results', 
      type: 'object',
      fields: [
        { name: 'success', title: 'Successful Stores', type: 'number' },
        { name: 'failed', title: 'Failed Stores', type: 'number' },
        { name: 'created', title: 'Vehicles Created', type: 'number' },
        { name: 'updated', title: 'Vehicles Updated', type: 'number' },
        { name: 'deleted', title: 'Vehicles Deleted', type: 'number' },
        { name: 'errors', title: 'Errors', type: 'array', of: [{type: 'object', fields: [
          { name: 'vehicle', type: 'string' },
          { name: 'errors', type: 'array', of: [{type: 'string'}] }
        ]}] }
      ]
    }
  ],
  preview: {
    select: {
      timestamp: 'timestamp',
      success: 'success',
      created: 'results.created',
      updated: 'results.updated'
    },
    prepare({ timestamp, success, created, updated }: any) {
      return {
        title: `Import ${success ? 'Successful' : 'Failed'}`,
        subtitle: `${new Date(timestamp).toLocaleString()} - Created: ${created}, Updated: ${updated}`
      }
    }
  }
}