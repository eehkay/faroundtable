"use client"

import { useState, useEffect } from 'react';
import { X, Save, Building2, Plus, Trash2 } from 'lucide-react';
import type { DealershipLocation } from '@/types/vehicle';

interface DealershipEditModalProps {
  dealership: Partial<DealershipLocation & { 
    emailDomains?: string[]; 
    enableCsvImport?: boolean;
    latitude?: number;
    longitude?: number;
    city_state?: string;
    dataforseo_location_code?: number;
  }>;
  isCreating: boolean;
  onSave: (dealership: Partial<DealershipLocation & { 
    emailDomains?: string[]; 
    enableCsvImport?: boolean;
    latitude?: number;
    longitude?: number;
    city_state?: string;
    dataforseo_location_code?: number;
  }>) => Promise<void>;
  onClose: () => void;
}

export default function DealershipEditModal({ dealership, isCreating, onSave, onClose }: DealershipEditModalProps) {
  const [formData, setFormData] = useState({
    name: dealership.name || '',
    code: dealership.code || '',
    address: dealership.address || '',
    city: dealership.city || '',
    state: dealership.state || '',
    zip: dealership.zip || '',
    phone: dealership.phone || '',
    email: dealership.email || '',
    csvFileName: dealership.csvFileName || '',
    emailDomains: dealership.emailDomains || [],
    enableCsvImport: dealership.enableCsvImport !== undefined ? dealership.enableCsvImport : true,
    active: dealership.active !== undefined ? dealership.active : true,
    latitude: dealership.latitude || undefined,
    longitude: dealership.longitude || undefined,
    city_state: dealership.city_state || '',
    dataforseo_location_code: dealership.dataforseo_location_code || undefined
  });
  const [emailDomainInput, setEmailDomainInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Re-initialize form when dealership data changes
  useEffect(() => {
    setFormData({
      name: dealership.name || '',
      code: dealership.code || '',
      address: dealership.address || '',
      city: dealership.city || '',
      state: dealership.state || '',
      zip: dealership.zip || '',
      phone: dealership.phone || '',
      email: dealership.email || '',
      csvFileName: dealership.csvFileName || '',
      emailDomains: dealership.emailDomains || [],
      enableCsvImport: dealership.enableCsvImport !== undefined ? dealership.enableCsvImport : true,
      active: dealership.active !== undefined ? dealership.active : true,
      latitude: dealership.latitude || undefined,
      longitude: dealership.longitude || undefined,
      city_state: dealership.city_state || '',
      dataforseo_location_code: dealership.dataforseo_location_code || undefined
    });
    setEmailDomainInput('');
    setErrors({}); // Clear any existing errors
  }, [dealership]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    // Only validate store code for new dealerships
    if (isCreating) {
      if (!formData.code.trim()) {
        newErrors.code = 'Store code is required';
      } else if (!/^[A-Z0-9]+$/.test(formData.code)) {
        newErrors.code = 'Store code must contain only uppercase letters and numbers';
      }
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (formData.phone && !/^[\d\s\-\(\)\+]+$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone format';
    }

    if (formData.state && formData.state.length !== 2) {
      newErrors.state = 'State must be 2 letters (e.g., CA)';
    }

    if (formData.zip && !/^\d{5}(-\d{4})?$/.test(formData.zip)) {
      newErrors.zip = 'Invalid ZIP code format';
    }

    if (formData.latitude !== undefined && (formData.latitude < -90 || formData.latitude > 90)) {
      newErrors.latitude = 'Latitude must be between -90 and 90';
    }

    if (formData.longitude !== undefined && (formData.longitude < -180 || formData.longitude > 180)) {
      newErrors.longitude = 'Longitude must be between -180 and 180';
    }

    if (formData.city_state && formData.city_state.includes(',')) {
      const parts = formData.city_state.split(',');
      if (parts.length !== 2 || parts[1].trim().length !== 2) {
        newErrors.city_state = 'Format must be "City, ST" (e.g., Las Vegas, NV)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSaving(true);
    try {
      await onSave({
        _id: dealership._id,
        name: formData.name,
        code: formData.code,
        address: formData.address || undefined,
        city: formData.city || undefined,
        state: formData.state ? formData.state.toUpperCase() : undefined,
        zip: formData.zip || undefined,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        csvFileName: formData.csvFileName || undefined,
        emailDomains: formData.emailDomains.length > 0 ? formData.emailDomains : undefined,
        enableCsvImport: formData.enableCsvImport,
        active: formData.active,
        latitude: formData.latitude,
        longitude: formData.longitude,
        city_state: formData.city_state || undefined,
        dataforseo_location_code: formData.dataforseo_location_code
      });
    } catch (error) {
      setErrors({ general: 'Failed to save dealership' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#2a2a2a] sticky top-0 bg-[#1f1f1f]">
          <div className="flex items-center gap-3">
            <Building2 className="h-5 w-5 text-[#3b82f6]" />
            <h2 className="text-lg font-semibold text-white">
              {isCreating ? 'Add New Dealership' : `Edit ${dealership.name}`}
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
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errors.general && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {errors.general}
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name Field */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Dealership Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className={`w-full px-3 py-2 bg-[#141414] border rounded-lg text-gray-100 placeholder-gray-400 focus:ring-1 focus:outline-none transition-all duration-200 ${
                    errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-[#2a2a2a] focus:border-[#3b82f6] focus:ring-[#3b82f6]/20'
                  }`}
                  placeholder="e.g., United Nissan Las Vegas"
                />
                {errors.name && <p className="mt-1 text-sm text-red-400">{errors.name}</p>}
              </div>

              {/* Store Code Field */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Store Code *
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  disabled={!isCreating}
                  className={`w-full px-3 py-2 bg-[#141414] border rounded-lg text-gray-100 placeholder-gray-400 focus:ring-1 focus:outline-none transition-all duration-200 ${
                    !isCreating ? 'opacity-50 cursor-not-allowed' : ''
                  } ${
                    errors.code ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-[#2a2a2a] focus:border-[#3b82f6] focus:ring-[#3b82f6]/20'
                  }`}
                  placeholder="e.g., MP1568"
                />
                {errors.code && <p className="mt-1 text-sm text-red-400">{errors.code}</p>}
                {!isCreating && (
                  <p className="mt-1 text-xs text-gray-500">Store code cannot be changed after creation</p>
                )}
              </div>

              {/* CSV Import Settings */}
              <div className="md:col-span-2 space-y-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="enableCsvImport"
                    checked={formData.enableCsvImport}
                    onChange={(e) => setFormData(prev => ({ ...prev, enableCsvImport: e.target.checked }))}
                    className="w-4 h-4 text-[#3b82f6] bg-[#141414] border-[#2a2a2a] rounded focus:ring-[#3b82f6]/20 focus:ring-2"
                  />
                  <label htmlFor="enableCsvImport" className="text-sm font-medium text-gray-300">
                    Enable CSV Import
                  </label>
                </div>
                
                {formData.enableCsvImport && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      CSV File Name
                    </label>
                    <input
                      type="text"
                      value={formData.csvFileName}
                      onChange={(e) => setFormData(prev => ({ ...prev, csvFileName: e.target.value }))}
                      className="w-full px-3 py-2 bg-[#141414] border border-[#2a2a2a] rounded-lg text-gray-100 placeholder-gray-400 focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/20 focus:outline-none transition-all duration-200"
                      placeholder="e.g., MP1568.csv"
                    />
                    <p className="mt-1 text-xs text-gray-500">Used for automated inventory imports</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Location Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Address Field */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Street Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#141414] border border-[#2a2a2a] rounded-lg text-gray-100 placeholder-gray-400 focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/20 focus:outline-none transition-all duration-200"
                  placeholder="e.g., 5050 W Sahara Ave"
                />
              </div>

              {/* City */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  City
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#141414] border border-[#2a2a2a] rounded-lg text-gray-100 placeholder-gray-400 focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/20 focus:outline-none transition-all duration-200"
                  placeholder="e.g., Las Vegas"
                />
              </div>

              {/* State */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  State
                </label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value.toUpperCase() }))}
                  maxLength={2}
                  className={`w-full px-3 py-2 bg-[#141414] border rounded-lg text-gray-100 placeholder-gray-400 focus:ring-1 focus:outline-none transition-all duration-200 ${
                    errors.state ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-[#2a2a2a] focus:border-[#3b82f6] focus:ring-[#3b82f6]/20'
                  }`}
                  placeholder="e.g., NV"
                />
                {errors.state && <p className="mt-1 text-sm text-red-400">{errors.state}</p>}
              </div>

              {/* ZIP */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  ZIP Code
                </label>
                <input
                  type="text"
                  value={formData.zip}
                  onChange={(e) => setFormData(prev => ({ ...prev, zip: e.target.value }))}
                  className={`w-full px-3 py-2 bg-[#141414] border rounded-lg text-gray-100 placeholder-gray-400 focus:ring-1 focus:outline-none transition-all duration-200 ${
                    errors.zip ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-[#2a2a2a] focus:border-[#3b82f6] focus:ring-[#3b82f6]/20'
                  }`}
                  placeholder="e.g., 89146"
                />
                {errors.zip && <p className="mt-1 text-sm text-red-400">{errors.zip}</p>}
              </div>
            </div>

            {/* Geographic Coordinates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Latitude */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Latitude
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={formData.latitude || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, latitude: e.target.value ? parseFloat(e.target.value) : undefined }))}
                  className={`w-full px-3 py-2 bg-[#141414] border rounded-lg text-gray-100 placeholder-gray-400 focus:ring-1 focus:outline-none transition-all duration-200 ${
                    errors.latitude ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-[#2a2a2a] focus:border-[#3b82f6] focus:ring-[#3b82f6]/20'
                  }`}
                  placeholder="e.g., 36.1699"
                />
                {errors.latitude && <p className="mt-1 text-sm text-red-400">{errors.latitude}</p>}
                <p className="mt-1 text-xs text-gray-500">Used for Market Check API location-based queries</p>
              </div>

              {/* Longitude */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Longitude
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={formData.longitude || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, longitude: e.target.value ? parseFloat(e.target.value) : undefined }))}
                  className={`w-full px-3 py-2 bg-[#141414] border rounded-lg text-gray-100 placeholder-gray-400 focus:ring-1 focus:outline-none transition-all duration-200 ${
                    errors.longitude ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-[#2a2a2a] focus:border-[#3b82f6] focus:ring-[#3b82f6]/20'
                  }`}
                  placeholder="e.g., -115.1398"
                />
                {errors.longitude && <p className="mt-1 text-sm text-red-400">{errors.longitude}</p>}
                <p className="mt-1 text-xs text-gray-500">Used for Market Check API location-based queries</p>
              </div>

              {/* City State */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  City, State Format
                </label>
                <input
                  type="text"
                  value={formData.city_state}
                  onChange={(e) => setFormData(prev => ({ ...prev, city_state: e.target.value }))}
                  className={`w-full px-3 py-2 bg-[#141414] border rounded-lg text-gray-100 placeholder-gray-400 focus:ring-1 focus:outline-none transition-all duration-200 ${
                    errors.city_state ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-[#2a2a2a] focus:border-[#3b82f6] focus:ring-[#3b82f6]/20'
                  }`}
                  placeholder="e.g., Las Vegas, NV"
                />
                {errors.city_state && <p className="mt-1 text-sm text-red-400">{errors.city_state}</p>}
                <p className="mt-1 text-xs text-gray-500">Used for Market Check citywise sales statistics</p>
              </div>

              {/* DataForSEO Location Code */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  DataForSEO Location Code
                </label>
                <input
                  type="number"
                  value={formData.dataforseo_location_code || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, dataforseo_location_code: e.target.value ? parseInt(e.target.value) : undefined }))}
                  className={`w-full px-3 py-2 bg-[#141414] border rounded-lg text-gray-100 placeholder-gray-400 focus:ring-1 focus:outline-none transition-all duration-200 ${
                    errors.dataforseo_location_code ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-[#2a2a2a] focus:border-[#3b82f6] focus:ring-[#3b82f6]/20'
                  }`}
                  placeholder="e.g., 9057131 for Las Vegas"
                />
                {errors.dataforseo_location_code && <p className="mt-1 text-sm text-red-400">{errors.dataforseo_location_code}</p>}
                <p className="mt-1 text-xs text-gray-500">
                  Used for local search volume data. Las Vegas: 9057131, Reno: 9058666 (primary) / 1022620 (secondary)
                </p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Contact Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className={`w-full px-3 py-2 bg-[#141414] border rounded-lg text-gray-100 placeholder-gray-400 focus:ring-1 focus:outline-none transition-all duration-200 ${
                    errors.phone ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-[#2a2a2a] focus:border-[#3b82f6] focus:ring-[#3b82f6]/20'
                  }`}
                  placeholder="e.g., (702) 555-0100"
                />
                {errors.phone && <p className="mt-1 text-sm text-red-400">{errors.phone}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className={`w-full px-3 py-2 bg-[#141414] border rounded-lg text-gray-100 placeholder-gray-400 focus:ring-1 focus:outline-none transition-all duration-200 ${
                    errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-[#2a2a2a] focus:border-[#3b82f6] focus:ring-[#3b82f6]/20'
                  }`}
                  placeholder="e.g., info@unitednissan.com"
                />
                {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email}</p>}
              </div>
            </div>
          </div>

          {/* Email Domains for Auto-Assignment */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Email Domain Auto-Assignment</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Associated Email Domains
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Users with these email domains will be automatically assigned to this dealership
              </p>
              
              <div className="space-y-2">
                {/* Existing domains */}
                {formData.emailDomains.map((domain, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="flex-1 px-3 py-2 bg-[#141414] border border-[#2a2a2a] rounded-lg text-gray-100">
                      {domain}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newDomains = [...formData.emailDomains];
                        newDomains.splice(index, 1);
                        setFormData(prev => ({ ...prev, emailDomains: newDomains }));
                      }}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                
                {/* Add new domain input */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={emailDomainInput}
                    onChange={(e) => setEmailDomainInput(e.target.value.toLowerCase())}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (emailDomainInput && !formData.emailDomains.includes(emailDomainInput)) {
                          setFormData(prev => ({ 
                            ...prev, 
                            emailDomains: [...prev.emailDomains, emailDomainInput] 
                          }));
                          setEmailDomainInput('');
                        }
                      }
                    }}
                    className="flex-1 px-3 py-2 bg-[#141414] border border-[#2a2a2a] rounded-lg text-gray-100 placeholder-gray-400 focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/20 focus:outline-none transition-all duration-200"
                    placeholder="e.g., unitednissan.com"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (emailDomainInput && !formData.emailDomains.includes(emailDomainInput)) {
                        setFormData(prev => ({ 
                          ...prev, 
                          emailDomains: [...prev.emailDomains, emailDomainInput] 
                        }));
                        setEmailDomainInput('');
                      }
                    }}
                    disabled={!emailDomainInput || formData.emailDomains.includes(emailDomainInput)}
                    className="p-2 bg-[#3b82f6] text-white rounded-lg hover:bg-[#2563eb] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
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
              Active Dealership
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-[#2a2a2a]">
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
              {saving ? 'Saving...' : (isCreating ? 'Create Dealership' : 'Save Changes')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}