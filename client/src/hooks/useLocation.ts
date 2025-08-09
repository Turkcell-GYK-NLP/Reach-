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

  useEffect(() => {
    const getLocation = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Önce tarayıcıdan GPS konumunu al
        if (navigator.geolocation) {
          console.log("Geolocation destekleniyor, konum isteniyor...");
          
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                console.log("GPS konumu alındı:", pos.coords);
                resolve(pos);
              },
              (error) => {
                console.error("GPS konum hatası:", error);
                reject(error);
              },
              {
                enableHighAccuracy: true,
                timeout: 15000, // 15 saniye
                maximumAge: 300000, // 5 dakika
              }
            );
          });

          const { latitude, longitude } = position.coords;
          console.log("GPS koordinatları:", latitude, longitude);
          
          // GPS koordinatlarını server'a gönder ve detaylı bilgi al
          try {
            console.log("Server'a koordinatlar gönderiliyor...");
            const locationData = await api.getLocationByCoordinates(latitude, longitude);
            console.log("Server'dan gelen konum:", locationData);
            setLocation(locationData);
          } catch (serverError) {
            console.error("Server location error:", serverError);
            // Server hatası durumunda GPS koordinatlarını kullan
            setLocation({
              latitude,
              longitude,
              city: "İstanbul",
              district: "GPS Konumu",
              country: "Türkiye",
              address: "GPS Konumu"
            });
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
      } finally {
        setIsLoading(false);
      }
    };

    getLocation();
  }, []);

  const refreshLocation = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const locationData = await api.getCurrentLocation();
      setLocation(locationData);
      
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
