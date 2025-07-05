import { config } from 'dotenv';
import { createClient } from '@sanity/client';
import groq from 'groq';
import path from 'path';

// Load environment variables from parent directory
config({ path: path.resolve(__dirname, '../.env.local') });

// Hardcode values if env vars are not available
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'bhik7rw7';
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
const token = process.env.SANITY_API_TOKEN;

if (!projectId || !token) {
  console.error('Project ID and SANITY_API_TOKEN are required');
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  token,
  apiVersion: '2023-01-01',
  useCdn: false,
});

async function checkUsers() {
  try {
    console.log('Checking users in Sanity...');
    console.log('Project ID:', projectId);
    console.log('Dataset:', dataset);
    
    // Fetch all users
    const users = await client.fetch(groq`
      *[_type == "user"] | order(name asc) {
        _id,
        email,
        name,
        image,
        domain,
        role,
        active,
        lastLogin,
        location->{
          _id,
          name,
          code
        }
      }
    `);
    
    console.log(`\nFound ${users.length} users:`);
    
    if (users.length === 0) {
      console.log('No users found in the database.');
      console.log('\nThis could mean:');
      console.log('1. Users haven\'t been created yet (try logging in with Google)');
      console.log('2. The user schema isn\'t deployed to Sanity Studio');
      console.log('3. There\'s a permission issue with the API token');
    } else {
      users.forEach((user: any) => {
        console.log(`\n- ${user.name || 'No name'} (${user.email})`);
        console.log(`  ID: ${user._id}`);
        console.log(`  Role: ${user.role || 'Not set'}`);
        console.log(`  Active: ${user.active !== false ? 'Yes' : 'No'}`);
        console.log(`  Location: ${user.location?.name || 'Not assigned'}`);
        console.log(`  Last Login: ${user.lastLogin || 'Never'}`);
      });
    }
    
    // Also check if the user type exists
    console.log('\n\nChecking user document type...');
    const userType = await client.fetch(groq`
      *[_type == "sanity.documentType" && name == "user"][0]
    `);
    
    if (!userType) {
      console.log('User document type not found in schema.');
      console.log('You may need to deploy your schema to Sanity Studio.');
    } else {
      console.log('User document type exists in schema.');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the script
checkUsers();