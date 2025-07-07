# Vehicle Import Implementation Guide

This guide provides step-by-step instructions for implementing the GitHub Actions-based vehicle import system for Round Table.

## Table of Contents
1. [Overview](#overview)
2. [GitHub Setup](#github-setup)
3. [Backend Configuration](#backend-configuration)
4. [Implementation Strategy](#implementation-strategy)
5. [Testing & Verification](#testing--verification)
6. [Monitoring & Troubleshooting](#monitoring--troubleshooting)

## Overview

The vehicle import system automatically downloads CSV inventory files from an SFTP server and syncs them to your Supabase database. It runs daily at 2 AM PST and can also be triggered manually.

### Key Features
- ✅ Automated daily imports via GitHub Actions
- ✅ SFTP file download with retry logic
- ✅ CSV filename to dealership mapping
- ✅ Preserves vehicles with active transfers
- ✅ Comprehensive import logging
- ✅ Manual trigger capability
- ✅ Real-time status monitoring

## GitHub Setup

### Step 1: Enable GitHub Actions

1. Navigate to your GitHub repository
2. Click on the **Actions** tab
3. If Actions are disabled, click **Enable Actions**

### Step 2: Add Repository Secrets

Navigate to **Settings** → **Secrets and variables** → **Actions** and add the following secrets:

#### Required Secrets

| Secret Name | Description | Example |
|------------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | `https://xxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbGc...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (keep secret!) | `eyJhbGc...` |
| `SFTP_HOST` | SFTP server hostname | `sftp.example.com` |
| `SFTP_USERNAME` | SFTP username | `inventory_user` |
| `SFTP_PASSWORD` | SFTP password | `secure_password` |
| `SFTP_PORT` | SFTP port (optional, defaults to 22) | `22` |
| `SFTP_PATH` | Path to CSV files on SFTP | `/inventory/csv` |

#### Optional Secrets

| Secret Name | Description | Example |
|------------|-------------|---------|
| `GITHUB_TOKEN` | For manual triggers (auto-provided) | Auto-generated |
| `SLACK_WEBHOOK` | Slack notifications URL | `https://hooks.slack.com/...` |
| `RESEND_API_KEY` | Email notifications | `re_xxxxx` |
| `RESEND_FROM_EMAIL` | Sender email | `alerts@yourdomain.com` |
| `ADMIN_EMAIL` | Admin notification email | `admin@yourdomain.com` |
| `MARKETCHECK_API_KEY` | Vehicle data enrichment | `mc_xxxxx` |
| `DATAFORSEO_EMAIL` | SEO data enrichment | `user@example.com` |
| `DATAFORSEO_API_KEY` | SEO data API key | `df_xxxxx` |

### Step 3: Verify Workflow Deployment

1. Go to **Actions** tab in GitHub
2. You should see "Daily Inventory Import" workflow
3. Click on it to view details
4. The workflow will run automatically at 2 AM PST daily

## Backend Configuration

### Step 1: Configure Dealership CSV Mappings

1. **Login as Admin** to Round Table
2. Navigate to **Admin** → **Dealerships**
3. For each dealership:
   - Click **Edit** button
   - Enter the **CSV File Name** (e.g., `MP1568.csv`)
   - This filename must match exactly what's on the SFTP server
   - Click **Save Changes**

### Step 2: Verify User Permissions

Ensure the following roles have appropriate access:

| Feature | Admin | Manager | Sales | Transport |
|---------|-------|---------|-------|-----------|
| View Import History | ✅ | ❌ | ❌ | ❌ |
| Trigger Manual Import | ✅ | ❌ | ❌ | ❌ |
| Edit CSV Mappings | ✅ | ❌ | ❌ | ❌ |
| View Import Status | ✅ | ✅ | ✅ | ✅ |

### Step 3: Configure Import Settings

The import system uses these settings:
- **Schedule**: Daily at 2:00 AM PST
- **Transfer Preservation**: Active transfers are never deleted
- **Cleanup**: Delivered vehicles reset to available after 3 days
- **Validation**: VIN must be 17 characters, valid year range

## Implementation Strategy

### Phase 1: Pre-Deployment Checklist

- [ ] All environment variables added to GitHub Secrets
- [ ] SFTP credentials tested and working
- [ ] All dealerships have CSV filenames configured
- [ ] Admin users identified and permissions verified
- [ ] Backup of current vehicle data created

### Phase 2: Initial Testing

1. **Test SFTP Connection**
   ```bash
   npm run test-import -- --connection
   ```

2. **Validate Dealership Mappings**
   ```bash
   npm run test-import -- --mapping
   ```

3. **Dry Run Test** (no database changes)
   ```bash
   npm run test-import -- --dry-run
   ```

4. **Single Store Test**
   ```bash
   npm run test-import -- --store=MP1568 --dry-run
   ```

### Phase 3: First Import

1. **Manual Trigger** (recommended for first run)
   - Go to **Admin** → **Imports**
   - Click **Trigger Import**
   - Select options:
     - Stores: Start with one store (e.g., `MP1568`)
     - Enable Data Enrichment: Optional
     - Dry Run: Yes (for safety)

2. **Monitor Progress**
   - Check GitHub Actions tab for live logs
   - View import status in Admin → Imports
   - Verify no errors occurred

3. **Production Run**
   - If dry run succeeds, run without dry run
   - Monitor the import closely
   - Check vehicle counts match expectations

### Phase 4: Full Rollout

1. **Enable All Stores**
   - Trigger import with stores: `all`
   - Monitor for any store-specific issues

2. **Verify Daily Schedule**
   - Check GitHub Actions at 2 AM PST next day
   - Confirm import ran successfully

3. **Set Up Monitoring**
   - Configure Slack/email notifications
   - Train team on import dashboard

## Testing & Verification

### Local Testing Commands

```bash
# Install dependencies first
npm install

# Test SFTP connection only
npm run test-import -- --connection

# Test dealership mapping
npm run test-import -- --mapping

# Full dry run (no DB changes)
npm run test-import -- --dry-run

# Test specific store
npm run test-import -- --store=MP1568

# Full import test (CAUTION: updates database)
npm run test-import
```

### Verification Steps

1. **Check Import Logs**
   - Admin → Imports shows recent imports
   - Click on import for detailed breakdown
   - Verify counts: created, updated, deleted

2. **Verify Vehicle Data**
   - Check total vehicle count is reasonable
   - Spot check a few vehicles for accuracy
   - Ensure no active transfers were deleted

3. **Check Dealership Status**
   - Admin → Dealerships shows last import status
   - Green checkmark = successful
   - Orange alert = errors occurred

## Monitoring & Troubleshooting

### Daily Monitoring

1. **Import Dashboard** (Admin → Imports)
   - Check for daily import completion
   - Review any error counts
   - Monitor import duration trends

2. **Dealership List** (Admin → Dealerships)
   - Quick status check for all stores
   - Shows last successful import time

3. **GitHub Actions**
   - Check workflow runs for detailed logs
   - Download artifacts for import reports

### Common Issues & Solutions

#### SFTP Connection Fails
```
Error: Failed to connect to SFTP server
```
**Solution:**
- Verify SFTP credentials in GitHub Secrets
- Check firewall/IP whitelist on SFTP server
- Test connection locally with `sftp` command

#### CSV File Not Found
```
Warning: No dealership mapping found for file: inventory_MP1234.csv
```
**Solution:**
- Update dealership CSV filename in Admin panel
- Ensure filename matches exactly (case-sensitive)
- Check if file exists on SFTP server

#### Import Runs But No Changes
```
Created: 0, Updated: 0, Deleted: 0
```
**Solution:**
- Verify CSV files contain data
- Check CSV format matches expected structure
- Review validation errors in import log

#### GitHub Actions Not Triggering
**Solution:**
- Verify workflow file exists in `.github/workflows/`
- Check Actions are enabled in repository
- Ensure default branch is correct (main/master)

### Emergency Procedures

1. **Stop Automated Imports**
   - Go to GitHub Actions → Daily Inventory Import
   - Click "..." → Disable workflow

2. **Rollback Bad Import**
   - Restore from Supabase backup
   - Or manually fix affected vehicles

3. **Debug Failed Import**
   - Download import artifacts from GitHub
   - Check `import-errors.log` file
   - Review detailed logs in GitHub Actions

### Performance Optimization

- **Large Inventories**: Process in batches if >10,000 vehicles
- **Slow Imports**: Enable GitHub Actions caching
- **API Rate Limits**: Adjust enrichment batch size

## Best Practices

1. **Regular Monitoring**
   - Check imports daily for first week
   - Set up alerts for failures
   - Review import duration trends

2. **Change Management**
   - Test CSV format changes in dry-run first
   - Coordinate dealership code changes
   - Document any custom modifications

3. **Security**
   - Rotate SFTP passwords quarterly
   - Keep service role key secret
   - Use environment-specific credentials

4. **Data Quality**
   - Validate CSV data at source
   - Monitor for duplicate VINs
   - Check for reasonable price ranges

## Support & Resources

- **GitHub Actions Docs**: https://docs.github.com/en/actions
- **Supabase Docs**: https://supabase.com/docs
- **Round Table Admin Guide**: `/admin/help`
- **Import API Reference**: `/api/admin/imports`

For additional support, contact your system administrator or check the import logs for detailed error messages.