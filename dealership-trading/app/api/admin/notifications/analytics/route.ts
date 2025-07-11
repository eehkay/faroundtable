import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-server';
import { subDays, startOfDay, endOfDay } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin permission
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (user?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '30');
    const startDate = startOfDay(subDays(new Date(), days));
    const endDate = endOfDay(new Date());

    // Get overall metrics
    const { data: overallMetrics } = await supabaseAdmin
      .from('notification_activity')
      .select('status, channel')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    // Calculate delivery rates
    const metrics = {
      total: overallMetrics?.length || 0,
      byChannel: {
        email: { sent: 0, delivered: 0, opened: 0, clicked: 0, failed: 0 },
        sms: { sent: 0, delivered: 0, failed: 0 }
      },
      byStatus: {
        queued: 0,
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        bounced: 0,
        failed: 0,
        unsubscribed: 0
      }
    };

    overallMetrics?.forEach(activity => {
      // Update status counts
      if (activity.status in metrics.byStatus) {
        metrics.byStatus[activity.status as keyof typeof metrics.byStatus]++;
      }

      // Update channel-specific counts
      if (activity.channel === 'email') {
        switch (activity.status) {
          case 'sent':
            metrics.byChannel.email.sent++;
            break;
          case 'delivered':
            metrics.byChannel.email.delivered++;
            break;
          case 'opened':
            metrics.byChannel.email.opened++;
            break;
          case 'clicked':
            metrics.byChannel.email.clicked++;
            break;
          case 'failed':
          case 'bounced':
            metrics.byChannel.email.failed++;
            break;
        }
      } else if (activity.channel === 'sms') {
        switch (activity.status) {
          case 'sent':
            metrics.byChannel.sms.sent++;
            break;
          case 'delivered':
            metrics.byChannel.sms.delivered++;
            break;
          case 'failed':
            metrics.byChannel.sms.failed++;
            break;
        }
      }
    });

    // Get daily trend data
    const { data: dailyData } = await supabaseAdmin
      .from('notification_activity')
      .select('created_at, channel, status')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: true });

    // Group by day for trend chart
    const dailyTrends = new Map<string, { date: string; email: number; sms: number; total: number }>();
    
    dailyData?.forEach(activity => {
      const dateKey = new Date(activity.created_at).toISOString().split('T')[0];
      
      if (!dailyTrends.has(dateKey)) {
        dailyTrends.set(dateKey, { date: dateKey, email: 0, sms: 0, total: 0 });
      }
      
      const dayData = dailyTrends.get(dateKey)!;
      dayData.total++;
      
      if (activity.channel === 'email') {
        dayData.email++;
      } else if (activity.channel === 'sms') {
        dayData.sms++;
      }
    });

    // Get template performance
    const { data: templatePerformance } = await supabaseAdmin
      .from('notification_activity')
      .select(`
        template_id,
        status,
        notification_templates!template_id (
          name,
          category
        )
      `)
      .not('template_id', 'is', null)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    // Aggregate template metrics
    const templateMetrics = new Map<string, any>();
    
    templatePerformance?.forEach(activity => {
      const templateId = activity.template_id;
      const template = (activity as any).notification_templates;
      
      if (!templateMetrics.has(templateId)) {
        templateMetrics.set(templateId, {
          id: templateId,
          name: template?.name || 'Unknown',
          category: template?.category || 'general',
          sent: 0,
          delivered: 0,
          opened: 0,
          clicked: 0,
          failed: 0
        });
      }
      
      const metrics = templateMetrics.get(templateId);
      
      switch (activity.status) {
        case 'sent':
          metrics.sent++;
          break;
        case 'delivered':
          metrics.delivered++;
          break;
        case 'opened':
          metrics.opened++;
          break;
        case 'clicked':
          metrics.clicked++;
          break;
        case 'failed':
        case 'bounced':
          metrics.failed++;
          break;
      }
    });

    // Get event distribution
    const { data: eventData } = await supabaseAdmin
      .from('notification_activity')
      .select('event')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    const eventDistribution = new Map<string, number>();
    eventData?.forEach(activity => {
      const count = eventDistribution.get(activity.event) || 0;
      eventDistribution.set(activity.event, count + 1);
    });

    return NextResponse.json({
      metrics,
      trends: Array.from(dailyTrends.values()),
      templates: Array.from(templateMetrics.values()),
      events: Array.from(eventDistribution.entries()).map(([event, count]) => ({
        event,
        count,
        percentage: Math.round((count / metrics.total) * 100)
      }))
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}