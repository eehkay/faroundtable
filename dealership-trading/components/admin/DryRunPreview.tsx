"use client"

import { useState } from 'react';
import { X, AlertTriangle, CheckCircle, TrendingUp, RefreshCw, TrendingDown, AlertCircle, FileText, Package } from 'lucide-react';

interface DryRunResult {
  success: boolean;
  stores: Record<string, {
    storeCode: string;
    storeName: string;
    success: boolean;
    created: number;
    updated: number;
    deleted: number;
    softDeleted: number;
    restored: number;
    errors: Array<{ vehicle: string | null; error: string }>;
    details?: {
      toCreate?: Array<{ stockNumber: string; vin: string; make: string; model: string; year: number }>;
      toUpdate?: Array<{ stockNumber: string; vin: string; make: string; model: string; year: number }>;
      toSoftDelete?: Array<{ stockNumber: string; vin: string; make: string; model: string; year: number }>;
      toPermanentlyDelete?: Array<{ stockNumber: string; vin: string; make: string; model: string; year: number; removedDate: string }>;
      toRestore?: Array<{ stockNumber: string; vin: string; make: string; model: string; year: number }>;
    };
  }>;
  totals: {
    created: number;
    updated: number;
    deleted: number;
    softDeleted: number;
    restored: number;
    errors: number;
  };
}

interface DryRunPreviewProps {
  result: DryRunResult;
  onClose: () => void;
  onProceed: () => void;
  loading?: boolean;
}

