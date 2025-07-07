"use client"

import { useState } from 'react';
import { Play, Loader2, AlertCircle, Settings, CheckCircle } from 'lucide-react';

interface ImportTriggerProps {
  onImportTriggered?: () => void;
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

  const triggerImport = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/admin/imports/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stores, enrichment, dryRun })
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
                <input
                  type="text"
                  value={stores}
                  onChange={(e) => setStores(e.target.value)}
                  placeholder="all or comma-separated codes (e.g., MP1568,MP22171)"
                  className="w-full px-3 py-2 bg-[#141414] border border-[#2a2a2a] rounded-lg text-gray-100 placeholder-gray-400 focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] focus:outline-none"
                  disabled={loading}
                />
                <p className="mt-1 text-xs text-gray-400">
                  Use "all" to import all stores or specify store codes
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
    </>
  );
}