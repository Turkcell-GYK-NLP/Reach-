import NodeGeocoder from 'node-geocoder';

export interface LocationInfo {
  latitude: number;
  longitude: number;
  city: string;
  district?: string;
  country: string;
  address: string;
}

export class LocationService {
  private cachedLocation: LocationInfo | null = null;
  private lastUpdate: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 dakika
  private geocoder: any;

  constructor() {
    // OpenStreetMap provider kullanarak ücretsiz geocoding
    this.geocoder = NodeGeocoder({
      provider: 'openstreetmap',
      formatter: null
    });
  }

  async getCurrentLocation(): Promise<LocationInfo> {
    // Bu fonksiyon artık kullanılmıyor, GPS konumu client tarafından geliyor
    // Fallback olarak İstanbul koordinatları döndür
    const fallbackLocation: LocationInfo = {
      latitude: 40.9839,
      longitude: 29.0365,
      city: "İstanbul",
      district: "Kadıköy",
      country: "Türkiye",
      address: "İstanbul, Türkiye"
    };

    return fallbackLocation;
  }

  async getLocationByCoordinates(lat: number, lng: number): Promise<LocationInfo> {
    try {
      console.log(`Reverse geocoding isteniyor: ${lat}, ${lng}`);
      
      const reverseResults = await this.geocoder.reverse({ lat, lon: lng });
      console.log("Reverse geocoding sonucu:", reverseResults);
      
      const reverseLocation = reverseResults[0];
      
      const locationInfo = {
        latitude: lat,
        longitude: lng,
        city: reverseLocation?.city || "İstanbul",
        district: reverseLocation?.administrativeLevels?.level2long || "Kadıköy",
        country: reverseLocation?.country || "Türkiye",
        address: reverseLocation?.formattedAddress || "İstanbul, Türkiye"
      };
      
      console.log("Döndürülen konum bilgisi:", locationInfo);
      return locationInfo;
      
    } catch (error) {
      console.error("Koordinat tabanlı konum alma hatası:", error);
      
      // Fallback konum bilgisi
      const fallbackLocation = {
        latitude: lat,
        longitude: lng,
        city: "İstanbul",
        district: "GPS Konumu",
        country: "Türkiye",
        address: `GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)}`
      };
      
      console.log("Fallback konum döndürülüyor:", fallbackLocation);
      return fallbackLocation;
    }
  }

  // En yakın güvenli alanı bul
  async getNearestSafeArea(): Promise<{
    name: string;
    distance: number;
    coordinates: { lat: number; lng: number };
  }> {
    const currentLocation = await this.getCurrentLocation();
    
    const safeAreas = [
      {
        name: "Fenerbahçe Parkı",
        coordinates: { lat: 40.9839, lng: 29.0365 }
      },
      {
        name: "Göztepe 60.Yıl Parkı",
        coordinates: { lat: 40.9751, lng: 29.0515 }
      },
      {
        name: "Kadıköy Meydanı",
        coordinates: { lat: 40.9903, lng: 29.0264 }
      }
    ];

    let nearestArea = safeAreas[0];
    let minDistance = this.calculateDistance(
      currentLocation.latitude, currentLocation.longitude,
      safeAreas[0].coordinates.lat, safeAreas[0].coordinates.lng
    );

    for (const area of safeAreas.slice(1)) {
      const distance = this.calculateDistance(
        currentLocation.latitude, currentLocation.longitude,
        area.coordinates.lat, area.coordinates.lng
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        nearestArea = area;
      }
    }

    return {
      name: nearestArea.name,
      distance: Math.round(minDistance * 1000), // metre cinsinden
      coordinates: nearestArea.coordinates
    };
  }

  // İki nokta arası mesafe hesaplama (Haversine formülü)
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Dünya'nın yarıçapı (km)
    const dLat = this.deg2rad(lat2 - lat1);
    const dLng = this.deg2rad(lng2 - lng1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }
}

export const locationService = new LocationService();
