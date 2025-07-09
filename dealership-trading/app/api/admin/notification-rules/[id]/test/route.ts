import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-server';
import { evaluateRule } from '@/lib/notifications/rule-evaluator';
import { resolveRecipients } from '@/lib/notifications/recipient-resolver';

// POST /api/admin/notification-rules/[id]/test - Test rule with sample data
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { vehicleId, transferId, dryRun = true } = body;

    // Fetch the rule
    const { data: rule, error: ruleError } = await supabaseAdmin
      .from('notification_rules')
      .select('*')
      .eq('id', id)
      .single();

    if (ruleError || !rule) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }

    // Create test context
    const context: any = {
      event: rule.event,
      user: session.user
    };

    // Add vehicle context if provided
    if (vehicleId) {
      const { data: vehicle } = await supabaseAdmin
        .from('vehicles')
        .select(`
          *,
          location:dealership_locations!location_id(*)
        `)
        .eq('id', vehicleId)
        .single();

      if (vehicle) {
        context.vehicle = vehicle;
      }
    }

    // Add transfer context if provided
    if (transferId) {
      const { data: transfer } = await supabaseAdmin
        .from('transfers')
        .select(`
          *,
          from_location:dealership_locations!from_location_id(*),
          to_location:dealership_locations!to_location_id(*),
          requested_by:users!requested_by_id(*),
          approved_by:users!approved_by_id(*)
        `)
        .eq('id', transferId)
        .single();

      if (transfer) {
        context.transfer = transfer;
      }
    }

    // Evaluate the rule conditions
    const conditionsMet = await evaluateRule(rule, context);

    // Resolve recipients if conditions are met
    let recipients: string[] = [];
    let recipientDetails: any[] = [];
    
    if (conditionsMet) {
      const result = await resolveRecipients(rule.recipients, context);
      recipients = result.emails;
      recipientDetails = result.details;
    }

    // Return test results
    return NextResponse.json({
      rule: {
        name: rule.name,
        description: rule.description,
        event: rule.event
      },
      test: {
        conditionsMet,
        conditions: rule.conditions,
        conditionLogic: rule.condition_logic,
        evaluatedContext: context,
        recipients,
        recipientDetails,
        channels: rule.channels,
        wouldSend: conditionsMet && recipients.length > 0
      }
    });
  } catch (error) {
    console.error('Error in POST /api/admin/notification-rules/[id]/test:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}