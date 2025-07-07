const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Supabase client with service role key for admin operations
const supabaseUrl = 'https://vchtbaawxxruwtvebxlg.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjaHRiYWF3eHhydXd0dmVieGxnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTczMjQ1OSwiZXhwIjoyMDY3MzA4NDU5fQ.8JTGLi1Swn1jS_AQbbUMedFFjqZUVsLrxdb8QC3AG2U';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function uploadFavicon() {
  try {
    console.log('Starting favicon upload process...');
    
    // Read the favicon file
    const faviconPath = '/Users/andrewkellogg/Del Mar Advertising Dropbox/Andrew Kellogg/Dev Work/faRoundTable/rt_favicon.png';
    const faviconBuffer = fs.readFileSync(faviconPath);
    
    // Upload the favicon to the logos bucket
    console.log('Uploading favicon...');
    const { data, error } = await supabase.storage
      .from('logos')
      .upload('roundtable-favicon.png', faviconBuffer, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: true
      });
    
    if (error) {
      console.error('Error uploading favicon:', error);
      return;
    }
    
    // Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from('logos')
      .getPublicUrl('roundtable-favicon.png');
    
    console.log('Favicon uploaded successfully!');
    console.log('Public URL:', publicUrlData.publicUrl);
    
    // Save the URL to a file for reference
    const urlInfo = `Favicon URL: ${publicUrlData.publicUrl}\n`;
    fs.writeFileSync(path.join(__dirname, 'favicon-url.txt'), urlInfo);
    console.log('URL saved to scripts/favicon-url.txt');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

uploadFavicon();