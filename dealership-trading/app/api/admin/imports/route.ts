import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { canManageDealerships } from '@/lib/permissions';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || !canManageDealerships(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const success = searchParams.get('success');

    // Build query
    let query = supabaseAdmin
      .from('import_logs')
      .select('*', { count: 'exact' })
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (success !== null && success !== '') {
      query = query.eq('success', success === 'true');
    }

    const { data: logs, error, count } = await query;

    if (error) {
      console.error('Failed to fetch import logs:', error);
      return NextResponse.json({ error: 'Failed to fetch import logs' }, { status: 500 });
    }

    // Parse details JSON for each log
    const parsedLogs = logs?.map(log => ({
      ...log,
      details: typeof log.details === 'string' ? JSON.parse(log.details) : log.details
    })) || [];

    return NextResponse.json({
      logs: parsedLogs,
      total: count || 0,
      limit,
      offset
    });
  } catch (error) {
    console.error('Error in import logs API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}