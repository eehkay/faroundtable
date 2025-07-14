import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Validate session
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow admins to see this sensitive info
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Check which analytics environment variables are set
    const envCheck = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      analyticsEnabled: process.env.ENABLE_ADVANCED_ANALYTICS === 'true',
      marketCheckKey: {
        isSet: !!process.env.MARKETCHECK_API_KEY,
        length: process.env.MARKETCHECK_API_KEY?.length || 0,
        preview: process.env.MARKETCHECK_API_KEY ? 
          `${process.env.MARKETCHECK_API_KEY.substring(0, 8)}...` : 
          'NOT SET'
      },
      dataForSEO: {
        emailSet: !!process.env.DATAFORSEO_EMAIL,
        apiKeySet: !!process.env.DATAFORSEO_API_KEY,
        apiKeyLength: process.env.DATAFORSEO_API_KEY?.length || 0
      },
      openAI: {
        isSet: !!process.env.OPENAI_API_KEY,
        length: process.env.OPENAI_API_KEY?.length || 0
      },
      openRouter: {
        isSet: !!process.env.OPENROUTER_API_KEY,
        length: process.env.OPENROUTER_API_KEY?.length || 0
      },
      // Check if we're on Netlify
      isNetlify: !!process.env.NETLIFY,
      netlifyContext: process.env.CONTEXT, // production, deploy-preview, branch-deploy
      // Check analytics cache settings
      cacheSettings: {
        ttlHours: process.env.ANALYTICS_CACHE_TTL_HOURS || '24',
        rateLimitPerHour: process.env.ANALYTICS_RATE_LIMIT_PER_HOUR || '100'
      }
    };

    return NextResponse.json(envCheck);
  } catch (error) {
    console.error('[Env Check] Error:', error);
    return NextResponse.json({ 
      error: 'Environment check failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}