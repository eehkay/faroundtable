'use client';

import { useState, useEffect } from 'react';
import { Users, MapPin, UserPlus, Mail, Phone } from 'lucide-react';
import type { RecipientConfig } from '@/types/notifications';

interface RecipientConfigProps {
  config: RecipientConfig;
  onChange: (config: RecipientConfig) => void;
}

export function RecipientConfigComponent({ config, onChange }: RecipientConfigProps) {
  const [locations, setLocations] = useState<Array<{ id: string; name: string }>>([]);
  const [users, setUsers] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch locations
      const locResponse = await fetch('/api/locations');
      if (locResponse.ok) {
        const locData = await locResponse.json();
        setLocations(locData);
      }

      // Fetch users
      const userResponse = await fetch('/api/users');
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUsers(userData);
      }
    } catch (error) {
      // Error fetching data
    } finally {
      setLoading(false);
    }
  };

  const roles = ['admin', 'manager', 'sales', 'transport'];

  const updateConfig = (updates: Partial<RecipientConfig>) => {
    onChange({ ...config, ...updates });
  };

  const toggleRole = (location: 'currentLocation' | 'requestingLocation' | 'destinationLocation', role: string) => {
    const current = config[location] || [];
    const updated = current.includes(role)
      ? current.filter(r => r !== role)
      : [...current, role];
    updateConfig({ [location]: updated });
  };

  const addEmail = (email: string) => {
    if (email && !config.additionalEmails?.includes(email)) {
      updateConfig({
        additionalEmails: [...(config.additionalEmails || []), email]
      });
    }
  };

  const removeEmail = (email: string) => {
    updateConfig({
      additionalEmails: config.additionalEmails?.filter(e => e !== email) || []
    });
  };

  const addPhone = (phone: string) => {
    if (phone && !config.additionalPhones?.includes(phone)) {
      updateConfig({
        additionalPhones: [...(config.additionalPhones || []), phone]
      });
    }
  };

  const removePhone = (phone: string) => {
    updateConfig({
      additionalPhones: config.additionalPhones?.filter(p => p !== phone) || []
    });
  };

  return (
    <div className="space-y-6">
      {/* Use Conditions */}
      <div className="bg-[#1a1a1a] rounded-lg p-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={config.useConditions}
            onChange={(e) => updateConfig({ useConditions: e.target.checked })}
            className="w-4 h-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500"
          />
          <div>
            <span className="font-medium">Use Condition-Based Recipients</span>
            <p className="text-sm text-gray-400">
              Send to users who match the conditions above
            </p>
          </div>
        </label>
      </div>

      {/* Location-Based Recipients */}
      <div className="space-y-4">
        <h4 className="font-medium flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          Location-Based Recipients
        </h4>

        {/* Current Location */}
        <div className="bg-[#1a1a1a] rounded-lg p-4">
          <h5 className="text-sm font-medium mb-3">Vehicle&apos;s Current Location</h5>
          <p className="text-xs text-gray-400 mb-3">Where the vehicle is physically located now</p>
          <div className="flex flex-wrap gap-2">
            {roles.map(role => (
              <label key={role} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.currentLocation?.includes(role) || false}
                  onChange={() => toggleRole('currentLocation', role)}
                  className="w-4 h-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm capitalize">{role}s</span>
              </label>
            ))}
          </div>
        </div>

        {/* Requesting Location */}
        <div className="bg-[#1a1a1a] rounded-lg p-4">
          <h5 className="text-sm font-medium mb-3">Requesting Location (From)</h5>
          <p className="text-xs text-gray-400 mb-3">The store requesting the transfer</p>
          <div className="flex flex-wrap gap-2">
            {roles.map(role => (
              <label key={role} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.requestingLocation?.includes(role) || false}
                  onChange={() => toggleRole('requestingLocation', role)}
                  className="w-4 h-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm capitalize">{role}s</span>
              </label>
            ))}
          </div>
        </div>

        {/* Destination Location */}
        <div className="bg-[#1a1a1a] rounded-lg p-4">
          <h5 className="text-sm font-medium mb-3">Destination Location (To)</h5>
          <p className="text-xs text-gray-400 mb-3">Where the vehicle is being transferred to</p>
          <div className="flex flex-wrap gap-2">
            {roles.map(role => (
              <label key={role} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.destinationLocation?.includes(role) || false}
                  onChange={() => toggleRole('destinationLocation', role)}
                  className="w-4 h-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm capitalize">{role}s</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Specific Users */}
      <div className="space-y-3">
        <h4 className="font-medium flex items-center gap-2">
          <UserPlus className="w-4 h-4" />
          Specific Users
        </h4>
        <div className="bg-[#1a1a1a] rounded-lg p-4">
          <select
            multiple
            value={config.specificUsers || []}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions).map(o => o.value);
              updateConfig({ specificUsers: selected });
            }}
            className="w-full h-32 px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg focus:border-blue-500 focus:outline-none text-sm"
          >
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.name || user.email}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-400 mt-2">
            Hold Ctrl/Cmd to select multiple users
          </p>
        </div>
      </div>

      {/* Additional Recipients */}
      <div className="space-y-4">
        <h4 className="font-medium">Additional Recipients</h4>

        {/* Additional Emails */}
        <div className="space-y-2">
          <label className="text-sm flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Additional Email Addresses
          </label>
          <div className="space-y-2">
            {config.additionalEmails?.map((email, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="email"
                  value={email}
                  readOnly
                  className="flex-1 px-3 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-sm"
                />
                <button
                  type="button"
                  onClick={() => removeEmail(email)}
                  className="px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  Remove
                </button>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <input
                type="email"
                placeholder="Add email address..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addEmail(e.currentTarget.value);
                    e.currentTarget.value = '';
                  }
                }}
                className="flex-1 px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg focus:border-blue-500 focus:outline-none text-sm"
              />
            </div>
          </div>
        </div>

        {/* Additional Phones */}
        <div className="space-y-2">
          <label className="text-sm flex items-center gap-2">
            <Phone className="w-4 h-4" />
            Additional Phone Numbers (for SMS)
          </label>
          <div className="space-y-2">
            {config.additionalPhones?.map((phone, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="tel"
                  value={phone}
                  readOnly
                  className="flex-1 px-3 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-sm"
                />
                <button
                  type="button"
                  onClick={() => removePhone(phone)}
                  className="px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  Remove
                </button>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <input
                type="tel"
                placeholder="Add phone number..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addPhone(e.currentTarget.value);
                    e.currentTarget.value = '';
                  }
                }}
                className="flex-1 px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg focus:border-blue-500 focus:outline-none text-sm"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}