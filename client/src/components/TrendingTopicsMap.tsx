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

interface TrendingTopic {
  topic: string;
  count: number;
  percentage: number;
  sentiment: number;
  category: string;
}

interface TrendingTopicData {
  il: string;
  latitude?: number;
  longitude?: number;
  topics: TrendingTopic[];
  totalTweets: number;
}

interface TrendingTopicsMapProps {
  timeframe?: "7d" | "1m" | "1y";
  startDate?: string;
  endDate?: string;
  className?: string;
}

const categoryColors: Record<string, string> = {
  "İnternet & İletişim": "#3b82f6", // blue
  "Deprem & Afet": "#dc2626", // red
  "Yardım & Destek": "#16a34a", // green
  "Sağlık & İlkyardım": "#ea580c", // orange
  "Güvenlik & Emniyet": "#7c3aed", // purple
  "Ulaşım & Lojistik": "#0891b2", // cyan
  "Enerji & Altyapı": "#ca8a04", // yellow
  "Diğer": "#6b7280" // gray
};

const categoryIcons: Record<string, string> = {
  "İnternet & İletişim": "📡",
  "Deprem & Afet": "🌍",
  "Yardım & Destek": "🤝",
  "Sağlık & İlkyardım": "🏥",
  "Güvenlik & Emniyet": "🛡️",
  "Ulaşım & Lojistik": "🚗",
  "Enerji & Altyapı": "⚡",
  "Diğer": "📋"
};

export default function TrendingTopicsMap({ 
  timeframe, 
  startDate, 
  endDate, 
  className = "" 
}: TrendingTopicsMapProps) {
  const [trendingData, setTrendingData] = useState<TrendingTopicData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTrendingData() {
      try {
        setLoading(true);
        setError(null);
        const response = await api.getTrendingTopics(timeframe, { startDate, endDate });
        setTrendingData(response.data || []);
      } catch (err: any) {
        setError(err?.message || "Veri yüklenemedi");
      } finally {
        setLoading(false);
      }
    }

    loadTrendingData();
  }, [timeframe, startDate, endDate]);

  const getIntensityColor = (totalTweets: number, maxTweets: number) => {
    if (maxTweets === 0) return '#94a3b8'; // gray for no data
    
    const intensity = totalTweets / maxTweets;
    
    // Kırmızı → Turuncu → Sarı gradient
    if (intensity >= 0.8) return '#dc2626'; // kırmızı - çok yüksek
    if (intensity >= 0.6) return '#ea580c'; // kırmızı-turuncu - yüksek
    if (intensity >= 0.4) return '#f97316'; // turuncu - orta-yüksek
    if (intensity >= 0.2) return '#fb923c'; // açık turuncu - orta
    if (intensity >= 0.1) return '#fbbf24'; // sarı-turuncu - düşük-orta
    return '#fde047'; // sarı - düşük
  };

  const getCircleSize = (totalTweets: number, maxTweets: number) => {
    if (maxTweets === 0) return 8;
    const minSize = 8;
    const maxSize = 25;
    const intensity = totalTweets / maxTweets;
    return minSize + (maxSize - minSize) * intensity;
  };

  const maxTweets = Math.max(...trendingData.map(d => d.totalTweets), 1);

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-96 bg-gray-50 rounded-lg ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Trend haritası yükleniyor...</p>
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
    <div className={`relative z-0 ${className}`}>
      <MapContainer
        center={[39.9334, 32.8597]} // Ankara center
        zoom={6}
        className="h-96 w-full rounded-lg z-0"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {trendingData.map((city, index) => {
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
          
          const color = getIntensityColor(city.totalTweets, maxTweets);
          const size = getCircleSize(city.totalTweets, maxTweets);
          
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
                <div className="p-3 min-w-[300px]">
                  <h3 className="font-semibold text-lg mb-3 capitalize">{city.il}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Toplam Tweet:</span>
                      <span className="font-bold text-lg">{city.totalTweets}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Yoğunluk:</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        city.totalTweets / maxTweets >= 0.8 ? 'bg-red-100 text-red-800' :
                        city.totalTweets / maxTweets >= 0.6 ? 'bg-orange-100 text-orange-800' :
                        city.totalTweets / maxTweets >= 0.4 ? 'bg-orange-100 text-orange-700' :
                        city.totalTweets / maxTweets >= 0.2 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-yellow-50 text-yellow-700'
                      }`}>
                        {Math.round((city.totalTweets / maxTweets) * 100)}%
                      </span>
                    </div>
                    <div className="mt-3">
                      <h4 className="font-medium mb-2">Trend Konular:</h4>
                      <div className="space-y-1">
                        {city.topics.slice(0, 5).map((topic, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{categoryIcons[topic.category]}</span>
                              <span className="font-medium">{topic.topic}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-gray-600">{topic.count} tweet</span>
                              <span className="text-gray-500">%{topic.percentage}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Popup>
              <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                <div className="text-center">
                  <div className="font-semibold capitalize">{city.il}</div>
                  <div className="text-sm">{city.totalTweets} tweet</div>
                  {city.topics.length > 0 && (
                    <div className="text-xs mt-1">
                      {categoryIcons[city.topics[0].category]} {city.topics[0].topic}
                    </div>
                  )}
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg z-10">
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
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span>Orta-Yüksek (%40-59)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-400"></div>
            <span>Orta (%20-39)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
            <span>Düşük-Orta (%10-19)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-300"></div>
            <span>Düşük (&lt;%10)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
