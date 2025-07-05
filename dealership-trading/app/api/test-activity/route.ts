import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { writeClient } from '@/lib/sanity';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const vehicleId = searchParams.get('vehicleId');
    
    if (!vehicleId) {
      return NextResponse.json({ error: 'Vehicle ID is required' }, { status: 400 });
    }
    
    // Create test activity
    const activity = await writeClient.create({
      _type: 'activity',
      vehicle: { _ref: vehicleId },
      user: { _ref: session.user.id },
      action: 'commented',
      details: 'Test activity created',
      createdAt: new Date().toISOString()
    });
    
    return NextResponse.json({ 
      success: true, 
      activity,
      message: 'Test activity created successfully'
    });
  } catch (error) {
    console.error('Error creating test activity:', error);
    return NextResponse.json({ 
      error: 'Failed to create test activity',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}