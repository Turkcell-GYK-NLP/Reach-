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

export interface SafeArea {
  name: string;
  district: string;
  coordinates: { lat: number; lng: number };
  category: string;
  distance?: number;
}

