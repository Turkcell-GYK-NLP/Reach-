import { LocationInfo } from './location/types.js';
import { GeocodingService } from './location/GeocodingService.js';
import { LocationCache } from './location/LocationCache.js';
import { SafeAreaFinder } from './location/SafeAreaFinder.js';

export class LocationService {
  private geocodingService: GeocodingService;
  private locationCache: LocationCache;
  private safeAreaFinder: SafeAreaFinder;
  private lastKnownCoordinates: { lat: number; lng: number } | null = null;

  constructor() {
    this.geocodingService = new GeocodingService();
    this.locationCache = new LocationCache();
    this.safeAreaFinder = new SafeAreaFinder();
  }

  /**
   * Get location by coordinates with caching
   */
  async getLocationByCoordinates(lat: number, lng: number, useOnlineGeocoding: boolean = true): Promise<LocationInfo> {
    console.log(`📍 Location request: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);

    // Check cache first
    const cached = this.locationCache.get(lat, lng);
    if (cached) {
      this.lastKnownCoordinates = { lat, lng };
      return cached;
    }

    // Get location from geocoding service
    const location = await this.geocodingService.getLocationByCoordinates(lat, lng, useOnlineGeocoding);
    
    // Cache the result
    this.locationCache.set(lat, lng, location);
    this.lastKnownCoordinates = { lat, lng };

    return location;
  }

  /**
   * Get current location (cached or fallback)
   */
  async getCurrentLocation(): Promise<LocationInfo> {
    // If we have last known coordinates, use them
    if (this.lastKnownCoordinates) {
      const { lat, lng } = this.lastKnownCoordinates;
      console.log("📡 Using last known GPS coordinates...");
      return await this.getLocationByCoordinates(lat, lng, true);
    }

    // Fallback to Istanbul center
    const fallbackLocation: LocationInfo = {
      latitude: 40.9839,
      longitude: 29.0365,
      city: "İstanbul",
      district: "Kadıköy",
      country: "Türkiye",
      address: "İstanbul, Türkiye",
      accuracy: 'low',
      source: 'fallback'
    };

    return fallbackLocation;
  }

  /**
   * Get nearest safe area
   */
  async getNearestSafeArea(): Promise<{
    name: string;
    distance: number;
    coordinates: { lat: number; lng: number };
    category: string;
    direction?: string;
  }> {
    const currentLocation = await this.getCurrentLocation();
    return this.safeAreaFinder.findNearest(currentLocation);
  }

  /**
   * Get safe areas within radius
   */
  async getSafeAreasWithinRadius(radiusKm: number = 5): Promise<any[]> {
    const currentLocation = await this.getCurrentLocation();
    return this.safeAreaFinder.findWithinRadius(currentLocation, radiusKm);
  }

  /**
   * Get route to safe area
   */
  async getRouteToSafeArea(safeAreaName: string): Promise<any> {
    const currentLocation = await this.getCurrentLocation();
    const nearestArea = await this.getNearestSafeArea();
    
    return this.safeAreaFinder.getRouteInstructions(currentLocation, nearestArea);
  }

  /**
   * Geocode address to coordinates
   */
  async geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    return this.geocodingService.geocodeAddress(address);
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.locationCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStatistics(): any {
    return this.locationCache.getStatistics();
  }

  /**
   * Clean expired cache entries
   */
  cleanExpiredCache(): number {
    return this.locationCache.cleanExpired();
  }
}

// Export singleton instance
export const locationService = new LocationService();

// Export types for external use
export type { LocationInfo } from './location/types.js';
