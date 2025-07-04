# Claude Code Build Guide - Inter-Dealership Trading System

## Project Overview

Build an internal inventory trading system for a dealership group with 5 locations. The system enables stores to claim vehicles from each other, track transfers, and communicate about trades. Features daily CSV imports from SFTP, Google SSO authentication, real-time activity tracking, and comprehensive transfer management.

## Architecture Summary

- **Frontend**: Next.js 14 (App Router) hosted on Netlify
- **Authentication**: NextAuth.js with Google SSO (domain-restricted)
- **CMS/Database**: Sanity.io
- **CSV Import**: Netlify Scheduled Functions (2 AM daily)
- **Styling**: Tailwind CSS
- **Real-time Updates**: Sanity listeners for activity feeds

## Build Order

### Phase 1: Project Initialization

1. **Create Next.js Project**
```bash
npx create-next-app@latest dealership-trading --app --tailwind --typescript
cd dealership-trading
```

2. **Install Dependencies**
```bash
# Core dependencies
npm install @sanity/client groq @sanity/image-url
npm install next-auth
npm install lucide-react
npm install date-fns

# Dev dependencies
npm install --save-dev @types/node
```

3. **Create Project Structure**
```
dealership-trading/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx
│   ├── (authenticated)/
│   │   ├── layout.tsx
│   │   ├── inventory/
│   │   │   ├── page.tsx
│   │   │   └── [stockNumber]/
│   │   │       └── page.tsx
│   │   ├── transfers/
│   │   │   └── page.tsx
│   │   └── dashboard/
│   │       └── page.tsx
│   └── api/
│       ├── auth/
│       │   └── [...nextauth]/
│       │       └── route.ts
│       ├── transfer/
│       │   ├── claim/
│       │   │   └── route.ts
│       │   └── update/
│       │       └── route.ts
│       ├── comment/
│       │   └── route.ts
│       └── search/
│           └── route.ts
├── components/
│   ├── auth/
│   │   ├── LoginButton.tsx
│   │   └── UserMenu.tsx
│   ├── inventory/
│   │   ├── VehicleCard.tsx
│   │   ├── VehicleGrid.tsx
│   │   ├── VehicleFilters.tsx
│   │   ├── VehicleSearch.tsx
│   │   └── TransferStatus.tsx
│   ├── vehicle/
│   │   ├── VehicleGallery.tsx
│   │   ├── VehicleSpecs.tsx
│   │   ├── ClaimButton.tsx
│   │   ├── ActivityFeed.tsx
│   │   └── CommentSection.tsx
│   └── transfers/
│       ├── TransferList.tsx
│       ├── TransferCard.tsx
│       └── TransferStats.tsx
├── lib/
│   ├── auth.ts
│   ├── sanity.ts
│   ├── queries.ts
│   └── permissions.ts
├── types/
│   ├── vehicle.ts
│   ├── transfer.ts
│   └── user.ts
├── middleware.ts
└── netlify/
    └── functions/
        ├── scheduled-import.ts
        └── utils/
            ├── csv-parser.ts
            └── sanity-sync.ts
```

### Phase 2: Authentication Setup

1. **Configure Google OAuth**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create OAuth 2.0 credentials
   - Add redirect URIs:
     - `http://localhost:3000/api/auth/callback/google`
     - `https://yourdomain.netlify.app/api/auth/callback/google`

2. **Create Authentication Files**

