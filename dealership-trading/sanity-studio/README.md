# Sanity Studio - Round Table

This is the Sanity Studio for managing the Round Table's content.

## Setup Instructions

### 1. Create a Sanity Project

If you haven't already created a Sanity project:

```bash
# Login to Sanity (if not already logged in)
sanity login

# Create a new project
sanity init
```

When prompted:
- Select "Create new project"
- Enter a project name (e.g., "Round Table")
- Use the default dataset name: `production`
- Choose "Clean project with no predefined schema types"

### 2. Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update `.env` with your Sanity project ID:
   ```
   SANITY_STUDIO_PROJECT_ID=your-actual-project-id
   SANITY_STUDIO_DATASET=production
   ```

3. Also update the parent project's `.env.local` with the same project ID

### 3. Run the Studio Locally

```bash
npm run dev
```

This will start the Sanity Studio at http://localhost:3333

### 4. Deploy the Studio

To deploy your studio to Sanity's hosted service:

```bash
npm run deploy
```

You'll be prompted to choose a hostname (e.g., `round-table`).
Your studio will be available at `https://round-table.sanity.studio`

### 5. Create Initial Data

After deploying, you need to create the 5 dealership locations:

1. Go to your deployed studio
2. Navigate to "Dealership Location" in the sidebar
3. Create 5 documents with these exact codes:
   - **Location 1**: Code = `MP18527`
   - **Location 2**: Code = `MP18528`
   - **Location 3**: Code = `MP18529`
   - **Location 4**: Code = `MP18530`
   - **Location 5**: Code = `MP18531`

4. For each location, fill in:
   - Name (e.g., "Main Street Dealership")
   - Address, City, State, ZIP
   - Phone number
   - Set Active = true

5. **Important**: After creating the locations, copy each document's ID and update the `storeConfigs` array in the parent project's `/netlify/functions/scheduled-import.ts` file.

### 6. Create API Tokens

1. Go to https://www.sanity.io/manage
2. Select your project
3. Go to API → Tokens
4. Create two tokens:
   - **Read token**: For public client access
   - **Write token**: For server-side operations (keep this secret!)

5. Update your parent project's `.env.local`:
   ```
   SANITY_API_TOKEN=your-read-token
   SANITY_WRITE_TOKEN=your-write-token
   ```

## Schema Overview

The studio includes these document types:

- **User**: System users with roles and location assignments
- **Dealership Location**: The 5 store locations
- **Vehicle**: Inventory items imported from CSV
- **Transfer**: Vehicle transfer requests between stores
- **Activity**: Activity log for all vehicle actions
- **Comment**: Comments on vehicles
- **Import Log**: History of CSV imports

## Permissions

Configure CORS origins for your project:

1. Go to https://www.sanity.io/manage
2. Select your project
3. Go to API → CORS origins
4. Add:
   - `http://localhost:3000` (for local development)
   - Your production URL (e.g., `https://yourdomain.netlify.app`)

## Troubleshooting

- If you get authentication errors, run `sanity login`
- If schemas don't appear, ensure all files are in the `schemas` folder
- For CORS issues, check your allowed origins in the Sanity dashboard