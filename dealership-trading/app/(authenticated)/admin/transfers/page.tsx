'use client'

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import TransferList from "@/components/admin/transfers/TransferList";
import TransferFilters from "@/components/admin/transfers/TransferFilters";
import { isAdmin, isManager } from "@/lib/permissions";

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
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'all',
    location: 'all',
    dateRange: 'all'
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && !isAdmin(session.user.role) && !isManager(session.user.role)) {
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
            *,
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
              image
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
          return;
        }

        // Transform data to match existing format
        // Filter out transfers with missing required data
        const transformedData = data?.filter(transfer => 
          transfer.vehicle && 
          transfer.from_location && 
          transfer.to_location && 
          transfer.requested_by
        ).map(transfer => ({
          _id: transfer.id,
          status: transfer.status,
          reason: transfer.reason,
          customerWaiting: transfer.customer_waiting,
          priority: transfer.priority,
          expectedPickupDate: transfer.expected_pickup_date,
          requestedAt: transfer.created_at,
          approvedAt: transfer.approved_at,
          intransitAt: transfer.actual_pickup_date,
          deliveredAt: transfer.delivered_date,
          cancelledAt: transfer.cancelled_at,
          cancellationReason: transfer.cancellation_reason,
          vehicle: {
            _id: transfer.vehicle.id,
            vin: transfer.vehicle.vin,
            year: transfer.vehicle.year,
            make: transfer.vehicle.make,
            model: transfer.vehicle.model,
            trim: transfer.vehicle.trim,
            stockNumber: transfer.vehicle.stock_number,
            price: transfer.vehicle.price,
            mileage: transfer.vehicle.mileage,
            images: transfer.vehicle.image_urls || []
          },
          fromLocation: {
            _id: transfer.from_location.id,
            name: transfer.from_location.name,
            code: transfer.from_location.code
          },
          toLocation: {
            _id: transfer.to_location.id,
            name: transfer.to_location.name,
            code: transfer.to_location.code
          },
          requestedBy: {
            _id: transfer.requested_by.id,
            name: transfer.requested_by.name,
            email: transfer.requested_by.email,
            image: transfer.requested_by.image
          },
          approvedBy: transfer.approved_by ? {
            _id: transfer.approved_by.id,
            name: transfer.approved_by.name,
            email: transfer.approved_by.email
          } : undefined,
          intransitBy: undefined, // Not tracked in Supabase schema
          deliveredBy: undefined, // Not tracked in Supabase schema
          cancelledBy: transfer.cancelled_by ? {
            _id: transfer.cancelled_by.id,
            name: transfer.cancelled_by.name,
            email: transfer.cancelled_by.email
          } : undefined
        })) || [];
        
        setTransfers(transformedData);
      } catch (error) {
        console.error('Failed to fetch transfers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransfers();

    // Set up real-time listener
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
          fetchTransfers();
        }
      )
      .subscribe();

    return () => {
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

  if (!session || (!isAdmin(session.user.role) && !isManager(session.user.role))) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Transfer Management</h1>
        <p className="mt-2 text-gray-400">
          Manage vehicle transfer requests across all locations
        </p>
      </div>

      <TransferFilters 
        filters={filters}
        onFilterChange={setFilters}
      />

      <TransferList 
        transfers={transfers}
        userRole={session.user.role}
        currentUserId={session.user.id}
      />
    </div>
  );
}