import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { canManageDealerships } from '@/lib/permissions';
import { createClient } from '@supabase/supabase-js';
import SftpClient from 'ssh2-sftp-client';
const csv = require('csv-parser');
import { Readable } from 'stream';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface DryRunOptions {
  stores?: string;
  enrichment?: boolean;
}

interface VehicleData {
  vin: string;
  stockNumber: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  color?: string;
  status: string;
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!canManageDealerships(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const options: DryRunOptions = await request.json();
    
    // Fetch active dealerships
    const { data: dealerships, error: dealershipError } = await supabase
      .from('dealership_locations')
      .select('*')
      .eq('active', true);

    if (dealershipError) {
      throw new Error(`Failed to fetch dealerships: ${dealershipError.message}`);
    }

    // Filter dealerships based on stores option
    let targetDealerships = dealerships || [];
    if (options.stores && options.stores !== 'all') {
      const storeCodes = options.stores.split(',').map(s => s.trim());
      targetDealerships = targetDealerships.filter(d => storeCodes.includes(d.code));
    }

    // Initialize SFTP client
    const sftp = new SftpClient();
    const sftpConfig = {
      host: process.env.SFTP_HOST!,
      username: process.env.SFTP_USERNAME!,
      password: process.env.SFTP_PASSWORD!,
      port: parseInt(process.env.SFTP_PORT || '22'),
    };

    await sftp.connect(sftpConfig);

    const result = {
      success: true,
      stores: {} as Record<string, any>,
      totals: {
        created: 0,
        updated: 0,
        deleted: 0,
        softDeleted: 0,
        restored: 0,
        errors: 0
      }
    };

    // Process each dealership
    for (const dealership of targetDealerships) {
      const storeResult = {
        storeCode: dealership.code,
        storeName: dealership.name,
        success: true,
        created: 0,
        updated: 0,
        deleted: 0,
        softDeleted: 0,
        restored: 0,
        errors: [] as Array<{ vehicle: string | null; error: string }>,
        details: {
          toCreate: [] as any[],
          toUpdate: [] as any[],
          toSoftDelete: [] as any[],
          toPermanentlyDelete: [] as any[],
          toRestore: [] as any[]
        }
      };

      try {
        if (!dealership.csv_file_name) {
          throw new Error('No CSV filename configured');
        }

        const csvPath = `${process.env.SFTP_PATH}/${dealership.csv_file_name}`;
        const csvData = await sftp.get(csvPath);
        
        // Parse CSV
        const vehicles: VehicleData[] = [];
        await new Promise((resolve, reject) => {
          const stream = Readable.from(csvData.toString());
          stream
            .pipe(csv({
              mapHeaders: ({ header }: { header: string }) => {
                const headerMap: Record<string, string> = {
                  'VIN': 'vin',
                  'Stock #': 'stockNumber',
                  'Make': 'make',
                  'Model': 'model',
                  'Year': 'year',
                  'Selling Price': 'price',
                  'Odometer': 'mileage',
                  'Ext Color': 'color'
                };
                return headerMap[header] || header.toLowerCase().replace(/\s+/g, '_');
              }
            }))
            .on('data', (row: any) => {
              // Validate and clean data
              if (row.vin && row.vin.length === 17) {
                vehicles.push({
                  vin: row.vin.toUpperCase(),
                  stockNumber: row.stockNumber || '',
                  make: row.make || '',
                  model: row.model || '',
                  year: parseInt(row.year) || 0,
                  price: parseFloat(row.price?.replace(/[$,]/g, '')) || 0,
                  mileage: parseInt(row.mileage?.replace(/,/g, '')) || 0,
                  color: row.color || null,
                  status: 'available'
                });
              }
            })
            .on('end', resolve)
            .on('error', reject);
        });

        // Fetch existing vehicles
        const { data: existingVehicles, error: vehicleError } = await supabase
          .from('vehicles')
          .select('*')
          .eq('location_id', dealership.id);

        if (vehicleError) {
          throw new Error(`Failed to fetch vehicles: ${vehicleError.message}`);
        }

        const existingByVin = new Map(existingVehicles?.map(v => [v.vin, v]) || []);
        const csvVins = new Set(vehicles.map(v => v.vin));

        // Determine changes
        for (const csvVehicle of vehicles) {
          const existing = existingByVin.get(csvVehicle.vin);
          
          if (!existing) {
            // New vehicle
            storeResult.created++;
            storeResult.details.toCreate.push({
              stockNumber: csvVehicle.stockNumber,
              vin: csvVehicle.vin,
              make: csvVehicle.make,
              model: csvVehicle.model,
              year: csvVehicle.year
            });
          } else if (existing.status === 'removed') {
            // Restore vehicle
            storeResult.restored++;
            storeResult.details.toRestore.push({
              stockNumber: csvVehicle.stockNumber,
              vin: csvVehicle.vin,
              make: csvVehicle.make,
              model: csvVehicle.model,
              year: csvVehicle.year
            });
          } else {
            // Check for updates
            const needsUpdate = 
              existing.stock_number !== csvVehicle.stockNumber ||
              existing.make !== csvVehicle.make ||
              existing.model !== csvVehicle.model ||
              existing.year !== csvVehicle.year ||
              existing.price !== csvVehicle.price ||
              existing.mileage !== csvVehicle.mileage;

            if (needsUpdate) {
              storeResult.updated++;
              storeResult.details.toUpdate.push({
                stockNumber: csvVehicle.stockNumber,
                vin: csvVehicle.vin,
                make: csvVehicle.make,
                model: csvVehicle.model,
                year: csvVehicle.year
              });
            }
          }
        }

        // Check for vehicles to soft delete or permanently delete
        for (const existing of existingVehicles || []) {
          if (!csvVins.has(existing.vin)) {
            // Check if vehicle has active transfer
            const { data: activeTransfer } = await supabase
              .from('transfers')
              .select('id')
              .eq('vehicle_id', existing.id)
              .in('status', ['requested', 'approved', 'in-transit'])
              .single();

            if (!activeTransfer) {
              if (existing.status === 'removed' && existing.removed_from_feed_at) {
                // Check if past 30 days
                const removedDate = new Date(existing.removed_from_feed_at);
                const daysSinceRemoval = Math.floor((Date.now() - removedDate.getTime()) / (1000 * 60 * 60 * 24));
                
                if (daysSinceRemoval > 30) {
                  storeResult.deleted++;
                  storeResult.details.toPermanentlyDelete.push({
                    stockNumber: existing.stock_number,
                    vin: existing.vin,
                    make: existing.make,
                    model: existing.model,
                    year: existing.year,
                    removedDate: removedDate.toLocaleDateString()
                  });
                }
              } else if (existing.status !== 'removed') {
                storeResult.softDeleted++;
                storeResult.details.toSoftDelete.push({
                  stockNumber: existing.stock_number,
                  vin: existing.vin,
                  make: existing.make,
                  model: existing.model,
                  year: existing.year
                });
              }
            }
          }
        }

        result.stores[dealership.code] = storeResult;
      } catch (error) {
        storeResult.success = false;
        storeResult.errors.push({
          vehicle: null,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        result.stores[dealership.code] = storeResult;
        result.totals.errors++;
      }

      // Update totals
      result.totals.created += storeResult.created;
      result.totals.updated += storeResult.updated;
      result.totals.deleted += storeResult.deleted;
      result.totals.softDeleted += storeResult.softDeleted;
      result.totals.restored += storeResult.restored;
    }

    await sftp.end();

    return NextResponse.json(result);
  } catch (error) {
    console.error('Dry run failed:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Dry run failed',
      success: false 
    }, { status: 500 });
  }
}