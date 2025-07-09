'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Mail, MessageSquare, TrendingUp, TrendingDown, AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface AnalyticsData {
  metrics: {
    total: number;
    byChannel: {
      email: { sent: number; delivered: number; opened: number; clicked: number; failed: number };
      sms: { sent: number; delivered: number; failed: number };
    };
    byStatus: {
      queued: number;
      sent: number;
      delivered: number;
      opened: number;
      clicked: number;
      bounced: number;
      failed: number;
      unsubscribed: number;
    };
  };
  trends: Array<{ date: string; email: number; sms: number; total: number }>;
  templates: Array<{
    id: string;
    name: string;
    category: string;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    failed: number;
  }>;
  events: Array<{ event: string; count: number; percentage: number }>;
}

// Chart colors matching the design system
const COLORS = {
  primary: '#3b82f6',
  secondary: '#6366f1',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  muted: '#6b7280'
};

const CHART_COLORS = [
  COLORS.primary,
  COLORS.secondary,
  COLORS.success,
  COLORS.warning,
  COLORS.danger,
  '#8b5cf6',
  '#ec4899',
  '#14b8a6'
];

export default function NotificationAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState('30');

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/admin/notifications/analytics?days=${timeRange}`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      
      const analyticsData = await response.json();
      setData(analyticsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8">
        <Card className="bg-red-900/20 border-red-900">
          <CardHeader>
            <CardTitle className="text-red-400">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-300">{error || 'Failed to load analytics data'}</p>
            <Button onClick={fetchAnalytics} className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const emailDeliveryRate = data.metrics.byChannel.email.sent > 0
    ? Math.round((data.metrics.byChannel.email.delivered / data.metrics.byChannel.email.sent) * 100)
    : 0;

  const smsDeliveryRate = data.metrics.byChannel.sms.sent > 0
    ? Math.round((data.metrics.byChannel.sms.delivered / data.metrics.byChannel.sms.sent) * 100)
    : 0;

  const emailOpenRate = data.metrics.byChannel.email.delivered > 0
    ? Math.round((data.metrics.byChannel.email.opened / data.metrics.byChannel.email.delivered) * 100)
    : 0;

  const emailClickRate = data.metrics.byChannel.email.opened > 0
    ? Math.round((data.metrics.byChannel.email.clicked / data.metrics.byChannel.email.opened) * 100)
    : 0;

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Notification Analytics</h1>
          <p className="text-muted-foreground mt-2">Monitor notification performance and delivery metrics</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Notifications</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.metrics.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {data.metrics.byChannel.email.sent} email, {data.metrics.byChannel.sms.sent} SMS
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Email Delivery Rate</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{emailDeliveryRate}%</div>
            <p className="text-xs text-muted-foreground">
              {data.metrics.byChannel.email.delivered} of {data.metrics.byChannel.email.sent} delivered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Email Open Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{emailOpenRate}%</div>
            <p className="text-xs text-muted-foreground">
              {data.metrics.byChannel.email.opened} opened
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SMS Delivery Rate</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{smsDeliveryRate}%</div>
            <p className="text-xs text-muted-foreground">
              {data.metrics.byChannel.sms.delivered} of {data.metrics.byChannel.sms.sent} delivered
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="channels">Channels</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Volume Trend</CardTitle>
              <CardDescription>Daily notification volume by channel</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={data.trends}>
                  <defs>
                    <linearGradient id="colorEmail" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorSMS" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.secondary} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={COLORS.secondary} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#888888"
                    tickFormatter={(value) => format(new Date(value), 'MMM d')}
                  />
                  <YAxis stroke="#888888" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #2a2a2a' }}
                    labelFormatter={(value) => format(new Date(value), 'MMM d, yyyy')}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="email"
                    stroke={COLORS.primary}
                    fillOpacity={1}
                    fill="url(#colorEmail)"
                  />
                  <Area
                    type="monotone"
                    dataKey="sms"
                    stroke={COLORS.secondary}
                    fillOpacity={1}
                    fill="url(#colorSMS)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="channels" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Email Performance</CardTitle>
                <CardDescription>Email delivery funnel</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={[
                      { stage: 'Sent', count: data.metrics.byChannel.email.sent },
                      { stage: 'Delivered', count: data.metrics.byChannel.email.delivered },
                      { stage: 'Opened', count: data.metrics.byChannel.email.opened },
                      { stage: 'Clicked', count: data.metrics.byChannel.email.clicked }
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                    <XAxis dataKey="stage" stroke="#888888" />
                    <YAxis stroke="#888888" />
                    <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #2a2a2a' }} />
                    <Bar dataKey="count" fill={COLORS.primary} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Channel Distribution</CardTitle>
                <CardDescription>Notifications by channel</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Email', value: data.metrics.byChannel.email.sent },
                        { name: 'SMS', value: data.metrics.byChannel.sms.sent }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      <Cell fill={COLORS.primary} />
                      <Cell fill={COLORS.secondary} />
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #2a2a2a' }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Template Performance</CardTitle>
              <CardDescription>Performance metrics by notification template</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.templates.map((template) => {
                  const deliveryRate = template.sent > 0 ? Math.round((template.delivered / template.sent) * 100) : 0;
                  const openRate = template.delivered > 0 ? Math.round((template.opened / template.delivered) * 100) : 0;
                  
                  return (
                    <div key={template.id} className="p-4 border border-gray-800 rounded-lg space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{template.name}</h4>
                          <p className="text-sm text-muted-foreground">Category: {template.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{template.sent} sent</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Delivery Rate</p>
                          <p className="font-medium">{deliveryRate}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Open Rate</p>
                          <p className="font-medium">{openRate}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Clicks</p>
                          <p className="font-medium">{template.clicked}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Failed</p>
                          <p className="font-medium text-red-400">{template.failed}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Event Distribution</CardTitle>
              <CardDescription>Notifications by event type</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart
                  data={data.events}
                  layout="horizontal"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                  <XAxis type="number" stroke="#888888" />
                  <YAxis dataKey="event" type="category" stroke="#888888" width={150} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #2a2a2a' }}
                    formatter={(value: number) => [`${value} (${data.events.find(e => e.count === value)?.percentage}%)`, 'Count']}
                  />
                  <Bar dataKey="count" fill={COLORS.primary} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}