export default function DryRunPreview({ result, onClose, onProceed, loading = false }: DryRunPreviewProps) {
  const [expandedStore, setExpandedStore] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'details'>('summary');

  const hasChanges = result.totals.created > 0 || 
                    result.totals.updated > 0 || 
                    result.totals.deleted > 0 || 
                    result.totals.softDeleted > 0 ||
                    result.totals.restored > 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[#2a2a2a]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-[#3b82f6]" />
              <h2 className="text-xl font-semibold text-gray-100">Dry Run Preview</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-200 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-[#2a2a2a]">
          <div className="flex">
            <button
              onClick={() => setActiveTab('summary')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'summary'
                  ? 'text-[#3b82f6] border-b-2 border-[#3b82f6]'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Summary
            </button>
            <button
              onClick={() => setActiveTab('details')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'details'
                  ? 'text-[#3b82f6] border-b-2 border-[#3b82f6]'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Detailed Changes
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'summary' ? (
            <div className="space-y-6">
              {/* Overall Summary */}
              <div className="bg-[#141414] p-6 rounded-lg">
                <h3 className="text-lg font-medium text-gray-100 mb-4">Import Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <TrendingUp className="h-5 w-5 text-green-400" />
                    </div>
                    <p className="text-2xl font-bold text-green-400">{result.totals.created}</p>
                    <p className="text-xs text-gray-400">To Create</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <RefreshCw className="h-5 w-5 text-blue-400" />
                    </div>
                    <p className="text-2xl font-bold text-blue-400">{result.totals.updated}</p>
                    <p className="text-xs text-gray-400">To Update</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <TrendingDown className="h-5 w-5 text-orange-400" />
                    </div>
                    <p className="text-2xl font-bold text-orange-400">{result.totals.softDeleted}</p>
                    <p className="text-xs text-gray-400">To Remove</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <AlertTriangle className="h-5 w-5 text-red-400" />
                    </div>
                    <p className="text-2xl font-bold text-red-400">{result.totals.deleted}</p>
                    <p className="text-xs text-gray-400">To Delete</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <CheckCircle className="h-5 w-5 text-purple-400" />
                    </div>
                    <p className="text-2xl font-bold text-purple-400">{result.totals.restored}</p>
                    <p className="text-xs text-gray-400">To Restore</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <AlertCircle className="h-5 w-5 text-red-400" />
                    </div>
                    <p className="text-2xl font-bold text-red-400">{result.totals.errors}</p>
                    <p className="text-xs text-gray-400">Errors</p>
                  </div>
                </div>
              </div>

              {/* Store Results */}
              <div>
                <h3 className="text-lg font-medium text-gray-100 mb-3">Store Results</h3>
                <div className="space-y-3">
                  {Object.entries(result.stores).map(([storeCode, store]) => (
                    <div key={storeCode} className="bg-[#141414] p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Package className="h-4 w-4 text-[#3b82f6]" />
                          <span className="font-medium text-gray-100">{store.storeName}</span>
                          <span className="text-sm text-gray-400">({storeCode})</span>
                        </div>
                        {store.success ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <X className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                      <div className="mt-3 grid grid-cols-5 gap-2 text-sm">
                        <div className="text-center">
                          <span className="text-green-400 font-medium">{store.created}</span>
                          <span className="text-gray-500 block text-xs">new</span>
                        </div>
                        <div className="text-center">
                          <span className="text-blue-400 font-medium">{store.updated}</span>
                          <span className="text-gray-500 block text-xs">updated</span>
                        </div>
                        <div className="text-center">
                          <span className="text-orange-400 font-medium">{store.softDeleted}</span>
                          <span className="text-gray-500 block text-xs">removed</span>
                        </div>
                        <div className="text-center">
                          <span className="text-red-400 font-medium">{store.deleted}</span>
                          <span className="text-gray-500 block text-xs">deleted</span>
                        </div>
                        <div className="text-center">
                          <span className="text-purple-400 font-medium">{store.restored}</span>
                          <span className="text-gray-500 block text-xs">restored</span>
                        </div>
                      </div>
                      {store.errors.length > 0 && (
                        <div className="mt-3 p-2 bg-red-500/10 rounded text-xs text-red-400">
                          {store.errors.length} error{store.errors.length !== 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Warnings */}
              {result.totals.deleted > 0 && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-400">Permanent Deletions Warning</p>
                      <p className="text-sm text-red-400/80 mt-1">
                        {result.totals.deleted} vehicle{result.totals.deleted !== 1 ? 's' : ''} will be permanently deleted. 
                        These vehicles have been removed from the feed for over 30 days.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Dry Run Limitation Notice */}
              {result.totals.created === 0 && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-400">Dry Run Limitation</p>
                      <p className="text-sm text-blue-400/80 mt-1">
                        This dry run simulates potential updates and deletions based on current database state. 
                        New vehicle imports cannot be simulated without actual SFTP access. 
                        Run the actual import to see all changes including new vehicles.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Detailed Changes by Store */}
              {Object.entries(result.stores).map(([storeCode, store]) => {
                const isExpanded = expandedStore === storeCode;
                const hasDetails = store.details && (
                  (store.details.toCreate?.length || 0) > 0 ||
                  (store.details.toUpdate?.length || 0) > 0 ||
                  (store.details.toSoftDelete?.length || 0) > 0 ||
                  (store.details.toPermanentlyDelete?.length || 0) > 0 ||
                  (store.details.toRestore?.length || 0) > 0
                );

                return (
                  <div key={storeCode} className="bg-[#141414] rounded-lg overflow-hidden">
                    <button
                      onClick={() => setExpandedStore(isExpanded ? null : storeCode)}
                      className="w-full p-4 flex items-center justify-between hover:bg-[#1a1a1a] transition-colors"
                      disabled={!hasDetails}
                    >
                      <div className="flex items-center gap-3">
                        <Package className="h-4 w-4 text-[#3b82f6]" />
                        <span className="font-medium text-gray-100">{store.storeName}</span>
                        <span className="text-sm text-gray-400">({storeCode})</span>
                      </div>
                      {hasDetails && (
                        <div className="text-gray-400">
                          {isExpanded ? '−' : '+'}
                        </div>
                      )}
                    </button>

                    {isExpanded && store.details && (
                      <div className="border-t border-[#2a2a2a] p-4 space-y-4">
                        {/* Vehicles to Create */}
                        {store.details.toCreate && store.details.toCreate.length > 0 && (
                          <div>
                            <h5 className="text-sm font-medium text-green-400 mb-2">
                              New Vehicles ({store.details.toCreate.length})
                            </h5>
                            <div className="space-y-1 max-h-40 overflow-y-auto">
                              {store.details.toCreate.map((v, i) => (
                                <div key={i} className="text-xs text-gray-400">
                                  {v.stockNumber} - {v.year} {v.make} {v.model} (VIN: {v.vin})
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Vehicles to Update */}
                        {store.details.toUpdate && store.details.toUpdate.length > 0 && (
                          <div>
                            <h5 className="text-sm font-medium text-blue-400 mb-2">
                              Updates ({store.details.toUpdate.length})
                            </h5>
                            <div className="space-y-1 max-h-40 overflow-y-auto">
                              {store.details.toUpdate.map((v, i) => (
                                <div key={i} className="text-xs text-gray-400">
                                  {v.stockNumber} - {v.year} {v.make} {v.model}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Vehicles to Soft Delete */}
                        {store.details.toSoftDelete && store.details.toSoftDelete.length > 0 && (
                          <div>
                            <h5 className="text-sm font-medium text-orange-400 mb-2">
                              To Remove ({store.details.toSoftDelete.length})
                            </h5>
                            <div className="space-y-1 max-h-40 overflow-y-auto">
                              {store.details.toSoftDelete.map((v, i) => (
                                <div key={i} className="text-xs text-gray-400">
                                  {v.stockNumber} - {v.year} {v.make} {v.model}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Vehicles to Permanently Delete */}
                        {store.details.toPermanentlyDelete && store.details.toPermanentlyDelete.length > 0 && (
                          <div>
                            <h5 className="text-sm font-medium text-red-400 mb-2">
                              Permanent Deletions ({store.details.toPermanentlyDelete.length})
                            </h5>
                            <div className="space-y-1 max-h-40 overflow-y-auto">
                              {store.details.toPermanentlyDelete.map((v, i) => (
                                <div key={i} className="text-xs text-gray-400">
                                  {v.stockNumber} - {v.year} {v.make} {v.model} 
                                  <span className="text-red-400/60"> (removed {v.removedDate})</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Vehicles to Restore */}
                        {store.details.toRestore && store.details.toRestore.length > 0 && (
                          <div>
                            <h5 className="text-sm font-medium text-purple-400 mb-2">
                              To Restore ({store.details.toRestore.length})
                            </h5>
                            <div className="space-y-1 max-h-40 overflow-y-auto">
                              {store.details.toRestore.map((v, i) => (
                                <div key={i} className="text-xs text-gray-400">
                                  {v.stockNumber} - {v.year} {v.make} {v.model}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#2a2a2a]">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              {hasChanges ? (
                <span>Review the changes above before proceeding with the actual import.</span>
              ) : (
                <span>No changes detected. The database is already up to date.</span>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-[#2a2a2a] text-gray-300 rounded-lg hover:bg-[#3a3a3a] transition-all duration-200"
              >
                Cancel
              </button>
              {hasChanges && (
                <button
                  onClick={onProceed}
                  disabled={loading}
                  className="px-4 py-2 bg-[#3b82f6] text-white rounded-lg hover:bg-[#2563eb] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {loading ? 'Processing...' : 'Proceed with Import'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}