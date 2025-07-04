export default {
  name: 'vehicle',
  title: 'Vehicle',
  type: 'document',
  fields: [
    // Identification
    { name: 'stockNumber', title: 'Stock Number', type: 'string', validation: Rule => Rule.required() },
    { name: 'vin', title: 'VIN', type: 'string', validation: Rule => Rule.required().length(17) },
    
    // Basic Information
    { name: 'year', title: 'Year', type: 'number', validation: Rule => Rule.required() },
    { name: 'make', title: 'Make', type: 'string', validation: Rule => Rule.required() },
    { name: 'model', title: 'Model', type: 'string', validation: Rule => Rule.required() },
    { name: 'trim', title: 'Trim', type: 'string' },
    { name: 'title', title: 'Title', type: 'string' },
    
    // Pricing
    { name: 'price', title: 'Price', type: 'number', validation: Rule => Rule.required().positive() },
    { name: 'salePrice', title: 'Sale Price', type: 'number' },
    { name: 'msrp', title: 'MSRP', type: 'number' },
    
    // Details
    { name: 'mileage', title: 'Mileage', type: 'number' },
    { name: 'condition', title: 'Condition', type: 'string', options: { list: ['new', 'used'] } },
    { name: 'exteriorColor', title: 'Exterior Color', type: 'string' },
    { name: 'bodyStyle', title: 'Body Style', type: 'string' },
    { name: 'fuelType', title: 'Fuel Type', type: 'string' },
    { name: 'description', title: 'Description', type: 'text' },
    
    // Features
    { name: 'features', title: 'Features', type: 'array', of: [{type: 'string'}] },
    
    // Status
    { 
      name: 'status', 
      title: 'Status', 
      type: 'string', 
      options: { 
        list: [
          { title: 'Available', value: 'available' },
          { title: 'Claimed', value: 'claimed' },
          { title: 'In Transit', value: 'in-transit' },
          { title: 'Delivered', value: 'delivered' }
        ] 
      }, 
      initialValue: 'available' 
    },
    
    // Store Information
    { name: 'storeCode', title: 'Store Code', type: 'string', validation: Rule => Rule.required() },
    { name: 'location', title: 'Current Location', type: 'reference', to: [{type: 'dealershipLocation'}] },
    { name: 'originalLocation', title: 'Original Location', type: 'reference', to: [{type: 'dealershipLocation'}] },
    
    // Transfer Information
    { name: 'currentTransfer', title: 'Current Transfer', type: 'reference', to: [{type: 'transfer'}] },
    
    // Images
    { name: 'imageUrls', title: 'Image URLs', type: 'array', of: [{type: 'url'}] },
    
    // Tracking
    { name: 'importedAt', title: 'Imported At', type: 'datetime', readOnly: true },
    { name: 'lastSeenInFeed', title: 'Last Seen in Feed', type: 'datetime', readOnly: true },
    { name: 'daysOnLot', title: 'Days on Lot', type: 'number', readOnly: true }
  ]
}