Create `/app/api/auth/[...nextauth]/route.ts`:
```typescript
import NextAuth, { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { createClient } from '@sanity/client'

const sanityClient = createClient({
  projectId: process.env.SANITY_PROJECT_ID!,
  dataset: process.env.SANITY_DATASET!,
  token: process.env.SANITY_WRITE_TOKEN!,
  apiVersion: '2023-01-01',
  useCdn: false,
})

// Allowed domains from environment variable
const ALLOWED_DOMAINS = process.env.ALLOWED_DOMAINS?.split(',') || ['yourdealership.com']

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          hd: ALLOWED_DOMAINS[0] // Primary domain restriction
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      const email = profile?.email || ''
      const domain = email.split('@')[1]
      
      // Verify domain is allowed
      if (!ALLOWED_DOMAINS.includes(domain)) {
        console.log(`Rejected login from unauthorized domain: ${domain}`)
        return false
      }
      
      try {
        // Check if user exists and is active
        const existingUser = await sanityClient.fetch(
          `*[_type == "user" && email == $email][0]`,
          { email }
        )
        
        if (existingUser && existingUser.active === false) {
          console.log(`Rejected login from deactivated user: ${email}`)
          return false
        }
        
        // Create or update user
        await sanityClient.createOrReplace({
          _id: `user.${email.replace(/[^a-z0-9]/gi, '_')}`,
          _type: 'user',
          email,
          name: user.name,
          image: user.image,
          domain,
          lastLogin: new Date().toISOString(),
          active: true,
          role: existingUser?.role || 'sales' // Preserve existing role
        })
        
        return true
      } catch (error) {
        console.error('Error during sign in:', error)
        return false
      }
    },
    
    async session({ session, token }) {
      if (session?.user?.email) {
        // Fetch user data from Sanity
        const sanityUser = await sanityClient.fetch(
          `*[_type == "user" && email == $email][0]{
            _id,
            email,
            name,
            role,
            location->{_id, name, code},
            active
          }`,
          { email: session.user.email }
        )
        
        if (sanityUser) {
          session.user.id = sanityUser._id
          session.user.role = sanityUser.role
          session.user.location = sanityUser.location
          session.user.domain = session.user.email.split('@')[1]
        }
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
    error: '/login?error=auth',
  },
  session: {
    strategy: 'jwt',
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
```

Create `middleware.ts`:
```typescript
import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const email = token?.email as string
    const allowedDomains = process.env.ALLOWED_DOMAINS?.split(',') || []
    const userDomain = email?.split('@')[1]
    
    // Double-check domain even after authentication
    if (userDomain && !allowedDomains.includes(userDomain)) {
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }
    
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    },
  }
)

// Protect all routes except public ones
export const config = {
  matcher: [
    '/((?!login|api/auth|unauthorized|_next/static|_next/image|favicon.ico).*)',
  ],
}
```

### Phase 3: Sanity Schema Setup

1. **Initialize Sanity Studio**
```bash
npm create sanity@latest -- --template clean --project dealership-studio --dataset production
cd dealership-studio
```

2. **Create Schemas**

Create `schemas/user.ts`:
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

Create `schemas/vehicle.ts`:
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

Create `schemas/transfer.ts`:
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

Create `schemas/activity.ts`:
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

Create `schemas/comment.ts`:
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

Create `schemas/dealershipLocation.ts`:
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

### Phase 4: Type Definitions

Create `types/next-auth.d.ts`:
```typescript
import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
      location?: {
        _id: string
        name: string
        code: string
      }
      domain: string
    } & DefaultSession["user"]
  }
}
```

Create `types/user.ts`:
```typescript
export interface User {
  _id: string
  _type: 'user'
  email: string
  name: string
  image?: string
  domain: string
  role: 'sales' | 'manager' | 'admin' | 'transport'
  location?: {
    _ref: string
    _type: 'reference'
  }
  lastLogin: string
  active: boolean
}
```

Create `types/vehicle.ts`:
```typescript
export interface Vehicle {
  _id?: string
  _type?: 'vehicle'
  stockNumber: string
  vin: string
  year: number
  make: string
  model: string
  trim?: string
  title?: string
  price: number
  salePrice?: number
  msrp?: number
  mileage?: number
  condition: 'new' | 'used'
  exteriorColor?: string
  bodyStyle?: string
  fuelType?: string
  description?: string
  features?: string[]
  status: 'available' | 'claimed' | 'in-transit' | 'delivered'
  storeCode: string
  location?: DealershipLocation | { _ref: string }
  originalLocation?: DealershipLocation | { _ref: string }
  currentTransfer?: Transfer | { _ref: string }
  imageUrls?: string[]
  importedAt?: string
  lastSeenInFeed?: string
  daysOnLot?: number
}

export interface DealershipLocation {
  _id: string
  _type: 'dealershipLocation'
  name: string
  code: string
  address?: string
  city?: string
  state?: string
  zip?: string
  phone?: string
  csvFileName?: string
  active: boolean
}
```

