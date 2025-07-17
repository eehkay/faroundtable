"use client"

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Download, 
  RefreshCw,
  Clock,
  Package,
  TrendingUp,
  TrendingDown,
  Activity
} from 'lucide-react';

interface ImportLog {
  id: string;
  timestamp: string;
  success: boolean;
  vehicles_imported: number;
  vehicles_updated: number;
  vehicles_deleted: number;
  errors: Array<{ vehicle: string | null; error: string }>;
  details: {
    duration_ms?: number;
    stores_processed?: Array<{
      storeCode: string;
      storeName: string;
      success: boolean;
      created: number;
      updated: number;
      deleted: number;
      errors: Array<{ vehicle: string | null; error: string }>;
    }>;
    status?: string;
    triggered_by?: string;
  };
}

interface ImportHistoryProps {
  limit?: number;
}

export default function ImportHistory({ limit = 10 }: ImportHistoryProps) {
  const [logs, setLogs] = useState<ImportLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [selectedLog, setSelectedLog] = useState<ImportLog | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/admin/imports?limit=${limit}&offset=${offset}`);
        if (response.ok) {
          const data = await response.json();
          setLogs(data.logs);
          setTotal(data.total);
        }
      } catch (error) {
        // Failed to fetch import logs
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [limit, offset]);

  const getStatusIcon = (log: ImportLog) => {
    if (log.details.status === 'triggered') {
      return <Clock className="h-5 w-5 text-yellow-500 animate-pulse" />;
    }
    if (log.success) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    if (log.details.status === 'critical_failure') {
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    }
    return <XCircle className="h-5 w-5 text-orange-500" />;
  };

  const getStatusText = (log: ImportLog) => {
    if (log.details.status === 'triggered') return 'Running';
    if (log.success) return 'Success';
    if (log.details.status === 'critical_failure') return 'Critical Failure';
    return 'Failed';
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return 'N/A';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${seconds}s`;
  };

  return (
    <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-[#2a2a2a]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-[#3b82f6]" />
            <h2 className="text-xl font-semibold text-gray-100">Import History</h2>
          </div>
          <button
            onClick={() => setOffset(0)}
            className="p-2 text-gray-400 hover:text-gray-200 hover:bg-[#2a2a2a] rounded-lg transition-all duration-200"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse bg-[#2a2a2a] h-20 rounded-lg"></div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No import history found</p>
            <p className="text-gray-500 text-sm mt-2">Import logs will appear here once imports are run</p>
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-4 bg-[#141414] border border-[#2a2a2a]/30 rounded-lg hover:bg-[#1a1a1a] transition-all duration-200 cursor-pointer"
                onClick={() => setSelectedLog(log)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {getStatusIcon(log)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-100">
                          {format(new Date(log.timestamp), 'MMM d, yyyy h:mm a')}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          log.success ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {getStatusText(log)}
                        </span>
                      </div>
                      
                      <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-400">
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3 text-green-400" />
                          <span>{log.vehicles_imported} imported</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <RefreshCw className="h-3 w-3 text-blue-400" />
                          <span>{log.vehicles_updated} updated</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <TrendingDown className="h-3 w-3 text-red-400" />
                          <span>{log.vehicles_deleted} deleted</span>
                        </div>
                        {log.errors.length > 0 && (
                          <div className="flex items-center gap-1">
                            <AlertCircle className="h-3 w-3 text-orange-400" />
                            <span>{log.errors.length} errors</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatDuration(log.details.duration_ms)}</span>
                        </div>
                      </div>

                      {log.details.triggered_by && (
                        <p className="mt-1 text-xs text-gray-500">
                          Triggered by: {log.details.triggered_by}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {total > limit && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-gray-400">
              Showing {offset + 1}-{Math.min(offset + limit, total)} of {total} imports
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setOffset(Math.max(0, offset - limit))}
                disabled={offset === 0}
                className="px-3 py-1 bg-[#2a2a2a] text-gray-300 rounded hover:bg-[#3a3a3a] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                Previous
              </button>
              <button
                onClick={() => setOffset(offset + limit)}
                disabled={offset + limit >= total}
                className="px-3 py-1 bg-[#2a2a2a] text-gray-300 rounded hover:bg-[#3a3a3a] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedLog(null)}>
          <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-[#2a2a2a]">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-100">Import Details</h3>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="text-gray-400 hover:text-gray-200"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
              {/* Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-[#141414] p-4 rounded-lg">
                  <p className="text-sm text-gray-400">Status</p>
                  <p className="text-lg font-medium text-gray-100">{getStatusText(selectedLog)}</p>
                </div>
                <div className="bg-[#141414] p-4 rounded-lg">
                  <p className="text-sm text-gray-400">Duration</p>
                  <p className="text-lg font-medium text-gray-100">{formatDuration(selectedLog.details.duration_ms)}</p>
                </div>
                <div className="bg-[#141414] p-4 rounded-lg">
                  <p className="text-sm text-gray-400">Total Processed</p>
                  <p className="text-lg font-medium text-gray-100">
                    {selectedLog.vehicles_imported + selectedLog.vehicles_updated + selectedLog.vehicles_deleted}
                  </p>
                </div>
                <div className="bg-[#141414] p-4 rounded-lg">
                  <p className="text-sm text-gray-400">Errors</p>
                  <p className="text-lg font-medium text-gray-100">{selectedLog.errors.length}</p>
                </div>
              </div>

              {/* Store Details */}
              {selectedLog.details.stores_processed && (
                <div className="mb-6">
                  <h4 className="text-lg font-medium text-gray-100 mb-3">Store Results</h4>
                  <div className="space-y-3">
                    {selectedLog.details.stores_processed.map(store => (
                      <div key={store.storeCode} className="bg-[#141414] p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-[#3b82f6]" />
                            <span className="font-medium text-gray-100">{store.storeName}</span>
                            <span className="text-sm text-gray-400">({store.storeCode})</span>
                          </div>
                          {store.success ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div className="flex items-center gap-1 text-gray-400">
                            <TrendingUp className="h-3 w-3 text-green-400" />
                            <span>{store.created} created</span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-400">
                            <RefreshCw className="h-3 w-3 text-blue-400" />
                            <span>{store.updated} updated</span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-400">
                            <TrendingDown className="h-3 w-3 text-red-400" />
                            <span>{store.deleted} deleted</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Errors */}
              {selectedLog.errors.length > 0 && (
                <div>
                  <h4 className="text-lg font-medium text-gray-100 mb-3">Errors</h4>
                  <div className="bg-[#141414] p-4 rounded-lg">
                    <pre className="text-sm text-red-400 whitespace-pre-wrap">
                      {selectedLog.errors.map((err, i) => 
                        `${err.vehicle || 'General'}: ${err.error}`
                      ).join('\n')}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}