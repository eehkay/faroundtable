export default {
  name: 'dealershipLocation',
  title: 'Dealership Location',
  type: 'document',
  fields: [
    { name: 'name', title: 'Name', type: 'string', validation: (Rule: any) => Rule.required() },
    { name: 'code', title: 'Location Code', type: 'string', validation: (Rule: any) => Rule.required() },
    { name: 'address', title: 'Address', type: 'string' },
    { name: 'city', title: 'City', type: 'string' },
    { name: 'state', title: 'State', type: 'string' },
    { name: 'zip', title: 'ZIP Code', type: 'string' },
    { name: 'phone', title: 'Phone', type: 'string' },
    { name: 'email', title: 'Email', type: 'string' },
    { name: 'csvFileName', title: 'CSV File Name', type: 'string', description: 'Expected CSV filename for this location' },
    { name: 'active', title: 'Active', type: 'boolean', initialValue: true }
  ]
}