Create `types/transfer.ts`:
```typescript
export interface Transfer {
  _id?: string
  _type: 'transfer'
  vehicle: { _ref: string } | Vehicle
  fromStore: { _ref: string } | DealershipLocation
  toStore: { _ref: string } | DealershipLocation
  requestedBy: { _ref: string } | User
  status: 'requested' | 'approved' | 'in-transit' | 'delivered' | 'cancelled'
  reason?: string
  customerWaiting: boolean
  priority: boolean
  expectedPickupDate?: string
  actualPickupDate?: string
  deliveredDate?: string
  transportNotes?: string
  createdAt: string
  updatedAt?: string
}

export interface Activity {
  _id: string
  _type: 'activity'
  vehicle: { _ref: string }
  user: { _ref: string } | User
  action: 'claimed' | 'released' | 'commented' | 'status-updated' | 'transfer-started' | 'transfer-completed'
  details?: string
  metadata?: {
    fromStatus?: string
    toStatus?: string
    fromStore?: string
    toStore?: string
  }
  createdAt: string
}

export interface Comment {
  _id: string
  _type: 'comment'
  vehicle: { _ref: string }
  author: { _ref: string } | User
  text: string
  mentions?: Array<{ _ref: string }>
  edited: boolean
  editedAt?: string
  createdAt: string
}
```

### Phase 5: Sanity Client & Queries

Create `lib/sanity.ts`:
```typescript
import { createClient } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2023-01-01',
  useCdn: true,
})

export const writeClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2023-01-01',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
})

const builder = imageUrlBuilder(client)

export const urlFor = (source: any) => {
  return builder.image(source)
}

// Real-time subscription client
export const listenClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2023-01-01',
  useCdn: false,
  withCredentials: true,
})
```

Create `lib/queries.ts`:
```typescript
import { groq } from '@sanity/client'

// Vehicle queries
export const vehiclesQuery = groq`
  *[_type == "vehicle"] | order(createdAt desc) {
    _id,
    stockNumber,
    vin,
    year,
    make,
    model,
    trim,
    title,
    price,
    salePrice,
    msrp,
    mileage,
    condition,
    exteriorColor,
    bodyStyle,
    fuelType,
    imageUrls,
    status,
    storeCode,
    location->{
      _id,
      name,
      code
    },
    originalLocation->{
      _id,
      name,
      code
    },
    currentTransfer->{
      _id,
      status,
      toStore->{name}
    },
    daysOnLot
  }
`

export const vehicleByStockNumberQuery = groq`
  *[_type == "vehicle" && stockNumber == $stockNumber][0] {
    ...,
    location->{
      _id,
      name,
      code,
      address,
      city,
      state,
      zip,
      phone
    },
    originalLocation->{
      _id,
      name,
      code
    },
    currentTransfer->{
      ...,
      fromStore->{name, code},
      toStore->{name, code},
      requestedBy->{name, email}
    }
  }
`

// Transfer queries
export const activeTransfersQuery = groq`
  *[_type == "transfer" && status in ["requested", "approved", "in-transit"]] | order(createdAt desc) {
    _id,
    status,
    reason,
    customerWaiting,
    priority,
    expectedPickupDate,
    createdAt,
    vehicle->{
      _id,
      stockNumber,
      title,
      imageUrls
    },
    fromStore->{name, code},
    toStore->{name, code},
    requestedBy->{name, email}
  }
`

export const transfersByStoreQuery = groq`
  *[_type == "transfer" && (fromStore._ref == $storeId || toStore._ref == $storeId)] | order(createdAt desc) [0...50] {
    _id,
    status,
    createdAt,
    vehicle->{
      stockNumber,
      title
    },
    fromStore->{name},
    toStore->{name},
    requestedBy->{name}
  }
`

// Activity queries
export const vehicleActivityQuery = groq`
  *[_type == "activity" && vehicle._ref == $vehicleId] | order(createdAt desc) [0...20] {
    _id,
    action,
    details,
    metadata,
    createdAt,
    user->{
      name,
      email,
      image
    }
  }
`

// Comment queries
export const vehicleCommentsQuery = groq`
  *[_type == "comment" && vehicle._ref == $vehicleId] | order(createdAt desc) {
    _id,
    text,
    edited,
    editedAt,
    createdAt,
    author->{
      _id,
      name,
      email,
      image
    },
    mentions[]->{
      _id,
      name
    }
  }
`

// Search query
export const vehicleSearchQuery = groq`
  *[_type == "vehicle" && (
    make match $search + "*" ||
    model match $search + "*" ||
    stockNumber match $search + "*" ||
    vin match $search + "*" ||
    title match $search + "*"
  )] | order(price asc) [0...50] {
    _id,
    stockNumber,
    title,
    price,
    imageUrls,
    status,
    location->{name}
  }
