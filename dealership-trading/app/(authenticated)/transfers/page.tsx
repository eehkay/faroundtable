'use client'

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import TransferList from "@/components/transfers/TransferList";
import TransferFilters from "@/components/transfers/TransferFilters";
import { canViewTransfers, isAdmin, isManager, canUpdateTransferStatus } from "@/lib/permissions";
import { useLocalStorage } from "@/lib/hooks/useLocalStorage";
import { ChevronLeft, ChevronRight, List, LayoutGrid } from 'lucide-react';

interface Transfer {
  _id: string;
  status: string;
  reason?: string;
  customerWaiting: boolean;
  priority: boolean;
  expectedPickupDate?: string;
  requestedAt: string;
  approvedAt?: string;
  intransitAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  vehicle: {
    _id: string;
    vin: string;
    year: number;
    make: string;
    model: string;
    trim?: string;
    stockNumber?: string;
    price: number;
    mileage?: number;
    images?: string[];
  };
  fromLocation: {
    _id: string;
    name: string;
    code: string;
  };
  toLocation: {
    _id: string;
    name: string;
    code: string;
  };
  requestedBy: {
    _id: string;
    name: string;
    email: string;
    image?: string;
  };
  approvedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  intransitBy?: {
    _id: string;
    name: string;
    email: string;
  };
  deliveredBy?: {
    _id: string;
    name: string;
    email: string;
  };
  cancelledBy?: {
    _id: string;
    name: string;
    email: string;
  };
}

