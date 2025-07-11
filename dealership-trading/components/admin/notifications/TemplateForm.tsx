'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Save, X, Send, Eye } from 'lucide-react';
import { TemplateEditor } from './TemplateEditor';
import type { NotificationTemplate, NotificationCategory } from '@/types/notifications';

interface TemplateFormProps {
  template?: NotificationTemplate;
  onSave?: (template: NotificationTemplate) => void;
}

export function TemplateForm({ template, onSave }: TemplateFormProps) {
  const router = useRouter();
  const isEditing = !!template;

  const [formData, setFormData] = useState({
    name: template?.name || '',
    description: template?.description || '',
    category: template?.category || 'general' as NotificationCategory,
    channels: {
      email: {
        enabled: template?.channels.email?.enabled ?? true,
        subject: template?.channels.email?.subject || '',
        bodyHtml: template?.channels.email?.bodyHtml || '',
        bodyText: template?.channels.email?.bodyText || ''
      },
      sms: {
        enabled: template?.channels.sms?.enabled ?? false,
        message: template?.channels.sms?.message || ''
      }
    },
    active: template?.active ?? true
  });

  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      toast.error('Template name is required');
      return;
    }

    if (!formData.channels.email.enabled && !formData.channels.sms.enabled) {
      toast.error('At least one channel must be enabled');
      return;
    }

    if (formData.channels.email.enabled && !formData.channels.email.subject.trim()) {
      toast.error('Email subject is required');
      return;
    }

    setSaving(true);

    try {
      const url = isEditing 
        ? `/api/admin/notification-templates/${template.id}`
        : '/api/admin/notification-templates';
      
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save template');
      }

      const savedTemplate = await response.json();
      
      toast.success(isEditing ? 'Template updated' : 'Template created');
      
      if (onSave) {
        onSave(savedTemplate);
      } else {
        router.push('/admin/notifications/templates');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    setShowPreview(true);
    // TODO: Implement preview modal
  };

  const handleSendTest = async () => {
    if (!template?.id) {
      toast.error('Please save the template first');
      return;
    }

    try {
      const response = await fetch(`/api/admin/notification-templates/${template.id}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          useRealData: false
        })
      });

      if (!response.ok) throw new Error('Failed to send test');

      const result = await response.json();
      toast.success('Test email sent successfully');
    } catch (error) {
      toast.error('Failed to send test email');
    }
  };

  const categories: NotificationCategory[] = ['transfer', 'system', 'vehicle', 'general'];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Template Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., transfer_requested"
              className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg focus:border-blue-500 focus:outline-none"
              required
            />
            <p className="text-xs text-gray-400 mt-1">
              Use lowercase with underscores, no spaces
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Description
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of when this template is used"
              className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as NotificationCategory })}
                className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg focus:border-blue-500 focus:outline-none"
                required
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
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

      {/* Email Template */}
      <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Email Template</h2>
          <label className="flex items-center gap-2 cursor-pointer">
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
            <span className="text-sm">Enable Email</span>
          </label>
        </div>

        {formData.channels.email.enabled && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Subject Line <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.channels.email.subject}
                onChange={(e) => setFormData({
                  ...formData,
                  channels: {
                    ...formData.channels,
                    email: { ...formData.channels.email, subject: e.target.value }
                  }
                })}
                placeholder="e.g., Transfer Request - {{vehicle.year}} {{vehicle.make}} {{vehicle.model}}"
                className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg focus:border-blue-500 focus:outline-none font-mono text-sm"
                required={formData.channels.email.enabled}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                HTML Body
              </label>
              <TemplateEditor
                value={formData.channels.email.bodyHtml}
                onChange={(value) => setFormData({
                  ...formData,
                  channels: {
                    ...formData.channels,
                    email: { ...formData.channels.email, bodyHtml: value }
                  }
                })}
                mode="html"
                placeholder="Enter HTML email content..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Plain Text Body (Fallback)
              </label>
              <textarea
                value={formData.channels.email.bodyText}
                onChange={(e) => setFormData({
                  ...formData,
                  channels: {
                    ...formData.channels,
                    email: { ...formData.channels.email, bodyText: e.target.value }
                  }
                })}
                placeholder="Plain text version of the email..."
                className="w-full h-32 px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg focus:border-blue-500 focus:outline-none resize-none font-mono text-sm"
              />
            </div>
          </div>
        )}
      </div>

      {/* SMS Template */}
      <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">SMS Template</h2>
          <label className="flex items-center gap-2 cursor-pointer">
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
            <span className="text-sm">Enable SMS</span>
          </label>
        </div>

        {formData.channels.sms.enabled && (
          <div>
            <label className="block text-sm font-medium mb-2">
              Message <span className="text-red-500">*</span>
            </label>
            <TemplateEditor
              value={formData.channels.sms.message}
              onChange={(value) => setFormData({
                ...formData,
                channels: {
                  ...formData.channels,
                  sms: { ...formData.channels.sms, message: value }
                }
              })}
              mode="text"
              placeholder="Enter SMS message..."
            />
            <p className="text-xs text-gray-400 mt-2">
              Keep messages under 160 characters to avoid multiple segments
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handlePreview}
            className="flex items-center gap-2 px-4 py-2 border border-[#2a2a2a] rounded-lg hover:bg-[#1a1a1a] transition-colors"
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
          {isEditing && (
            <button
              type="button"
              onClick={handleSendTest}
              className="flex items-center gap-2 px-4 py-2 border border-[#2a2a2a] rounded-lg hover:bg-[#1a1a1a] transition-colors"
            >
              <Send className="w-4 h-4" />
              Send Test
            </button>
          )}
        </div>
        
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => router.push('/admin/notifications/templates')}
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
            {saving ? 'Saving...' : (isEditing ? 'Update Template' : 'Create Template')}
          </button>
        </div>
      </div>
    </form>
  );
}