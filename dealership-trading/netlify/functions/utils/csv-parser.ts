import Papa from 'papaparse';

interface CSVRow {
  id: number;
  VIN: string;
  brand: string;
  model: string;
  year: number;
  price: string;
  vehicle_msrp: string;
  mileage: string;
  condition: string;
  color: string;
  trim: string;
  body_style: string;
  engine: string;
  store_code: string;
  address: string;
  title: string;
  dealership_name: string;
  description: string;
  image_link: string;
  image_link1: string;
  image_link2: string;
  image_link3: string;
  image_link4: string;
  image_link5: string;
  'Days on Lot'?: string;
  // Note: The CSV contains 10 duplicate "additional_image_link " columns
  // PapaParse puts these duplicate values in __parsed_extra array
  __parsed_extra?: string[];
}

export function parseInventoryCSV(csvContent: string, storeCode: string) {
  const parsed = Papa.parse<CSVRow>(csvContent, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
    transformHeader: (header) => {
      return header
        .replace(/additional_image_link\s+"/g, 'additional_image_link_')
        .replace(/"/g, '')
        .trim();
    }
  });

  if (parsed.errors.length > 0) {
    console.warn('CSV parsing warnings:', parsed.errors.slice(0, 5));
  }

  // Log first few rows for debugging
  if (parsed.data.length > 0) {
    console.log(`\n📊 CSV Debug Info for ${storeCode}:`);
    console.log(`   Total rows: ${parsed.data.length}`);
    console.log(`   Sample data (first 3 rows):`);
    parsed.data.slice(0, 3).forEach((row, index) => {
      console.log(`   Row ${index + 1}: VIN=${row.VIN}, condition="${row.condition}", id=${row.id}`);
    });
  }

  const vehicles = [];
  const skipReasons: Record<string, number> = {
    'missing_data': 0,
    'condition_new': 0,
    'condition_other': 0,
    'valid': 0
  };
  
  for (const row of parsed.data) {
    try {
      const vehicle = transformVehicle(row, storeCode);
      if (vehicle) {
        vehicles.push(vehicle);
        skipReasons.valid++;
      }
    } catch (error) {
      console.error(`Error parsing vehicle ${row.id || 'unknown'}:`, error);
    }
  }

  // Log summary
  console.log(`   Import summary: ${skipReasons.valid} valid, ${parsed.data.length - skipReasons.valid} skipped`);

  return vehicles;
}

function transformVehicle(row: CSVRow, expectedStoreCode: string) {
  if (!row.VIN || !row.id) {
    return null;
  }

  // Skip store code validation - we trust the file mapping
  // The store code in CSV may differ from our internal codes
  // if (expectedStoreCode && row.store_code !== expectedStoreCode) {
  //   console.warn(`Skipping vehicle ${row.id} - wrong store code: ${row.store_code}`);
  //   return null;
  // }

  // Filter vehicles based on condition
  const rawCondition = row.condition;
  const condition = rawCondition ? rawCondition.toString().toLowerCase().trim() : 'used';
  
  // Check if we should skip non-used vehicles
  const skipNonUsed = process.env.SKIP_NON_USED_VEHICLES !== 'false';
  
  // Accept various forms of "used" condition
  const usedConditions = ['used', 'pre-owned', 'preowned', 'certified', 'cpo'];
  const isUsed = usedConditions.includes(condition);
  
  // Enhanced logging for debugging
  if (skipNonUsed && !isUsed) {
    console.log(`Skipping vehicle ${row.id} - condition: "${rawCondition}" -> "${condition}" (not in accepted used conditions: ${usedConditions.join(', ')})`);
    return null;
  } else if (!skipNonUsed && !isUsed) {
    console.log(`⚠️  Importing non-used vehicle ${row.id} with condition: "${rawCondition}" (SKIP_NON_USED_VEHICLES=false)`);
  }

  const parsePrice = (priceStr: string) => {
    if (!priceStr) return null;
    const cleaned = priceStr.toString().replace(/[^0-9]/g, '');
    return cleaned ? parseInt(cleaned) : null;
  };

  const parseMileage = (mileageStr: string) => {
    if (!mileageStr) return null;
    const cleaned = mileageStr.toString().replace(/[^0-9]/g, '');
    return cleaned ? parseInt(cleaned) : null;
  };

  const parseDaysOnLot = (daysStr: string | undefined) => {
    if (!daysStr) return null;
    const cleaned = daysStr.toString().replace(/[^0-9]/g, '');
    return cleaned ? parseInt(cleaned) : null;
  };

  const images = [];
  // Add the main image_link if it exists
  if (row.image_link) images.push(row.image_link);
  
  // Add image_link1 through image_link5
  for (let i = 1; i <= 5; i++) {
    if (row[`image_link${i}` as keyof CSVRow]) {
      images.push(row[`image_link${i}` as keyof CSVRow] as string);
    }
  }
  
  // Note: We could also parse additional_image_link columns from __parsed_extra in the future
  // but for now we'll stick with image_link1-5 which is working well

  const uniqueImages = [...new Set(images)].slice(0, 10);

  let features: string[] = [];
  let dealershipName: string | null = null;
  let fullDescription: string | null = null;
  
  // The __parsed_extra array contains the duplicate "additional_image_link " columns
  // and any other extra columns. Since we're not parsing additional_image_link for now,
  // we can still try to extract features and other data if they exist
  if (row.__parsed_extra && Array.isArray(row.__parsed_extra) && row.__parsed_extra.length > 10) {
    // Try to find non-image data in the parsed_extra array
    // This is a bit fragile but works for the current CSV structure
    const lastItems = row.__parsed_extra.slice(-3);
    if (lastItems.length >= 3) {
      if (lastItems[0] && typeof lastItems[0] === 'string' && !lastItems[0].startsWith('http')) {
        features = lastItems[0].split(',').map(f => f.trim()).filter(Boolean);
      }
      if (lastItems[1] && !lastItems[1].startsWith('http')) {
        dealershipName = lastItems[1];
      }
      if (lastItems[2] && !lastItems[2].startsWith('http')) {
        fullDescription = lastItems[2];
      }
    }
  }

  return {
    stockNumber: row.id.toString(),
    vin: row.VIN,
    year: row.year || null,
    make: row.brand || null,
    model: row.model || null,
    trim: row.trim || null,
    title: row.title || `${row.year} ${row.brand} ${row.model}`.trim(),
    price: parsePrice(row.price),
    msrp: parsePrice(row.vehicle_msrp),
    condition: condition,  // Already processed and lowercase
    mileage: parseMileage(row.mileage),
    exteriorColor: row.color || null,
    bodyStyle: row.body_style || null,
    fuelType: row.engine || null,
    features: features,
    description: fullDescription || row.description || null,
    status: 'available',
    storeCode: row.store_code,
    address: row.address || null,
    dealershipName: dealershipName || row.dealership_name || null,
    imageUrls: uniqueImages,
    lastSeenInFeed: new Date().toISOString(),
    daysOnLot: parseDaysOnLot(row['Days on Lot'])
  };
}

export function validateVehicle(vehicle: any) {
  const errors = [];
  
  if (!vehicle.stockNumber) errors.push('Missing stock number');
  if (!vehicle.vin) errors.push('Missing VIN');
  if (!vehicle.make) errors.push('Missing make');
  if (!vehicle.model) errors.push('Missing model');
  if (!vehicle.year) errors.push('Missing year');
  if (!vehicle.price) errors.push('Missing price');
  
  // Validate condition - only accept 'used' vehicles
  if (vehicle.condition && vehicle.condition !== 'used') {
    errors.push(`Invalid condition: ${vehicle.condition} (only 'used' vehicles allowed)`);
  }
  
  if (vehicle.vin && vehicle.vin.length !== 17) {
    errors.push(`Invalid VIN length: ${vehicle.vin.length}`);
  }
  
  const currentYear = new Date().getFullYear();
  if (vehicle.year && (vehicle.year < 1900 || vehicle.year > currentYear + 2)) {
    errors.push(`Invalid year: ${vehicle.year}`);
  }
  
  if (vehicle.price && vehicle.price < 0) {
    errors.push(`Invalid price: ${vehicle.price}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
}