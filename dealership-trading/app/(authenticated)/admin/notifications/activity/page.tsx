'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  ChevronLeft, 
  ChevronRight, 
  Mail, 
  MessageSquare, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  Eye,
  MousePointer,
  RefreshCw,
  Search
} from 'lucide-react';
import { format } from 'date-fns';

interface NotificationActivity {
  id: string;
  template: string;
  category: string;
  event: string;
  channel: string;
  status: string;
  recipients: string[];
  subject?: string;
  error_message?: string;
  retry_count: number;
  created_at: string;
  sent_at?: string;
  delivered_at?: string;
  opened_at?: string;
  clicked_at?: string;
  failed_at?: string;
  vehicle?: {
    description: string;
    stock_number: string;
  };
  transfer?: {
    id: string;
    route: string;
  };
  user?: {
    name: string;
    email: string;
  };
  location?: string;
}

interface ActivityResponse {
  activities: NotificationActivity[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const STATUS_CONFIG = {
  queued: { label: 'Queued', icon: Clock, color: 'bg-gray-500' },
  sent: { label: 'Sent', icon: CheckCircle, color: 'bg-blue-500' },
  delivered: { label: 'Delivered', icon: CheckCircle, color: 'bg-green-500' },
  opened: { label: 'Opened', icon: Eye, color: 'bg-purple-500' },
  clicked: { label: 'Clicked', icon: MousePointer, color: 'bg-indigo-500' },
  bounced: { label: 'Bounced', icon: AlertCircle, color: 'bg-orange-500' },
  failed: { label: 'Failed', icon: XCircle, color: 'bg-red-500' },
  unsubscribed: { label: 'Unsubscribed', icon: XCircle, color: 'bg-gray-600' }
};

const CHANNEL_CONFIG = {
  email: { label: 'Email', icon: Mail, color: 'bg-blue-600' },
  sms: { label: 'SMS', icon: MessageSquare, color: 'bg-purple-600' }
};

export default function NotificationActivityPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ActivityResponse | null>(null);
  const [page, setPage] = useState(1);
  const [channel, setChannel] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const fetchActivity = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      });
      
      if (channel !== 'all') params.append('channel', channel);
      if (status !== 'all') params.append('status', status);
      
      const response = await fetch(`/api/admin/notifications/activity?${params}`);
      if (!response.ok) throw new Error('Failed to fetch activity');
      
      const activityData = await response.json();
      setData(activityData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [page, channel, status]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.queued;
    const Icon = config.icon;
    
    return (
      <Badge variant="outline" className={`${config.color} bg-opacity-20 border-opacity-50`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getChannelBadge = (channel: string) => {
    const config = CHANNEL_CONFIG[channel as keyof typeof CHANNEL_CONFIG];
    if (!config) return null;
    
    const Icon = config.icon;
    
    return (
      <Badge variant="outline" className={`${config.color} bg-opacity-20 border-opacity-50`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading activity log...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <Card className="bg-red-900/20 border-red-900">
          <CardHeader>
            <CardTitle className="text-red-400">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-300">{error}</p>
            <Button onClick={fetchActivity} className="mt-4">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredActivities = data?.activities.filter(activity => {
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        activity.template.toLowerCase().includes(searchLower) ||
        activity.event.toLowerCase().includes(searchLower) ||
        activity.recipients.some(r => r.toLowerCase().includes(searchLower)) ||
        activity.subject?.toLowerCase().includes(searchLower) ||
        activity.vehicle?.stock_number.toLowerCase().includes(searchLower)
      );
    }
    return true;
  }) || [];

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Notification Activity Log</h1>
        <p className="text-muted-foreground mt-2">Track all notification delivery attempts and their status</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search by template, event, recipient, or stock number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full"
                icon={<Search className="w-4 h-4" />}
              />
            </div>
            <Select value={channel} onValueChange={setChannel}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Channel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Channels</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="queued">Queued</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="opened">Opened</SelectItem>
                <SelectItem value="clicked">Clicked</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="bounced">Bounced</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={fetchActivity} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Activity Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Recipients</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Context</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredActivities.map((activity) => (
                <>
                  <TableRow 
                    key={activity.id}
                    className="cursor-pointer hover:bg-gray-900/50"
                    onClick={() => setExpandedRow(expandedRow === activity.id ? null : activity.id)}
                  >
                    <TableCell className="text-sm">
                      {format(new Date(activity.created_at), 'MMM d, h:mm a')}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{activity.template}</p>
                        <p className="text-xs text-muted-foreground">{activity.category}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{activity.event}</TableCell>
                    <TableCell>{getChannelBadge(activity.channel)}</TableCell>
                    <TableCell>
                      <div className="max-w-[200px]">
                        <p className="text-sm truncate">
                          {activity.recipients.slice(0, 2).join(', ')}
                        </p>
                        {activity.recipients.length > 2 && (
                          <p className="text-xs text-muted-foreground">
                            +{activity.recipients.length - 2} more
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(activity.status)}</TableCell>
                    <TableCell>
                      <div className="text-sm space-y-1">
                        {activity.vehicle && (
                          <p className="text-xs">
                            <span className="text-muted-foreground">Vehicle:</span> {activity.vehicle.stock_number}
                          </p>
                        )}
                        {activity.transfer && (
                          <p className="text-xs">
                            <span className="text-muted-foreground">Transfer:</span> {activity.transfer.route}
                          </p>
                        )}
                        {activity.location && (
                          <p className="text-xs">
                            <span className="text-muted-foreground">Location:</span> {activity.location}
                          </p>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                  
                  {/* Expanded Row */}
                  {expandedRow === activity.id && (
                    <TableRow>
                      <TableCell colSpan={7} className="bg-gray-900/30">
                        <div className="p-4 space-y-4">
                          {activity.subject && (
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Subject</p>
                              <p className="text-sm">{activity.subject}</p>
                            </div>
                          )}
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">All Recipients</p>
                              <div className="text-sm space-y-1">
                                {activity.recipients.map((recipient, idx) => (
                                  <p key={idx}>{recipient}</p>
                                ))}
                              </div>
                            </div>
                            
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Timeline</p>
                              <div className="text-sm space-y-1">
                                <p>Created: {format(new Date(activity.created_at), 'MMM d, h:mm:ss a')}</p>
                                {activity.sent_at && (
                                  <p>Sent: {format(new Date(activity.sent_at), 'h:mm:ss a')}</p>
                                )}
                                {activity.delivered_at && (
                                  <p>Delivered: {format(new Date(activity.delivered_at), 'h:mm:ss a')}</p>
                                )}
                                {activity.opened_at && (
                                  <p>Opened: {format(new Date(activity.opened_at), 'h:mm:ss a')}</p>
                                )}
                                {activity.clicked_at && (
                                  <p>Clicked: {format(new Date(activity.clicked_at), 'h:mm:ss a')}</p>
                                )}
                                {activity.failed_at && (
                                  <p className="text-red-400">Failed: {format(new Date(activity.failed_at), 'h:mm:ss a')}</p>
                                )}
                              </div>
                            </div>
                            
                            {activity.retry_count > 0 && (
                              <div>
                                <p className="text-sm font-medium text-muted-foreground">Retry Attempts</p>
                                <p className="text-sm">{activity.retry_count}</p>
                              </div>
                            )}
                            
                            {activity.error_message && (
                              <div>
                                <p className="text-sm font-medium text-red-400">Error Message</p>
                                <p className="text-sm text-red-300">{activity.error_message}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
              
              {filteredActivities.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No activity found matching your filters
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((page - 1) * data.pagination.limit) + 1} to {Math.min(page * data.pagination.limit, data.pagination.total)} of {data.pagination.total} entries
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page === data.pagination.totalPages}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}