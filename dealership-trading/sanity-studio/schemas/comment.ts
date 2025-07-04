export default {
  name: 'comment',
  title: 'Comment',
  type: 'document',
  fields: [
    { 
      name: 'vehicle', 
      title: 'Vehicle', 
      type: 'reference', 
      to: [{type: 'vehicle'}],
      validation: Rule => Rule.required()
    },
    { 
      name: 'author', 
      title: 'Author', 
      type: 'reference', 
      to: [{type: 'user'}],
      validation: Rule => Rule.required()
    },
    { 
      name: 'text', 
      title: 'Comment', 
      type: 'text',
      validation: Rule => Rule.required()
    },
    { 
      name: 'mentions', 
      title: 'Mentioned Users', 
      type: 'array', 
      of: [{type: 'reference', to: [{type: 'user'}]}]
    },
    { name: 'edited', title: 'Edited', type: 'boolean', initialValue: false },
    { name: 'editedAt', title: 'Edited At', type: 'datetime' },
    { name: 'createdAt', title: 'Created At', type: 'datetime', readOnly: true, initialValue: () => new Date().toISOString() }
  ]
}