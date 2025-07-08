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

  const vehicles = [];
  
  for (const row of parsed.data) {
    try {
      const vehicle = transformVehicle(row, storeCode);
      if (vehicle) {
        vehicles.push(vehicle);
      }
    } catch (error) {
      console.error(`Error parsing vehicle ${row.id || 'unknown'}:`, error);
    }
  }

  return vehicles;
}

function transformVehicle(row: CSVRow, expectedStoreCode: string) {
  if (!row.VIN || !row.id) {
    return null;
  }

  if (expectedStoreCode && row.store_code !== expectedStoreCode) {
    console.warn(`Skipping vehicle ${row.id} - wrong store code: ${row.store_code}`);
    return null;
  }

  // Filter out non-used vehicles
  const condition = row.condition ? row.condition.toLowerCase() : 'used';
  if (condition !== 'used') {
    console.log(`Skipping vehicle ${row.id} - condition: ${condition} (only 'used' vehicles are imported)`);
    return null;
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

  const images = [];
  // Add the main image_link if it exists
  if (row.image_link) images.push(row.image_link);
  
  // The CSV has 10 duplicate columns named "additional_image_link " (with trailing space)
  // PapaParse puts duplicate column values in __parsed_extra array
  // Based on the CSV structure, the additional_image_link values are in the first 10 positions
  if (row.__parsed_extra && Array.isArray(row.__parsed_extra)) {
    for (let i = 0; i < 10; i++) {
      const img = row.__parsed_extra[i];
      if (img && img.startsWith('http')) {
        images.push(img);
      }
    }
  }

  const uniqueImages = [...new Set(images)].slice(0, 10);

  let features: string[] = [];
  let dealershipName: string | null = null;
  let fullDescription: string | null = null;
  
  // After the 10 additional_image_link columns, the next columns in __parsed_extra are:
  // index 10: vehicle_option (features)
  // index 11: dealership_name
  // index 12: description
  if (row.__parsed_extra && Array.isArray(row.__parsed_extra)) {
    if (row.__parsed_extra[10] && typeof row.__parsed_extra[10] === 'string') {
      features = row.__parsed_extra[10].split(',').map(f => f.trim()).filter(Boolean);
    }
    if (row.__parsed_extra[11]) {
      dealershipName = row.__parsed_extra[11];
    }
    if (row.__parsed_extra[12]) {
      fullDescription = row.__parsed_extra[12];
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
    condition: row.condition ? row.condition.toLowerCase() : 'used',
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
    lastSeenInFeed: new Date().toISOString()
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