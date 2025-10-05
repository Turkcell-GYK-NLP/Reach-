import NodeGeocoder from 'node-geocoder';
import { LocationInfo, DistrictBounds } from './types.js';
import { DistanceCalculator } from './DistanceCalculator.js';
import { ISTANBUL_BOUNDS } from './districtConstants.js';

export class GeocodingService {
  private geocoder: any;
  private distanceCalculator: DistanceCalculator;
  private lastGeocodingRequest: number = 0;
  private readonly RATE_LIMIT_DELAY = 1000; // 1 second

  constructor() {
    // OpenStreetMap provider - ücretsiz ama rate limit var
    this.geocoder = NodeGeocoder({
      provider: 'openstreetmap',
      formatter: null,
    });
    this.distanceCalculator = new DistanceCalculator();
  }

  /**
   * Get location from coordinates using online geocoding
   */
  async getLocationByCoordinates(lat: number, lng: number, useOnlineGeocoding: boolean = true): Promise<LocationInfo> {
    try {
      console.log(`📍 Geocoding coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);

      // Check if within Istanbul bounds
      if (!this.isInIstanbul(lat, lng)) {
        console.warn("⚠️ Coordinates outside Istanbul bounds");
        return this.createFallbackLocation(lat, lng, "İstanbul Dışı");
      }

      // Try online geocoding if available
      if (useOnlineGeocoding && this.canMakeGeocodingRequest()) {
        const onlineLocation = await this.getOnlineLocation(lat, lng);
        if (onlineLocation.accuracy === 'high') {
          return onlineLocation;
        }
      }

      // Fallback to offline method
      return this.getOfflineLocation(lat, lng);

    } catch (error) {
      console.error("❌ Geocoding error:", error);
      return this.createFallbackLocation(lat, lng, "Bilinmeyen Konum");
    }
  }

  /**
   * Online geocoding using external service
   */
  private async getOnlineLocation(lat: number, lng: number): Promise<LocationInfo> {
    try {
      this.lastGeocodingRequest = Date.now();
      console.log("🌐 Online geocoding başlatılıyor...");

      const results = await this.geocoder.reverse({ lat, lon: lng });
      
      if (results && results.length > 0) {
        const result = results[0];
        
        return {
          latitude: lat,
          longitude: lng,
          city: result.city || result.county || "İstanbul",
          district: result.administrativeLevels?.level2long || result.county || "Bilinmiyor",
          country: result.country || "Türkiye",
          address: result.formattedAddress || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
          accuracy: 'high',
          source: 'geocoding'
        };
      }
    } catch (error) {
      console.warn("⚠️ Online geocoding failed:", error);
    }

    // If online failed, use offline
    return this.getOfflineLocation(lat, lng);
  }

  /**
   * Offline location detection using district bounds
   */
  private getOfflineLocation(lat: number, lng: number): LocationInfo {
    const district = this.distanceCalculator.findNearestDistrict(lat, lng);
    
    return {
      latitude: lat,
      longitude: lng,
      city: "İstanbul",
      district: district.name,
      country: "Türkiye",
      address: `${district.name}, İstanbul, Türkiye`,
      accuracy: 'medium',
      source: 'fallback'
    };
  }

  /**
   * Check if coordinates are within Istanbul bounds
   */
  isInIstanbul(lat: number, lng: number): boolean {
    return lat >= ISTANBUL_BOUNDS.minLat && 
           lat <= ISTANBUL_BOUNDS.maxLat && 
           lng >= ISTANBUL_BOUNDS.minLng && 
           lng <= ISTANBUL_BOUNDS.maxLng;
  }

  /**
   * Check if we can make a geocoding request (rate limiting)
   */
  private canMakeGeocodingRequest(): boolean {
    const now = Date.now();
    return (now - this.lastGeocodingRequest) >= this.RATE_LIMIT_DELAY;
  }

  /**
   * Create fallback location when geocoding fails
   */
  private createFallbackLocation(lat: number, lng: number, district: string): LocationInfo {
    return {
      latitude: lat,
      longitude: lng,
      city: "İstanbul",
      district: district,
      country: "Türkiye",
      address: `GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      accuracy: 'low',
      source: 'fallback'
    };
  }

  /**
   * Geocode address to coordinates (reverse operation)
   */
  async geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    try {
      if (!this.canMakeGeocodingRequest()) {
        console.warn("⚠️ Rate limit reached, waiting...");
        await new Promise(resolve => setTimeout(resolve, this.RATE_LIMIT_DELAY));
      }

      this.lastGeocodingRequest = Date.now();
      const results = await this.geocoder.geocode(address);
      
      if (results && results.length > 0) {
        const result = results[0];
        return {
          lat: result.latitude,
          lng: result.longitude
        };
      }
      
      return null;
    } catch (error) {
      console.error("❌ Address geocoding error:", error);
      return null;
    }
  }
}

