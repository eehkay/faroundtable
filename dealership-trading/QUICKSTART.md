# Quick Start Guide - Round Table

## Your Sanity Project Details
- **Project ID**: bhik7rw7
- **Allowed Domains**: delmaradv.com, formanautomotive.com

## 1. Deploy Sanity Studio (if not already deployed)

```bash
cd sanity-studio
npm install
npm run deploy
```

Your studio will be available at: https://bhik7rw7.sanity.studio/

## 2. Create Sanity API Tokens

1. Go to https://www.sanity.io/manage/project/bhik7rw7/api
2. Create two tokens:
   - **Read Token** (Viewer permissions) - for public API access
   - **Write Token** (Editor permissions) - for authentication and imports

## 3. Set Up CORS Origins

1. Go to https://www.sanity.io/manage/project/bhik7rw7/api#cors-origins
2. Add these origins with credentials allowed:
   - `http://localhost:3000`
   - Your Netlify domain (e.g., `https://your-app.netlify.app`)

## 4. Configure Environment Variables

Copy `.env.local.example` to `.env.local` and fill in:

```bash
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=[generate with: openssl rand -base64 32]

# Google OAuth (from Google Cloud Console)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Sanity (already configured with your project ID)
SANITY_API_TOKEN=your-read-token
SANITY_WRITE_TOKEN=your-write-token

# SFTP for CSV imports
SFTP_HOST=your-sftp-host
SFTP_USERNAME=your-username
SFTP_PASSWORD=your-password
```

## 5. Create Dealership Locations in Sanity

1. Go to https://bhik7rw7.sanity.studio/
2. Create 5 "Dealership Location" documents:

   | Name | Code | 
   |------|------|
   | Store 1 | MP18527 |
   | Store 2 | MP18528 |
   | Store 3 | MP18529 |
   | Store 4 | MP18530 |
   | Store 5 | MP18531 |

3. Note the document IDs (visible in the URL when you open each document)

## 6. Update Location IDs

Edit `netlify/functions/scheduled-import.ts` and update the `storeConfigs` array with your actual location IDs:

```typescript
const storeConfigs = [
  { storeCode: 'MP18527', fileName: 'MP18527.csv', locationId: 'actual-id-from-sanity' },
  { storeCode: 'MP18528', fileName: 'MP18528.csv', locationId: 'actual-id-from-sanity' },
  // ... etc
];
```

## 7. Run the Application

```bash
npm run dev
```

Visit http://localhost:3000 and sign in with your company Google account.

## 8. Deploy to Netlify

1. Push to GitHub
2. Connect repository to Netlify
3. Set all environment variables in Netlify dashboard
4. Deploy

## Testing the Import Function

To test the scheduled import locally:
```bash
netlify dev
# Then visit: http://localhost:8888/.netlify/functions/scheduled-import
```

## Troubleshooting

- **CORS errors**: Check Sanity CORS settings include your domain with credentials
- **Auth errors**: Verify Google OAuth redirect URIs match your domain
- **Import errors**: Check SFTP credentials and file paths