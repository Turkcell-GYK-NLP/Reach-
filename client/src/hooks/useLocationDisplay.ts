import { useState, useEffect } from "react";
import { useLocation } from "./useLocation";

interface LocationDisplayData {
  city: string;
  district?: string;
  coordinates: string;
  isLoading: boolean;
  error: string | null;
}

export function useLocationDisplay() {
  const { location, error, isLoading } = useLocation();
  const [displayData, setDisplayData] = useState<LocationDisplayData>({
    city: "Konum alınıyor...",
    district: "",
    coordinates: "",
    isLoading: true,
    error: null
  });

  useEffect(() => {
    if (isLoading) {
      setDisplayData({
        city: "Konum alınıyor...",
        district: "",
        coordinates: "",
        isLoading: true,
        error: null
      });
      return;
    }

    if (error) {
      setDisplayData({
        city: "Konum alınamadı",
        district: "",
        coordinates: "",
        isLoading: false,
        error: error
      });
      return;
    }

    if (location) {
      const city = location.city || "Bilinmeyen İl";
      const district = location.district ? `, ${location.district}` : "";
      const coordinates = `📍 GPS: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
      
      setDisplayData({
        city: city,
        district: district,
        coordinates: coordinates,
        isLoading: false,
        error: null
      });
    }
  }, [location, error, isLoading]);

  return displayData;
}
