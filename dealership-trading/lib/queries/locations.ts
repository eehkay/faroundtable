import { supabaseAdmin } from '@/lib/supabase-server';

export interface DealershipLocation {
  id: string;
  name: string;
  code: string;
  csv_file_name?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export async function getDealershipLocation(locationId: string): Promise<DealershipLocation | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('dealership_locations')
      .select('*')
      .eq('id', locationId)
      .single();

    if (error || !data) {
      return null;
    }

    // Add default coordinates based on location name if not in database
    const defaultCoordinates: Record<string, { lat: number; lng: number }> = {
      'Forman Ford': { lat: 33.0152, lng: -117.0964 }, // Example coordinates
      'Forman Mazda': { lat: 33.0172, lng: -117.0984 },
      'Forman Hyundai': { lat: 33.0192, lng: -117.1004 },
      'Forman Honda': { lat: 33.0212, lng: -117.1024 },
      'Forman Auto Outlet': { lat: 33.0232, lng: -117.1044 },
    };

    return {
      ...data,
      coordinates: defaultCoordinates[data.name] || { lat: 33.0, lng: -117.0 },
    };
  } catch (error) {
    return null;
  }
}

export async function getAllDealershipLocations(): Promise<DealershipLocation[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('dealership_locations')
      .select('*')
      .order('name');

    if (error || !data) {
      return [];
    }

    // Add default coordinates
    const defaultCoordinates: Record<string, { lat: number; lng: number }> = {
      'Forman Ford': { lat: 33.0152, lng: -117.0964 },
      'Forman Mazda': { lat: 33.0172, lng: -117.0984 },
      'Forman Hyundai': { lat: 33.0192, lng: -117.1004 },
      'Forman Honda': { lat: 33.0212, lng: -117.1024 },
      'Forman Auto Outlet': { lat: 33.0232, lng: -117.1044 },
    };

    return data.map(location => ({
      ...location,
      coordinates: defaultCoordinates[location.name] || { lat: 33.0, lng: -117.0 },
    }));
  } catch (error) {
    return [];
  }
}