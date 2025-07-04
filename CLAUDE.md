# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Design System

**IMPORTANT**: Always consult `dealership-trading/DESIGN-GUIDELINES.md` when making UI changes. The project follows a modern dark theme with:
- True black backgrounds (#000000 to #0a0a0a)
- Bright blue accents (#3b82f6)
- No borders - use background contrast for separation
- Smooth transitions and hover effects

## Project Overview

This is **Round Table** - an internal inventory management platform for a 5-store dealership network. The system enables stores to claim vehicles from each other, track transfers, and communicate about trades.

## Architecture

- **Frontend**: Next.js 14 (App Router) with TypeScript
- **Authentication**: NextAuth.js with Google SSO (domain-restricted to delmaradv.com and formanautomotive.com)
- **Database/CMS**: Sanity.io
- **Styling**: Tailwind CSS v4
- **Hosting**: Netlify
- **Real-time Updates**: Sanity listeners for activity feeds
- **Automated Imports**: Netlify Scheduled Functions (daily CSV imports at 2 AM from SFTP)

## Common Development Commands

```bash
# Development
npm run dev          # Start development server with turbopack on port 3000

# Production Build
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
```

## High-Level Architecture

### Data Flow
1. **CSV Import Pipeline**: Daily scheduled function fetches inventory CSV files from SFTP for each store (MP18527-MP18531)
2. **Sanity CMS**: Central data store for vehicles, transfers, users, and activities
3. **Real-time Updates**: Sanity listeners provide live updates for activities and comments
4. **Authentication**: Google SSO creates/updates user records in Sanity with role-based permissions

### Key Components

**Authentication Flow** (`/app/api/auth/[...nextauth]/route.ts`)
- Validates user domain against allowed list
- Creates/updates user record in Sanity
- Assigns default 'sales' role, preserves existing roles
- Middleware enforces authentication on all routes except login

**Vehicle Transfer System**
- Claims API (`/app/api/transfer/claim/route.ts`) - Creates transfer request and updates vehicle status
- Transfer states: requested → approved → in-transit → delivered
- Vehicles preserve transfer state during daily imports
- Delivered vehicles are retained for 3 days before deletion

**CSV Import Logic** (`/netlify/functions/scheduled-import.ts`)
- Parses non-standard CSV format with dynamic headers
- Validates VIN (17 chars), year, price requirements
- Preserves vehicles in active transfers
- Updates only 'available' status vehicles

**Permission System** (`/lib/permissions.ts`)
- Role hierarchy: admin > manager > sales/transport
- Transfer approval requires manager/admin role
- Status updates require manager/admin/transport role

### Sanity Schema Structure

The system uses these main document types:
- `vehicle` - Inventory items with status tracking
- `transfer` - Transfer requests between stores
- `user` - Authenticated users with roles
- `activity` - Vehicle action history
- `comment` - Inter-store communication
- `dealershipLocation` - Store configuration

### Environment Variables

Critical configurations:
- `NEXTAUTH_URL` and `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- `ALLOWED_DOMAINS` (comma-separated)
- `SANITY_PROJECT_ID`, `SANITY_DATASET`, `SANITY_API_TOKEN`
- SFTP credentials for CSV imports

### Development Notes

1. **Sanity Studio** is embedded at `/studio` route
2. **TypeScript** strict mode is enabled
3. **Path alias** `@/*` maps to project root
4. **No test framework** is currently configured
5. **Turbopack** is used for faster development builds