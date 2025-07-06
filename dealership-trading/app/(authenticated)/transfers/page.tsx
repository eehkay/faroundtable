'use client'

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import TransferList from "@/components/transfers/TransferList";
import TransferFilters from "@/components/transfers/TransferFilters";
import { canViewTransfers, isAdmin, isManager, canUpdateTransferStatus } from "@/lib/permissions";

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
  
  // Initialize filters
  const [filters, setFilters] = useState({
    status: 'all',
    location: 'all',
    dateRange: 'all'
  });

  // Update filters when URL parameters change
  useEffect(() => {
    const newFilters = {
      status: searchParams.get('status') || 'all',
      location: searchParams.get('location') || 'all',
      dateRange: searchParams.get('dateRange') || 'all'
    };
    setFilters(newFilters);
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
          `)
          .order('created_at', { ascending: false });
        
        // For sales role, only show their own requests or transfers involving their location
        if (session.user.role === 'sales' && session.user.location?.id) {
          query = query.or(
            `requested_by_id.eq.${session.user.id},from_location_id.eq.${session.user.location.id},to_location_id.eq.${session.user.location.id}`
          );
        }
        
        // Apply filters
        if (filters.status !== 'all') {
          query = query.eq('status', filters.status);
        }
        
        if (filters.location !== 'all') {
          query = query.or(`from_location_id.eq.${filters.location},to_location_id.eq.${filters.location}`);
        }
        
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
        
        const { data, error } = await query;

        if (error) {
          console.error('Failed to fetch transfers:', error);
          setTransfers([]);
          return;
        }

        if (!data) {
          setTransfers([]);
          return;
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
  }, [session, filters]);

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
    // Update URL parameters
    const params = new URLSearchParams();
    if (newFilters.status !== 'all') params.set('status', newFilters.status);
    if (newFilters.location !== 'all') params.set('location', newFilters.location);
    if (newFilters.dateRange !== 'all') params.set('dateRange', newFilters.dateRange);
    
    const queryString = params.toString();
    router.replace(`/transfers${queryString ? `?${queryString}` : ''}`, { scroll: false });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">{getPageTitle()}</h1>
        <p className="mt-2 text-gray-400">
          {getPageDescription()}
        </p>
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
        onTransferUpdate={handleTransferUpdate}
      />
    </div>
  );
}