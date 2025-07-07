import { createClient } from '@supabase/supabase-js';
import type { SFTPFile, MappedFile } from './types/import';

// Use the actual Supabase dealership type
interface SupabaseDealership {
  id: string;
  name: string;
  code: string;
  csv_file_name?: string;
  active: boolean;
}

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function mapFilesToDealerships(files: SFTPFile[]): Promise<MappedFile[]> {
  // Fetch all active dealerships from Supabase
  const { data: dealerships, error } = await supabase
    .from('dealership_locations')
    .select('*')
    .eq('active', true);

  if (error) {
    throw new Error(`Failed to fetch dealerships: ${error.message}`);
  }

  if (!dealerships || dealerships.length === 0) {
    throw new Error('No active dealerships found in the database');
  }

  console.log(`    Found ${dealerships.length} active dealerships`);

  // Create a map of CSV filename to dealership
  const dealershipMap = new Map<string, SupabaseDealership>();
  dealerships.forEach(dealership => {
    if (dealership.csv_file_name) {
      dealershipMap.set(dealership.csv_file_name, dealership);
      // Also map without .csv extension for flexibility
      dealershipMap.set(dealership.csv_file_name.replace('.csv', ''), dealership);
    }
  });

  // Map files to dealerships
  const mappedFiles: MappedFile[] = files.map(file => {
    const dealership = dealershipMap.get(file.filename) || 
                      dealershipMap.get(file.filename.replace('.csv', ''));

    if (!dealership) {
      console.warn(`    ⚠️  No dealership mapping found for file: ${file.filename}`);
    }

    return {
      filename: file.filename,
      content: file.content,
      dealership: dealership || null,
      shouldProcess: !!dealership
    };
  });

  // Log mapping results
  const mapped = mappedFiles.filter(f => f.shouldProcess).length;
  const unmapped = mappedFiles.filter(f => !f.shouldProcess).length;

  console.log(`    ✅ Mapping complete:`);
  console.log(`       - Mapped: ${mapped} files`);
  console.log(`       - Unmapped: ${unmapped} files`);

  // Log unmapped files for visibility
  const unmappedFiles = mappedFiles.filter(f => !f.shouldProcess);
  if (unmappedFiles.length > 0) {
    console.log('    📋 Unmapped files:');
    unmappedFiles.forEach(f => {
      console.log(`       - ${f.filename}`);
    });
  }

  // Check for missing dealership files if running full import
  if (process.env.IMPORT_STORES === 'all') {
    const receivedFilenames = new Set(files.map(f => f.filename));
    const missingDealerships = dealerships.filter(d => 
      d.csv_file_name && !receivedFilenames.has(d.csv_file_name)
    );

    if (missingDealerships.length > 0) {
      console.log('    ⚠️  Expected files not found:');
      missingDealerships.forEach(d => {
        console.log(`       - ${d.csv_file_name} (${d.name})`);
      });
    }
  }

  return mappedFiles;
}

// Utility function to validate dealership configuration
export async function validateDealershipConfiguration(): Promise<{
  valid: boolean;
  issues: string[];
}> {
  const issues: string[] = [];

  const { data: dealerships, error } = await supabase
    .from('dealership_locations')
    .select('*')
    .eq('active', true);

  if (error) {
    issues.push(`Database error: ${error.message}`);
    return { valid: false, issues };
  }

  if (!dealerships || dealerships.length === 0) {
    issues.push('No active dealerships found');
    return { valid: false, issues };
  }

  // Check for missing CSV filenames
  const missingCsvFilenames = dealerships.filter(d => !d.csv_file_name);
  if (missingCsvFilenames.length > 0) {
    missingCsvFilenames.forEach(d => {
      issues.push(`Dealership "${d.name}" (${d.code}) is missing CSV filename`);
    });
  }

  // Check for duplicate CSV filenames
  const csvFilenames = dealerships
    .filter(d => d.csv_file_name)
    .map(d => d.csv_file_name);
  
  const duplicates = csvFilenames.filter((filename, index) => 
    csvFilenames.indexOf(filename) !== index
  );

  if (duplicates.length > 0) {
    const uniqueDuplicates = [...new Set(duplicates)];
    uniqueDuplicates.forEach(filename => {
      const dealershipsWithFile = dealerships.filter(d => d.csv_file_name === filename);
      const dealershipNames = dealershipsWithFile.map(d => `${d.name} (${d.code})`).join(', ');
      issues.push(`Duplicate CSV filename "${filename}" used by: ${dealershipNames}`);
    });
  }

  // Check for invalid CSV filename format
  const invalidFilenames = dealerships.filter(d => 
    d.csv_file_name && !d.csv_file_name.endsWith('.csv')
  );

  if (invalidFilenames.length > 0) {
    invalidFilenames.forEach(d => {
      issues.push(`Dealership "${d.name}" has invalid CSV filename format: ${d.csv_file_name}`);
    });
  }

  return {
    valid: issues.length === 0,
    issues
  };
}