import { useState, useEffect } from "react";
import { api } from "@/lib/api";

interface LocationData {
  latitude: number;
  longitude: number;
  city?: string;
  district?: string;
  country?: string;
  address?: string;
  coordinates?: string;
}

export function useLocation() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const LAST_LOCATION_KEY = "lastLocation";

  useEffect(() => {
    const getPosition = (options: PositionOptions) =>
      new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, options);
      });

    const resolveLocation = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Önce tarayıcıdan GPS konumunu al
        if (navigator.geolocation) {
          console.log("Geolocation destekleniyor, konum isteniyor...");
          
          let position: GeolocationPosition;
          try {
            // 1. deneme: yüksek doğruluk, kısa timeout
            position = await getPosition({
              enableHighAccuracy: true,
              timeout: 15000, // 15 saniye
              maximumAge: 300000, // 5 dakika
            });
          } catch (firstErr) {
            console.warn("Yüksek doğruluk başarısız, düşük doğrulukla tekrar deneniyor...", firstErr);
            // 2. deneme: düşük doğruluk, daha uzun timeout
            position = await getPosition({
              enableHighAccuracy: false,
              timeout: 30000, // 30 saniye
              maximumAge: 600000, // 10 dakika
            });
          }

          const { latitude, longitude } = position.coords;
          console.log("GPS koordinatları:", latitude, longitude);
          
          // GPS koordinatlarını server'a gönder ve detaylı bilgi al
          try {
            console.log("Server'a koordinatlar gönderiliyor...");
            const locationData = await api.getLocationByCoordinates(latitude, longitude);
            console.log("Server'dan gelen konum:", locationData);
            setLocation(locationData);
            localStorage.setItem(LAST_LOCATION_KEY, JSON.stringify(locationData));
          } catch (serverError) {
            console.error("Server location error:", serverError);
            // Server hatası durumunda GPS koordinatlarını kullan
            const fallback = {
              latitude,
              longitude,
              city: "İstanbul",
              district: "GPS Konumu",
              country: "Türkiye",
              address: "GPS Konumu"
            };
            setLocation(fallback);
            localStorage.setItem(LAST_LOCATION_KEY, JSON.stringify(fallback));
          }
        } else {
          throw new Error("Geolocation desteklenmiyor");
        }
        
      } catch (err) {
        console.error("Location fetch failed:", err);
        
        let errorMessage = "Konum alınamadı";
        
        if (err instanceof GeolocationPositionError) {
          switch (err.code) {
            case err.PERMISSION_DENIED:
              errorMessage = "Konum izni reddedildi. Tarayıcı ayarlarından konum iznini verin.";
              break;
            case err.POSITION_UNAVAILABLE:
              errorMessage = "Konum bilgisi mevcut değil. GPS'i kontrol edin.";
              break;
            case err.TIMEOUT:
              errorMessage = "Konum alma zaman aşımına uğradı. Tekrar deneyin.";
              break;
            default:
              errorMessage = "Konum alınamadı: " + err.message;
          }
        } else if (err instanceof Error) {
          errorMessage = err.message;
        }
        
        // Eğer son başarılı konum varsa onu kullan, hatayı göstermeyelim
        const cached = localStorage.getItem(LAST_LOCATION_KEY);
        if (cached) {
          try {
            const parsed = JSON.parse(cached) as LocationData;
            setLocation(parsed);
            setError(null);
          } catch {
            setError(errorMessage);
          }
        } else {
          setError(errorMessage);
          // Fallback to default location
          setLocation({
            latitude: 40.9839,
            longitude: 29.0365,
            city: "İstanbul",
            district: "Kadıköy",
            country: "Türkiye",
            address: "İstanbul, Türkiye"
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    resolveLocation();
  }, []);

  const refreshLocation = async () => {
    try {
      setIsLoading(true);
      setError(null);
      // GPS'i yeniden iste
      if (navigator.geolocation) {
        const getPosition = (options: PositionOptions) =>
          new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, options);
          });

        let position: GeolocationPosition;
        try {
          position = await getPosition({ enableHighAccuracy: true, timeout: 15000, maximumAge: 300000 });
        } catch {
          position = await getPosition({ enableHighAccuracy: false, timeout: 30000, maximumAge: 600000 });
        }

        const { latitude, longitude } = position.coords;
        try {
          const locationData = await api.getLocationByCoordinates(latitude, longitude);
          setLocation(locationData);
          localStorage.setItem(LAST_LOCATION_KEY, JSON.stringify(locationData));
        } catch {
          const fallback = {
            latitude,
            longitude,
            city: "İstanbul",
            district: "GPS Konumu",
            country: "Türkiye",
            address: "GPS Konumu"
          };
          setLocation(fallback);
          localStorage.setItem(LAST_LOCATION_KEY, JSON.stringify(fallback));
        }
      } else {
        throw new Error("Geolocation desteklenmiyor");
      }
      
    } catch (err) {
      console.error("Location refresh failed:", err);
      setError("Konum bilgisi yenilenemedi");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    location,
    error,
    isLoading,
    refreshLocation,
  };
}
