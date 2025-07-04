"use client"

import { useState, useEffect } from 'react';
import { X, Save, UserPlus } from 'lucide-react';
import type { DealershipLocation } from '@/types/vehicle';

interface User {
  _id?: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'sales' | 'transport';
  active: boolean;
  location?: {
    _id: string;
    name: string;
    code: string;
  };
}

interface UserEditModalProps {
  user: User;
  locations: DealershipLocation[];
  onSave: (userId: string, updates: Partial<User>) => Promise<void>;
  onClose: () => void;
}

export default function UserEditModal({ user, locations, onSave, onClose }: UserEditModalProps) {
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
    role: user.role || 'sales',
    locationId: user.location?._id || '',
    active: user.active !== undefined ? user.active : true
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isNewUser = !user._id;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.role) {
      newErrors.role = 'Role is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSaving(true);
    try {
      if (isNewUser) {
        // Create new user
        const response = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            name: formData.name,
            role: formData.role,
            locationId: formData.locationId || null,
            active: formData.active
          })
        });

        if (response.ok) {
          onClose();
          // Trigger refresh in parent component
          window.location.reload();
        } else {
          const error = await response.json();
          setErrors({ general: error.error || 'Failed to create user' });
        }
      } else {
        // Update existing user
        const updates: any = {
          name: formData.name,
          role: formData.role,
          active: formData.active
        };

        if (formData.locationId) {
          updates.locationId = formData.locationId;
        } else {
          updates.locationId = null;
        }

        await onSave(user._id!, updates);
      }
    } catch (error) {
      setErrors({ general: 'Failed to save user' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#2a2a2a]">
          <div className="flex items-center gap-3">
            {isNewUser ? (
              <UserPlus className="h-5 w-5 text-[#3b82f6]" />
            ) : (
              <div className="w-5 h-5 bg-[#3b82f6] rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-medium">
                  {user.name?.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <h2 className="text-lg font-semibold text-white">
              {isNewUser ? 'Add New User' : `Edit ${user.name}`}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-200 hover:bg-[#2a2a2a] rounded-lg transition-all duration-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errors.general && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {errors.general}
            </div>
          )}

          {/* Name Field */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className={`w-full px-3 py-2 bg-[#141414] border rounded-lg text-gray-100 placeholder-gray-400 focus:ring-1 focus:outline-none transition-all duration-200 ${
                errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-[#2a2a2a] focus:border-[#3b82f6] focus:ring-[#3b82f6]/20'
              }`}
              placeholder="Enter user's full name"
            />
            {errors.name && <p className="mt-1 text-sm text-red-400">{errors.name}</p>}
          </div>

          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              disabled={!isNewUser}
              className={`w-full px-3 py-2 bg-[#141414] border rounded-lg text-gray-100 placeholder-gray-400 focus:ring-1 focus:outline-none transition-all duration-200 ${
                !isNewUser ? 'opacity-50 cursor-not-allowed' : ''
              } ${
                errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-[#2a2a2a] focus:border-[#3b82f6] focus:ring-[#3b82f6]/20'
              }`}
              placeholder="user@delmaradv.com"
            />
            {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email}</p>}
            {!isNewUser && (
              <p className="mt-1 text-xs text-gray-500">Email cannot be changed after creation</p>
            )}
          </div>

          {/* Role Field */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Role *
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as any }))}
              className={`w-full px-3 py-2 bg-[#141414] border rounded-lg text-gray-100 focus:ring-1 focus:outline-none transition-all duration-200 ${
                errors.role ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-[#2a2a2a] focus:border-[#3b82f6] focus:ring-[#3b82f6]/20'
              }`}
            >
              <option value="">Select a role</option>
              <option value="sales">Sales</option>
              <option value="transport">Transport</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
            {errors.role && <p className="mt-1 text-sm text-red-400">{errors.role}</p>}
          </div>

          {/* Location Field */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Primary Location
            </label>
            <select
              value={formData.locationId}
              onChange={(e) => setFormData(prev => ({ ...prev, locationId: e.target.value }))}
              className="w-full px-3 py-2 bg-[#141414] border border-[#2a2a2a] rounded-lg text-gray-100 focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/20 focus:outline-none transition-all duration-200"
            >
              <option value="">No specific location</option>
              {locations.map((location) => (
                <option key={location._id} value={location._id}>
                  {location.name} ({location.code})
                </option>
              ))}
            </select>
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="active"
              checked={formData.active}
              onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
              className="w-4 h-4 text-[#3b82f6] bg-[#141414] border-[#2a2a2a] rounded focus:ring-[#3b82f6]/20 focus:ring-2"
            />
            <label htmlFor="active" className="text-sm font-medium text-gray-300">
              Active Account
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-[#2a2a2a] text-gray-300 rounded-lg hover:bg-[#333333] transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#3b82f6] text-white rounded-lg hover:bg-[#2563eb] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? 'Saving...' : (isNewUser ? 'Create User' : 'Save Changes')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}