`

// Dashboard stats
export const dashboardStatsQuery = groq`
  {
    "totalVehicles": count(*[_type == "vehicle"]),
    "availableVehicles": count(*[_type == "vehicle" && status == "available"]),
    "activeTransfers": count(*[_type == "transfer" && status in ["requested", "approved", "in-transit"]]),
    "recentActivity": *[_type == "activity"] | order(createdAt desc) [0...10] {
      action,
      createdAt,
      vehicle->{title, stockNumber},
      user->{name}
    }
  }
`
```

Create `lib/permissions.ts`:
```typescript
// Permission helper functions
export function canClaimVehicle(role: string): boolean {
  return ['sales', 'manager', 'admin'].includes(role)
}

export function canApproveTransfer(role: string): boolean {
  return ['manager', 'admin'].includes(role)
}

export function canUpdateTransferStatus(role: string): boolean {
  return ['manager', 'admin', 'transport'].includes(role)
}

export function canDeleteComment(role: string, isAuthor: boolean): boolean {
  return role === 'admin' || (isAuthor && ['manager', 'sales'].includes(role))
}

export function canEditComment(role: string, isAuthor: boolean): boolean {
  return isAuthor
}

export function canManageUsers(role: string): boolean {
  return role === 'admin'
}

export function canViewAllTransfers(role: string): boolean {
  return ['manager', 'admin'].includes(role)
}

export function canExportData(role: string): boolean {
  return ['manager', 'admin'].includes(role)
}
```

### Phase 6: CSV Parser Implementation

Create `netlify/functions/utils/csv-parser.ts`:
```typescript
import Papa from 'papaparse';

interface CSVRow {
  id: number;
  VIN: string;
  brand: string;
  model: string;
  year: number;
  price: string;
  vehicle_msrp: string;
  mileage: string;
  condition: string;
  color: string;
  trim: string;
  body_style: string;
  engine: string;
  store_code: string;
  address: string;
  title: string;
  dealership_name: string;
  description: string;
  image_link: string;
  image_link1: string;
  image_link2: string;
  image_link3: string;
  image_link4: string;
  image_link5: string;
  __parsed_extra?: string[];
}

export function parseInventoryCSV(csvContent: string, storeCode: string) {
  const parsed = Papa.parse<CSVRow>(csvContent, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
    transformHeader: (header) => {
      return header
        .replace(/additional_image_link\s+"/g, 'additional_image_link_')
        .replace(/"/g, '')
        .trim();
    }
  });

  if (parsed.errors.length > 0) {
    console.warn('CSV parsing warnings:', parsed.errors.slice(0, 5));
  }

  const vehicles = [];
  
  for (const row of parsed.data) {
    try {
      const vehicle = transformVehicle(row, storeCode);
      if (vehicle) {
        vehicles.push(vehicle);
      }
    } catch (error) {
      console.error(`Error parsing vehicle ${row.id || 'unknown'}:`, error);
    }
  }

  return vehicles;
}

function transformVehicle(row: CSVRow, expectedStoreCode: string) {
  if (!row.VIN || !row.id) {
    return null;
  }

  if (expectedStoreCode && row.store_code !== expectedStoreCode) {
    console.warn(`Skipping vehicle ${row.id} - wrong store code: ${row.store_code}`);
    return null;
  }

  const parsePrice = (priceStr: string) => {
    if (!priceStr) return null;
    const cleaned = priceStr.toString().replace(/[^0-9]/g, '');
    return cleaned ? parseInt(cleaned) : null;
  };

  const parseMileage = (mileageStr: string) => {
    if (!mileageStr) return null;
    const cleaned = mileageStr.toString().replace(/[^0-9]/g, '');
    return cleaned ? parseInt(cleaned) : null;
  };

  const images = [];
  if (row.image_link) images.push(row.image_link);
  for (let i = 1; i <= 5; i++) {
    if (row[`image_link${i}`]) {
      images.push(row[`image_link${i}`]);
    }
  }
  
  if (row.__parsed_extra && Array.isArray(row.__parsed_extra)) {
    for (let i = 0; i < 10; i++) {
      const img = row.__parsed_extra[i];
      if (img && img.startsWith('http')) {
        images.push(img);
      }
    }
  }

  const uniqueImages = [...new Set(images)].slice(0, 10);

  let features = [];
  let dealershipName = null;
  let fullDescription = null;
  
  if (row.__parsed_extra && Array.isArray(row.__parsed_extra)) {
    if (row.__parsed_extra[10] && typeof row.__parsed_extra[10] === 'string') {
      features = row.__parsed_extra[10].split(',').map(f => f.trim()).filter(Boolean);
    }
    if (row.__parsed_extra[11]) {
      dealershipName = row.__parsed_extra[11];
    }
    if (row.__parsed_extra[12]) {
      fullDescription = row.__parsed_extra[12];
    }
  }

  return {
    stockNumber: row.id.toString(),
    vin: row.VIN,
    year: row.year || null,
    make: row.brand || null,
    model: row.model || null,
    trim: row.trim || null,
    title: row.title || `${row.year} ${row.brand} ${row.model}`.trim(),
    price: parsePrice(row.price),
    msrp: parsePrice(row.vehicle_msrp),
    condition: row.condition ? row.condition.toLowerCase() : 'used',
    mileage: parseMileage(row.mileage),
    exteriorColor: row.color || null,
    bodyStyle: row.body_style || null,
    fuelType: row.engine || null,
    features: features,
    description: fullDescription || row.description || null,
    status: 'available',
    storeCode: row.store_code,
    address: row.address || null,
    dealershipName: dealershipName || row.dealership_name || null,
    imageUrls: uniqueImages,
    lastSeenInFeed: new Date().toISOString()
  };
}

export function validateVehicle(vehicle: any) {
  const errors = [];
  
  if (!vehicle.stockNumber) errors.push('Missing stock number');
  if (!vehicle.vin) errors.push('Missing VIN');
  if (!vehicle.make) errors.push('Missing make');
  if (!vehicle.model) errors.push('Missing model');
  if (!vehicle.year) errors.push('Missing year');
  if (!vehicle.price) errors.push('Missing price');
  
  if (vehicle.vin && vehicle.vin.length !== 17) {
    errors.push(`Invalid VIN length: ${vehicle.vin.length}`);
  }
  
  const currentYear = new Date().getFullYear();
  if (vehicle.year && (vehicle.year < 1900 || vehicle.year > currentYear + 2)) {
    errors.push(`Invalid year: ${vehicle.year}`);
  }
  
  if (vehicle.price && vehicle.price < 0) {
    errors.push(`Invalid price: ${vehicle.price}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
}
```

### Phase 7: Import Function

Create `netlify/functions/scheduled-import.ts`:
```typescript
import { schedule } from '@netlify/functions';
import Client from 'ssh2-sftp-client';
import { parseInventoryCSV, validateVehicle } from './utils/csv-parser';
import { createClient } from '@sanity/client';

const sanityClient = createClient({
  projectId: process.env.SANITY_PROJECT_ID!,
  dataset: process.env.SANITY_DATASET || 'production',
  token: process.env.SANITY_WRITE_TOKEN!,
  apiVersion: '2023-01-01',
  useCdn: false
});

const sftpConfig = {
  host: process.env.SFTP_HOST!,
  username: process.env.SFTP_USERNAME!,
  password: process.env.SFTP_PASSWORD!,
  port: parseInt(process.env.SFTP_PORT || '22')
};

// Store configurations - map store codes to location IDs
const storeConfigs = [
  { storeCode: 'MP18527', fileName: 'MP18527.csv', locationId: 'location-1' },
  { storeCode: 'MP18528', fileName: 'MP18528.csv', locationId: 'location-2' },
  { storeCode: 'MP18529', fileName: 'MP18529.csv', locationId: 'location-3' },
  { storeCode: 'MP18530', fileName: 'MP18530.csv', locationId: 'location-4' },
  { storeCode: 'MP18531', fileName: 'MP18531.csv', locationId: 'location-5' }
];

