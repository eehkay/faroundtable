'use client'

import { useState, useEffect } from 'react';
import { Save, RotateCcw, Check, X } from 'lucide-react';

interface EmailTemplate {
  id?: string;
  settingType: string;
  enabled: boolean;
  subjectTemplate: string;
  recipientRoles: string[];
  notifyOriginStore: boolean;
  notifyDestinationStore: boolean;
  notifyRequester: boolean;
  customTemplate?: string;
}

const templateTypes = [
  { value: 'transferRequested', label: 'Transfer Requested', defaultSubject: 'Transfer Request: {{year}} {{make}} {{model}}' },
  { value: 'transferApproved', label: 'Transfer Approved', defaultSubject: 'Transfer Approved: {{year}} {{make}} {{model}}' },
  { value: 'transferInTransit', label: 'Transfer In Transit', defaultSubject: 'Transfer In Transit: {{year}} {{make}} {{model}}' },
  { value: 'transferDelivered', label: 'Transfer Delivered', defaultSubject: 'Transfer Delivered: {{year}} {{make}} {{model}}' },
  { value: 'transferCancelled', label: 'Transfer Cancelled', defaultSubject: 'Transfer Cancelled: {{year}} {{make}} {{model}}' }
];

const defaultTemplates: Record<string, Partial<EmailTemplate>> = {
  transferRequested: {
    recipientRoles: ['manager', 'admin'],
    notifyOriginStore: true,
    notifyDestinationStore: false,
    notifyRequester: false
  },
  transferApproved: {
    recipientRoles: ['manager', 'admin', 'sales'],
    notifyOriginStore: false,
    notifyDestinationStore: true,
    notifyRequester: true
  },
  transferInTransit: {
    recipientRoles: ['manager', 'admin', 'sales'],
    notifyOriginStore: true,
    notifyDestinationStore: true,
    notifyRequester: false
  },
  transferDelivered: {
    recipientRoles: ['manager', 'admin', 'sales'],
    notifyOriginStore: true,
    notifyDestinationStore: true,
    notifyRequester: false
  },
  transferCancelled: {
    recipientRoles: ['manager', 'admin'],
    notifyOriginStore: true,
    notifyDestinationStore: true,
    notifyRequester: true
  }
};

