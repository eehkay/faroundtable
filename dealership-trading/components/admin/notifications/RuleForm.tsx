'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Save, X, Send, TestTube } from 'lucide-react';
import { ConditionBuilder } from './ConditionBuilder';
import { RecipientConfigComponent } from './RecipientConfig';
import type { NotificationRule, NotificationEvent, NotificationTemplate, ChannelPriority } from '@/types/notifications';

interface RuleFormProps {
  rule?: NotificationRule;
  onSave?: (rule: NotificationRule) => void;
}

export function RuleForm({ rule, onSave }: RuleFormProps) {
  const router = useRouter();
  const isEditing = !!rule;

  const [formData, setFormData] = useState({
    name: rule?.name || '',
    description: rule?.description || '',
    event: rule?.event || 'transfer_requested' as NotificationEvent,
    conditions: rule?.conditions || [],
    conditionLogic: rule?.conditionLogic || 'AND',
    recipients: rule?.recipients || {
      useConditions: false,
      currentLocation: [],
      requestingLocation: [],
      destinationLocation: [],
      specificUsers: [],
      additionalEmails: [],
      additionalPhones: []
    },
    channels: rule?.channels || {
      email: { enabled: true, templateId: '' },
      sms: { enabled: false, templateId: '' },
      priority: 'email_first' as ChannelPriority
    },
    active: rule?.active ?? true
  });

  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/admin/notification-templates?active=true');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      toast.error('Rule name is required');
      return;
    }

    if (!formData.channels.email.enabled && !formData.channels.sms.enabled) {
      toast.error('At least one channel must be enabled');
      return;
    }

    if (formData.channels.email.enabled && !formData.channels.email.templateId) {
      toast.error('Please select an email template');
      return;
    }

    setSaving(true);

    try {
      const url = isEditing 
        ? `/api/admin/notification-rules/${rule.id}`
        : '/api/admin/notification-rules';
      
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save rule');
      }

      const savedRule = await response.json();
      
      toast.success(isEditing ? 'Rule updated' : 'Rule created');
      
      if (onSave) {
        onSave(savedRule);
      } else {
        router.push('/admin/notifications/rules');
      }
    } catch (error: any) {
      console.error('Error saving rule:', error);
      toast.error(error.message || 'Failed to save rule');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!rule?.id) {
      toast.error('Please save the rule first');
      return;
    }

    setTesting(true);
    try {
      const response = await fetch(`/api/admin/notification-rules/${rule.id}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun: true })
      });

      if (!response.ok) throw new Error('Failed to test rule');

      const result = await response.json();
      
      // Show test results in a toast or modal
      if (result.test.conditionsMet) {
        toast.success(`Rule conditions met! Would send to ${result.test.recipients.length} recipients`);
      } else {
        toast.info('Rule conditions not met - no notifications would be sent');
      }
    } catch (error) {
      console.error('Error testing rule:', error);
      toast.error('Failed to test rule');
    } finally {
      setTesting(false);
    }
  };

  const events: Array<{ value: NotificationEvent; label: string }> = [
    { value: 'transfer_requested', label: 'Transfer Requested' },
    { value: 'transfer_approved', label: 'Transfer Approved' },
    { value: 'transfer_in_transit', label: 'Transfer In Transit' },
    { value: 'transfer_delivered', label: 'Transfer Delivered' },
    { value: 'transfer_cancelled', label: 'Transfer Cancelled' },
    { value: 'comment_added', label: 'Comment Added' },
    { value: 'vehicle_updated', label: 'Vehicle Updated' }
  ];

  const emailTemplates = templates.filter(t => t.channels.email?.enabled);
  const smsTemplates = templates.filter(t => t.channels.sms?.enabled);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Rule Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Transport Team - All Transfers"
              className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe when this rule should trigger..."
              rows={2}
              className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg focus:border-blue-500 focus:outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Trigger Event <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.event}
                onChange={(e) => setFormData({ ...formData, event: e.target.value as NotificationEvent })}
                className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg focus:border-blue-500 focus:outline-none"
                required
              >
                {events.map(event => (
                  <option key={event.value} value={event.value}>
                    {event.label}
                  </option>
                ))}
              </select>
            </div>


            <div>
              <label className="block text-sm font-medium mb-2">
                Status
              </label>
              <select
                value={formData.active ? 'active' : 'inactive'}
                onChange={(e) => setFormData({ ...formData, active: e.target.value === 'active' })}
                className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg focus:border-blue-500 focus:outline-none"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Conditions */}
      <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Conditions</h2>
          <p className="text-sm text-gray-400">Define when this notification should be sent</p>
        </div>

        {formData.conditions.length > 1 && (
          <div className="mb-4">
            <label className="text-sm font-medium">Condition Logic</label>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="AND"
                  checked={formData.conditionLogic === 'AND'}
                  onChange={(e) => setFormData({ ...formData, conditionLogic: e.target.value as 'AND' | 'OR' })}
                  className="w-4 h-4 text-blue-600"
                />
                <span>Match ALL conditions</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="OR"
                  checked={formData.conditionLogic === 'OR'}
                  onChange={(e) => setFormData({ ...formData, conditionLogic: e.target.value as 'AND' | 'OR' })}
                  className="w-4 h-4 text-blue-600"
                />
                <span>Match ANY condition</span>
              </label>
            </div>
          </div>
        )}

        <ConditionBuilder
          conditions={formData.conditions}
          onChange={(conditions) => setFormData({ ...formData, conditions })}
          event={formData.event}
        />
      </div>

      {/* Recipients */}
      <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Recipients</h2>
          <p className="text-sm text-gray-400">Configure who receives this notification</p>
        </div>

        <RecipientConfigComponent
          config={formData.recipients}
          onChange={(recipients) => setFormData({ ...formData, recipients })}
        />
      </div>

      {/* Channels & Templates */}
      <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Channels & Templates</h2>
          <p className="text-sm text-gray-400">Select notification channels and templates</p>
        </div>

        <div className="space-y-4">
          {/* Email Channel */}
          <div className="bg-[#1a1a1a] rounded-lg p-4">
            <label className="flex items-center gap-3 cursor-pointer mb-3">
              <input
                type="checkbox"
                checked={formData.channels.email.enabled}
                onChange={(e) => setFormData({
                  ...formData,
                  channels: {
                    ...formData.channels,
                    email: { ...formData.channels.email, enabled: e.target.checked }
                  }
                })}
                className="w-4 h-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500"
              />
              <span className="font-medium">Email</span>
            </label>

            {formData.channels.email.enabled && (
              <div>
                <label className="block text-sm mb-2">Email Template</label>
                <select
                  value={formData.channels.email.templateId}
                  onChange={(e) => setFormData({
                    ...formData,
                    channels: {
                      ...formData.channels,
                      email: { ...formData.channels.email, templateId: e.target.value }
                    }
                  })}
                  className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg focus:border-blue-500 focus:outline-none text-sm"
                  required={formData.channels.email.enabled}
                >
                  <option value="">Select a template...</option>
                  {emailTemplates.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.name} - {template.description}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* SMS Channel */}
          <div className="bg-[#1a1a1a] rounded-lg p-4">
            <label className="flex items-center gap-3 cursor-pointer mb-3">
              <input
                type="checkbox"
                checked={formData.channels.sms.enabled}
                onChange={(e) => setFormData({
                  ...formData,
                  channels: {
                    ...formData.channels,
                    sms: { ...formData.channels.sms, enabled: e.target.checked }
                  }
                })}
                className="w-4 h-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500"
              />
              <span className="font-medium">SMS</span>
              <span className="text-xs text-gray-400">(Coming soon)</span>
            </label>

            {formData.channels.sms.enabled && (
              <div>
                <label className="block text-sm mb-2">SMS Template</label>
                <select
                  value={formData.channels.sms.templateId}
                  onChange={(e) => setFormData({
                    ...formData,
                    channels: {
                      ...formData.channels,
                      sms: { ...formData.channels.sms, templateId: e.target.value }
                    }
                  })}
                  className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg focus:border-blue-500 focus:outline-none text-sm"
                  disabled={smsTemplates.length === 0}
                >
                  <option value="">
                    {smsTemplates.length === 0 ? 'No SMS templates available' : 'Select a template...'}
                  </option>
                  {smsTemplates.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.name} - {template.description}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          {isEditing && (
            <button
              type="button"
              onClick={handleTest}
              disabled={testing}
              className="flex items-center gap-2 px-4 py-2 border border-[#2a2a2a] rounded-lg hover:bg-[#1a1a1a] transition-colors"
            >
              <TestTube className="w-4 h-4" />
              {testing ? 'Testing...' : 'Test Rule'}
            </button>
          )}
        </div>
        
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => router.push('/admin/notifications/rules')}
            className="flex items-center gap-2 px-4 py-2 border border-[#2a2a2a] rounded-lg hover:bg-[#1a1a1a] transition-colors"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : (isEditing ? 'Update Rule' : 'Create Rule')}
          </button>
        </div>
      </div>
    </form>
  );
}