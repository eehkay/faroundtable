import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { client } from '@/lib/sanity';
import groq from 'groq';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dealerships = await client.fetch(groq`
      *[_type == "dealershipLocation"] | order(name asc) {
        _id,
        name,
        storeId,
        address,
        phone,
        email
      }
    `);

    return NextResponse.json(dealerships);
  } catch (error) {
    console.error('Error fetching dealerships:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dealerships' },
      { status: 500 }
    );
  }
}