const handler = schedule('0 2 * * *', async (event) => {
  console.log('Starting scheduled inventory import...');
  
  const sftp = new Client();
  const results = {
    success: 0,
    failed: 0,
    created: 0,
    updated: 0,
    deleted: 0,
    errors: []
  };

  try {
    await sftp.connect(sftpConfig);
    
    // Get all current vehicles from Sanity (excluding transferred vehicles)
    const existingVehicles = await sanityClient.fetch(
      `*[_type == "vehicle" && status != "delivered"]{ 
        _id, 
        stockNumber, 
        storeCode,
        status,
        currentTransfer
      }`
    );
    
    const existingByStock = new Map(
      existingVehicles.map(v => [`${v.storeCode}-${v.stockNumber}`, v])
    );
    
    const seenVehicles = new Set<string>();
    
    // Process each store's CSV
    for (const store of storeConfigs) {
      try {
        console.log(`Processing ${store.fileName}...`);
        
        const csvPath = process.env.SFTP_PATH ? 
          `${process.env.SFTP_PATH}/${store.fileName}` : 
          `/inventory/${store.fileName}`;
          
        const csvContent = await sftp.get(csvPath);
        const vehicles = parseInventoryCSV(csvContent.toString(), store.storeCode);
        
        console.log(`Found ${vehicles.length} vehicles for ${store.storeCode}`);
        
        // Get location reference
        const location = await sanityClient.fetch(
          `*[_type == "dealershipLocation" && code == $code][0]._id`,
          { code: store.storeCode }
        );
        
        if (!location) {
          console.error(`Location not found for store code: ${store.storeCode}`);
          continue;
        }
        
        // Process each vehicle
        for (const vehicle of vehicles) {
          const key = `${vehicle.storeCode}-${vehicle.stockNumber}`;
          seenVehicles.add(key);
          
          const validation = validateVehicle(vehicle);
          if (!validation.isValid) {
            console.error(`Invalid vehicle ${key}:`, validation.errors);
            results.errors.push({ vehicle: key, errors: validation.errors });
            continue;
          }
          
          const existing = existingByStock.get(key);
          
          try {
            if (existing) {
              // Don't update if vehicle is currently being transferred
              if (existing.status === 'claimed' || existing.status === 'in-transit') {
                console.log(`Skipping update for ${key} - currently in transfer`);
                continue;
              }
              
              // Update existing vehicle
              await sanityClient
                .patch(existing._id)
                .set({
                  ...vehicle,
                  location: { _type: 'reference', _ref: location },
                  originalLocation: { _type: 'reference', _ref: location },
                  lastSeenInFeed: new Date().toISOString()
                })
                .commit();
              results.updated++;
            } else {
              // Create new vehicle
              await sanityClient.create({
                _type: 'vehicle',
                ...vehicle,
                location: { _type: 'reference', _ref: location },
                originalLocation: { _type: 'reference', _ref: location },
                importedAt: new Date().toISOString(),
                status: 'available'
              });
              results.created++;
            }
          } catch (error) {
            console.error(`Error processing vehicle ${key}:`, error);
            results.failed++;
          }
        }
        
        results.success++;
      } catch (error) {
        console.error(`Error processing ${store.fileName}:`, error);
        results.failed++;
      }
    }
    
    // Delete vehicles not in current feed based on status
    for (const [key, vehicle] of existingByStock) {
      if (!seenVehicles.has(key)) {
        try {
          if (vehicle.status === 'available') {
            // Delete available vehicles immediately if not in feed
            await sanityClient.delete(vehicle._id);
            results.deleted++;
          } else if (vehicle.status === 'delivered') {
            // For delivered vehicles, check if they've been delivered for more than 3 days
            const transfer = await sanityClient.fetch(
              `*[_type == "transfer" && _id == $id][0]{ deliveredDate }`,
              { id: vehicle.currentTransfer?._ref }
            );
            
            if (transfer?.deliveredDate) {
              const deliveredDate = new Date(transfer.deliveredDate);
              const daysSinceDelivered = (Date.now() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24);
              
              if (daysSinceDelivered > 3) {
                console.log(`Deleting vehicle ${key} - delivered ${Math.floor(daysSinceDelivered)} days ago`);
                await sanityClient.delete(vehicle._id);
                results.deleted++;
              } else {
                console.log(`Keeping vehicle ${key} - delivered ${Math.floor(daysSinceDelivered)} days ago`);
              }
            }
          }
          // Claimed and in-transit vehicles are always preserved
        } catch (error) {
          console.error(`Error processing vehicle ${key} for deletion:`, error);
        }
      }
    }
    
    await sftp.end();
    
    // Log import activity
    await sanityClient.create({
      _type: 'importLog',
      timestamp: new Date().toISOString(),
      results: results,
      success: results.failed === 0
    });
    
    console.log('Import completed:', results);
    
    return {
      statusCode: 200,
      body: JSON.stringify(results)
    };
  } catch (error) {
    console.error('Import failed:', error);
    await sftp.end();
    
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Import failed', details: error.message })
    };
  }
});

