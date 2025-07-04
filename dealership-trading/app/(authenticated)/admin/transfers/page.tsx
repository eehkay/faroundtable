'use client'

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { client } from "@/lib/sanity";
import { groq } from "next-sanity";
import TransferList from "@/components/admin/transfers/TransferList";
import TransferFilters from "@/components/admin/transfers/TransferFilters";
import { isAdmin, isManager } from "@/lib/permissions";

export default function TransfersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [transfers, setTransfers] = useState([]);
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
        
        // Build query based on filters
        let query = groq`*[_type == "transfer"`;
        const queryFilters = [];
        
        if (filters.status !== 'all') {
          queryFilters.push(`status == "${filters.status}"`);
        }
        
        if (filters.location !== 'all') {
          queryFilters.push(`(fromLocation._ref == "${filters.location}" || toLocation._ref == "${filters.location}")`);
        }
        
        if (filters.dateRange !== 'all') {
          const now = new Date();
          let dateFilter = '';
          
          switch (filters.dateRange) {
            case 'today':
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              dateFilter = `requestedAt >= "${today.toISOString()}"`;
              break;
            case 'week':
              const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
              dateFilter = `requestedAt >= "${weekAgo.toISOString()}"`;
              break;
            case 'month':
              const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
              dateFilter = `requestedAt >= "${monthAgo.toISOString()}"`;
              break;
          }
          
          if (dateFilter) {
            queryFilters.push(dateFilter);
          }
        }
        
        if (queryFilters.length > 0) {
          query += ` && ${queryFilters.join(' && ')}`;
        }
        
        query += `] | order(requestedAt desc) {
          _id,
          status,
          reason,
          customerWaiting,
          priority,
          expectedPickupDate,
          requestedAt,
          approvedAt,
          intransitAt,
          deliveredAt,
          cancelledAt,
          cancellationReason,
          vehicle->{
            _id,
            vin,
            year,
            make,
            model,
            trim,
            stockNumber,
            price,
            mileage,
            images
          },
          fromLocation->{
            _id,
            name,
            code
          },
          toLocation->{
            _id,
            name,
            code
          },
          requestedBy->{
            _id,
            name,
            email,
            image
          },
          approvedBy->{
            _id,
            name,
            email
          },
          intransitBy->{
            _id,
            name,
            email
          },
          deliveredBy->{
            _id,
            name,
            email
          },
          cancelledBy->{
            _id,
            name,
            email
          }
        }`;
        
        const data = await client.fetch(query);
        setTransfers(data);
      } catch (error) {
        console.error('Failed to fetch transfers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransfers();

    // Set up real-time listener
    const subscription = client
      .listen(`*[_type == "transfer"]`)
      .subscribe(() => {
        fetchTransfers();
      });

    return () => subscription.unsubscribe();
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