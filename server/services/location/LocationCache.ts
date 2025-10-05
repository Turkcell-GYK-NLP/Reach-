import { LocationInfo } from './types.js';

export class LocationCache {
  private cache: Map<string, { location: LocationInfo; timestamp: number }>;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor(cacheDurationMs?: number) {
    this.cache = new Map();
    if (cacheDurationMs) {
      this.CACHE_DURATION = cacheDurationMs;
    }
  }

  /**
   * Generate cache key from coordinates
   */
  private generateKey(lat: number, lng: number): string {
    return `${lat.toFixed(4)}_${lng.toFixed(4)}`;
  }

  /**
   * Get cached location
   */
  get(lat: number, lng: number): LocationInfo | null {
    const key = this.generateKey(lat, lng);
    const cached = this.cache.get(key);

    if (!cached) {
      return null;
    }

    // Check if cache is still valid
    if (!this.isValid(key)) {
      this.cache.delete(key);
      return null;
    }

    console.log(`📦 Cache hit for ${key}`);
    return cached.location;
  }

  /**
   * Set location in cache
   */
  set(lat: number, lng: number, location: LocationInfo): void {
    const key = this.generateKey(lat, lng);
    this.cache.set(key, {
      location,
      timestamp: Date.now()
    });
    console.log(`💾 Cached location for ${key}`);
  }

  /**
   * Check if cached entry is still valid
   */
  isValid(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) {
      return false;
    }

    const now = Date.now();
    const age = now - cached.timestamp;
    return age < this.CACHE_DURATION;
  }

  /**
   * Check if coordinates have cached location
   */
  has(lat: number, lng: number): boolean {
    const key = this.generateKey(lat, lng);
    return this.cache.has(key) && this.isValid(key);
  }

  /**
   * Clear specific cache entry
   */
  delete(lat: number, lng: number): boolean {
    const key = this.generateKey(lat, lng);
    const deleted = this.cache.delete(key);
    if (deleted) {
      console.log(`🗑️ Cleared cache for ${key}`);
    }
    return deleted;
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    console.log(`🗑️ Cleared all location cache`);
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Clean expired entries
   */
  cleanExpired(): number {
    const now = Date.now();
    let removed = 0;

    for (const [key, value] of this.cache.entries()) {
      const age = now - value.timestamp;
      if (age >= this.CACHE_DURATION) {
        this.cache.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      console.log(`🧹 Cleaned ${removed} expired cache entries`);
    }
    return removed;
  }

  /**
   * Get cache statistics
   */
  getStatistics(): {
    totalEntries: number;
    validEntries: number;
    expiredEntries: number;
    cacheAge: number;
  } {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;
    let oldestTimestamp = now;

    for (const [key, value] of this.cache.entries()) {
      const age = now - value.timestamp;
      if (age < this.CACHE_DURATION) {
        validEntries++;
      } else {
        expiredEntries++;
      }
      oldestTimestamp = Math.min(oldestTimestamp, value.timestamp);
    }

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
      cacheAge: now - oldestTimestamp
    };
  }
}

