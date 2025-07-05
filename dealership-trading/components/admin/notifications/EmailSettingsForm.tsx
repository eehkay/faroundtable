'use client'

import { useState, useEffect } from 'react';
import { Save, AlertCircle } from 'lucide-react';

interface EmailSettings {
  id?: string;
  fromName: string;
  fromEmail: string;
  replyToEmail: string;
}

export default function EmailSettingsForm() {
  const [settings, setSettings] = useState<EmailSettings>({
    fromName: 'Round Table',
    fromEmail: 'notifications@roundtable.app',
    replyToEmail: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/email-settings/general');
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.metadata) {
          setSettings({
            id: data.id,
            fromName: data.metadata.fromName || 'Round Table',
            fromEmail: data.metadata.fromEmail || 'notifications@roundtable.app',
            replyToEmail: data.metadata.replyToEmail || ''
          });
        }
      } else if (response.status === 404) {
        // Settings don't exist yet, use defaults
        console.log('No general email settings found, using defaults');
      }
    } catch (error) {
      console.error('Failed to fetch email settings:', error);
      setMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/email-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          setting_key: 'general',
          enabled: true,
          metadata: {
            fromName: settings.fromName,
            fromEmail: settings.fromEmail,
            replyToEmail: settings.replyToEmail
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      const data = await response.json();
      setSettings({ ...settings, id: data.id });
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
    } catch (error) {
      console.error('Failed to save settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-[#2a2a2a] rounded w-1/3"></div>
          <div className="h-10 bg-[#2a2a2a] rounded"></div>
          <div className="h-10 bg-[#2a2a2a] rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg p-6">
      <h2 className="text-xl font-semibold text-white mb-6">General Email Settings</h2>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            From Name
          </label>
          <input
            type="text"
            value={settings.fromName}
            onChange={(e) => setSettings({ ...settings, fromName: e.target.value })}
            className="w-full bg-[#2a2a2a] border border-[#333333] text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., Round Table Notifications"
          />
          <p className="mt-1 text-sm text-gray-500">
            The name that will appear as the sender in emails
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            From Email
          </label>
          <input
            type="email"
            value={settings.fromEmail}
            onChange={(e) => setSettings({ ...settings, fromEmail: e.target.value })}
            className="w-full bg-[#2a2a2a] border border-[#333333] text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., notifications@yourdomain.com"
          />
          <p className="mt-1 text-sm text-gray-500">
            The email address used to send notifications
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Reply-To Email (Optional)
          </label>
          <input
            type="email"
            value={settings.replyToEmail}
            onChange={(e) => setSettings({ ...settings, replyToEmail: e.target.value })}
            className="w-full bg-[#2a2a2a] border border-[#333333] text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., support@yourdomain.com"
          />
          <p className="mt-1 text-sm text-gray-500">
            Where replies to notification emails should go (optional)
          </p>
        </div>

        <div className="bg-[#2a2a2a] border border-[#333333] rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-gray-300 font-medium">Important Configuration</p>
              <p className="text-sm text-gray-400 mt-1">
                Remember to configure your email service credentials in the environment variables:
              </p>
              <code className="block mt-2 text-xs bg-[#333333] text-gray-300 p-2 rounded">
                RESEND_API_KEY=re_your_api_key_here
              </code>
            </div>
          </div>
        </div>

        {message && (
          <div className={`p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-500/10 border border-green-500/20 text-green-400' 
              : 'bg-red-500/10 border border-red-500/20 text-red-400'
          }`}>
            {message.text}
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}