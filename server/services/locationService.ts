import NodeGeocoder from 'node-geocoder';

export interface LocationInfo {
  latitude: number;
  longitude: number;
  city: string;
  district?: string;
  country: string;
  address: string;
  accuracy?: 'high' | 'medium' | 'low';
  source?: 'gps' | 'geocoding' | 'fallback';
}

export interface DistrictBounds {
  name: string;
  center: { lat: number; lng: number };
  radius: number; // km cinsinden
  polygon?: { lat: number; lng: number }[]; // Gerçek sınırlar için
}

export class LocationService {
  private cachedLocation: LocationInfo | null = null;
  private lastUpdate: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 dakika
  private lastGeocodingRequest: number = 0;
  private readonly RATE_LIMIT_DELAY = 1000; // 1 saniye
  private geocoder: any;

  // GERÇEK İstanbul ilçe merkezleri ve yarıçapları
  private readonly ISTANBUL_DISTRICTS: DistrictBounds[] = [
    // Avrupa Yakası
    { name: "Beyoğlu", center: { lat: 41.0370, lng: 28.9857 }, radius: 3 },
    { name: "Beşiktaş", center: { lat: 41.0422, lng: 29.0098 }, radius: 4 },
    { name: "Şişli", center: { lat: 41.0602, lng: 28.9887 }, radius: 5 },
    { name: "Kağıthane", center: { lat: 41.0789, lng: 28.9785 }, radius: 4 },
    { name: "Sarıyer", center: { lat: 41.1735, lng: 29.0434 }, radius: 15 },
    { name: "Eyüpsultan", center: { lat: 41.0546, lng: 28.9343 }, radius: 8 },
    { name: "Fatih", center: { lat: 41.0186, lng: 28.9497 }, radius: 6 },
    { name: "Zeytinburnu", center: { lat: 40.9895, lng: 28.9012 }, radius: 3 },
    { name: "Bakırköy", center: { lat: 40.9744, lng: 28.8737 }, radius: 4 },
    { name: "Bahçelievler", center: { lat: 40.9967, lng: 28.8567 }, radius: 4 },
    { name: "Bağcılar", center: { lat: 41.0395, lng: 28.8414 }, radius: 5 },
    { name: "Küçükçekmece", center: { lat: 41.0082, lng: 28.7761 }, radius: 8 },
    { name: "Büyükçekmece", center: { lat: 41.0214, lng: 28.5858 }, radius: 12 },
    { name: "Avcılar", center: { lat: 41.0199, lng: 28.7245 }, radius: 6 },
    { name: "Esenyurt", center: { lat: 41.0297, lng: 28.6744 }, radius: 8 },
    { name: "Arnavutköy", center: { lat: 41.1977, lng: 28.7322 }, radius: 12 },
    { name: "Gaziosmanpaşa", center: { lat: 41.0609, lng: 28.9104 }, radius: 5 },
    { name: "Esenler", center: { lat: 41.0446, lng: 28.8764 }, radius: 4 },
    { name: "Güngören", center: { lat: 41.0201, lng: 28.8742 }, radius: 3 },
    { name: "Sultangazi", center: { lat: 41.1089, lng: 28.8613 }, radius: 6 },
    { name: "Bayrampaşa", center: { lat: 41.0462, lng: 28.8951 }, radius: 3 },
    
    // Asya Yakası
    { name: "Kadıköy", center: { lat: 40.9839, lng: 29.0365 }, radius: 6 },
    { name: "Üsküdar", center: { lat: 41.0214, lng: 29.0068 }, radius: 5 },
    { name: "Beykoz", center: { lat: 41.1158, lng: 29.0997 }, radius: 15 },
    { name: "Ümraniye", center: { lat: 41.0195, lng: 29.1244 }, radius: 6 },
    { name: "Ataşehir", center: { lat: 40.9833, lng: 29.1167 }, radius: 5 },
    { name: "Maltepe", center: { lat: 40.9436, lng: 29.1667 }, radius: 6 },
    { name: "Kartal", center: { lat: 40.9064, lng: 29.1836 }, radius: 7 },
    { name: "Pendik", center: { lat: 40.8783, lng: 29.2333 }, radius: 8 },
    { name: "Tuzla", center: { lat: 40.8231, lng: 29.2975 }, radius: 10 },
    { name: "Şile", center: { lat: 41.1744, lng: 29.6097 }, radius: 20 },
    { name: "Çekmeköy", center: { lat: 41.0311, lng: 29.2119 }, radius: 8 },
    { name: "Sancaktepe", center: { lat: 41.0089, lng: 29.2331 }, radius: 6 },
    { name: "Sultanbeyli", center: { lat: 40.9631, lng: 29.2631 }, radius: 5 },
    { name: "Şişli", center: { lat: 41.0602, lng: 28.9887 }, radius: 5 }
  ];

