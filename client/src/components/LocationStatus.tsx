import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";

interface LocationStatusProps {
  location: {
    latitude: number;
    longitude: number;  
    city?: string;
    district?: string;
  } | null;
}

export default function LocationStatus({ location }: LocationStatusProps) {
  const getRiskLevel = () => {
    // This would be calculated based on real risk assessment data
    return {
      level: "Orta",
      color: "bg-yellow-100 text-yellow-800",
    };
  };

  const riskLevel = getRiskLevel();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Konum Durumu</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Mevcut Konum</span>
            <span className="text-sm font-medium text-dark">
              {location ? `${location.district || "Bilinmiyor"}, ${location.city || "Türkiye"}` : "Konum alınıyor..."}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Risk Seviyesi</span>
            <Badge className={`text-xs font-medium ${riskLevel.color}`}>
              {riskLevel.level}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">En Yakın Güvenli Alan</span>
            <span className="text-sm font-medium text-trust">400m</span>
          </div>
        </div>
        
        {/* Mini Map Placeholder */}
        <div className="mt-4 h-32 bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <MapPin className="text-2xl text-gray-400 mb-2 mx-auto" size={32} />
            <p className="text-xs text-gray-500">Harita yükleniyor...</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