export { handler };
```

### Phase 8: API Routes

Create `/app/api/transfer/claim/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { writeClient } from '@/lib/sanity';
import { canClaimVehicle } from '@/lib/permissions';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !canClaimVehicle(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { vehicleId, reason, customerWaiting, priority, expectedPickupDate } = await request.json();
    
    // Get vehicle details
    const vehicle = await writeClient.fetch(
      `*[_type == "vehicle" && _id == $id][0]{
        _id,
        status,
        location,
        currentTransfer
      }`,
      { id: vehicleId }
    );
    
    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }
    
    if (vehicle.status !== 'available') {
      return NextResponse.json({ error: 'Vehicle is not available for transfer' }, { status: 400 });
    }
    
    // Create transfer record
    const transfer = await writeClient.create({
      _type: 'transfer',
      vehicle: { _ref: vehicleId },
      fromStore: vehicle.location,
      toStore: { _ref: session.user.location._id },
      requestedBy: { _ref: session.user.id },
      status: 'requested',
      reason,
      customerWaiting: customerWaiting || false,
      priority: priority || false,
      expectedPickupDate,
      createdAt: new Date().toISOString()
    });
    
    // Update vehicle status
    await writeClient
      .patch(vehicleId)
      .set({ 
        status: 'claimed',
        currentTransfer: { _ref: transfer._id }
      })
      .commit();
    
    // Create activity log
    await writeClient.create({
      _type: 'activity',
      vehicle: { _ref: vehicleId },
      user: { _ref: session.user.id },
      action: 'claimed',
      details: `Vehicle claimed for transfer to ${session.user.location.name}`,
      metadata: {
        fromStore: vehicle.location._ref,
        toStore: session.user.location._id
      },
      createdAt: new Date().toISOString()
    });
    
    return NextResponse.json({ success: true, transferId: transfer._id });
  } catch (error) {
    console.error('Error claiming vehicle:', error);
    return NextResponse.json({ error: 'Failed to claim vehicle' }, { status: 500 });
  }
}
```

Create `/app/api/comment/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { writeClient } from '@/lib/sanity';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { vehicleId, text, mentions } = await request.json();
    
    if (!vehicleId || !text) {
      return NextResponse.json({ error: 'Vehicle ID and text are required' }, { status: 400 });
    }
    
    // Create comment
    const comment = await writeClient.create({
      _type: 'comment',
      vehicle: { _ref: vehicleId },
      author: { _ref: session.user.id },
      text,
      mentions: mentions?.map((userId: string) => ({ _ref: userId })) || [],
      edited: false,
      createdAt: new Date().toISOString()
    });
    
    // Create activity log
    await writeClient.create({
      _type: 'activity',
      vehicle: { _ref: vehicleId },
      user: { _ref: session.user.id },
      action: 'commented',
      details: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      createdAt: new Date().toISOString()
    });
    
    return NextResponse.json({ success: true, commentId: comment._id });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('id');
    
    if (!commentId) {
      return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 });
    }
    
    // Get comment to check ownership
    const comment = await writeClient.fetch(
      `*[_type == "comment" && _id == $id][0]{ author }`,
      { id: commentId }
    );
    
    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }
    
    // Check permissions
    const canDelete = 
      session.user.role === 'admin' || 
      comment.author._ref === session.user.id;
    
    if (!canDelete) {
      return NextResponse.json({ error: 'Unauthorized to delete this comment' }, { status: 403 });
    }
    
    await writeClient.delete(commentId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
  }
}
```

### Phase 9: Key Frontend Components

Create `/components/vehicle/ClaimButton.tsx`:
```typescript
"use client"

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { canClaimVehicle } from '@/lib/permissions';

interface ClaimButtonProps {
  vehicleId: string;
  vehicleStatus: string;
  vehicleLocation: string;
  onSuccess?: () => void;
}

