export default {
  name: 'importLog',
  title: 'Import Log',
  type: 'document',
  fields: [
    { name: 'timestamp', title: 'Timestamp', type: 'datetime', validation: (Rule: any) => Rule.required() },
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
    prepare(selection: any) {
      const { timestamp, success, created, updated } = selection;
      return {
        title: `Import ${success ? '✓' : '✗'} - ${new Date(timestamp).toLocaleString()}`,
        subtitle: `Created: ${created || 0}, Updated: ${updated || 0}`
      }
    }
  }
}