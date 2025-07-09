'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Save, Mail, Send, AlertCircle, Clock, Shield, Code, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface EmailConfig {
  // Essential Settings
  from_name: string;
  from_email: string;
  reply_to_email: string;
  
  // Compliance Settings
  footer_text: string;
  footer_html: string;
  company_address: string;
  unsubscribe_text: string;
  bcc_email: string;
  
  // Delivery Settings
  rate_limit_per_hour: number;
  rate_limit_per_day: number;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  default_timezone: string;
  
  // Testing & Monitoring
  test_mode_enabled: boolean;
  test_email_address: string;
  tracking_enabled: boolean;
  
  // Advanced Settings
  bounce_email: string;
  email_domain: string;
  custom_headers: Record<string, string>;
}

export default function EmailSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<EmailConfig | null>(null);
  const [testEmail, setTestEmail] = useState('');
  const [sendingTest, setSendingTest] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/notifications/settings');
      if (!response.ok) throw new Error('Failed to fetch settings');
      
      const data = await response.json();
      setConfig(data);
    } catch (error) {
      toast.error('Failed to load email settings');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!config) return;
    
    setSaving(true);
    try {
      const response = await fetch('/api/admin/notifications/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save settings');
      }

      toast.success('Email settings saved successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const sendTestEmail = async () => {
    if (!testEmail) {
      toast.error('Please enter a test email address');
      return;
    }

    setSendingTest(true);
    try {
      const response = await fetch('/api/admin/notifications/settings/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test_email: testEmail })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send test email');
      }

      toast.success(`Test email sent to ${testEmail}`);
      setTestEmail('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send test email');
    } finally {
      setSendingTest(false);
    }
  };

  if (loading || !config) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin/notifications"
            className="inline-flex items-center text-sm text-gray-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Notifications
          </Link>
          <h1 className="text-3xl font-bold text-white">Email Settings</h1>
          <p className="text-gray-400 mt-2">Configure global email settings for all notifications</p>
        </div>
        <button
          onClick={saveSettings}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {/* Essential Settings */}
      <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Mail className="w-5 h-5 text-blue-500" />
          <h2 className="text-xl font-semibold text-white">Essential Settings</h2>
        </div>
        <p className="text-gray-400 text-sm mb-6">Basic email configuration that applies to all notifications</p>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="from_name" className="block text-sm font-medium text-gray-300 mb-2">
                From Name
              </label>
              <input
                id="from_name"
                type="text"
                value={config.from_name || ''}
                onChange={(e) => setConfig({ ...config, from_name: e.target.value })}
                placeholder="Round Table"
                className="w-full px-3 py-2 bg-black border border-[#2a2a2a] rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
            <div>
              <label htmlFor="from_email" className="block text-sm font-medium text-gray-300 mb-2">
                From Email
              </label>
              <input
                id="from_email"
                type="email"
                value={config.from_email || ''}
                onChange={(e) => setConfig({ ...config, from_email: e.target.value })}
                placeholder="notifications@roundtable.app"
                className="w-full px-3 py-2 bg-black border border-[#2a2a2a] rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>
          <div>
            <label htmlFor="reply_to_email" className="block text-sm font-medium text-gray-300 mb-2">
              Reply-To Email
            </label>
            <input
              id="reply_to_email"
              type="email"
              value={config.reply_to_email || ''}
              onChange={(e) => setConfig({ ...config, reply_to_email: e.target.value })}
              placeholder="support@roundtable.app"
              className="w-full px-3 py-2 bg-black border border-[#2a2a2a] rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
            <p className="text-sm text-gray-500 mt-1">Where replies should be sent (optional)</p>
          </div>
        </div>
      </div>

      {/* Email Footer */}
      <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Email Footer</h2>
        <p className="text-gray-400 text-sm mb-6">Add a consistent footer to all emails</p>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="footer_text" className="block text-sm font-medium text-gray-300 mb-2">
              Plain Text Footer
            </label>
            <textarea
              id="footer_text"
              value={config.footer_text || ''}
              onChange={(e) => setConfig({ ...config, footer_text: e.target.value })}
              placeholder="Round Table - Internal Vehicle Management System"
              rows={3}
              className="w-full px-3 py-2 bg-black border border-[#2a2a2a] rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
          <div>
            <label htmlFor="footer_html" className="block text-sm font-medium text-gray-300 mb-2">
              HTML Footer
            </label>
            <textarea
              id="footer_html"
              value={config.footer_html || ''}
              onChange={(e) => setConfig({ ...config, footer_html: e.target.value })}
              placeholder="<p style='color: #666;'>Round Table - Internal Vehicle Management System</p>"
              rows={4}
              className="w-full px-3 py-2 bg-black border border-[#2a2a2a] rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 font-mono text-sm"
            />
            <p className="text-sm text-gray-500 mt-1">HTML markup for rich email clients</p>
          </div>
        </div>
      </div>

      {/* Compliance Settings */}
      <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-green-500" />
          <h2 className="text-xl font-semibold text-white">Compliance Settings</h2>
        </div>
        <p className="text-gray-400 text-sm mb-6">Email compliance and monitoring configuration</p>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="company_address" className="block text-sm font-medium text-gray-300 mb-2">
                Company Address
              </label>
              <textarea
                id="company_address"
                value={config.company_address || ''}
                onChange={(e) => setConfig({ ...config, company_address: e.target.value })}
                placeholder="123 Main St, City, State 12345"
                rows={2}
                className="w-full px-3 py-2 bg-black border border-[#2a2a2a] rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
              <p className="text-sm text-gray-500 mt-1">Required for CAN-SPAM compliance</p>
            </div>
            <div>
              <label htmlFor="unsubscribe_text" className="block text-sm font-medium text-gray-300 mb-2">
                Unsubscribe Text
              </label>
              <input
                id="unsubscribe_text"
                type="text"
                value={config.unsubscribe_text || ''}
                onChange={(e) => setConfig({ ...config, unsubscribe_text: e.target.value })}
                placeholder="Unsubscribe from these notifications"
                className="w-full px-3 py-2 bg-black border border-[#2a2a2a] rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>
          <div>
            <label htmlFor="bcc_email" className="block text-sm font-medium text-gray-300 mb-2">
              BCC Email
            </label>
            <input
              id="bcc_email"
              type="email"
              value={config.bcc_email || ''}
              onChange={(e) => setConfig({ ...config, bcc_email: e.target.value })}
              placeholder="compliance@company.com"
              className="w-full px-3 py-2 bg-black border border-[#2a2a2a] rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
            <p className="text-sm text-gray-500 mt-1">Automatically BCC all emails to this address</p>
          </div>
        </div>
      </div>

      {/* Delivery Settings */}
      <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-purple-500" />
          <h2 className="text-xl font-semibold text-white">Delivery Settings</h2>
        </div>
        <p className="text-gray-400 text-sm mb-6">Control when and how emails are sent</p>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="rate_limit_per_hour" className="block text-sm font-medium text-gray-300 mb-2">
                Hourly Rate Limit
              </label>
              <input
                id="rate_limit_per_hour"
                type="number"
                value={config.rate_limit_per_hour || 0}
                onChange={(e) => setConfig({ ...config, rate_limit_per_hour: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-black border border-[#2a2a2a] rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
            <div>
              <label htmlFor="rate_limit_per_day" className="block text-sm font-medium text-gray-300 mb-2">
                Daily Rate Limit
              </label>
              <input
                id="rate_limit_per_day"
                type="number"
                value={config.rate_limit_per_day || 0}
                onChange={(e) => setConfig({ ...config, rate_limit_per_day: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-black border border-[#2a2a2a] rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="quiet_hours" className="text-sm font-medium text-gray-300">
                  Quiet Hours
                </label>
                <p className="text-sm text-gray-500">Pause non-urgent notifications during these hours</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={config.quiet_hours_enabled}
                onClick={() => setConfig({ ...config, quiet_hours_enabled: !config.quiet_hours_enabled })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black ${
                  config.quiet_hours_enabled ? 'bg-blue-600' : 'bg-[#2a2a2a]'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                    config.quiet_hours_enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            
            {config.quiet_hours_enabled && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ml-4">
                <div>
                  <label htmlFor="quiet_start" className="block text-sm font-medium text-gray-300 mb-2">
                    Start Time
                  </label>
                  <input
                    id="quiet_start"
                    type="time"
                    value={config.quiet_hours_start || ''}
                    onChange={(e) => setConfig({ ...config, quiet_hours_start: e.target.value })}
                    className="w-full px-3 py-2 bg-black border border-[#2a2a2a] rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
                <div>
                  <label htmlFor="quiet_end" className="block text-sm font-medium text-gray-300 mb-2">
                    End Time
                  </label>
                  <input
                    id="quiet_end"
                    type="time"
                    value={config.quiet_hours_end || ''}
                    onChange={(e) => setConfig({ ...config, quiet_hours_end: e.target.value })}
                    className="w-full px-3 py-2 bg-black border border-[#2a2a2a] rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
                <div>
                  <label htmlFor="timezone" className="block text-sm font-medium text-gray-300 mb-2">
                    Timezone
                  </label>
                  <input
                    id="timezone"
                    type="text"
                    value={config.default_timezone || ''}
                    onChange={(e) => setConfig({ ...config, default_timezone: e.target.value })}
                    placeholder="America/New_York"
                    className="w-full px-3 py-2 bg-black border border-[#2a2a2a] rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Testing & Monitoring */}
      <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Testing & Monitoring</h2>
        <p className="text-gray-400 text-sm mb-6">Test mode and tracking configuration</p>
        
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="test_mode" className="text-sm font-medium text-gray-300">
                  Test Mode
                </label>
                <p className="text-sm text-gray-500">When enabled, all emails go to the test address</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={config.test_mode_enabled}
                onClick={() => setConfig({ ...config, test_mode_enabled: !config.test_mode_enabled })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black ${
                  config.test_mode_enabled ? 'bg-blue-600' : 'bg-[#2a2a2a]'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                    config.test_mode_enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            
            {config.test_mode_enabled && (
              <div className="ml-4">
                <label htmlFor="test_address" className="block text-sm font-medium text-gray-300 mb-2">
                  Test Email Address
                </label>
                <input
                  id="test_address"
                  type="email"
                  value={config.test_email_address || ''}
                  onChange={(e) => setConfig({ ...config, test_email_address: e.target.value })}
                  placeholder="test@company.com"
                  className="w-full px-3 py-2 bg-black border border-[#2a2a2a] rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="tracking" className="text-sm font-medium text-gray-300">
                Email Tracking
              </label>
              <p className="text-sm text-gray-500">Track email opens and clicks</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={config.tracking_enabled}
              onClick={() => setConfig({ ...config, tracking_enabled: !config.tracking_enabled })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black ${
                config.tracking_enabled ? 'bg-blue-600' : 'bg-[#2a2a2a]'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                  config.tracking_enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="border-t border-[#2a2a2a] pt-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">Send Test Email</label>
            <div className="flex gap-2">
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="Enter email address"
                className="flex-1 px-3 py-2 bg-black border border-[#2a2a2a] rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
              <button
                onClick={sendTestEmail}
                disabled={sendingTest}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                {sendingTest ? 'Sending...' : 'Send Test'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Settings */}
      <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Code className="w-5 h-5 text-orange-500" />
          <h2 className="text-xl font-semibold text-white">Advanced Settings</h2>
        </div>
        <p className="text-gray-400 text-sm mb-6">Technical configuration options</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="bounce_email" className="block text-sm font-medium text-gray-300 mb-2">
              Bounce Email
            </label>
            <input
              id="bounce_email"
              type="email"
              value={config.bounce_email || ''}
              onChange={(e) => setConfig({ ...config, bounce_email: e.target.value })}
              placeholder="bounces@company.com"
              className="w-full px-3 py-2 bg-black border border-[#2a2a2a] rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
            <p className="text-sm text-gray-500 mt-1">Where bounce notifications are sent</p>
          </div>
          <div>
            <label htmlFor="email_domain" className="block text-sm font-medium text-gray-300 mb-2">
              Email Domain
            </label>
            <input
              id="email_domain"
              type="text"
              value={config.email_domain || ''}
              onChange={(e) => setConfig({ ...config, email_domain: e.target.value })}
              placeholder="roundtable.app"
              className="w-full px-3 py-2 bg-black border border-[#2a2a2a] rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
            <p className="text-sm text-gray-500 mt-1">Used for link generation in emails</p>
          </div>
        </div>
      </div>

      {config.test_mode_enabled && (
        <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-yellow-400" />
            <h3 className="text-lg font-semibold text-yellow-400">Test Mode Active</h3>
          </div>
          <p className="text-yellow-300">
            All emails are being redirected to: <strong>{config.test_email_address || 'Not configured'}</strong>
          </p>
        </div>
      )}
    </div>
  );
}