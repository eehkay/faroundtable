export default {
  name: 'user',
  title: 'User',
  type: 'document',
  fields: [
    { name: 'email', title: 'Email', type: 'string', validation: (Rule: any) => Rule.required().email() },
    { name: 'name', title: 'Name', type: 'string' },
    { name: 'image', title: 'Profile Image', type: 'url' },
    { name: 'domain', title: 'Email Domain', type: 'string' },
    { 
      name: 'role', 
      title: 'Role', 
      type: 'string',
      options: {
        list: [
          { title: 'Sales', value: 'sales' },
          { title: 'Manager', value: 'manager' },
          { title: 'Admin', value: 'admin' },
          { title: 'Transport', value: 'transport' }
        ]
      },
      initialValue: 'sales'
    },
    { 
      name: 'location', 
      title: 'Primary Location', 
      type: 'reference',
      to: [{ type: 'dealershipLocation' }]
    },
    { name: 'lastLogin', title: 'Last Login', type: 'datetime' },
    { name: 'active', title: 'Active', type: 'boolean', initialValue: true }
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'email',
      role: 'role'
    },
    prepare(selection: any) {
      const { title, subtitle, role } = selection
      return {
        title: title || subtitle,
        subtitle: `${subtitle} • ${role || 'sales'}`
      }
    }
  }
}