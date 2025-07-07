"use client"

import { useState, useEffect } from 'react';
import { Search, Building2, Filter, MoreVertical, Edit, Trash2, CheckCircle, XCircle, Phone, Mail, MapPin, Download, Clock, AlertCircle } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import DealershipEditModal from './DealershipEditModal';
import type { DealershipLocation } from '@/types/vehicle';

interface DealershipListProps {
  initialDealerships: DealershipLocation[];
}

interface ImportStatus {
  timestamp: string;
  success: boolean;
  created: number;
  updated: number;
  deleted: number;
  errors: number;
}

export default function DealershipList({ initialDealerships }: DealershipListProps) {
  const [dealerships, setDealerships] = useState(initialDealerships);
  const [filteredDealerships, setFilteredDealerships] = useState(initialDealerships);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingDealership, setEditingDealership] = useState<DealershipLocation | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [importStatuses, setImportStatuses] = useState<Record<string, ImportStatus>>({});

  // Filter dealerships based on search and filters
  useEffect(() => {
    let filtered = dealerships;

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(dealership =>
        dealership.name.toLowerCase().includes(search) ||
        dealership.code.toLowerCase().includes(search) ||
        dealership.address?.toLowerCase().includes(search) ||
        dealership.city?.toLowerCase().includes(search)
      );
    }

    // Status filter
    if (statusFilter === 'active') {
      filtered = filtered.filter(dealership => dealership.active !== false);
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter(dealership => dealership.active === false);
    }

    setFilteredDealerships(filtered);
  }, [dealerships, searchTerm, statusFilter]);

  const fetchDealerships = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/dealerships');
      if (response.ok) {
        const data = await response.json();
        setDealerships(data);
        // Fetch import statuses for all dealerships
        fetchImportStatuses(data);
      }
    } catch (error) {
      console.error('Failed to fetch dealerships:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchImportStatuses = async (dealershipList: DealershipLocation[]) => {
    const statuses: Record<string, ImportStatus> = {};
    
    // Fetch all statuses in parallel
    await Promise.all(
      dealershipList.map(async (dealership) => {
        try {
          const response = await fetch(`/api/admin/imports/last-import/${dealership._id}`);
          if (response.ok) {
            const data = await response.json();
            if (data.lastImport) {
              statuses[dealership._id] = data.lastImport;
            }
          }
        } catch (error) {
          console.error(`Failed to fetch import status for ${dealership.name}:`, error);
        }
      })
    );
    
    setImportStatuses(statuses);
  };

  // Fetch import statuses on mount
  useEffect(() => {
    if (dealerships.length > 0) {
      fetchImportStatuses(dealerships);
    }
  }, [dealerships]);

  const handleSaveDealership = async (dealership: Partial<DealershipLocation>) => {
    try {
      const url = dealership._id 
        ? `/api/admin/dealerships/${dealership._id}`
        : '/api/admin/dealerships';
      
      const method = dealership._id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dealership)
      });

      if (response.ok) {
        await fetchDealerships();
        setEditingDealership(null);
        setIsCreating(false);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save dealership');
      }
    } catch (error) {
      console.error('Failed to save dealership:', error);
      alert('Failed to save dealership');
    }
  };

  const handleDeleteDealership = async (dealershipId: string) => {
    if (!confirm('Are you sure you want to deactivate this dealership? This will not delete any associated data.')) return;

    try {
      const response = await fetch(`/api/admin/dealerships/${dealershipId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchDealerships();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to deactivate dealership');
      }
    } catch (error) {
      console.error('Failed to deactivate dealership:', error);
      alert('Failed to deactivate dealership');
    }
  };

  return (
    <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg shadow-sm transition-all duration-200">
      {/* Header with Search and Filters */}
      <div className="p-6 border-b border-[#2a2a2a]">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search dealerships..."
                className="w-full pl-10 pr-4 py-2 bg-[#141414] border border-[#2a2a2a] rounded-lg text-gray-100 placeholder-gray-400 focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] focus:outline-none transition-all duration-200"
              />
            </div>
          </div>

          <div className="flex gap-3">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-[#141414] border border-[#2a2a2a] rounded-lg text-gray-100 focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] focus:outline-none"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            {/* Add Dealership Button */}
            <button
              onClick={() => {
                setIsCreating(true);
                setEditingDealership({} as DealershipLocation);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-[#3b82f6] text-white rounded-lg hover:bg-[#2563eb] transition-all duration-200"
            >
              <Building2 className="h-4 w-4" />
              Add Dealership
            </button>
          </div>
        </div>
      </div>

      {/* Dealership List */}
      <div className="p-6">
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse bg-[#2a2a2a] h-24 rounded-lg"></div>
            ))}
          </div>
        ) : dealerships.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No dealerships in the system</p>
            <p className="text-gray-500 text-sm mt-2">Click &quot;Add Dealership&quot; to create one</p>
          </div>
        ) : filteredDealerships.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No dealerships match your filters</p>
            <p className="text-gray-500 text-sm mt-2">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDealerships.map((dealership) => (
              <div
                key={dealership._id}
                className="flex items-center justify-between p-4 bg-[#141414] border border-[#2a2a2a]/30 rounded-lg hover:bg-[#1a1a1a] transition-all duration-200"
              >
                <div className="flex-1">
                  <div className="flex items-start gap-4">
                    {/* Dealership Icon */}
                    <div className="relative">
                      <div className="w-10 h-10 bg-[#3b82f6]/20 rounded-full flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-[#3b82f6]" />
                      </div>
                      {dealership.active !== false ? (
                        <CheckCircle className="absolute -bottom-1 -right-1 h-4 w-4 text-green-500 bg-[#141414] rounded-full" />
                      ) : (
                        <XCircle className="absolute -bottom-1 -right-1 h-4 w-4 text-red-500 bg-[#141414] rounded-full" />
                      )}
                    </div>

                    {/* Dealership Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium text-gray-100">{dealership.name}</h3>
                        <span className="px-2.5 py-1 bg-[#2a2a2a] text-gray-300 rounded-full text-xs font-medium">
                          {dealership.code}
                        </span>
                        {dealership.csvFileName && (
                          <span className="px-2.5 py-1 bg-[#2a2a2a]/50 text-gray-400 rounded-full text-xs">
                            CSV: {dealership.csvFileName}
                          </span>
                        )}
                      </div>
                      
                      <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-400">
                        {dealership.address && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span>{dealership.address}{dealership.city && `, ${dealership.city}`}{dealership.state && `, ${dealership.state}`}{dealership.zip && ` ${dealership.zip}`}</span>
                          </div>
                        )}
                        {dealership.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            <span>{dealership.phone}</span>
                          </div>
                        )}
                        {dealership.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            <span>{dealership.email}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Import Status */}
                      {importStatuses[dealership._id] && (
                        <div className="mt-3 flex items-center gap-3 text-xs">
                          <div className="flex items-center gap-1.5 text-gray-500">
                            <Download className="h-3 w-3" />
                            <span>Last import:</span>
                          </div>
                          {importStatuses[dealership._id].success ? (
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              <span className="text-gray-400">
                                {formatDistanceToNow(new Date(importStatuses[dealership._id].timestamp), { addSuffix: true })}
                              </span>
                              <span className="text-gray-500">
                                ({importStatuses[dealership._id].created} new, {importStatuses[dealership._id].updated} updated)
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <AlertCircle className="h-3 w-3 text-orange-500" />
                              <span className="text-orange-400">
                                Failed {formatDistanceToNow(new Date(importStatuses[dealership._id].timestamp), { addSuffix: true })}
                              </span>
                              {importStatuses[dealership._id].errors > 0 && (
                                <span className="text-orange-500">
                                  ({importStatuses[dealership._id].errors} errors)
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => {
                      setIsCreating(false);
                      setEditingDealership(dealership);
                    }}
                    className="p-2 text-gray-400 hover:text-gray-200 hover:bg-[#2a2a2a] rounded-lg transition-all duration-200"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  
                  <button
                    onClick={() => handleDeleteDealership(dealership._id)}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Dealership Modal */}
      {editingDealership && (
        <DealershipEditModal
          dealership={editingDealership}
          isCreating={isCreating}
          onSave={handleSaveDealership}
          onClose={() => {
            setEditingDealership(null);
            setIsCreating(false);
          }}
        />
      )}
    </div>
  );
}