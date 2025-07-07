import { createHash } from 'crypto';
import { AnalyticsCacheEntry } from '@/types/analytics';
import { supabaseAdmin } from '@/lib/supabase-server';

export interface CacheOptions {
  ttlHours?: number;
  forceRefresh?: boolean;
}

export class CacheManager {
  private defaultTTLHours: number;

  constructor(defaultTTLHours: number = 24) {
    this.defaultTTLHours = defaultTTLHours;
  }

  private generateCacheKey(params: Record<string, any>): string {
    const normalized = this.normalizeParams(params);
    return createHash('sha256')
      .update(JSON.stringify(normalized))
      .digest('hex');
  }

  private normalizeParams(params: Record<string, any>): Record<string, any> {
    const normalized: Record<string, any> = {};
    
    // Sort keys for consistent hashing
    Object.keys(params).sort().forEach(key => {
      const value = params[key];
      
      // Normalize location coordinates to reduce cache misses
      if (key === 'location' && value && typeof value === 'object') {
        normalized[key] = {
          lat: Math.round(value.lat * 100) / 100,
          lng: Math.round(value.lng * 100) / 100,
        };
      } else if (value !== undefined && value !== null) {
        normalized[key] = value;
      }
    });
    
    return normalized;
  }

  async get<T>(
    dataType: AnalyticsCacheEntry['data_type'],
    apiSource: AnalyticsCacheEntry['api_source'],
    params: Record<string, any>,
    options: CacheOptions = {}
  ): Promise<T | null> {
    if (options.forceRefresh) {
      return null;
    }

    const cacheKey = this.generateCacheKey({ dataType, apiSource, ...params });

    try {
      const { data, error } = await supabaseAdmin
        .from('analytics_cache')
        .select('*')
        .eq('cache_key', cacheKey)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !data) {
        return null;
      }

      // Increment hit count
      await supabaseAdmin
        .from('analytics_cache')
        .update({ hit_count: data.hit_count + 1 })
        .eq('id', data.id);

      return data.response_data as T;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set<T>(
    dataType: AnalyticsCacheEntry['data_type'],
    apiSource: AnalyticsCacheEntry['api_source'],
    params: Record<string, any>,
    data: T,
    options: CacheOptions = {}
  ): Promise<void> {
    const cacheKey = this.generateCacheKey({ dataType, apiSource, ...params });
    const ttlHours = options.ttlHours || this.defaultTTLHours;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + ttlHours);

    try {
      const cacheEntry: Omit<AnalyticsCacheEntry, 'id' | 'created_at' | 'hit_count'> = {
        cache_key: cacheKey,
        data_type: dataType,
        api_source: apiSource,
        request_params: params,
        response_data: data as any,
        expires_at: expiresAt.toISOString(),
      };

      // Upsert to handle race conditions
      const { error } = await supabaseAdmin
        .from('analytics_cache')
        .upsert(cacheEntry, {
          onConflict: 'cache_key',
        });

      if (error) {
        console.error('Cache set error:', error);
      }
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async invalidate(
    dataType?: AnalyticsCacheEntry['data_type'],
    apiSource?: AnalyticsCacheEntry['api_source']
  ): Promise<void> {
    try {
      let query = supabaseAdmin.from('analytics_cache').delete();

      if (dataType) {
        query = query.eq('data_type', dataType);
      }

      if (apiSource) {
        query = query.eq('api_source', apiSource);
      }

      // If no filters, clear all expired entries
      if (!dataType && !apiSource) {
        query = query.lt('expires_at', new Date().toISOString());
      }

      const { error } = await query;

      if (error) {
        console.error('Cache invalidate error:', error);
      }
    } catch (error) {
      console.error('Cache invalidate error:', error);
    }
  }

  async getStats(): Promise<{
    totalEntries: number;
    totalHits: number;
    avgHitRate: number;
    sizeByType: Record<string, number>;
  }> {
    try {
      const { data, error } = await supabaseAdmin
        .from('analytics_cache')
        .select('data_type, hit_count');

      if (error || !data) {
        return {
          totalEntries: 0,
          totalHits: 0,
          avgHitRate: 0,
          sizeByType: {},
        };
      }

      const totalEntries = data.length;
      const totalHits = data.reduce((sum, entry) => sum + entry.hit_count, 0);
      const avgHitRate = totalEntries > 0 ? totalHits / totalEntries : 0;

      const sizeByType = data.reduce((acc, entry) => {
        acc[entry.data_type] = (acc[entry.data_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalEntries,
        totalHits,
        avgHitRate,
        sizeByType,
      };
    } catch (error) {
      console.error('Cache stats error:', error);
      return {
        totalEntries: 0,
        totalHits: 0,
        avgHitRate: 0,
        sizeByType: {},
      };
    }
  }
}