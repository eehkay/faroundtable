'use client'

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import VehicleGrid from "@/components/inventory/VehicleGrid";
import VehicleFilters from "@/components/inventory/VehicleFilters";
import VehicleSearch from "@/components/inventory/VehicleSearch";
import { supabase } from "@/lib/supabase-client";
import { LoadingCard } from "@/components/Loading";
import type { DealershipLocation } from "@/types/vehicle";
import { isCorporateUser, getCorporateDisplayText, CORPORATE_LOCATION_CODE } from "@/lib/utils/corporate";

export default function InventoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [locations, setLocations] = useState<DealershipLocation[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(true);
  
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    // Fetch locations for filters
    const fetchLocations = async () => {
      try {
        const { data, error } = await supabase
          .from('dealership_locations')
          .select('*')
          .eq('active', true)
          .neq('code', CORPORATE_LOCATION_CODE) // Exclude corporate location from filters
          .order('name', { ascending: true });
        
        if (error) throw error;
        
        // Transform to match DealershipLocation type
        const transformedLocations: DealershipLocation[] = (data || []).map(loc => ({
          _id: loc.id,
          _type: 'dealershipLocation' as const,
          name: loc.name,
          code: loc.code,
          address: loc.address,
          city: loc.city,
          state: loc.state,
          zip: loc.zip,
          phone: loc.phone,
          csvFileName: loc.csv_file_name,
          active: loc.active
        }));
        
        setLocations(transformedLocations);
      } catch (error) {
        console.error('Failed to fetch locations:', error);
      } finally {
        setLocationsLoading(false);
      }
    };

    fetchLocations();
  }, []);

  if (status === "loading") {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <LoadingCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Vehicle Inventory</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          {isCorporateUser(session.user) 
            ? getCorporateDisplayText().locationDescription
            : 'Browse and manage vehicles across all dealership locations'}
        </p>
      </div>

      {/* Search Bar */}
      <VehicleSearch />

      {/* Filters */}
      {!locationsLoading && <VehicleFilters locations={locations} />}

      {/* Vehicle Grid */}
      <VehicleGrid 
        userLocation={session.user.location ? {
          _id: session.user.location.id,
          _type: 'dealershipLocation' as const,
          name: session.user.location.name,
          code: session.user.location.code,
          active: true
        } : undefined} 
        userRole={session.user.role}
      />
    </div>
  );
}