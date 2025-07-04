# Round Table

An internal inventory management platform for a 5-store dealership network. Enables stores to claim vehicles from each other, track transfers, and communicate about trades.

## Features

- **Vehicle Inventory Management**: Browse all vehicles across 5 dealership locations
- **Transfer Claims**: Claim vehicles from other stores with priority and customer waiting flags
- **Real-time Activity Tracking**: See all actions on each vehicle in real-time
- **Comments System**: Inter-store communication on specific vehicles
- **Automated CSV Import**: Daily inventory updates from SFTP server at 2 AM
- **Role-based Permissions**: Different access levels for sales, managers, admins, and transport
- **Google SSO Authentication**: Secure login restricted to company domains

## Tech Stack

- **Frontend**: Next.js 14 (App Router) with TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: NextAuth.js with Google OAuth
- **Database/CMS**: Sanity.io
- **Hosting**: Netlify
- **CSV Import**: Netlify Scheduled Functions
- **Real-time Updates**: Sanity listeners

## Setup Instructions

1. **Clone the repository and install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   - Copy `.env.local.example` to `.env.local`
   - Fill in all required values

3. **Set up Sanity Studio**
   - The Sanity Studio is embedded at `/studio`
   - First, create a Sanity project at [sanity.io](https://sanity.io)
   - Add your project ID and dataset to `.env.local`
   - Run the app and navigate to `http://localhost:3000/studio`
   - Create the 5 dealership location documents with codes: MP18527, MP18528, MP18529, MP18530, MP18531

4. **Configure Google OAuth**
   - Create OAuth 2.0 credentials in Google Cloud Console
   - Add authorized redirect URIs for local and production
   - Update `.env.local` with client ID and secret

5. **Update location IDs**
   - After creating dealership locations in Sanity, update the `storeConfigs` array in `netlify/functions/scheduled-import.ts` with the correct location document IDs

6. **Run the development server**
   ```bash
   npm run dev
   ```

## Deployment

1. **Deploy to Netlify**
   - Connect your GitHub repository to Netlify
   - Set all environment variables in Netlify dashboard
   - Deploy

2. **Configure scheduled imports**
   - The CSV import function will run automatically at 2 AM daily
   - Ensure SFTP credentials are correctly configured

## Store Codes

The system expects CSV files for these store codes:
- MP18527
- MP18528
- MP18529
- MP18530
- MP18531

## Permissions

- **Sales**: Can claim vehicles and add comments
- **Manager**: All sales permissions plus approve transfers
- **Admin**: Full access including user management
- **Transport**: Can update transfer status

## Accessing Sanity Studio

The Sanity Studio is embedded in the application and can be accessed at:
- Development: `http://localhost:3000/studio`
- Production: `https://yourdomain.com/studio`

Note: The studio route is excluded from authentication middleware, so you'll need to log in with your Sanity credentials.

## CSV Format

The system handles malformed CSV headers and expects the following columns:
- id (stock number)
- VIN
- brand (make)
- model
- year
- price
- mileage
- condition
- Additional image links and features in extra columns