export default function TransfersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [compactMode, setCompactMode] = useLocalStorage('transfers-compact-mode', false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  
  // Initialize filters
  const [filters, setFilters] = useState({
    status: 'all',
    location: 'all',
    locations: [] as string[],
    dateRange: 'all'
  });

  // Update filters when URL parameters change
  useEffect(() => {
    const locationsParam = searchParams.get('locations');
    const newFilters = {
      status: searchParams.get('status') || 'all',
      location: searchParams.get('location') || 'all',
      locations: locationsParam ? locationsParam.split(',').filter(Boolean) : [],
      dateRange: searchParams.get('dateRange') || 'all'
    };
    setFilters(newFilters);
    
    // Reset to page 1 when filters change
    setCurrentPage(1);
  }, [searchParams]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && !canViewTransfers(session.user.role)) {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (!session) return;

    const fetchTransfers = async () => {
      try {
        setLoading(true);
        
        // Start building the query
        let query = supabase
          .from('transfers')
          .select(`
            id,
            status,
            reason,
            transfer_notes,
            customer_waiting,
            priority,
            expected_pickup_date,
            created_at,
            approved_at,
            actual_pickup_date,
            delivered_date,
            cancelled_at,
            rejection_reason,
            vehicle:vehicle_id(
              id,
              vin,
              year,
              make,
              model,
              trim,
              stock_number,
              price,
              mileage,
              image_urls
            ),
            from_location:from_location_id(
              id,
              name,
              code
            ),
            to_location:to_location_id(
              id,
              name,
              code
            ),
            requested_by:requested_by_id(
              id,
              name,
              email,
              image_url
            ),
            approved_by:approved_by_id(
              id,
              name,
              email
            ),
            cancelled_by:cancelled_by_id(
              id,
              name,
              email
            )
          `);
        
        // Apply filters BEFORE pagination
        
        // For sales role, only show their own requests or transfers involving their location
        if (session.user.role === 'sales' && session.user.location?.id) {
          query = query.or(
            `requested_by_id.eq.${session.user.id},from_location_id.eq.${session.user.location.id},to_location_id.eq.${session.user.location.id}`
          );
        }
        
        // Apply status filter
        if (filters.status !== 'all') {
          query = query.eq('status', filters.status);
        } else {
          // When showing "all", exclude delivered and cancelled transfers by default
          query = query.not('status', 'in', '("delivered","cancelled")');
        }
        
        // Handle multi-select locations
        if (filters.locations && filters.locations.length > 0) {
          console.log('Applying location filter for:', filters.locations);
          const locationConditions = filters.locations
            .map(id => `from_location_id.eq.${id},to_location_id.eq.${id}`)
            .join(',');
          console.log('Location condition string:', locationConditions);
          query = query.or(locationConditions);
        } else if (filters.location && filters.location !== 'all') {
          // Fallback to single location for backward compatibility
          console.log('Applying single location filter for:', filters.location);
          query = query.or(`from_location_id.eq.${filters.location},to_location_id.eq.${filters.location}`);
        }
        
        // Apply ordering and pagination AFTER filters
        query = query
          .order('created_at', { ascending: false })
          .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);
        
        if (filters.dateRange !== 'all') {
          const now = new Date();
          let dateFilter;
          
          switch (filters.dateRange) {
            case 'today':
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              dateFilter = today.toISOString();
              break;
            case 'week':
              const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
              dateFilter = weekAgo.toISOString();
              break;
            case 'month':
              const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
              dateFilter = monthAgo.toISOString();
              break;
          }
          
          if (dateFilter) {
            query = query.gte('created_at', dateFilter);
          }
        }
        
        const { data, error, count } = await query;
        
        if (count !== null) {
          setTotalCount(count);
        }

        if (error) {
          console.error('Failed to fetch transfers:', error);
          console.error('Query details:', {
            locationFilters: filters.locations,
            statusFilter: filters.status,
            error: error.message
          });
          setTransfers([]);
          return;
        }

        if (!data) {
          setTransfers([]);
          return;
        }

        // Debug: Log some sample transfers to see location data
        if (data.length > 0) {
          console.log('Sample transfer data:', {
            transferId: data[0].id,
            fromLocation: data[0].from_location,
            toLocation: data[0].to_location,
            appliedFilters: filters
          });
        }

        // Transform data to match existing format
        const transformedData = data.filter(transfer => 
          transfer.vehicle && 
          transfer.from_location && 
          transfer.to_location && 
          transfer.requested_by
        ).map((transfer: any) => {
          // TypeScript needs explicit type assertion after filtering
          // Handle case where nested relations might be arrays
          const vehicle = Array.isArray(transfer.vehicle) ? transfer.vehicle[0] : transfer.vehicle;
          const fromLocation = Array.isArray(transfer.from_location) ? transfer.from_location[0] : transfer.from_location;
          const toLocation = Array.isArray(transfer.to_location) ? transfer.to_location[0] : transfer.to_location;
          const requestedBy = Array.isArray(transfer.requested_by) ? transfer.requested_by[0] : transfer.requested_by;
          
          return {
          _id: transfer.id,
          status: transfer.status,
          reason: transfer.reason,
          customerWaiting: transfer.customer_waiting,
          priority: transfer.priority === 'high' || transfer.priority === 'urgent',
          expectedPickupDate: transfer.expected_pickup_date,
          requestedAt: transfer.created_at,
          approvedAt: transfer.approved_at,
          intransitAt: transfer.actual_pickup_date,
          deliveredAt: transfer.delivered_date,
          cancelledAt: transfer.cancelled_at,
          cancellationReason: transfer.rejection_reason,
          vehicle: {
            _id: vehicle.id,
            vin: vehicle.vin,
            year: vehicle.year,
            make: vehicle.make,
            model: vehicle.model,
            trim: vehicle.trim,
            stockNumber: vehicle.stock_number,
            price: vehicle.price,
            mileage: vehicle.mileage,
            images: vehicle.image_urls || []
          },
          fromLocation: {
            _id: fromLocation.id,
            name: fromLocation.name,
            code: fromLocation.code
          },
          toLocation: {
            _id: toLocation.id,
            name: toLocation.name,
            code: toLocation.code
          },
          requestedBy: {
            _id: requestedBy.id,
            name: requestedBy.name,
            email: requestedBy.email,
            image: requestedBy.image_url
          },
          approvedBy: transfer.approved_by ? {
            _id: transfer.approved_by.id,
            name: transfer.approved_by.name,
            email: transfer.approved_by.email
          } : undefined,
          intransitBy: undefined,
          deliveredBy: undefined,
          cancelledBy: transfer.cancelled_by ? {
            _id: transfer.cancelled_by.id,
            name: transfer.cancelled_by.name,
            email: transfer.cancelled_by.email
          } : undefined
          };
        });
        
        setTransfers(transformedData);
      } catch (error) {
        console.error('Failed to fetch transfers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransfers();

    // Set up real-time listener with debouncing
    let debounceTimeout: NodeJS.Timeout;
    const channel = supabase
      .channel('transfers-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transfers'
        },
        () => {
          // Debounce rapid successive updates
          clearTimeout(debounceTimeout);
          debounceTimeout = setTimeout(() => {
            fetchTransfers();
          }, 500);
        }
      )
      .subscribe();

    return () => {
      clearTimeout(debounceTimeout);
      supabase.removeChannel(channel);
    };
  }, [session, filters, currentPage, pageSize]);

  if (status === "loading" || loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-[#2a2a2a] rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-[#2a2a2a] rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-[#2a2a2a] rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!session || !canViewTransfers(session.user.role)) {
    return null;
  }

  const getPageTitle = () => {
    switch (session.user.role) {
      case 'transport':
        return 'Transport Management';
      case 'sales':
        return 'My Transfer Requests';
      default:
        return 'Transfer Management';
    }
  };

  const getPageDescription = () => {
    switch (session.user.role) {
      case 'transport':
        return 'Manage vehicle pickups and deliveries';
      case 'sales':
        return 'View and track your transfer requests';
      default:
        return 'Manage vehicle transfer requests across all locations';
    }
  };

  // Function to handle optimistic updates with rollback capability
  const handleTransferUpdate = (updatedTransfer: any) => {
    // Store original transfer for potential rollback
    const originalTransfer = transfers.find(t => t._id === updatedTransfer.id);
    
    // Apply optimistic update immediately
    setTransfers(prevTransfers => 
      prevTransfers.map(transfer => 
        transfer._id === updatedTransfer.id 
          ? { ...transfer, status: updatedTransfer.status }
          : transfer
      )
    );

    // Verify the update after a short delay to ensure consistency
    setTimeout(() => {
      // Re-fetch transfers to ensure we have the latest state
      // This helps catch any discrepancies between optimistic updates and actual server state
      const verifyUpdate = async () => {
        try {
          // Only verify if we still have the transfer in state
          const currentTransfer = transfers.find(t => t._id === updatedTransfer.id);
          if (currentTransfer && currentTransfer.status !== updatedTransfer.status) {
            // If status doesn't match, re-fetch all transfers
            window.location.reload();
          }
        } catch (error) {
          console.error('Failed to verify transfer update:', error);
        }
      };
      verifyUpdate();
    }, 2000);
  };

  // Update URL when filters change
  const handleFilterChange = (newFilters: typeof filters) => {
    // Update local state immediately
    setFilters(newFilters);
    
    // Update URL parameters
    const params = new URLSearchParams();
    if (newFilters.status !== 'all') params.set('status', newFilters.status);
    if (newFilters.location !== 'all') params.set('location', newFilters.location);
    if (newFilters.locations && newFilters.locations.length > 0) params.set('locations', newFilters.locations.join(','));
    if (newFilters.dateRange !== 'all') params.set('dateRange', newFilters.dateRange);
    
    const queryString = params.toString();
    router.replace(`/transfers${queryString ? `?${queryString}` : ''}`, { scroll: false });
  };

  const totalPages = Math.ceil(totalCount / pageSize);
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">{getPageTitle()}</h1>
          <p className="mt-2 text-gray-400">
            {getPageDescription()}
          </p>
        </div>
        <button
          onClick={() => setCompactMode(!compactMode)}
          className="flex items-center gap-2 px-4 py-2 bg-[#2a2a2a] text-white rounded-lg hover:bg-[#333333] transition-colors"
          title={compactMode ? 'Switch to detailed view' : 'Switch to compact view'}
        >
          {compactMode ? <LayoutGrid className="h-4 w-4" /> : <List className="h-4 w-4" />}
          {compactMode ? 'Detailed' : 'Compact'}
        </button>
      </div>

      {/* Only show filters for roles that can see all transfers */}
      {(isAdmin(session.user.role) || isManager(session.user.role) || canUpdateTransferStatus(session.user.role)) && (
        <TransferFilters 
          filters={filters}
          onFilterChange={handleFilterChange}
        />
      )}

      <TransferList 
        transfers={transfers}
        userRole={session.user.role}
        currentUserId={session.user.id}
        userLocationId={session.user.location?.id}
        onTransferUpdate={handleTransferUpdate}
        compactMode={compactMode}
      />
      
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-400">
                Showing {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, totalCount)} of {totalCount} transfers
              </span>
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="bg-[#2a2a2a] border border-[#333333] text-white rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="10">10 per page</option>
                <option value="20">20 per page</option>
                <option value="50">50 per page</option>
                <option value="100">100 per page</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded bg-[#2a2a2a] text-white hover:bg-[#333333] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={i}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                        pageNum === currentPage
                          ? 'bg-blue-600 text-white'
                          : 'bg-[#2a2a2a] text-gray-300 hover:bg-[#333333]'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded bg-[#2a2a2a] text-white hover:bg-[#333333] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}