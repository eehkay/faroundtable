#!/usr/bin/env tsx
/**
 * Local test script for vehicle import functionality
 * 
 * Usage:
 *   npm run test-import                    # Test full import process
 *   npm run test-import -- --connection    # Test SFTP connection only
 *   npm run test-import -- --mapping       # Test dealership mapping only
 *   npm run test-import -- --dry-run       # Test without database updates
 *   npm run test-import -- --store=MP1568  # Test specific store only
 */

import dotenv from 'dotenv';
import { join } from 'path';
import { testSFTPConnection } from './github-actions/sftp-client';
import { validateDealershipConfiguration } from './github-actions/dealership-mapper';

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env.local') });

// Command line arguments
const args = process.argv.slice(2);
const testConnection = args.includes('--connection');
const testMapping = args.includes('--mapping');
const dryRun = args.includes('--dry-run');
const storeArg = args.find(arg => arg.startsWith('--store='));
const specificStore = storeArg ? storeArg.split('=')[1] : null;

// Override environment variables for testing
if (dryRun) {
  process.env.DRY_RUN = 'true';
}
if (specificStore) {
  process.env.IMPORT_STORES = specificStore;
}

async function testImport() {
  console.log('🧪 Round Table Import Test Script');
  console.log('================================\n');

  // Check required environment variables
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'SFTP_HOST',
    'SFTP_USERNAME',
    'SFTP_PASSWORD'
  ];

  console.log('📋 Checking environment variables...');
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => console.error(`   - ${varName}`));
    console.log('\nPlease add these to your .env.local file');
    process.exit(1);
  }
  console.log('✅ All required environment variables present\n');

  // Test SFTP connection
  if (testConnection || !testMapping) {
    console.log('🔌 Testing SFTP connection...');
    const connectionSuccess = await testSFTPConnection();
    if (!connectionSuccess) {
      console.error('❌ SFTP connection test failed');
      process.exit(1);
    }
    console.log('');

    if (testConnection) {
      console.log('✅ Connection test completed successfully');
      return;
    }
  }

  // Validate dealership configuration
  if (testMapping || !testConnection) {
    console.log('🗺️  Validating dealership configuration...');
    const { valid, issues } = await validateDealershipConfiguration();
    
    if (!valid) {
      console.error('❌ Dealership configuration has issues:');
      issues.forEach(issue => console.error(`   - ${issue}`));
      console.log('\nPlease fix these issues in the admin panel');
      process.exit(1);
    }
    console.log('✅ Dealership configuration is valid\n');

    if (testMapping) {
      console.log('✅ Mapping test completed successfully');
      return;
    }
  }

  // Run full import
  console.log('🚀 Running full import test...');
  console.log(`   Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log(`   Stores: ${specificStore || 'ALL'}`);
  console.log(`   Enrichment: ${process.env.ENABLE_ADVANCED_ANALYTICS === 'true' ? 'ENABLED' : 'DISABLED'}`);
  console.log('');

  try {
    // Import and run the main function
    const { default: runImport } = await import('./github-actions/index');
    await runImport();
    
    console.log('\n✅ Import test completed successfully!');
  } catch (error) {
    console.error('\n❌ Import test failed:', error);
    process.exit(1);
  }
}

// Helper function to display test options
function showHelp() {
  console.log(`
Round Table Import Test Script

Usage:
  npm run test-import [options]

Options:
  --connection    Test SFTP connection only
  --mapping       Test dealership mapping only
  --dry-run       Test without database updates
  --store=CODE    Test specific store only (e.g., --store=MP1568)
  --help          Show this help message

Examples:
  npm run test-import                     # Full import test
  npm run test-import -- --connection     # Test SFTP connection
  npm run test-import -- --dry-run        # Dry run test
  npm run test-import -- --store=MP1568   # Test single store
`);
}

// Main execution
if (args.includes('--help')) {
  showHelp();
} else {
  testImport().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}