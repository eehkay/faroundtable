# Round Table 🎯

An internal inventory management platform for a 5-store dealership network. Round Table enables stores to claim vehicles from each other, track transfers, and communicate about trades in real-time.

## 🚀 Features

### Core Functionality
- **Vehicle Inventory Management**: Browse and search all vehicles across 5 dealership locations
- **Transfer Claims**: Request vehicles from other stores with priority levels and customer waiting flags
- **Real-time Activity Tracking**: Live updates on all vehicle actions and status changes
- **Comments System**: Inter-store communication thread on each vehicle
- **Market Insights**: Automated market value analysis and pricing recommendations

### Automation & Integration
- **Automated CSV Import**: Daily inventory updates from SFTP server at 2 AM
- **Email Notifications**: Automated alerts for transfer requests and status changes
- **VIN Decoder**: Automatic vehicle details lookup via NHTSA API
- **Activity History**: Complete audit trail for every vehicle

### Security & Access Control
- **Google SSO Authentication**: Secure login restricted to company domains
- **Role-based Permissions**: Granular access control for sales, managers, admins, and transport
- **Domain Restrictions**: Limited to @delmaradv.com and @formanautomotive.com

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router) with TypeScript
- **Styling**: Tailwind CSS v4 with modern dark theme
- **Authentication**: NextAuth.js with Google OAuth
- **Database**: Supabase (PostgreSQL) with real-time subscriptions
- **Hosting**: Netlify with edge functions
- **Email**: Resend for transactional emails
- **CSV Import**: Netlify Scheduled Functions
- **Real-time Updates**: Supabase Realtime subscriptions

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account
- Google Cloud Console access (for OAuth)
- Netlify account (for deployment)
- SFTP access (for inventory imports)

## 🚀 Getting Started

### 1. Clone and Install

```bash
git clone https://github.com/eehkay/faroundtable.git
cd dealership-trading
npm install
```

### 2. Environment Setup

Copy the example environment file and fill in your values:

```bash
cp .env.example .env.local
```

Required environment variables:
- `NEXTAUTH_URL` - Your app URL
- `NEXTAUTH_SECRET` - Generate with `openssl rand -hex 32`
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET` - From Google Cloud Console
- `NEXT_PUBLIC_SUPABASE_URL` & `NEXT_PUBLIC_SUPABASE_ANON_KEY` - From Supabase project
- `SUPABASE_SERVICE_ROLE_KEY` - For server-side operations
- `RESEND_API_KEY` - For email notifications
- SFTP credentials for inventory imports

### 3. Database Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the migration scripts in order:
   ```bash
   npm run db:migrate
   ```
3. Initialize dealership locations:
   ```bash
   npm run db:seed
   ```

### 4. Google OAuth Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)

### 5. Development

Start the development server:

```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## 🚢 Deployment

### Netlify Deployment

1. **Connect GitHub Repository**
   - Log in to [Netlify](https://netlify.com)
   - Click "New site from Git"
   - Connect your GitHub repository

2. **Configure Build Settings**
   - Build command: `npm run build`
   - Publish directory: `.next`

3. **Set Environment Variables**
   - Add all variables from `.env.local` to Netlify dashboard
   - Go to Site settings → Environment variables

4. **Deploy**
   - Trigger deploy from Netlify dashboard
   - Monitor build logs for any issues

### Scheduled Functions

The CSV import function runs automatically at 2 AM EST daily. Ensure:
- SFTP credentials are correctly configured
- Netlify Functions are enabled
- Function logs are monitored for errors

## 🏢 Store Configuration

The system manages inventory for these dealership locations:

| Store Code | Location Name |
|------------|---------------|
| MP18527    | Store 1       |
| MP18528    | Store 2       |
| MP18529    | Store 3       |
| MP18530    | Store 4       |
| MP18531    | Store 5       |

## 👥 User Roles & Permissions

| Role | Capabilities |
|------|-------------|
| **Sales** | • View inventory<br>• Claim vehicles<br>• Add comments<br>• View transfer history |
| **Manager** | • All Sales permissions<br>• Approve/reject transfers<br>• View all store transfers<br>• Access reports |
| **Admin** | • All Manager permissions<br>• User management<br>• System configuration<br>• View analytics |
| **Transport** | • Update transfer status<br>• Mark vehicles as in-transit/delivered<br>• View transport queue |

## 📊 CSV Import Format

The system automatically handles CSV files with these required columns:

```csv
id,VIN,brand,model,year,price,mileage,condition,image1,image2,...
12345,1HGCM82633A123456,Honda,Accord,2023,25000,15000,Used,http://...
```

**Required Fields:**
- `id` - Stock number (unique per store)
- `VIN` - 17-character Vehicle Identification Number
- `brand` - Vehicle make
- `model` - Vehicle model
- `year` - 4-digit year
- `price` - Numeric price (no formatting)
- `mileage` - Numeric mileage
- `condition` - New/Used/CPO

**Optional Fields:**
- Multiple image URLs (image1, image2, etc.)
- Additional features and specifications

## 🔧 Development Commands

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript compiler

# Database
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed initial data
npm run db:reset     # Reset database (careful!)

# Testing
npm run test         # Run test suite
npm run test:watch   # Run tests in watch mode
```

## 📁 Project Structure

```
dealership-trading/
├── app/                    # Next.js app directory
│   ├── (authenticated)/    # Protected routes
│   ├── api/               # API routes
│   └── login/             # Public auth page
├── components/            # React components
├── lib/                   # Utility functions
├── supabase/             # Database migrations
├── public/               # Static assets
├── types/                # TypeScript types
└── netlify/              # Netlify functions
```

## 🐛 Troubleshooting

### Common Issues

**Authentication Issues**
- Ensure Google OAuth credentials are correct
- Check authorized domains include your email domain
- Verify redirect URIs match your deployment

**Import Failures**
- Check SFTP credentials and connectivity
- Verify CSV format matches expected structure
- Monitor Netlify function logs

**Real-time Updates Not Working**
- Check Supabase Realtime is enabled
- Verify WebSocket connections aren't blocked
- Check browser console for errors

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)

## 🤝 Contributing

This is an internal project. For questions or issues, contact the development team.

## 📄 License

Proprietary - All rights reserved
