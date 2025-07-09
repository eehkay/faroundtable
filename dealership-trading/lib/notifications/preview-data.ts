import type { SupabaseClient } from '@supabase/supabase-js';
import type { TemplatePreviewData } from '@/types/notifications';
import { format } from 'date-fns';

interface PreviewDataOptions {
  useRealData: boolean;
  vehicleId?: string;
  transferId?: string;
  userId?: string;
}

/**
 * Get preview data for template processing
 * Either uses real data from database or generates sample data
 */
export async function getPreviewData(
  supabase: SupabaseClient,
  options: PreviewDataOptions
): Promise<TemplatePreviewData> {
  const { useRealData, vehicleId, transferId, userId } = options;

  console.log('[Preview Data] getPreviewData called with:', { useRealData, vehicleId, transferId, userId });

  if (useRealData && (vehicleId || transferId)) {
    return getRealPreviewData(supabase, { vehicleId, transferId, userId });
  }

  return getSamplePreviewData();
}

/**
 * Get real data from the database for preview
 */
async function getRealPreviewData(
  supabase: SupabaseClient,
  { vehicleId, transferId, userId }: { vehicleId?: string; transferId?: string; userId?: string }
): Promise<TemplatePreviewData> {
  console.log('[Preview Data] getRealPreviewData started with:', { vehicleId, transferId, userId });
  
  const data: TemplatePreviewData = {
    system: {
      date: format(new Date(), 'MMMM d, yyyy'),
      time: format(new Date(), 'h:mm a')
    },
    link: {
      view_transfer: `${process.env.NEXTAUTH_URL}/transfers/${transferId || 'preview'}`,
      approve_transfer: `${process.env.NEXTAUTH_URL}/api/transfer/${transferId || 'preview'}/approve`,
      dashboard: `${process.env.NEXTAUTH_URL}/dashboard`,
      view_short: `${process.env.NEXTAUTH_URL}/t/${transferId || 'preview'}`,
      approve_short: `${process.env.NEXTAUTH_URL}/a/${transferId || 'preview'}`
    }
  };

  // Fetch transfer data if transferId provided
  if (transferId) {
    console.log('[Preview Data] Fetching transfer with ID:', transferId);
    
    const { data: transfer, error: transferError } = await supabase
      .from('transfers')
      .select(`
        *,
        vehicle:vehicles!transfers_vehicle_id_fkey(*),
        from_location:dealership_locations!from_location_id(*),
        to_location:dealership_locations!to_location_id(*),
        requested_by:users!requested_by_id(*),
        approved_by:users!approved_by_id(*)
      `)
      .eq('id', transferId)
      .single();

    if (transferError) {
      console.error('[Preview Data] Error fetching transfer:', transferError);
    }

    if (transfer) {
      // Debug log to check what we're getting
      console.log('[Preview Data Debug] Transfer data received:', {
        transferId: transfer.id,
        hasFromLocation: !!transfer.from_location,
        fromLocationName: transfer.from_location?.name,
        hasToLocation: !!transfer.to_location,
        toLocationName: transfer.to_location?.name,
        hasRequestedBy: !!transfer.requested_by,
        requestedByName: transfer.requested_by?.name,
        requestedByEmail: transfer.requested_by?.email,
        rawTransfer: JSON.stringify(transfer, null, 2)
      });
      
      data.transfer = {
        from_location: transfer.from_location ? { name: transfer.from_location.name } : { name: 'Unknown' },
        to_location: transfer.to_location ? { name: transfer.to_location.name } : { name: 'Unknown' },
        requested_by: transfer.requested_by ? {
          name: transfer.requested_by.name || transfer.requested_by.email || 'Unknown',
          email: transfer.requested_by.email || ''
        } : {
          name: 'Unknown',
          email: ''
        },
        approved_by: transfer.approved_by ? {
          name: transfer.approved_by.name || transfer.approved_by.email
        } : undefined,
        status: transfer.status || 'unknown',
        priority: transfer.priority || 'normal',
        created_at: transfer.created_at ? format(new Date(transfer.created_at), 'MMM d, yyyy') : 'Unknown date',
        notes: transfer.transfer_notes || '',
        cancellation_reason: transfer.cancellation_reason || ''
      };

      // Use vehicle from transfer if available
      if (transfer.vehicle) {
        vehicleId = transfer.vehicle.id;
      }
    }
  }

  // Fetch vehicle data if vehicleId provided
  if (vehicleId) {
    console.log('[Preview Data] Fetching vehicle with ID:', vehicleId);
    
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select(`
        *,
        location:dealership_locations!location_id(*)
      `)
      .eq('id', vehicleId)
      .single();

    if (vehicleError) {
      console.error('[Preview Data] Error fetching vehicle:', vehicleError);
    }

    if (vehicle) {
      data.vehicle = {
        year: vehicle.year,
        make: vehicle.make,
        model: vehicle.model,
        vin: vehicle.vin,
        stock_number: vehicle.stock_number,
        price: vehicle.price ? `$${vehicle.price.toLocaleString()}` : 'N/A',
        mileage: vehicle.mileage ? vehicle.mileage.toLocaleString() : 'N/A',
        color: vehicle.color,
        location: vehicle.location ? { name: vehicle.location.name } : undefined,
        image_link1: vehicle.image_urls?.[0] || undefined,
        image_link2: vehicle.image_urls?.[1] || undefined,
        image_link3: vehicle.image_urls?.[2] || undefined
      };
    }
  }

  // Fetch user data if userId provided
  if (userId) {
    const { data: user } = await supabase
      .from('users')
      .select(`
        *,
        location:dealership_locations!location_id(*)
      `)
      .eq('id', userId)
      .single();

    if (user) {
      data.user = {
        name: user.name || user.email,
        email: user.email,
        location: user.location ? { name: user.location.name } : undefined,
        role: user.role
      };
    }
  }

  // Add system data
  data.system = {
    date: format(new Date(), 'MMMM d, yyyy'),
    time: format(new Date(), 'h:mm a')
  };

  // Add links
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  data.link = {
    dashboard: `${baseUrl}/dashboard`,
    view_transfer: transferId ? `${baseUrl}/transfers/${transferId}` : '#',
    approve_transfer: transferId ? `${baseUrl}/transfers/${transferId}?action=approve` : '#',
    view_short: transferId ? `${baseUrl}/t/${transferId}` : '#',
    approve_short: transferId ? `${baseUrl}/a/${transferId}` : '#'
  };

  return data;
}

