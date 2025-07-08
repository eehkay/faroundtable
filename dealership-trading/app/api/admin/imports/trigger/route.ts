import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { canManageDealerships } from '@/lib/permissions';
import { supabaseAdmin } from '@/lib/supabase-server';
import { Octokit } from '@octokit/rest';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || !canManageDealerships(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { stores = 'all', enrichment = true, dryRun = false } = body;

    // Validate GitHub token is available
    if (!process.env.GITHUB_TOKEN) {
      return NextResponse.json(
        { error: 'GitHub token not configured. Please set GITHUB_TOKEN environment variable.' },
        { status: 500 }
      );
    }

    // Initialize Octokit
    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN
    });

    // Parse repository information from environment or hardcode it
    const repoOwner = process.env.GITHUB_REPOSITORY_OWNER || 'your-org';
    const repoName = process.env.GITHUB_REPOSITORY_NAME || 'faRoundTable';
    const workflowFileName = 'daily-inventory-import.yml';

    // Create activity log
    await supabaseAdmin
      .from('activities')
      .insert({
        vehicle_id: null,
        user_id: session.user.id,
        action: 'import-triggered',
        details: `Manual import triggered by ${session.user.name}`,
        metadata: {
          stores,
          enrichment,
          dryRun,
          triggered_by: session.user.email
        }
      });

    // Trigger the workflow
    try {
      const response = await octokit.actions.createWorkflowDispatch({
        owner: repoOwner,
        repo: repoName,
        workflow_id: workflowFileName,
        ref: 'main', // or 'master' depending on your default branch
        inputs: {
          stores: stores.toString(),
          enrichment: enrichment.toString(),
          dryRun: dryRun.toString()
        }
      });

      if (response.status === 204) {
        // Create initial import log entry
        const { data: importLog } = await supabaseAdmin
          .from('import_logs')
          .insert({
            timestamp: new Date().toISOString(),
            success: false,
            vehicles_imported: 0,
            vehicles_updated: 0,
            vehicles_deleted: 0,
            errors: [],
            details: JSON.stringify({
              status: 'triggered',
              triggered_by: session.user.email,
              trigger_params: { stores, enrichment, dryRun }
            })
          })
          .select()
          .single();

        return NextResponse.json({
          success: true,
          message: 'Import workflow triggered successfully',
          importLogId: importLog?.id,
          parameters: { stores, enrichment, dryRun }
        });
      } else {
        throw new Error(`Unexpected response status: ${response.status}`);
      }
    } catch (githubError: any) {
      console.error('GitHub API error:', githubError);
      
      // Common error messages
      if (githubError.status === 404) {
        return NextResponse.json(
          { error: 'Workflow not found. Please ensure the workflow file exists in the repository.' },
          { status: 404 }
        );
      } else if (githubError.status === 403) {
        return NextResponse.json(
          { error: 'GitHub token lacks necessary permissions. Please ensure it has workflow dispatch permissions.' },
          { status: 403 }
        );
      }
      
      throw githubError;
    }
  } catch (error) {
    console.error('Error triggering import:', error);
    return NextResponse.json(
      { error: 'Failed to trigger import workflow' },
      { status: 500 }
    );
  }
}

// Get current import status (if any running)
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || !canManageDealerships(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get the most recent import log
    const { data: recentLog, error } = await supabaseAdmin
      .from('import_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // Not found is ok
      console.error('Failed to fetch recent import:', error);
      return NextResponse.json({ error: 'Failed to fetch import status' }, { status: 500 });
    }

    if (!recentLog) {
      return NextResponse.json({ running: false, lastImport: null });
    }

    // Parse details
    const details = typeof recentLog.details === 'string' 
      ? JSON.parse(recentLog.details) 
      : recentLog.details;

    // Check if import is running (triggered within last hour and not completed)
    const importTime = new Date(recentLog.timestamp);
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const isRunning = details.status === 'triggered' && importTime > hourAgo;

    return NextResponse.json({
      running: isRunning,
      lastImport: {
        ...recentLog,
        details
      }
    });
  } catch (error) {
    console.error('Error checking import status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}