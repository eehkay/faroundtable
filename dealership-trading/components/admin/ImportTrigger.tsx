"use client"

import { useState, useEffect } from 'react';
import { Play, Loader2, AlertCircle, Settings, CheckCircle, ChevronDown } from 'lucide-react';
import DryRunPreview from './DryRunPreview';

interface ImportTriggerProps {
  onImportTriggered?: () => void;
}

interface Dealership {
  id: string;
  name: string;
  code: string;
  csv_file_name: string | null;
}

export default function ImportTrigger({ onImportTriggered }: ImportTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Import options
  const [stores, setStores] = useState('all');
  const [enrichment, setEnrichment] = useState(true);
  const [dryRun, setDryRun] = useState(false);
  
  // Store selector
  const [dealerships, setDealerships] = useState<Dealership[]>([]);
  const [selectedStores, setSelectedStores] = useState<string[]>([]);
  const [showStoreDropdown, setShowStoreDropdown] = useState(false);
  
  // Dry run preview
  const [dryRunResult, setDryRunResult] = useState<any | null>(null);
  const [showDryRunPreview, setShowDryRunPreview] = useState(false);

  // Fetch dealerships on mount
  useEffect(() => {
    if (isOpen) {
      fetchDealerships();
    }
  }, [isOpen]);

  const fetchDealerships = async () => {
    try {
      const response = await fetch('/api/admin/dealerships/active');
      if (response.ok) {
        const data = await response.json();
        setDealerships(data);
      }
    } catch (err) {
      console.error('Failed to fetch dealerships:', err);
    }
  };

  const handleStoreSelection = (storeCode: string) => {
    if (storeCode === 'all') {
      setSelectedStores([]);
      setStores('all');
    } else {
      const newSelection = selectedStores.includes(storeCode)
        ? selectedStores.filter(s => s !== storeCode)
        : [...selectedStores, storeCode];
      
      setSelectedStores(newSelection);
      setStores(newSelection.length === 0 ? 'all' : newSelection.join(','));
    }
  };

  const triggerImport = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // If dry run, fetch preview first
      if (dryRun) {
        const response = await fetch('/api/admin/imports/dry-run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stores, enrichment })
        });

        const data = await response.json();

        if (response.ok) {
          setDryRunResult(data);
          setShowDryRunPreview(true);
          setLoading(false);
          return;
        } else {
          setError(data.error || 'Failed to run dry run');
          setLoading(false);
          return;
        }
      }

      // Normal import
      const response = await fetch('/api/admin/imports/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stores, enrichment, dryRun: false })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          setIsOpen(false);
          setSuccess(false);
          onImportTriggered?.();
        }, 2000);
      } else {
        setError(data.error || 'Failed to trigger import');
      }
    } catch (err) {
      setError('Network error - unable to trigger import');
    } finally {
      setLoading(false);
    }
  };

  const handleProceedWithImport = async () => {
    setShowDryRunPreview(false);
    setDryRun(false);
    await triggerImport();
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-[#3b82f6] text-white rounded-lg hover:bg-[#2563eb] transition-all duration-200"
      >
        <Play className="h-4 w-4" />
        Trigger Import
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => !loading && setIsOpen(false)}>
          <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-[#2a2a2a]">
              <div className="flex items-center gap-3">
                <Settings className="h-6 w-6 text-[#3b82f6]" />
                <h3 className="text-xl font-semibold text-gray-100">Trigger Vehicle Import</h3>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Store Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Stores to Import
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowStoreDropdown(!showStoreDropdown)}
                    disabled={loading}
                    className="w-full px-3 py-2 bg-[#141414] border border-[#2a2a2a] rounded-lg text-gray-100 text-left focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between"
                  >
                    <span>
                      {stores === 'all' 
                        ? 'All Stores' 
                        : selectedStores.length === 0 
                          ? 'Select stores...'
                          : `${selectedStores.length} store${selectedStores.length > 1 ? 's' : ''} selected`
                      }
                    </span>
                    <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showStoreDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showStoreDropdown && (
                    <div className="absolute z-10 mt-1 w-full bg-[#141414] border border-[#2a2a2a] rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      <div
                        className="px-3 py-2 hover:bg-[#1f1f1f] cursor-pointer text-sm text-gray-100 border-b border-[#2a2a2a]"
                        onClick={() => {
                          handleStoreSelection('all');
                          setShowStoreDropdown(false);
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded border ${stores === 'all' ? 'bg-[#3b82f6] border-[#3b82f6]' : 'border-[#2a2a2a]'}`}>
                            {stores === 'all' && (
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <span className="font-medium">All Stores</span>
                        </div>
                      </div>
                      
                      {dealerships.map((dealership) => (
                        <div
                          key={dealership.id}
                          className="px-3 py-2 hover:bg-[#1f1f1f] cursor-pointer text-sm text-gray-100"
                          onClick={() => handleStoreSelection(dealership.code)}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded border ${selectedStores.includes(dealership.code) ? 'bg-[#3b82f6] border-[#3b82f6]' : 'border-[#2a2a2a]'}`}>
                              {selectedStores.includes(dealership.code) && (
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium">{dealership.name}</div>
                              <div className="text-xs text-gray-400">{dealership.code}</div>
                            </div>
                            {!dealership.csv_file_name && (
                              <span className="text-xs text-orange-400">No CSV configured</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  Select specific stores or choose &quot;All Stores&quot; to import everything
                </p>
              </div>

              {/* Options */}
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enrichment}
                    onChange={(e) => setEnrichment(e.target.checked)}
                    disabled={loading}
                    className="w-4 h-4 bg-[#141414] border-[#2a2a2a] rounded text-[#3b82f6] focus:ring-[#3b82f6]"
                  />
                  <div>
                    <span className="text-sm text-gray-100">Enable Data Enrichment</span>
                    <p className="text-xs text-gray-400">Use analytics APIs to enrich vehicle data</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dryRun}
                    onChange={(e) => setDryRun(e.target.checked)}
                    disabled={loading}
                    className="w-4 h-4 bg-[#141414] border-[#2a2a2a] rounded text-[#3b82f6] focus:ring-[#3b82f6]"
                  />
                  <div>
                    <span className="text-sm text-gray-100">Dry Run</span>
                    <p className="text-xs text-gray-400">Test import without making database changes</p>
                  </div>
                </label>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-400 mt-0.5" />
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <p className="text-sm text-green-400">Import triggered successfully!</p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-[#2a2a2a] flex gap-3">
              <button
                onClick={() => setIsOpen(false)}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-[#2a2a2a] text-gray-300 rounded-lg hover:bg-[#3a3a3a] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={triggerImport}
                disabled={loading || success}
                className="flex-1 px-4 py-2 bg-[#3b82f6] text-white rounded-lg hover:bg-[#2563eb] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Triggering...
                  </>
                ) : success ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Triggered!
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Trigger Import
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dry Run Preview Modal */}
      {showDryRunPreview && dryRunResult && (
        <DryRunPreview
          result={dryRunResult}
          onClose={() => {
            setShowDryRunPreview(false);
            setDryRunResult(null);
          }}
          onProceed={handleProceedWithImport}
          loading={loading}
        />
      )}
    </>
  );
}