  constructor() {
    // OpenStreetMap provider - ücretsiz ama rate limit var
    this.geocoder = NodeGeocoder({
      provider: 'openstreetmap',
      formatter: null,
      httpAdapter: 'https',
      apiKey: undefined, // OSM için gerekli değil
    });
  }

  /**
   * GPS koordinatlarından konum bilgisi al
   * ÖNEMLİ: Bu fonksiyon artık gerçek reverse geocoding yapıyor
   */
  async getLocationByCoordinates(lat: number, lng: number, useOnlineGeocoding: boolean = true): Promise<LocationInfo> {
    try {
      console.log(`📍 Koordinat analizi başlatılıyor: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);

      // 1. Önce İstanbul sınırları içinde mi kontrol et
      if (!this.isInIstanbul(lat, lng)) {
        console.warn("⚠️  Koordinatlar İstanbul sınırları dışında");
        return this.createFallbackLocation(lat, lng, "İstanbul Dışı");
      }

      let locationInfo: LocationInfo;

      // 2. Online geocoding kullan (daha doğru)
      if (useOnlineGeocoding && this.canMakeGeocodingRequest()) {
        locationInfo = await this.getLocationFromGeocoding(lat, lng);
        if (locationInfo.accuracy === 'high') {
          return locationInfo;
        }
      }

      // 3. Offline ilçe tespiti (fallback)
      const district = this.findDistrictByCoordinates(lat, lng);
      locationInfo = {
        latitude: lat,
        longitude: lng,
        city: "İstanbul",
        district: district.name,
        country: "Türkiye",
        address: `${district.name}, İstanbul, Türkiye`,
        accuracy: 'medium',
        source: 'offline_mapping'
      };

      console.log("✅ Konum belirlendi:", locationInfo);
      return locationInfo;

    } catch (error) {
      console.error("❌ Koordinat tabanlı konum alma hatası:", error);
      return this.createFallbackLocation(lat, lng, "Bilinmeyen Konum");
    }
  }

  /**
   * Online geocoding servisi kullanarak konum al
   */
  private async getLocationFromGeocoding(lat: number, lng: number): Promise<LocationInfo> {
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
      console.warn("⚠️  Geocoding hatası:", error);
    }

    // Geocoding başarısızsa offline yönteme dön
    return this.getOfflineLocation(lat, lng);
  }

  /**
   * Offline konum tespiti - geliştirilmiş algoritma
   */
  private getOfflineLocation(lat: number, lng: number): LocationInfo {
    const district = this.findDistrictByCoordinates(lat, lng);
    
    return {
      latitude: lat,
      longitude: lng,
      city: "İstanbul",
      district: district.name,
      country: "Türkiye",
      address: `${district.name}, İstanbul, Türkiye`,
      accuracy: 'medium',
      source: 'offline_mapping'
    };
  }

  /**
   * Koordinatlara göre en yakın ilçeyi bul - GELİŞTİRİLMİŞ
   */
  private findDistrictByCoordinates(lat: number, lng: number): DistrictBounds {
    let nearestDistrict = this.ISTANBUL_DISTRICTS[0];
    let minDistance = this.calculateDistance(
      lat, lng, 
      nearestDistrict.center.lat, 
      nearestDistrict.center.lng
    );

    // Önce yarıçap içinde olan ilçeleri kontrol et
    for (const district of this.ISTANBUL_DISTRICTS) {
      const distance = this.calculateDistance(lat, lng, district.center.lat, district.center.lng);
      
      // Eğer ilçe yarıçapı içindeyse, bu daha doğru bir sonuç
      if (distance <= district.radius) {
        console.log(`🎯 ${district.name} yarıçapı içinde: ${distance.toFixed(2)}km`);
        return district;
      }
      
      if (distance < minDistance) {
        minDistance = distance;
        nearestDistrict = district;
      }
    }

    console.log(`📍 En yakın ilçe: ${nearestDistrict.name} (${minDistance.toFixed(2)}km)`);
    return nearestDistrict;
  }

  /**
   * İstanbul sınırları kontrolü
   */
  private isInIstanbul(lat: number, lng: number): boolean {
    // İstanbul'un yaklaşık sınırları
    const ISTANBUL_BOUNDS = {
      minLat: 40.8,   // En güney nokta (Tuzla)
      maxLat: 41.6,   // En kuzey nokta (Şile)
      minLng: 28.5,   // En batı nokta (Büyükçekmece)
      maxLng: 29.7    // En doğu nokta (Şile)
    };

    return lat >= ISTANBUL_BOUNDS.minLat && 
           lat <= ISTANBUL_BOUNDS.maxLat && 
           lng >= ISTANBUL_BOUNDS.minLng && 
           lng <= ISTANBUL_BOUNDS.maxLng;
  }

  /**
   * Rate limit kontrolü
   */
  private canMakeGeocodingRequest(): boolean {
    const now = Date.now();
    return (now - this.lastGeocodingRequest) >= this.RATE_LIMIT_DELAY;
  }

  /**
   * Fallback konum oluştur
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
   * Haversine formülü - mesafe hesaplama
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Dünya'nın yarıçapı (km)
    const dLat = this.deg2rad(lat2 - lat1);
    const dLng = this.deg2rad(lng2 - lng1);
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }

  /**
   * Cache'li konum alma
   */
  async getCurrentLocation(): Promise<LocationInfo> {
    const now = Date.now();
    
    if (this.cachedLocation && (now - this.lastUpdate) < this.CACHE_DURATION) {
      console.log("📦 Cache'den konum döndürülüyor");
      return this.cachedLocation;
    }

    // Fallback İstanbul koordinatları
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

    this.cachedLocation = fallbackLocation;
    this.lastUpdate = now;
    
    return fallbackLocation;
  }

  /**
   * En yakın güvenli alan bul - GELİŞTİRİLMİŞ
   */
  async getNearestSafeArea(): Promise<{
    name: string;
    distance: number;
    coordinates: { lat: number; lng: number };
    category: string;
  }> {
    const currentLocation = await this.getCurrentLocation();
    
    // Daha kapsamlı güvenli alan listesi
    const safeAreas = [
      // Parklar
      { name: "Fenerbahçe Parkı", coordinates: { lat: 40.9839, lng: 29.0365 }, category: "park" },
      { name: "Göztepe 60.Yıl Parkı", coordinates: { lat: 40.9751, lng: 29.0515 }, category: "park" },
      { name: "Moda Parkı", coordinates: { lat: 40.9878, lng: 29.0269 }, category: "park" },
      
      // Meydanlar
      { name: "Kadıköy Meydanı", coordinates: { lat: 40.9903, lng: 29.0264 }, category: "meydan" },
      { name: "Taksim Meydanı", coordinates: { lat: 41.0369, lng: 28.9850 }, category: "meydan" },
      
      // Hastaneler
      { name: "Acıbadem Kadıköy Hastanesi", coordinates: { lat: 40.9903, lng: 29.0350 }, category: "hastane" },
      { name: "Dr. Sadi Konuk Hastanesi", coordinates: { lat: 40.9744, lng: 28.8737 }, category: "hastane" },
      
      // Karakollar
      { name: "Kadıköy Karakolu", coordinates: { lat: 40.9903, lng: 29.0264 }, category: "karakol" }
    ];

    let nearestArea = safeAreas[0];
    let minDistance = this.calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      safeAreas[0].coordinates.lat,
      safeAreas[0].coordinates.lng
    );

    for (const area of safeAreas.slice(1)) {
      const distance = this.calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        area.coordinates.lat,
        area.coordinates.lng
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        nearestArea = area;
      }
    }

    return {
      name: nearestArea.name,
      distance: Math.round(minDistance * 1000), // metre cinsinden
      coordinates: nearestArea.coordinates,
      category: nearestArea.category
    };
  }
}

export const locationService = new LocationService();