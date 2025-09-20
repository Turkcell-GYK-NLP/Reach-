import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, MapPin, Signal, BarChart } from "lucide-react";
import EmergencyCallDialog from "./EmergencyCallDialog";
import LocationSendDialog from "./LocationSendDialog";
import { useLocation } from "@/hooks/useLocation";
import { api } from "@/lib/api";

export default function QuickActions() {
  const [showEmergencyDialog, setShowEmergencyDialog] = useState(false);
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [isSendingLocation, setIsSendingLocation] = useState(false);
  
  const { location, refreshLocation } = useLocation();

  const handleEmergencyCall = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowEmergencyDialog(true);
  };

  const confirmEmergencyCall = () => {
    window.open("tel:112");
  };

  const handleLocationSend = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowLocationDialog(true);
  };

  const confirmLocationSend = async () => {
    setIsSendingLocation(true);
    try {
      // Refresh location to get the latest coordinates
      await refreshLocation();
      
      if (location) {
        // Send location to emergency contacts
        await api.sendEmergencyLocation({
          latitude: location.latitude,
          longitude: location.longitude,
          address: location.address,
          city: location.city,
          district: location.district
        });
        
        console.log("Location sent to emergency contacts:", location);
      } else {
        throw new Error("Konum bilgisi alınamadı");
      }
    } catch (error) {
      console.error("Failed to send location:", error);
      // You might want to show a toast notification here
    } finally {
      setIsSendingLocation(false);
    }
  };

  const actions = [
    {
      icon: AlertTriangle,
      label: "Acil Durum",
      color: "bg-emergency hover:bg-red-600",
      action: handleEmergencyCall,
    },
    {
      icon: MapPin,
      label: "Konum Gönder",
      color: "bg-trust hover:bg-blue-700",
      action: handleLocationSend,
    },
    {
      icon: Signal,
      label: "Şebeke Test",
      color: "bg-success hover:bg-green-600",
      action: (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        console.log("Run network test");
      },
    },
    {
      icon: BarChart,
      label: "Raporlar",
      color: "bg-accent hover:bg-purple-600",
      action: (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        console.log("Show reports");
      },
    },
  ];

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Hızlı Erişim</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {actions.map((action, index) => (
              <Button
                key={index}
                type="button"
                onClick={action.action}
                className={`flex flex-col items-center p-3 ${action.color} text-white transition-colors h-auto`}
              >
                <action.icon size={20} className="mb-1" />
                <span className="text-xs font-medium">{action.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <EmergencyCallDialog
        isOpen={showEmergencyDialog}
        onClose={() => setShowEmergencyDialog(false)}
        onConfirm={confirmEmergencyCall}
      />

      <LocationSendDialog
        isOpen={showLocationDialog}
        onClose={() => setShowLocationDialog(false)}
        onConfirm={confirmLocationSend}
        location={location ? `${location.city}, ${location.district}` : "Konum bilgisi alınıyor..."}
        isLoading={isSendingLocation}
      />
    </>
  );
}
