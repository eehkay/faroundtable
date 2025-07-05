# GitHub Actions SFTP Import with Data Enrichment Plan

## Overview

This document outlines a comprehensive plan to implement vehicle inventory imports using GitHub Actions, replacing the current Netlify Functions approach. This solution provides full SFTP support, data enrichment capabilities, and robust error handling.

### Why GitHub Actions?

| Feature | GitHub Actions | Netlify Functions |
|---------|---------------|-------------------|
| Native modules (`.node`) | ✅ Full support | ❌ Not supported |
| SFTP connections | ✅ ssh2-sftp-client works | ❌ Cannot bundle |
| Timeout limit | 6 hours | 10 seconds |
| Scheduled runs | ✅ Cron syntax | ✅ Cron syntax |
| Cost | Free (public) / 2000 min/mo (private) | Pay per invocation |
| Environment | Full Ubuntu VM | Sandboxed JavaScript |

## Architecture

### File Structure
```
faRoundTable/
├── .github/
│   └── workflows/
│       └── daily-inventory-import.yml        # Main workflow
├── dealership-trading/
│   └── scripts/
│       └── github-actions/
│           ├── index.ts                      # Main orchestrator
│           ├── sftp-import.ts               # SFTP connection & download
│           ├── csv-processor.ts             # Parse & validate CSVs
│           ├── data-enrichment.ts           # API enrichment logic
│           ├── sanity-sync.ts               # Sanity create/update/delete
│           ├── config/
│           │   └── stores.json              # Store configurations
│           └── types/
│               └── enrichment.ts            # TypeScript interfaces
```

### Data Flow
```
SFTP Server → Download CSVs → Parse → Enrich → Validate → Sync to Sanity
     ↓                                    ↓                      ↓
   Retry on fail                    External APIs          Import logs
```

## SFTP Implementation

### Full Native Module Support
```typescript
// sftp-import.ts
import Client from 'ssh2-sftp-client';

export async function downloadInventoryFiles(config: SFTPConfig): Promise<StoreFiles[]> {
  const sftp = new Client();
  
  try {
    await sftp.connect({
      host: process.env.SFTP_HOST,
      username: process.env.SFTP_USERNAME,
      password: process.env.SFTP_PASSWORD,
      port: parseInt(process.env.SFTP_PORT || '22'),
      retries: 3,
      retry_delay: 2000
    });
    
    const files = await Promise.all(
      storeConfigs.map(async (store) => {
        const remotePath = `${process.env.SFTP_PATH}/${store.fileName}`;
        const data = await sftp.get(remotePath);
        return {
          storeCode: store.storeCode,
          fileName: store.fileName,
          content: data.toString('utf-8'),
          timestamp: new Date().toISOString()
        };
      })
    );
    
    return files;
  } finally {
    await sftp.end();
  }
}
```

## Data Enrichment APIs

### 1. VIN Decoder Integration
```typescript
// data-enrichment.ts
interface VINDecoderResponse {
  make: string;
  model: string;
  year: number;
  trim: string;
  engineType: string;
  transmission: string;
  drivetrain: string;
  mpgCity: number;
  mpgHighway: number;
  standardFeatures: string[];
  msrp: number;
}

export async function enrichWithVINData(vin: string): Promise<VINDecoderResponse> {
  // Option 1: Free NHTSA API
  const nhtsaUrl = `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${vin}?format=json`;
  
  // Option 2: Paid service (more detailed data)
  const paidUrl = `https://api.vindecoder.com/v1/decode/${vin}`;
  
  const response = await fetch(paidUrl, {
    headers: {
      'Authorization': `Bearer ${process.env.VIN_DECODER_API_KEY}`
    }
  });
  
  return parseVINResponse(await response.json());
}
```

### 2. Market Data Enrichment
```typescript
interface MarketDataResponse {
  fairMarketValue: number;
  tradeInValue: number;
  retailValue: number;
  marketDemand: 'low' | 'medium' | 'high';
  averageDaysOnMarket: number;
  priceAnalysis: {
    vsMarket: 'below' | 'at' | 'above';
    percentDifference: number;
  };
}

export async function enrichWithMarketData(vehicle: Vehicle): Promise<MarketDataResponse> {
  // Services: KBB, Black Book, Edmunds, etc.
  const marketData = await fetch(`https://api.blackbook.com/v1/values`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.MARKET_DATA_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      vin: vehicle.vin,
      mileage: vehicle.mileage,
      condition: vehicle.condition,
      zipCode: getZipFromStore(vehicle.storeCode)
    })
  });
  
  return await marketData.json();
}
```

### 3. Image Enhancement
```typescript
interface ImageEnrichmentResponse {
  stockPhotoUrl?: string;
  detectedFeatures: string[];
  generatedDescription: string;
  imageQualityScore: number;
}

