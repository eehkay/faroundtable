import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { canManageDealerships } from '@/lib/permissions';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  
  if (!session || !canManageDealerships(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const { data: log, error } = await supabase
      .from('import_logs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Failed to fetch import log:', error);
      return NextResponse.json({ error: 'Import log not found' }, { status: 404 });
    }

    // Parse details JSON
    const parsedLog = {
      ...log,
      details: typeof log.details === 'string' ? JSON.parse(log.details) : log.details
    };

    return NextResponse.json(parsedLog);
  } catch (error) {
    console.error('Error in import log API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}