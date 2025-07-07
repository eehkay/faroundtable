# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Design System

**IMPORTANT**: Always consult `DESIGN-GUIDELINES.md` when making UI changes. The project follows a modern dark theme with:
- True black backgrounds (#000000 to #0a0a0a)
- Bright blue accents (#3b82f6)
- Subtle 1px borders (#2a2a2a) on all cards and containers
- Smooth transitions (200ms ease) and hover effects

## Project Overview

**Round Table** - An internal inventory management platform for a 5-store dealership network. The system enables stores to claim vehicles from each other, track transfers, and communicate about trades.

## Development Commands

```bash
# Development
npm run dev          # Start development server with turbopack on port 3000

# Production Build
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run type-check   # TypeScript validation
npm run test         # Combined type-check + lint + build
```

## Architecture

### Tech Stack
- **Frontend**: Next.js 15 (App Router) with TypeScript
- **Authentication**: NextAuth.js with Google SSO (domain-restricted)
- **Database**: Supabase (PostgreSQL) - Migrated from Sanity.io in January 2025
- **Styling**: Tailwind CSS v3 with custom dark theme
- **Hosting**: Netlify with edge functions
- **Real-time**: Supabase Realtime subscriptions
- **Email**: Resend for transactional emails
- **Imports**: Netlify Scheduled Functions (daily CSV at 2 AM)

### Data Flow Architecture

```
┌─────────────────┐     ┌────────────────┐     ┌─────────────────┐
│   Next.js 15    │────▶│  Supabase DB   │◀────│ Netlify Function│
│   (App Router)  │     │  (PostgreSQL)  │     │ (CSV Import)    │
└─────────────────┘     └────────────────┘     └─────────────────┘
         │                       │                        │
         ▼                       ▼                        ▼
┌─────────────────┐     ┌────────────────┐     ┌─────────────────┐
│  NextAuth.js    │     │  Real-time     │     │   SFTP Server   │
│ (Google OAuth)  │     │  Subscriptions │     │ (Inventory CSV) │
└─────────────────┘     └────────────────┘     └─────────────────┘
```

### Database Schema

```sql
dealership_locations (id, name, code, csv_file_name)
    ├── users (location_id)
    ├── vehicles (location_id, original_location_id)
    └── transfers (from_location_id, to_location_id)

vehicles (id, vin, stock_number, status)
    ├── transfers (vehicle_id)
    ├── activities (vehicle_id)
    ├── comments (vehicle_id)
    └── current_transfer_id → transfers

users (id, email, role, location_id)
    ├── transfers (requested_by_id, approved_by_id)
    ├── activities (user_id)
    ├── comments (author_id)
    └── comment_mentions (user_id)

transfers (id, vehicle_id, status, from/to_location_id)
    - States: requested → approved → in-transit → delivered
    - Preserves vehicles during daily imports
    - 3-day retention after delivery
```

### Key Components

**Authentication** (`/app/api/auth/[...nextauth]/route.ts`)
- Domain validation: delmaradv.com, formanautomotive.com
- Auto-creates/updates Supabase user records
- Enriches session with role and location
- Middleware enforces auth except /login

**Transfer System**
- `/api/transfer/claim` - Create transfer request
- `/api/transfer/[id]/approve` - Manager/admin approval
- `/api/transfer/[id]/status` - Update transfer status
- Vehicles retain transfer state during imports

**CSV Import** (`/netlify/functions/scheduled-import.ts`)
- Parses non-standard CSV with dynamic headers
- Validates: VIN (17 chars), year, price
- Preserves active transfer vehicles
- Updates only 'available' status vehicles

**Permissions** (`/lib/permissions.ts`)
- Hierarchy: admin > manager > sales/transport
- Transfer approval: manager/admin only
- Status updates: manager/admin/transport
- User impersonation: admin only

### API Patterns

```typescript
// Standard API route pattern
export async function GET/POST(request: NextRequest) {
  // 1. Session validation
  const session = await getServerSession(authOptions);
  if (!session) return unauthorized();
  
  // 2. Permission check
  if (!hasPermission(session.user.role)) return forbidden();
  
  // 3. Supabase operation
  const { data, error } = await supabase
    .from('table')
    .select('*');
    
  // 4. Activity logging
  await createActivity(action, details);
  
  // 5. Response
  return NextResponse.json(data);
}
```

### Real-time Patterns

```typescript
// Client-side subscription
const channel = supabase
  .channel('activities')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'activities' },
    (payload) => handleNewActivity(payload)
  )
  .subscribe();
```

### Environment Variables

**Authentication**
- `NEXTAUTH_URL`, `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `ALLOWED_DOMAINS` (comma-separated)

**Database**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

**Services**
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
- `AUTODEALERDATA_API_KEY_ID`, `AUTODEALERDATA_API_KEY`
- SFTP credentials for CSV imports

**Analytics** (optional)
- `ENABLE_ADVANCED_ANALYTICS` (set to 'true' to enable)
- `MARKETCHECK_API_KEY`
- `DATAFORSEO_EMAIL`, `DATAFORSEO_API_KEY`

## Analytics Feature

**Status**: Foundation implemented, UI components pending

The analytics feature provides market intelligence using Market Check and DataForSEO APIs:
- **Vehicle Analysis**: Market pricing, demand metrics, and recommendations
- **Regional Insights**: Popular vehicles, trends, and opportunities
- **Caching**: 24-hour TTL to minimize API costs
- **Usage Tracking**: Monitor API calls and performance

To enable analytics:
1. Set `ENABLE_ADVANCED_ANALYTICS=true` in `.env.local`
2. Add API keys for Market Check and DataForSEO
3. Run the analytics database migration
4. See `/docs/ANALYTICS_SETUP.md` for detailed setup

## Development Guidelines

### File Structure
- `/app` - Next.js App Router pages and API routes
- `/components` - React components organized by feature
- `/lib` - Utilities, queries, and shared logic
  - `/lib/analytics` - Analytics API clients and utilities
- `/types` - TypeScript type definitions
- `/public` - Static assets

### Code Patterns
- Use server components by default
- Client components only for interactivity
- Supabase admin client for server operations
- Supabase client for real-time subscriptions
- Always validate sessions in API routes
- Log activities for audit trail

### Testing Approach
- No dedicated test framework configured
- Use `npm run test` for type/lint/build validation
- Manual testing in development environment
- Staging deployment on Netlify for QA

### Common Tasks

**Add a new API endpoint**
1. Create route in `/app/api/[resource]/route.ts`
2. Validate session and permissions
3. Use Supabase admin client
4. Create activity log entry
5. Return consistent response format

**Update UI component**
1. Follow DESIGN-GUIDELINES.md
2. Use existing Tailwind classes
3. Maintain dark theme consistency
4. Add proper TypeScript types
5. Test responsive behavior

**Modify database schema**
1. Create migration in `/supabase/migrations/`
2. Update TypeScript types
3. Update relevant queries
4. Test with local Supabase

### Deployment

**Netlify Configuration**
```toml
[build]
  base = "dealership-trading"
  command = "npm run build"
  publish = ".next"
```

**Pre-deployment Checklist**
1. Run `npm run test`
2. Check environment variables
3. Verify database migrations
4. Test critical user flows
5. Review security permissions