export async function enrichWithImageData(vehicle: Vehicle): Promise<ImageEnrichmentResponse> {
  // If no images, get stock photo
  if (!vehicle.imageUrls?.length) {
    const stockPhoto = await getStockPhoto(vehicle.year, vehicle.make, vehicle.model);
    vehicle.imageUrls = [stockPhoto];
  }
  
  // Analyze images for features
  const features = await analyzeVehicleImages(vehicle.imageUrls);
  
  // Generate AI description
  const description = await generateDescription(vehicle, features);
  
  return {
    stockPhotoUrl: stockPhoto,
    detectedFeatures: features,
    generatedDescription: description,
    imageQualityScore: calculateImageQuality(vehicle.imageUrls)
  };
}
```

## Enhanced Vehicle Type
```typescript
// types/enrichment.ts
export interface EnrichedVehicle extends Vehicle {
  // VIN Decoder Data
  engineType?: string;
  engineSize?: string;
  transmission?: string;
  transmissionSpeed?: string;
  drivetrain?: string;
  mpgCity?: number;
  mpgHighway?: number;
  standardFeatures?: string[];
  safetyRating?: number;
  
  // Market Data
  fairMarketValue?: number;
  tradeInValue?: number;
  retailValue?: number;
  priceVsMarket?: 'below' | 'at' | 'above';
  marketDemand?: 'low' | 'medium' | 'high';
  averageDaysOnMarket?: number;
  competitorPricing?: number[];
  
  // Image Analysis
  detectedFeatures?: string[];
  generatedDescription?: string;
  stockPhotoUrl?: string;
  imageQualityScore?: number;
  
  // Computed Fields
  pricingStrategy?: 'aggressive' | 'competitive' | 'premium';
  turnoverRisk?: 'low' | 'medium' | 'high';
  profitMargin?: number;
  recommendedPrice?: number;
}
```

## GitHub Actions Workflow

### Complete Workflow Configuration
```yaml
# .github/workflows/daily-inventory-import.yml
name: Daily Inventory Import with Enrichment

on:
  schedule:
    - cron: '0 2 * * *'  # 2 AM daily
  workflow_dispatch:     # Manual trigger
    inputs:
      stores:
        description: 'Specific stores to import (comma-separated codes)'
        required: false
        default: 'all'
      enrichment:
        description: 'Enable data enrichment'
        type: boolean
        default: true
      dryRun:
        description: 'Dry run (no Sanity updates)'
        type: boolean
        default: false