export default function ClaimButton({ vehicleId, vehicleStatus, vehicleLocation, onSuccess }: ClaimButtonProps) {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    reason: '',
    customerWaiting: false,
    priority: false,
    expectedPickupDate: ''
  });

  if (!session || !canClaimVehicle(session.user.role)) {
    return null;
  }

  // Don't show claim button if vehicle is at user's location
  if (vehicleLocation === session.user.location?._id) {
    return null;
  }

  // Don't show if vehicle is not available
  if (vehicleStatus !== 'available') {
    return (
      <div className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg">
        {vehicleStatus === 'claimed' && 'Claimed'}
        {vehicleStatus === 'in-transit' && 'In Transit'}
        {vehicleStatus === 'delivered' && 'Delivered'}
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/transfer/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId,
          ...formData
        })
      });

      if (response.ok) {
        setIsOpen(false);
        onSuccess?.();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to claim vehicle');
      }
    } catch (error) {
      alert('Failed to claim vehicle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
      >
        Claim for Transfer
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Claim Vehicle for Transfer</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Reason for Transfer
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                  rows={3}
                  placeholder="Customer waiting, specific request, etc."
                  required
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.customerWaiting}
                    onChange={(e) => setFormData({...formData, customerWaiting: e.target.checked})}
                  />
                  <span className="text-sm">Customer Waiting</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.checked})}
                  />
                  <span className="text-sm">High Priority</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Expected Pickup Date
                </label>
                <input
                  type="date"
                  value={formData.expectedPickupDate}
                  onChange={(e) => setFormData({...formData, expectedPickupDate: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Claiming...' : 'Confirm Claim'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
```

Create `/components/vehicle/ActivityFeed.tsx`:
```typescript
"use client"

import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { client } from '@/lib/sanity';
import { vehicleActivityQuery } from '@/lib/queries';
import type { Activity } from '@/types/transfer';

interface ActivityFeedProps {
  vehicleId: string;
}

export default function ActivityFeed({ vehicleId }: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
    
    // Subscribe to real-time updates
    const subscription = client
      .listen(`*[_type == "activity" && vehicle._ref == $vehicleId]`, { vehicleId })
      .subscribe((update) => {
        if (update.transition === 'appear') {
          fetchActivities();
        }
      });

    return () => subscription.unsubscribe();
  }, [vehicleId]);

  const fetchActivities = async () => {
    try {
      const data = await client.fetch(vehicleActivityQuery, { vehicleId });
      setActivities(data);
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'claimed': return '🚚';
      case 'released': return '↩️';
      case 'commented': return '💬';
      case 'status-updated': return '📝';
      case 'transfer-started': return '🚗';
      case 'transfer-completed': return '✅';
      default: return '📌';
    }
  };

  const getActivityDescription = (activity: Activity) => {
    const userName = activity.user?.name || 'Someone';
    
    switch (activity.action) {
      case 'claimed':
        return `${userName} claimed this vehicle for transfer`;
      case 'released':
        return `${userName} released the transfer claim`;
      case 'commented':
        return `${userName} added a comment`;
      case 'status-updated':
        return `${userName} updated the status`;
      case 'transfer-started':
        return `${userName} started the transfer`;
      case 'transfer-completed':
        return `${userName} completed the transfer`;
      default:
        return activity.details || 'Activity recorded';
    }
  };

  if (loading) {
    return <div className="animate-pulse bg-gray-100 h-32 rounded"></div>;
  }

  return (
    <div className="bg-white rounded-lg border p-4">
      <h3 className="font-semibold mb-4">Activity Feed</h3>
      
      {activities.length === 0 ? (
        <p className="text-gray-500 text-sm">No activity yet</p>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => (
            <div key={activity._id} className="flex gap-3">
              <div className="text-2xl">{getActivityIcon(activity.action)}</div>
              <div className="flex-1">
                <p className="text-sm">
                  {getActivityDescription(activity)}
                </p>
                <p className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

Create `/components/vehicle/CommentSection.tsx`:
```typescript
"use client"

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { formatDistanceToNow } from 'date-fns';
import { client } from '@/lib/sanity';
import { vehicleCommentsQuery } from '@/lib/queries';
import type { Comment } from '@/types/transfer';

interface CommentSectionProps {
  vehicleId: string;
}

export default function CommentSection({ vehicleId }: CommentSectionProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    fetchComments();
    
    // Subscribe to real-time updates
    const subscription = client
      .listen(`*[_type == "comment" && vehicle._ref == $vehicleId]`, { vehicleId })
      .subscribe((update) => {
        if (update.transition === 'appear' || update.transition === 'disappear') {
          fetchComments();
        }