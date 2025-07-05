import { config } from 'dotenv';
import { createClient } from '@sanity/client';
import groq from 'groq';
import path from 'path';

// Load environment variables from parent directory
config({ path: path.resolve(__dirname, '../.env.local') });

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

async function checkUserByEmail() {
  try {
    const email = 'kellogg@formanautomotive.com';
    const userId = `user.${email.replace(/[^a-z0-9]/gi, '_')}`;
    
    console.log('Checking for user with email:', email);
    console.log('Expected user ID:', userId);
    
    // Check by ID
    const userById = await client.fetch(groq`
      *[_type == "user" && _id == $userId][0]
    `, { userId });
    
    // Check by email
    const userByEmail = await client.fetch(groq`
      *[_type == "user" && email == $email][0]
    `, { email });
    
    console.log('\nUser by ID:', userById);
    console.log('\nUser by email:', userByEmail);
    
    // Check all users to see what we have
    const allUsers = await client.fetch(groq`
      *[_type == "user"] {
        _id,
        email,
        name,
        role,
        active,
        lastLogin
      }
    `);
    
    console.log('\n\nAll users in database:');
    allUsers.forEach((user: any) => {
      console.log(`- ${user.email} (ID: ${user._id})`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkUserByEmail();