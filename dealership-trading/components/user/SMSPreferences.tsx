'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Phone, MessageSquare, Check, X, Info } from 'lucide-react';

interface SMSPreferences {
  phone: string | null;
  phoneVerified: boolean;
  smsOptIn: boolean;
  smsOptInDate: string | null;
  smsOptOutDate: string | null;
}

export function SMSPreferences() {
  const [preferences, setPreferences] = useState<SMSPreferences | null>(null);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await fetch('/api/user/sms');
      if (!response.ok) throw new Error('Failed to fetch preferences');
      
      const data = await response.json();
      setPreferences(data);
      setPhone(data.phone || '');
    } catch (error) {
      console.error('Error fetching SMS preferences:', error);
      toast.error('Failed to load SMS preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleOptIn = async () => {
    if (!phone.trim()) {
      toast.error('Please enter a phone number');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/user/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, optIn: true })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to opt-in');
      }

      toast.success('Successfully opted in to SMS notifications');
      await fetchPreferences();
    } catch (error: any) {
      console.error('Error opting in:', error);
      toast.error(error.message || 'Failed to opt-in to SMS');
    } finally {
      setSaving(false);
    }
  };

  const handleOptOut = async () => {
    if (!confirm('Are you sure you want to opt out of SMS notifications?')) {
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/user/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optIn: false })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to opt-out');
      }

      toast.success('Successfully opted out of SMS notifications');
      await fetchPreferences();
    } catch (error: any) {
      console.error('Error opting out:', error);
      toast.error(error.message || 'Failed to opt-out');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePhone = async () => {
    if (!phone.trim()) {
      toast.error('Please enter a phone number');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/user/sms', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update phone number');
      }

      toast.success('Phone number updated successfully');
      await fetchPreferences();
    } catch (error: any) {
      console.error('Error updating phone:', error);
      toast.error(error.message || 'Failed to update phone number');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-[#2a2a2a] rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-[#2a2a2a] rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <MessageSquare className="w-5 h-5 text-blue-400" />
        <h3 className="text-lg font-semibold">SMS Notifications</h3>
      </div>

      {preferences?.smsOptIn ? (
        // Opted in - show status and opt-out option
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-green-400">
            <Check className="w-5 h-5" />
            <span>SMS notifications enabled</span>
          </div>

          <div className="bg-[#1a1a1a] rounded-lg p-4 space-y-3">
            <div>
              <label className="text-sm text-gray-400">Phone Number</label>
              <p className="font-medium">{preferences.phone}</p>
            </div>
            
            {preferences.smsOptInDate && (
              <div>
                <label className="text-sm text-gray-400">Opted in</label>
                <p className="text-sm">
                  {new Date(preferences.smsOptInDate).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleOptOut}
              disabled={saving}
              className="px-4 py-2 bg-red-600/10 text-red-400 rounded-lg hover:bg-red-600/20 transition-colors disabled:opacity-50"
            >
              Opt Out of SMS
            </button>
          </div>
        </div>
      ) : (
        // Not opted in - show opt-in form
        <div className="space-y-4">
          <p className="text-gray-400 text-sm">
            Receive important notifications via SMS for transfers and urgent updates.
          </p>

          <div>
            <label className="block text-sm font-medium mb-2">
              Phone Number
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                  className="w-full pl-10 pr-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>
              {preferences?.phone && preferences.phone !== phone && (
                <button
                  onClick={handleUpdatePhone}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  Update
                </button>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              US phone numbers only. Standard messaging rates apply.
            </p>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="text-blue-300 font-medium mb-1">SMS Consent</p>
                <p className="text-gray-400">
                  By opting in, you agree to receive SMS notifications from Round Table. 
                  You can opt out at any time by replying STOP to any message.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleOptIn}
            disabled={saving || !phone.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            Enable SMS Notifications
          </button>
        </div>
      )}
    </div>
  );
}