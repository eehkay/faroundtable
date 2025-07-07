'use client';

import { useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

export default function AnalyticsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Analytics error:', error);
  }, [error]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-[#0a0a0a] border border-red-500/20 rounded-lg p-8">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <AlertCircle className="h-6 w-6 text-red-500" />
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-lg font-medium text-white">
              Analytics Error
            </h3>
            <p className="mt-2 text-sm text-gray-400">
              {error.message || 'An error occurred while loading analytics data.'}
            </p>
            <div className="mt-4">
              <button
                onClick={reset}
                className="text-sm font-medium text-[#3b82f6] hover:text-[#2563eb] transition-colors duration-200"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}