import { useState, useEffect } from "react";

interface LocationData {
  latitude: number;
  longitude: number;
  city?: string;
  district?: string;
}

export function useLocation() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser");
      setIsLoading(false);
      return;
    }

    const success = async (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;
      
      try {
        // Reverse geocoding to get city/district info
        // In a production app, you'd use a real geocoding service
        const mockLocation: LocationData = {
          latitude,
          longitude,
          city: "İstanbul",
          district: "Kadıköy", // Mock data based on coordinates
        };
        
        setLocation(mockLocation);
      } catch (err) {
        console.error("Reverse geocoding failed:", err);
        setLocation({ latitude, longitude });
      } finally {
        setIsLoading(false);
      }
    };

    const error = (err: GeolocationPositionError) => {
      setError(`Location error: ${err.message}`);
      setIsLoading(false);
      
      // Fallback to default location
      setLocation({
        latitude: 40.9839,
        longitude: 29.0365,
        city: "İstanbul",
        district: "Kadıköy"
      });
    };

    navigator.geolocation.getCurrentPosition(success, error, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000, // 5 minutes
    });
  }, []);

  const refreshLocation = () => {
    setIsLoading(true);
    setError(null);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ 
          latitude, 
          longitude,
          city: "İstanbul",
          district: "Kadıköy"
        });
        setIsLoading(false);
      },
      (err) => {
        setError(`Location error: ${err.message}`);
        setIsLoading(false);
      }
    );
  };

  return {
    location,
    error,
    isLoading,
    refreshLocation,
  };
}
