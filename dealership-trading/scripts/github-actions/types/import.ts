import type { DealershipLocation } from '@/types/vehicle';

export interface ImportResult {
  stores: Record<string, StoreImportResult>;
  totals: {
    created: number;
    updated: number;
    deleted: number;
    errors: number;
    enriched: number;
  };
  duration: number;
  timestamp: string;
}

export interface StoreImportResult {
  storeCode: string;
  storeName: string;
  success: boolean;
  created: number;
  updated: number;
  deleted: number;
  errors: ImportError[];
}

export interface ImportError {
  vehicle: string | null;
  error: string;
}

export interface ImportLogEntry {
  id: string;
  timestamp: string;
  success: boolean;
  vehicles_imported: number;
  vehicles_updated: number;
  vehicles_deleted: number;
  errors: ImportError[];
  details: string;
}

export interface SFTPFile {
  filename: string;
  content: string;
  size: number;
  timestamp: Date;
}

export interface MappedFile {
  filename: string;
  content: string;
  dealership: DealershipLocation | null;
  shouldProcess: boolean;
}

export interface SyncResult {
  created: number;
  updated: number;
  deleted: number;
  preserved: number;
}

export interface EnrichmentStats {
  vinDecoded: number;
  marketDataAdded: number;
  imagesAnalyzed: number;
  errors: number;
}