jobs:
  import:
    runs-on: ubuntu-latest
    timeout-minutes: 60
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: 'dealership-trading/package-lock.json'
      
      - name: Install dependencies
        run: |
          cd dealership-trading
          npm ci
          npm install ssh2-sftp-client
      
      - name: Cache enrichment data
        uses: actions/cache@v3
        with:
          path: ~/.cache/vehicle-enrichment
          key: enrichment-${{ runner.os }}-${{ hashFiles('**/package-lock.json') }}
          restore-keys: |
            enrichment-${{ runner.os }}-
      
      - name: Run Import with Enrichment
        id: import
        env:
          # Sanity Configuration
          SANITY_PROJECT_ID: ${{ secrets.SANITY_PROJECT_ID }}
          SANITY_DATASET: ${{ secrets.SANITY_DATASET }}
          SANITY_WRITE_TOKEN: ${{ secrets.SANITY_WRITE_TOKEN }}
          
          # SFTP Configuration
          SFTP_HOST: ${{ secrets.SFTP_HOST }}
          SFTP_USERNAME: ${{ secrets.SFTP_USERNAME }}
          SFTP_PASSWORD: ${{ secrets.SFTP_PASSWORD }}
          SFTP_PORT: ${{ secrets.SFTP_PORT }}
          SFTP_PATH: ${{ secrets.SFTP_PATH }}
          
          # Enrichment API Keys
          VIN_DECODER_API_KEY: ${{ secrets.VIN_DECODER_API_KEY }}
          MARKET_DATA_API_KEY: ${{ secrets.MARKET_DATA_API_KEY }}
          IMAGE_ANALYSIS_API_KEY: ${{ secrets.IMAGE_ANALYSIS_API_KEY }}
          
          # Runtime Configuration
          STORES: ${{ github.event.inputs.stores || 'all' }}
          ENABLE_ENRICHMENT: ${{ github.event.inputs.enrichment || 'true' }}
          DRY_RUN: ${{ github.event.inputs.dryRun || 'false' }}
        run: |
          cd dealership-trading
          tsx scripts/github-actions/index.ts
      
      - name: Upload Import Report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: import-report-${{ github.run_id }}
          path: |
            dealership-trading/import-report.json
            dealership-trading/import-errors.log
      
      - name: Send Slack Notification
        if: always()
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: |
            Inventory Import ${{ job.status }}
            Imported: ${{ steps.import.outputs.created }}
            Updated: ${{ steps.import.outputs.updated }}
            Deleted: ${{ steps.import.outputs.deleted }}
            Errors: ${{ steps.import.outputs.errors }}
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
      
      - name: Create Issue on Failure
        if: failure()
        uses: actions/create-issue@v2
        with:
          title: "Inventory Import Failed - ${{ github.run_id }}"
          body: |
            The daily inventory import failed.
            
            **Run ID**: ${{ github.run_id }}
            **Error Count**: ${{ steps.import.outputs.errors }}
            
            Check the [workflow run](https://github.com/${{ github.repository }}/actions/runs/${{ github.run_id }}) for details.
          labels: bug, import-failure
```

## Store Configuration

### Multi-Store Setup
```json
// scripts/github-actions/config/stores.json
{
  "stores": [
    {
      "code": "MP1568",
      "name": "United Nissan Las Vegas",
      "fileName": "MP1568.csv",
      "locationId": "location-mp1568",
      "timezone": "America/Los_Angeles",
      "enrichment": {
        "vinDecode": true,
        "marketData": true,
        "imageAnalysis": true,
        "competitorRadius": 50
      }
    },
    {
      "code": "MP22171",
      "name": "United Nissan Reno",
      "fileName": "MP22171.csv",
      "locationId": "location-mp22171",
      "timezone": "America/Los_Angeles",
      "enrichment": {
        "vinDecode": true,
        "marketData": true,
        "imageAnalysis": false,
        "competitorRadius": 75
      }
    },
    {
      "code": "MP18527",
      "name": "United Nissan Imperial",
      "fileName": "MP18527.csv",
      "locationId": "location-mp18527",
      "timezone": "America/Los_Angeles",
      "enrichment": {
        "vinDecode": true,
        "marketData": true,
        "imageAnalysis": true,
        "competitorRadius": 30
      }
    },
    {
      "code": "MP23003",
      "name": "United Kia Imperial",
      "fileName": "MP23003.csv",
      "locationId": "location-mp23003",
      "timezone": "America/Los_Angeles",
      "enrichment": {
        "vinDecode": true,
        "marketData": true,
        "imageAnalysis": true,
        "competitorRadius": 30
      }
    },
    {
      "code": "MP22968",
      "name": "United Toyota Imperial",
      "fileName": "MP22968.csv",
      "locationId": "location-mp22968",
      "timezone": "America/Los_Angeles",
      "enrichment": {
        "vinDecode": true,
        "marketData": true,
        "imageAnalysis": true,
        "competitorRadius": 30
      }
    }
  ],
  "enrichmentConfig": {
    "vinDecoder": {
      "provider": "nhtsa",
      "fallbackProvider": "vindecoder.com",
      "rateLimit": 5,
      "cacheDuration": 2592000,  // 30 days in seconds
      "retries": 3
    },
    "marketData": {
      "provider": "blackbook",
      "includeHistory": true,
      "includeForecast": true,
      "cacheDuration": 86400,  // 24 hours
      "retries": 2
    },
    "imageAnalysis": {
      "provider": "google-vision",
      "detectFeatures": true,
      "generateDescriptions": true,
      "maxImagesPerVehicle": 5,
      "cacheDuration": 604800  // 7 days
    }
  },
  "importConfig": {
    "deleteAfterDays": 3,
    "preserveTransferredVehicles": true,
    "validateVINChecksum": true,
    "requiredFields": ["stockNumber", "vin", "year", "make", "model", "price"]
  }
}
```

## Implementation Code Examples

### Main Orchestrator
```typescript
// scripts/github-actions/index.ts
import { downloadInventoryFiles } from './sftp-import';
import { processCSVFiles } from './csv-processor';
import { enrichVehicles } from './data-enrichment';
import { syncToSanity } from './sanity-sync';
import { generateReport } from './reporting';
import stores from './config/stores.json';

async function main() {
  const startTime = Date.now();
  const results = {
    stores: {} as Record<string, StoreResult>,
    totals: {
      created: 0,
      updated: 0,
      deleted: 0,
      errors: 0,
      enriched: 0
    }
  };

  try {
    // 1. Download files from SFTP
    console.log('📥 Downloading inventory files...');
    const files = await downloadInventoryFiles(stores.stores);
    
    // 2. Process each store in parallel
    const storeResults = await Promise.all(
      files.map(async (file) => {
        try {
          // Parse CSV
          const vehicles = await processCSVFiles(file);
          
          // Enrich data if enabled
          let enrichedVehicles = vehicles;
          if (process.env.ENABLE_ENRICHMENT === 'true') {
            enrichedVehicles = await enrichVehicles(vehicles, file.storeCode);
            results.totals.enriched += enrichedVehicles.length;
          }
          
          // Sync to Sanity
          const syncResult = await syncToSanity(enrichedVehicles, file.storeCode);
          
          return {
            storeCode: file.storeCode,
            success: true,
            ...syncResult
          };
        } catch (error) {
          return {
            storeCode: file.storeCode,
            success: false,
            error: error.message
          };
        }
      })
    );
    
    // 3. Aggregate results
    storeResults.forEach(result => {
      results.stores[result.storeCode] = result;
      if (result.success) {
        results.totals.created += result.created || 0;
        results.totals.updated += result.updated || 0;
        results.totals.deleted += result.deleted || 0;
      } else {
        results.totals.errors++;
      }
    });
    
    // 4. Generate report
    const report = await generateReport(results, startTime);
    
    // 5. Set outputs for GitHub Actions
    console.log(`::set-output name=created::${results.totals.created}`);
    console.log(`::set-output name=updated::${results.totals.updated}`);
    console.log(`::set-output name=deleted::${results.totals.deleted}`);
    console.log(`::set-output name=errors::${results.totals.errors}`);
    
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main();
```

### Parallel Enrichment Pipeline
```typescript
// scripts/github-actions/data-enrichment.ts
export async function enrichVehicles(
  vehicles: Vehicle[], 
  storeCode: string
): Promise<EnrichedVehicle[]> {
  const storeConfig = stores.stores.find(s => s.code === storeCode);
  const enrichmentConfig = storeConfig?.enrichment;
  
  if (!enrichmentConfig) return vehicles;
  
  // Process in batches to avoid rate limits
  const batchSize = 10;
  const enrichedBatches = [];
  
  for (let i = 0; i < vehicles.length; i += batchSize) {
    const batch = vehicles.slice(i, i + batchSize);
    
    const enrichedBatch = await Promise.all(
      batch.map(async (vehicle) => {
        try {
          const enrichments = await Promise.all([
            enrichmentConfig.vinDecode ? enrichVIN(vehicle.vin) : null,
            enrichmentConfig.marketData ? enrichMarketData(vehicle, storeCode) : null,
            enrichmentConfig.imageAnalysis ? enrichImages(vehicle) : null
          ]);
          
          return mergeEnrichmentData(vehicle, ...enrichments);
        } catch (error) {
          console.error(`Enrichment failed for ${vehicle.stockNumber}:`, error);
          return vehicle; // Return original on failure
        }
      })
    );
    
    enrichedBatches.push(...enrichedBatch);
    
    // Rate limiting pause
    if (i + batchSize < vehicles.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return enrichedBatches;
}
```

## Error Handling & Monitoring

### Retry Logic
```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    retries: number;
    delay: number;
    backoff?: number;
    onRetry?: (error: Error, attempt: number) => void;
  }
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= options.retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      options.onRetry?.(error, attempt);
      
      if (attempt < options.retries) {
        const delay = options.delay * Math.pow(options.backoff || 1, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError!;
}
```

### Caching Strategy
```typescript
import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';

class EnrichmentCache {
  private cacheDir = process.env.CACHE_DIR || '.cache/enrichment';
  
  async get(key: string, type: string): Promise<any | null> {
    const hash = createHash('md5').update(key).digest('hex');
    const filePath = path.join(this.cacheDir, type, `${hash}.json`);
    
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      const cached = JSON.parse(data);
      
      if (cached.expires > Date.now()) {
        return cached.data;
      }
      
      await fs.unlink(filePath); // Remove expired cache
    } catch (error) {
      // Cache miss
    }
    
    return null;
  }
  
  async set(key: string, type: string, data: any, ttl: number): Promise<void> {
    const hash = createHash('md5').update(key).digest('hex');
    const dirPath = path.join(this.cacheDir, type);
    const filePath = path.join(dirPath, `${hash}.json`);
    
    await fs.mkdir(dirPath, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify({
      data,
      expires: Date.now() + ttl * 1000
    }));
  }
}
```

## Setup Instructions

### 1. Create GitHub Secrets
```bash
# Required secrets:
SANITY_PROJECT_ID
SANITY_DATASET
SANITY_WRITE_TOKEN
SFTP_HOST
SFTP_USERNAME
SFTP_PASSWORD
SFTP_PORT
SFTP_PATH

# Optional enrichment API keys:
VIN_DECODER_API_KEY
MARKET_DATA_API_KEY
IMAGE_ANALYSIS_API_KEY
SLACK_WEBHOOK
```

### 2. Install Additional Dependencies
```bash
cd dealership-trading
npm install --save-dev ssh2-sftp-client
npm install --save-dev node-cache
npm install --save-dev p-limit  # For concurrency control
```

### 3. Test Locally
```bash
# Create .env file with all secrets
cd dealership-trading
tsx scripts/github-actions/index.ts
```

### 4. Deploy Workflow
```bash
# Commit and push the workflow file
git add .github/workflows/daily-inventory-import.yml
git commit -m "Add GitHub Actions inventory import workflow"
git push
```

### 5. Manual Test Run
```bash
# Trigger manually from GitHub UI or CLI
gh workflow run daily-inventory-import.yml \
  -f stores=MP1568 \
  -f enrichment=true \
  -f dryRun=true
```

## Cost Considerations

### GitHub Actions
- **Public repos**: Free
- **Private repos**: 2,000 minutes/month free, then $0.008/minute
- **Estimated usage**: ~30 minutes/day = 900 minutes/month

### Enrichment APIs
- **VIN Decoder (NHTSA)**: Free
- **VIN Decoder (Paid)**: ~$0.01-0.05 per VIN
- **Market Data**: ~$0.10-0.50 per vehicle
- **Image Analysis**: ~$0.001-0.003 per image

### Monthly Estimate (5 stores, 1000 vehicles)
- GitHub Actions: $0 (public) or ~$7 (private)
- VIN Decoding: $10-50
- Market Data: $100-500
- Image Analysis: $5-15
- **Total**: $115-572/month

## Future Enhancements

### 1. Additional Enrichment Sources
- **Carfax/AutoCheck** - Vehicle history
- **Google Maps API** - Distance calculations
- **Weather API** - Correlate sales with weather
- **Social Media** - Sentiment analysis
- **Competitor Websites** - Price scraping

### 2. Machine Learning
- **Price Optimization** - ML model for optimal pricing
- **Demand Forecasting** - Predict which vehicles sell faster
- **Image Quality** - Automatically request new photos
- **Description Generation** - GPT-powered descriptions

### 3. Advanced Features
- **Real-time Updates** - Webhook from dealer systems
- **Incremental Imports** - Only process changes
- **Multi-region Support** - Different rules per region
- **A/B Testing** - Test pricing strategies
- **ROI Tracking** - Measure enrichment value

### 4. Integration Options
- **Slack Commands** - Trigger imports via Slack
- **Email Reports** - Daily summaries
- **Dashboard** - Real-time import status
- **API Endpoint** - Allow manual uploads

## Troubleshooting

### Common Issues

1. **SFTP Connection Fails**
   - Check firewall/IP whitelist
   - Verify credentials
   - Test with command line sftp

2. **Enrichment API Rate Limits**
   - Implement exponential backoff
   - Use caching aggressively
   - Consider higher tier plans

3. **Large Files Timeout**
   - Process in smaller batches
   - Use streaming for CSV parsing
   - Increase workflow timeout

4. **Sanity Write Limits**
   - Batch mutations
   - Use transactions
   - Implement queuing

### Debug Commands
```bash
# Test SFTP connection
sftp -P $SFTP_PORT $SFTP_USERNAME@$SFTP_HOST

# Test enrichment APIs
curl -H "Authorization: Bearer $API_KEY" https://api.example.com/test

# Check GitHub Actions logs
gh run list --workflow=daily-inventory-import.yml
gh run view <run-id> --log
```

## Conclusion

This GitHub Actions-based solution provides a robust, scalable way to import inventory data with enrichment capabilities. It overcomes the limitations of serverless functions while adding valuable data that can improve inventory management and sales.