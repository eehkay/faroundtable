'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Copy,
  ToggleLeft,
  ToggleRight,
  Search,
  Filter,
  TestTube,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import type { NotificationRule, NotificationEvent } from '@/types/notifications';

export default function NotificationRulesPage() {
  const router = useRouter();
  const [rules, setRules] = useState<NotificationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [eventFilter, setEventFilter] = useState<NotificationEvent | 'all'>('all');

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const response = await fetch('/api/admin/notification-rules');
      if (!response.ok) throw new Error('Failed to fetch rules');
      
      const data = await response.json();
      setRules(data);
    } catch (error) {
      console.error('Error fetching rules:', error);
      toast.error('Failed to load rules');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (rule: NotificationRule) => {
    try {
      const response = await fetch(`/api/admin/notification-rules/${rule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...rule,
          active: !rule.active
        })
      });

      if (!response.ok) throw new Error('Failed to update rule');
      
      await fetchRules();
      toast.success(`Rule ${!rule.active ? 'activated' : 'deactivated'}`);
    } catch (error) {
      console.error('Error updating rule:', error);
      toast.error('Failed to update rule');
    }
  };

  const handleDelete = async (rule: NotificationRule) => {
    if (!confirm(`Are you sure you want to delete "${rule.name}"?`)) return;

    try {
      const response = await fetch(`/api/admin/notification-rules/${rule.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete rule');
      
      await fetchRules();
      toast.success('Rule deleted successfully');
    } catch (error) {
      console.error('Error deleting rule:', error);
      toast.error('Failed to delete rule');
    }
  };

  const handleDuplicate = async (rule: NotificationRule) => {
    try {
      const response = await fetch('/api/admin/notification-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...rule,
          id: undefined,
          name: `${rule.name} (Copy)`,
          active: false,
          created_at: undefined,
          updated_at: undefined
        })
      });

      if (!response.ok) throw new Error('Failed to duplicate rule');
      
      await fetchRules();
      toast.success('Rule duplicated successfully');
    } catch (error) {
      console.error('Error duplicating rule:', error);
      toast.error('Failed to duplicate rule');
    }
  };

  const handleTest = async (rule: NotificationRule) => {
    try {
      const response = await fetch(`/api/admin/notification-rules/${rule.id}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun: true })
      });

      if (!response.ok) throw new Error('Failed to test rule');

      const result = await response.json();
      
      if (result.test.conditionsMet) {
        toast.success(`Rule would send to ${result.test.recipients.length} recipients`);
      } else {
        toast.info('Rule conditions not met - no notifications would be sent');
      }
    } catch (error) {
      console.error('Error testing rule:', error);
      toast.error('Failed to test rule');
    }
  };

  const filteredRules = rules.filter(rule => {
    const matchesSearch = rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rule.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEvent = eventFilter === 'all' || rule.event === eventFilter;
    return matchesSearch && matchesEvent;
  });

  const events: NotificationEvent[] = [
    'transfer_requested',
    'transfer_approved',
    'transfer_in_transit',
    'transfer_delivered',
    'transfer_cancelled',
    'comment_added',
    'vehicle_updated'
  ];

  const formatEventName = (event: string) => {
    return event.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-400">Loading rules...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Notification Rules</h1>
          <p className="text-gray-400 mt-1">
            Configure who receives notifications and when
          </p>
        </div>
        <button
          onClick={() => router.push('/admin/notifications/rules/new')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Rule
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search rules..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg focus:border-blue-500 focus:outline-none"
          />
        </div>
        <select
          value={eventFilter}
          onChange={(e) => setEventFilter(e.target.value as NotificationEvent | 'all')}
          className="px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg focus:border-blue-500 focus:outline-none"
        >
          <option value="all">All Events</option>
          {events.map(event => (
            <option key={event} value={event}>
              {formatEventName(event)}
            </option>
          ))}
        </select>
      </div>

      {/* Rules List */}
      <div className="grid gap-4">
        {filteredRules.length === 0 ? (
          <div className="text-center py-12 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg">
            <p className="text-gray-400">No rules found</p>
          </div>
        ) : (
          filteredRules.map(rule => (
            <div
              key={rule.id}
              className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-6 hover:border-[#3a3a3a] transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{rule.name}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      rule.active 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {rule.active ? 'Active' : 'Inactive'}
                    </span>
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-500/20 text-blue-400">
                      {formatEventName(rule.event)}
                    </span>
                  </div>
                  {rule.description && (
                    <p className="text-gray-400 text-sm mb-3">{rule.description}</p>
                  )}
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-gray-400">
                      <span className="font-medium">Conditions:</span>{' '}
                      {rule.conditions.length === 0 
                        ? 'Always send' 
                        : `${rule.conditions.length} condition${rule.conditions.length !== 1 ? 's' : ''} (${rule.conditionLogic})`
                      }
                    </div>
                    <div className="text-gray-400">
                      <span className="font-medium">Channels:</span>{' '}
                      {[
                        rule.channels.email?.enabled && 'Email',
                        rule.channels.sms?.enabled && 'SMS'
                      ].filter(Boolean).join(', ')}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleToggleActive(rule)}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                    title={rule.active ? 'Deactivate' : 'Activate'}
                  >
                    {rule.active ? (
                      <ToggleRight className="w-5 h-5 text-green-400" />
                    ) : (
                      <ToggleLeft className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={() => handleTest(rule)}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                    title="Test"
                  >
                    <TestTube className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => router.push(`/admin/notifications/rules/${rule.id}`)}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDuplicate(rule)}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                    title="Duplicate"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(rule)}
                    className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}