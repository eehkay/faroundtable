# Sanity Setup Guide for Round Table

## Your Sanity Project Details
- **Project ID**: bhik7rw7
- **Organization ID**: oDcZsUsyO

## Step 1: Create Sanity API Tokens

1. Go to https://www.sanity.io/manage/project/bhik7rw7/api
2. Create two tokens:
   - **Read Token**: For public queries (can be viewer level)
   - **Write Token**: For the import function and authentication (needs editor or admin level)
3. Update your `.env.local` file with these tokens

## Step 2: Set Up CORS Origins

1. Go to https://www.sanity.io/manage/project/bhik7rw7/api#cors-origins
2. Add these origins:
   - `http://localhost:3000` (for development)
   - Your Netlify domain (for production)
   - Allow credentials for both

## Step 3: Create a Sanity Studio

If you haven't already created a studio for this project:

```bash
# Create a new directory for your studio
mkdir dealership-studio
cd dealership-studio

# Initialize Sanity studio
npm create sanity@latest -- --project bhik7rw7 --dataset production

# When prompted:
# - Select "Clean project with no predefined schemas"
# - Choose TypeScript
```

## Step 4: Add Schema Files

Create these files in your `dealership-studio/schemas/` directory:

### schemas/user.ts
```typescript
export default {
  name: 'user',
  title: 'User',
  type: 'document',
  fields: [
    { name: 'email', title: 'Email', type: 'string', validation: Rule => Rule.required().email() },
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
      media: 'image'
    }
  }
}
```

### schemas/vehicle.ts
```typescript
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
```

### schemas/transfer.ts
```typescript
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
      validation: Rule => Rule.required()
    },
    { 
      name: 'fromStore', 
      title: 'From Store', 
      type: 'reference', 
      to: [{type: 'dealershipLocation'}],
      validation: Rule => Rule.required()
    },
    { 
      name: 'toStore', 
      title: 'To Store', 
      type: 'reference', 
      to: [{type: 'dealershipLocation'}],
      validation: Rule => Rule.required()
    },
    { 
      name: 'requestedBy', 
      title: 'Requested By', 
      type: 'reference', 
      to: [{type: 'user'}],
      validation: Rule => Rule.required()
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
    prepare({ vehicleTitle, fromStore, toStore, status }) {
      return {
        title: vehicleTitle || 'Vehicle Transfer',
        subtitle: `${fromStore} → ${toStore} (${status})`
      }
    }
  }
}
```

### schemas/activity.ts
```typescript
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
      validation: Rule => Rule.required()
    },
    { 
      name: 'user', 
      title: 'User', 
      type: 'reference', 
      to: [{type: 'user'}],
      validation: Rule => Rule.required()
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
      validation: Rule => Rule.required()
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
```

### schemas/comment.ts
```typescript
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
```

### schemas/dealershipLocation.ts
```typescript
export default {
  name: 'dealershipLocation',
  title: 'Dealership Location',
  type: 'document',
  fields: [
    { name: 'name', title: 'Name', type: 'string', validation: Rule => Rule.required() },
    { name: 'code', title: 'Location Code', type: 'string', validation: Rule => Rule.required() },
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
```

### schemas/importLog.ts (optional, for tracking imports)
```typescript
export default {
  name: 'importLog',
  title: 'Import Log',
  type: 'document',
  fields: [
    { name: 'timestamp', title: 'Timestamp', type: 'datetime' },
    { name: 'success', title: 'Success', type: 'boolean' },
    { name: 'results', title: 'Results', type: 'object', fields: [
      { name: 'success', type: 'number' },
      { name: 'failed', type: 'number' },
      { name: 'created', type: 'number' },
      { name: 'updated', type: 'number' },
      { name: 'deleted', type: 'number' },
      { name: 'errors', type: 'array', of: [{type: 'object'}] }
    ]}
  ]
}
```

## Step 5: Update schemas/index.ts

```typescript
import user from './user'
import vehicle from './vehicle'
import transfer from './transfer'
import activity from './activity'
import comment from './comment'
import dealershipLocation from './dealershipLocation'
import importLog from './importLog'

export const schemaTypes = [
  user,
  vehicle,
  transfer,
  activity,
  comment,
  dealershipLocation,
  importLog
]
```

## Step 6: Deploy your Studio

```bash
npm run deploy
```

Your studio will be available at: https://bhik7rw7.sanity.studio/

## Step 7: Create Initial Data

1. Open your studio at https://bhik7rw7.sanity.studio/
2. Create 5 Dealership Location documents:
   - Name: Store 1, Code: MP18527
   - Name: Store 2, Code: MP18528
   - Name: Store 3, Code: MP18529
   - Name: Store 4, Code: MP18530
   - Name: Store 5, Code: MP18531

3. Note down the document IDs (they'll look like: `drafts.abc123...`)
4. Update the `storeConfigs` array in your `netlify/functions/scheduled-import.ts` file with these IDs

## Step 8: Test Your Connection

Run your Next.js app:
```bash
npm run dev
```

Visit http://localhost:3000 and try logging in with Google OAuth.

## Troubleshooting

If you get CORS errors:
- Make sure you've added your origins in Sanity settings
- Check that credentials are allowed

If authentication fails:
- Verify your API tokens are correct
- Check that the dataset name is 'production'
- Ensure your Google OAuth is properly configured