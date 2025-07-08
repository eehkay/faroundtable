'use client'

import { useEffect, useState } from 'react';
import { Clock, Check, Truck, Package } from 'lucide-react';

interface StatusFilterPillsProps {
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  locations?: string[];
}

interface StatusCount {
  status: string;
  count: number;
  label: string;
  icon: React.ReactNode;
  color: string;
}

export default function StatusFilterPills({ selectedStatus, onStatusChange, locations }: StatusFilterPillsProps) {
  const [statusCounts, setStatusCounts] = useState<StatusCount[]>([]);
  const [loading, setLoading] = useState(true);

  // Define visible statuses (excluding cancelled and rejected)
  const visibleStatuses = [
    { status: 'requested', label: 'Requested', icon: <Clock className="h-4 w-4" />, color: 'yellow' },
    { status: 'approved', label: 'Approved', icon: <Check className="h-4 w-4" />, color: 'blue' },
    { status: 'in-transit', label: 'In Transit', icon: <Truck className="h-4 w-4" />, color: 'purple' },
    { status: 'delivered', label: 'Delivered', icon: <Package className="h-4 w-4" />, color: 'green' },
  ];

  useEffect(() => {
    const fetchStatusCounts = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (locations && locations.length > 0) {
          params.set('locations', locations.join(','));
        }
        
        const response = await fetch(`/api/transfers/stats?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          
          const counts = visibleStatuses.map(status => ({
            ...status,
            count: data.statusCounts[status.status] || 0
          }));
          
          setStatusCounts(counts);
        }
      } catch (error) {
        console.error('Failed to fetch transfer stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatusCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locations]);

  const getColorClasses = (color: string, isActive: boolean) => {
    const colorMap: Record<string, { active: string; inactive: string }> = {
      yellow: {
        active: 'bg-yellow-600 text-white border-yellow-600',
        inactive: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30 hover:bg-yellow-500/20'
      },
      blue: {
        active: 'bg-blue-600 text-white border-blue-600',
        inactive: 'bg-blue-500/10 text-blue-600 border-blue-500/30 hover:bg-blue-500/20'
      },
      purple: {
        active: 'bg-purple-600 text-white border-purple-600',
        inactive: 'bg-purple-500/10 text-purple-600 border-purple-500/30 hover:bg-purple-500/20'
      },
      green: {
        active: 'bg-green-600 text-white border-green-600',
        inactive: 'bg-green-500/10 text-green-600 border-green-500/30 hover:bg-green-500/20'
      }
    };
    
    return colorMap[color]?.[isActive ? 'active' : 'inactive'] || '';
  };

  if (loading) {
    return (
      <div className="flex items-center gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-10 w-32 bg-[#2a2a2a] rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm font-medium text-gray-400 mr-2">Filter by status:</span>
      {statusCounts.map((statusItem) => {
        const isActive = selectedStatus === statusItem.status;
        
        return (
          <button
            key={statusItem.status}
            onClick={() => onStatusChange(isActive ? 'all' : statusItem.status)}
            className={`
              inline-flex items-center gap-2 px-4 py-2 rounded-lg border font-medium text-sm
              transition-all duration-200 ${getColorClasses(statusItem.color, isActive)}
            `}
          >
            {statusItem.icon}
            <span>{statusItem.label}</span>
            <span className={`
              inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-full text-xs font-bold
              ${isActive ? 'bg-white/20' : 'bg-[#2a2a2a]'}
              ${statusItem.status === 'delivered' ? 'invisible' : ''}
            `}>
              {statusItem.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}