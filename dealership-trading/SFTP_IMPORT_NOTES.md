# SFTP Import Notes

## Issue
The scheduled SFTP import functionality has been temporarily disabled due to Netlify Functions' inability to bundle native Node.js modules. The `ssh2-sftp-client` package uses native bindings (`.node` files) that cannot be bundled for serverless environments.

## Current Status
- The scheduled import function (`netlify/functions/scheduled-import.ts`) has been modified to return a placeholder response
- The `ssh2-sftp-client` package has been removed from dependencies to allow successful deployment

## Alternative Solutions

### 1. Manual Import Script
A manual import script has been created that can be run from a server with SFTP access. To use it:

1. Install `ssh2-sftp-client` locally: `npm install ssh2-sftp-client`
2. Create a file `scripts/manual-import.ts` with the SFTP import logic
3. Run: `npm run manual-import`

### 2. GitHub Actions
Set up a GitHub Action that runs on a schedule to perform the SFTP import. GitHub Actions can handle native modules.

### 3. External Service
Use a dedicated server or service (like a small VPS or cloud function that supports native modules) to handle SFTP imports.

### 4. HTTP-based Import
Modify the dealership systems to push CSV data to an HTTP endpoint instead of requiring SFTP pull.

## Recommended Approach
For production use, we recommend setting up a GitHub Action that:
1. Runs on a daily schedule (cron)
2. Connects to SFTP and downloads CSV files
3. Processes the files and updates Sanity
4. Provides logging and error notifications

This approach is more reliable and doesn't have the limitations of serverless functions.