export default function EmailTemplateEditor() {
  const [selectedType, setSelectedType] = useState('transferRequested');
  const [templates, setTemplates] = useState<Record<string, EmailTemplate>>({});
  const [currentTemplate, setCurrentTemplate] = useState<EmailTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    if (templates[selectedType]) {
      setCurrentTemplate(templates[selectedType]);
    } else {
      // Create default template
      const templateType = templateTypes.find(t => t.value === selectedType);
      const defaults = defaultTemplates[selectedType] || {};
      setCurrentTemplate({
        settingType: selectedType,
        enabled: true,
        subjectTemplate: templateType?.defaultSubject || '',
        recipientRoles: defaults.recipientRoles || ['admin'],
        notifyOriginStore: defaults.notifyOriginStore ?? true,
        notifyDestinationStore: defaults.notifyDestinationStore ?? true,
        notifyRequester: defaults.notifyRequester ?? false,
        customTemplate: defaults.customTemplate
      });
    }
  }, [selectedType, templates]);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/email-settings');
      
      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }
      
      const data = await response.json();
      const templateMap: Record<string, EmailTemplate> = {};
      
      // Convert Supabase format to our component format
      data.forEach((setting: any) => {
        if (setting.setting_key !== 'general') {
          templateMap[setting.setting_key] = {
            id: setting.id,
            settingType: setting.setting_key,
            enabled: setting.enabled,
            subjectTemplate: setting.subject || templateTypes.find(t => t.value === setting.setting_key)?.defaultSubject || '',
            recipientRoles: setting.metadata?.recipientRoles || defaultTemplates[setting.setting_key]?.recipientRoles || ['admin'],
            notifyOriginStore: setting.metadata?.notifyOriginStore ?? defaultTemplates[setting.setting_key]?.notifyOriginStore ?? true,
            notifyDestinationStore: setting.metadata?.notifyDestinationStore ?? defaultTemplates[setting.setting_key]?.notifyDestinationStore ?? true,
            notifyRequester: setting.metadata?.notifyRequester ?? defaultTemplates[setting.setting_key]?.notifyRequester ?? false,
            customTemplate: setting.template
          };
        }
      });
      
      setTemplates(templateMap);
    } catch (error) {
      console.error('Failed to fetch email templates:', error);
      setMessage({ type: 'error', text: 'Failed to load templates' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!currentTemplate) return;
    
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/email-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          setting_key: currentTemplate.settingType,
          enabled: currentTemplate.enabled,
          subject: currentTemplate.subjectTemplate,
          template: currentTemplate.customTemplate,
          metadata: {
            recipientRoles: currentTemplate.recipientRoles,
            notifyOriginStore: currentTemplate.notifyOriginStore,
            notifyDestinationStore: currentTemplate.notifyDestinationStore,
            notifyRequester: currentTemplate.notifyRequester
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save template');
      }

      const data = await response.json();
      setCurrentTemplate({ ...currentTemplate, id: data.id });
      setTemplates({ ...templates, [selectedType]: { ...currentTemplate, id: data.id } });
      
      setMessage({ type: 'success', text: 'Template saved successfully!' });
      await fetchTemplates();
    } catch (error) {
      console.error('Failed to save template:', error);
      setMessage({ type: 'error', text: 'Failed to save template' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    const templateType = templateTypes.find(t => t.value === selectedType);
    setCurrentTemplate({
      ...currentTemplate!,
      subjectTemplate: templateType?.defaultSubject || '',
      ...defaultTemplates[selectedType],
      customTemplate: ''
    });
  };

  if (loading || !currentTemplate) {
    return (
      <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-[#2a2a2a] rounded w-1/3"></div>
          <div className="h-20 bg-[#2a2a2a] rounded"></div>
        </div>
      </div>
    );
  }

  const showStoreOptions = ['transferRequested', 'transferApproved', 'transferInTransit', 'transferDelivered', 'transferCancelled'].includes(selectedType);
  const showRequesterOption = ['transferApproved', 'transferInTransit', 'transferDelivered', 'transferCancelled'].includes(selectedType);

  return (
    <div className="space-y-6">
      {/* Template Selector */}
      <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg p-6">
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Select Email Template
        </label>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="w-full bg-[#2a2a2a] border border-[#333333] text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {templateTypes.map(type => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {/* Template Settings */}
      <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">
            {templateTypes.find(t => t.value === selectedType)?.label} Settings
          </h3>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={currentTemplate.enabled}
              onChange={(e) => setCurrentTemplate({ ...currentTemplate, enabled: e.target.checked })}
              className="w-4 h-4 bg-[#2a2a2a] border-[#333333] text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-400">Enabled</span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Subject Template
          </label>
          <input
            type="text"
            value={currentTemplate.subjectTemplate}
            onChange={(e) => setCurrentTemplate({ ...currentTemplate, subjectTemplate: e.target.value })}
            className="w-full bg-[#2a2a2a] border border-[#333333] text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., Transfer Request: {{year}} {{make}} {{model}}"
          />
          <p className="mt-1 text-sm text-gray-500">
            Available variables: {'{{year}}, {{make}}, {{model}}, {{fromStore}}, {{toStore}}, {{requesterName}}'}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Recipient Roles
          </label>
          <div className="grid grid-cols-2 gap-3">
            {['admin', 'manager', 'sales', 'transport'].map(role => (
              <label key={role} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={currentTemplate.recipientRoles.includes(role)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setCurrentTemplate({
                        ...currentTemplate,
                        recipientRoles: [...currentTemplate.recipientRoles, role]
                      });
                    } else {
                      setCurrentTemplate({
                        ...currentTemplate,
                        recipientRoles: currentTemplate.recipientRoles.filter(r => r !== role)
                      });
                    }
                  }}
                  className="w-4 h-4 bg-[#2a2a2a] border-[#333333] text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-300 capitalize">{role}</span>
              </label>
            ))}
          </div>
        </div>

        {showStoreOptions && (
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Notification Recipients
            </label>
            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={currentTemplate.notifyOriginStore}
                  onChange={(e) => setCurrentTemplate({ ...currentTemplate, notifyOriginStore: e.target.checked })}
                  className="w-4 h-4 bg-[#2a2a2a] border-[#333333] text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-300">Notify Origin Store</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={currentTemplate.notifyDestinationStore}
                  onChange={(e) => setCurrentTemplate({ ...currentTemplate, notifyDestinationStore: e.target.checked })}
                  className="w-4 h-4 bg-[#2a2a2a] border-[#333333] text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-300">Notify Destination Store</span>
              </label>
              {showRequesterOption && (
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={currentTemplate.notifyRequester}
                    onChange={(e) => setCurrentTemplate({ ...currentTemplate, notifyRequester: e.target.checked })}
                    className="w-4 h-4 bg-[#2a2a2a] border-[#333333] text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-300">Notify Original Requester</span>
                </label>
              )}
            </div>
          </div>
        )}

        {message && (
          <div className={`p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-500/10 border border-green-500/20 text-green-400' 
              : 'bg-red-500/10 border border-red-500/20 text-red-400'
          }`}>
            {message.text}
          </div>
        )}

        <div className="flex justify-between">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-[#2a2a2a] text-white rounded-lg hover:bg-[#333333] transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            Reset to Default
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Template'}
          </button>
        </div>
      </div>
    </div>
  );
}