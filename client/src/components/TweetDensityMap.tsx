import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '@/lib/api';
import { getCityCoordinates } from '@/lib/turkeyCities';

// Leaflet icon fix
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface TweetDensityData {
  il: string;
  count: number;
  latitude?: number;
  longitude?: number;
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

interface TweetDensityMapProps {
  timeframe?: "7d" | "1m" | "1y";
  startDate?: string;
  endDate?: string;
  className?: string;
}

export default function TweetDensityMap({ 
  timeframe, 
  startDate, 
  endDate, 
  className = "" 
}: TweetDensityMapProps) {
  const [densityData, setDensityData] = useState<TweetDensityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDensityData() {
      try {
        setLoading(true);
        setError(null);
        const response = await api.getTweetDensity(timeframe, { startDate, endDate });
        setDensityData(response.data || []);
      } catch (err: any) {
        setError(err?.message || "Veri yüklenemedi");
      } finally {
        setLoading(false);
      }
    }

    loadDensityData();
  }, [timeframe, startDate, endDate]);

  const getCircleColor = (count: number, maxCount: number) => {
    if (maxCount === 0) return '#94a3b8'; // gray for no data
    
    const intensity = count / maxCount;
    if (intensity >= 0.8) return '#dc2626'; // red for high
    if (intensity >= 0.6) return '#ea580c'; // orange for medium-high
    if (intensity >= 0.4) return '#d97706'; // amber for medium
    if (intensity >= 0.2) return '#eab308'; // yellow for low-medium
    return '#84cc16'; // lime for low
  };

  const getCircleSize = (count: number, maxCount: number) => {
    if (maxCount === 0) return 8;
    const minSize = 8;
    const maxSize = 25;
    const intensity = count / maxCount;
    return minSize + (maxSize - minSize) * intensity;
  };

  const maxCount = Math.max(...densityData.map(d => d.count), 1);

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-96 bg-gray-50 rounded-lg ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Harita yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center h-96 bg-red-50 rounded-lg ${className}`}>
        <div className="text-center">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <MapContainer
        center={[39.9334, 32.8597]} // Ankara center
        zoom={6}
        className="h-96 w-full rounded-lg"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {densityData.map((city, index) => {
          // Use coordinates from data or fallback to city coordinates
          let lat = city.latitude;
          let lng = city.longitude;
          
          if (!lat || !lng) {
            const coords = getCityCoordinates(city.il);
            if (coords) {
              lat = coords.latitude;
              lng = coords.longitude;
            }
          }
          
          if (!lat || !lng) return null;
          
          const color = getCircleColor(city.count, maxCount);
          const size = getCircleSize(city.count, maxCount);
          
          return (
            <CircleMarker
              key={`${city.il}-${index}`}
              center={[lat, lng]}
              radius={size}
              pathOptions={{
                fillColor: color,
                color: '#ffffff',
                weight: 2,
                opacity: 0.8,
                fillOpacity: 0.7,
              }}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <h3 className="font-semibold text-lg mb-2 capitalize">{city.il}</h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Tweet Sayısı:</span> {city.count}</p>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Sentiment:</span>
                      <div className="flex gap-1">
                        <span className="text-green-600">%{city.sentiment.positive} pozitif</span>
                        <span className="text-gray-600">%{city.sentiment.neutral} nötr</span>
                        <span className="text-red-600">%{city.sentiment.negative} negatif</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Popup>
              <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                <div className="text-center">
                  <div className="font-semibold capitalize">{city.il}</div>
                  <div className="text-sm">{city.count} tweet</div>
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
        <h4 className="font-semibold text-sm mb-2">Tweet Yoğunluğu</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-600"></div>
            <span>Çok Yüksek (≥%80)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-600"></div>
            <span>Yüksek (%60-79)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-600"></div>
            <span>Orta (%40-59)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span>Düşük (%20-39)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-lime-500"></div>
            <span>Çok Düşük (&lt;%20)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
