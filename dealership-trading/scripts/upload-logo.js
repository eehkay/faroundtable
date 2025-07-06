const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Supabase client with service role key for admin operations
const supabaseUrl = 'https://vchtbaawxxruwtvebxlg.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjaHRiYWF3eHhydXd0dmVieGxnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTczMjQ1OSwiZXhwIjoyMDY3MzA4NDU5fQ.8JTGLi1Swn1jS_AQbbUMedFFjqZUVsLrxdb8QC3AG2U';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function uploadLogo() {
  try {
    console.log('Starting logo upload process...');
    
    // First, create the bucket if it doesn't exist
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
      return;
    }
    
    const logosBucketExists = buckets.some(bucket => bucket.name === 'logos');
    
    if (!logosBucketExists) {
      console.log('Creating logos bucket...');
      const { data: createData, error: createError } = await supabase.storage.createBucket('logos', {
        public: true,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'],
        fileSizeLimit: 5242880 // 5MB
      });
      
      if (createError) {
        console.error('Error creating bucket:', createError);
        return;
      }
      console.log('Logos bucket created successfully');
    }
    
    // Read the logo file
    const logoPath = '/Users/andrewkellogg/Del Mar Advertising Dropbox/Andrew Kellogg/Dev Work/faRoundTable/roundtable_logo stacked.png';
    const logoBuffer = fs.readFileSync(logoPath);
    
    // Upload the logo
    console.log('Uploading logo...');
    const { data, error } = await supabase.storage
      .from('logos')
      .upload('roundtable-logo-stacked.png', logoBuffer, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: true
      });
    
    if (error) {
      console.error('Error uploading logo:', error);
      return;
    }
    
    // Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from('logos')
      .getPublicUrl('roundtable-logo-stacked.png');
    
    console.log('Logo uploaded successfully!');
    console.log('Public URL:', publicUrlData.publicUrl);
    
    // Save the URL to a file for reference
    const urlInfo = `Logo URL: ${publicUrlData.publicUrl}\n`;
    fs.writeFileSync(path.join(__dirname, 'logo-url.txt'), urlInfo);
    console.log('URL saved to scripts/logo-url.txt');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

uploadLogo();