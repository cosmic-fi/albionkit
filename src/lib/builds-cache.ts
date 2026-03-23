/**
 * Builds Cache Management
 * Efficient caching for build data with Firestore integration
 */

import { Timestamp } from 'firebase/firestore';
import type { Build, PaginatedBuilds } from './builds-service';

const CACHE_PREFIX = 'ao-builds-';
const CACHE_VERSION = 'v1';
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes for build lists

interface CacheMetadata {
  timestamp: number;
  ttl: number;
  total?: number;
  hasMore?: boolean;
}

interface CachedPage extends CacheMetadata {
  builds: Build[];
  lastDocId?: string | null;
  currentPage?: number;
}

/**
 * Generate cache key based on filters
 */
function getCacheKey(filters: {
  sort?: string;
  tag?: string;
  zone?: string;
  activity?: string;
  role?: string;
  search?: string;
  page?: number;
}): string {
  const key = JSON.stringify({
    v: CACHE_VERSION,
    ...filters
  });
  // Create a short hash to avoid localStorage key length limits
  return CACHE_PREFIX + simpleHash(key);
}

/**
 * Simple hash function for strings
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Safely get item from localStorage with timeout
 */
function getFromStorage<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  
  try {
    // Add timeout for localStorage operations
    const startTime = Date.now();
    const item = localStorage.getItem(key);
    const duration = Date.now() - startTime;
    
    if (duration > 1000) {
      console.warn(`localStorage.getItem took ${duration}ms - consider clearing cache`);
    }
    
    if (!item) return null;
    return JSON.parse(item) as T;
  } catch (error) {
    // Handle quota exceeded or corrupted data
    if (error instanceof DOMException) {
      if (error.name === 'QuotaExceededError' || error.name === 'InvalidStateError') {
        console.warn('localStorage quota exceeded or corrupted, clearing cache...');
        try {
          clearBuildsCache();
        } catch (clearError) {
          console.error('Failed to clear cache:', clearError);
        }
        return null;
      }
      if (error.name === 'TimeoutError') {
        console.warn('localStorage operation timed out:', key);
        return null;
      }
    }
    console.warn('Failed to parse cache item:', key, error);
    return null;
  }
}

/**
 * Safely set item in localStorage
 */
function setToStorage(key: string, value: unknown): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    // Quota exceeded - clear old cache and try again
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.warn('Cache full, clearing old entries...');
      clearExpiredCache();
      
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (retryError) {
        console.error('Still failed to cache after clearing:', retryError);
        return false;
      }
    }
    console.error('Failed to cache item:', error);
    return false;
  }
}

/**
 * Check if cache entry is still valid
 */
function isValid(metadata: CacheMetadata): boolean {
  const now = Date.now();
  return (now - metadata.timestamp) < metadata.ttl;
}

/**
 * Get cached builds for given filters
 */
export function getCachedBuilds(filters: {
  sort?: string;
  tag?: string;
  zone?: string;
  activity?: string;
  role?: string;
  search?: string;
  page?: number;
}): CachedPage | null {
  const cacheKey = getCacheKey(filters);
  const cached = getFromStorage<CachedPage>(cacheKey);
  
  if (!cached) return null;
  if (!isValid(cached)) {
    // Cache expired, remove it
    try {
      localStorage.removeItem(cacheKey);
    } catch (e) {
      // Ignore
    }
    return null;
  }
  
  return cached;
}

/**
 * Cache builds for given filters
 */
export function cacheBuilds(
  filters: {
    sort?: string;
    tag?: string;
    zone?: string;
    activity?: string;
    role?: string;
    search?: string;
    page?: number;
  },
  result: PaginatedBuilds,
  ttl: number = DEFAULT_TTL
): void {
  const cacheKey = getCacheKey(filters);
  
  const cached: CachedPage = {
    builds: result.builds,
    lastDocId: result.lastDoc?.id || null,
    timestamp: Date.now(),
    ttl,
    total: result.total,
    hasMore: result.hasMore,
    currentPage: result.currentPage
  };
  
  setToStorage(cacheKey, cached);
}

/**
 * Clear expired cache entries
 */
export function clearExpiredCache(): void {
  if (typeof window === 'undefined') return;
  
  try {
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(CACHE_PREFIX)) {
        try {
          const cached = JSON.parse(localStorage.getItem(key) || '{}');
          if (!isValid(cached as CacheMetadata)) {
            keysToRemove.push(key);
          }
        } catch {
          // Invalid JSON, remove
          keysToRemove.push(key);
        }
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    if (keysToRemove.length > 0) {
      console.log(`🧹 Cleared ${keysToRemove.length} expired cache entries`);
    }
  } catch (error) {
    console.error('Failed to clear expired cache:', error);
  }
}

/**
 * Clear all builds cache
 */
export function clearBuildsCache(): void {
  if (typeof window === 'undefined') return;
  
  try {
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(CACHE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log(`🗑️ Cleared ${keysToRemove.length} builds cache entries`);
  } catch (error) {
    console.error('Failed to clear builds cache:', error);
  }
}

/**
 * Get cache statistics
 */
export function getBuildsCacheStats(): {
  entries: number;
  sizeKB: number;
  oldestEntry?: number;
} {
  if (typeof window === 'undefined') return { entries: 0, sizeKB: 0 };
  
  let totalSize = 0;
  let entryCount = 0;
  let oldestTimestamp = Date.now();
  
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(CACHE_PREFIX)) {
        const value = localStorage.getItem(key);
        if (value) {
          totalSize += value.length * 2; // UTF-16
          entryCount++;
          
          try {
            const cached = JSON.parse(value) as CacheMetadata;
            if (cached.timestamp < oldestTimestamp) {
              oldestTimestamp = cached.timestamp;
            }
          } catch {
            // Ignore
          }
        }
      }
    }
  } catch (error) {
    console.error('Failed to get cache stats:', error);
  }
  
  return {
    entries: entryCount,
    sizeKB: Math.round(totalSize / 1024),
    oldestEntry: entryCount > 0 ? oldestTimestamp : undefined
  };
}

/**
 * Pre-cache builds for common filter combinations
 * Call this during idle time to improve perceived performance
 */
export function preCacheCommonFilters(): void {
  // This would be called from the component when idle
  // Common filters could be pre-fetched and cached
  console.log('💡 Pre-cache common filters (not implemented yet)');
}

// Auto-clear expired cache on module load (in browser)
if (typeof window !== 'undefined') {
  // Clear expired cache after a short delay to not block initial load
  setTimeout(() => {
    clearExpiredCache();
    const stats = getBuildsCacheStats();
    if (stats.entries > 0) {
      console.log(`📦 Builds cache: ${stats.entries} entries, ${stats.sizeKB} KB`);
    }
  }, 1000);
}