/**
 * Generate sample preview data for testing
 */
function getSamplePreviewData(): TemplatePreviewData {
  return {
    vehicle: {
      year: '2024',
      make: 'Toyota',
      model: 'Camry',
      vin: '1HGCM82633A123456',
      stock_number: 'STK-12345',
      price: '$28,999',
      mileage: '15,234',
      color: 'Silver Metallic',
      location: {
        name: 'Store 1'
      },
      image_link1: 'https://via.placeholder.com/800x600/3b82f6/ffffff?text=2024+Toyota+Camry',
      image_link2: 'https://via.placeholder.com/800x600/2563eb/ffffff?text=Interior+View',
      image_link3: 'https://via.placeholder.com/800x600/1d4ed8/ffffff?text=Engine+View'
    },
    transfer: {
      from_location: {
        name: 'Store 1'
      },
      to_location: {
        name: 'Store 3'
      },
      requested_by: {
        name: 'John Smith',
        email: 'john.smith@formanautomotive.com'
      },
      approved_by: {
        name: 'Jane Doe'
      },
      status: 'approved',
      priority: 'high',
      created_at: format(new Date(), 'MMM d, yyyy'),
      notes: 'Customer waiting - urgent delivery needed'
    },
    user: {
      name: 'Mike Johnson',
      email: 'mike.johnson@formanautomotive.com',
      location: {
        name: 'Store 2'
      },
      role: 'manager'
    },
    system: {
      date: format(new Date(), 'MMMM d, yyyy'),
      time: format(new Date(), 'h:mm a')
    },
    link: {
      view_transfer: `${process.env.NEXTAUTH_URL || 'https://roundtable.app'}/transfers/sample-123`,
      approve_transfer: `${process.env.NEXTAUTH_URL || 'https://roundtable.app'}/api/transfer/sample-123/approve`,
      dashboard: `${process.env.NEXTAUTH_URL || 'https://roundtable.app'}/dashboard`,
      view_short: `${process.env.NEXTAUTH_URL || 'https://roundtable.app'}/t/sample-123`,
      approve_short: `${process.env.NEXTAUTH_URL || 'https://roundtable.app'}/a/sample-123`
    }
  };
}