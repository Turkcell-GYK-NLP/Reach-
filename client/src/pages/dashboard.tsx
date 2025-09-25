import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useLocation } from "@/hooks/useLocation";
import ChatInterface from "@/components/ChatInterface";
import HamburgerMenu from "@/components/HamburgerMenu";
import EmergencyAlert from "@/components/EmergencyAlert";
import NotificationPanel from "@/components/NotificationPanel";
import HospitalModal from "@/components/HospitalModal";
import { Button } from "@/components/ui/button";
import { Heart, Menu, Bell, Wifi, WifiOff, Bluetooth } from "lucide-react";

export default function Dashboard() {
  const { location } = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHospitalModal, setShowHospitalModal] = useState(false);
  
  const [connectionStatus, setConnectionStatus] = useState<"online" | "offline" | "bluetooth">("online");
  const [notifications] = useState(3);

  // User ID - auth'dan al
  let userId = "default";
  try {
    const auth = JSON.parse(localStorage.getItem("auth") || "null");
    if (auth?.user?.id) {
      userId = auth.user.id;
    }
  } catch {}

  // Get emergency alerts
  const { data: emergencyAlerts = [] } = useQuery({
    queryKey: ["/api/emergency-alerts", location?.district],
    queryFn: () => api.getEmergencyAlerts(location?.district),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Monitor connection status
  useEffect(() => {
    const handleOnline = () => setConnectionStatus("online");
    const handleOffline = () => setConnectionStatus("offline");

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case "online": return <Wifi className="w-4 h-4 text-green-600" />;
      case "offline": return <WifiOff className="w-4 h-4 text-red-600" />;
      case "bluetooth": return <Bluetooth className="w-4 h-4 text-blue-600" />;
      default: return <Wifi className="w-4 h-4 text-green-600" />;
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case "online": return "Çevrimiçi";
      case "offline": return "Çevrimdışı";
      case "bluetooth": return "Bluetooth";
      default: return "Çevrimiçi";
    }
  };

  const handleNavigate = (path: string) => {
    if (path === "/") {
      // Ana sayfa zaten açık
      return;
    }
    // Diğer sayfalar için navigation
    window.location.href = path;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left side - Logo and Menu */}
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMenuOpen(true)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <Menu className="w-6 h-6 text-gray-600" />
              </Button>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-700 rounded-xl flex items-center justify-center">
                  <Heart className="text-white" size={20} />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-800">REACH+</h1>
                  <p className="text-xs text-gray-500">AI Destek Asistanı</p>
                </div>
              </div>
            </div>
            
            {/* Right side - Status and Notifications */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 px-3 py-1.5 bg-gray-100 rounded-full">
                {getConnectionStatusIcon()}
                <span className="text-sm text-gray-600">{getConnectionStatusText()}</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-2 relative"
                onClick={() => setShowNotifications(prev => !prev)}
              >
                <Bell className="w-5 h-5 text-gray-600" />
                {notifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {notifications}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Emergency Alert */}
      {emergencyAlerts.length > 0 && (
        <EmergencyAlert alert={emergencyAlerts[0]} />
      )}

      {/* Main Content - Chat Interface */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="h-[calc(100vh-8rem)]">
          <ChatInterface onOpenHospitalModal={() => setShowHospitalModal(true)} />
        </div>
      </main>

      {/* Hamburger Menu */}
      <HamburgerMenu 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)}
        onNavigate={handleNavigate}
      />

      {/* Notification Panel */}
      <NotificationPanel
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        userId={userId}
      />

      {/* Hospital Modal */}
      <HospitalModal
        isOpen={showHospitalModal}
        onClose={() => setShowHospitalModal(false)}
      />

      {/* Floating Emergency Button */}
      <Button 
        className="fixed bottom-6 right-6 w-14 h-14 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 z-30" 
        onClick={() => window.open("tel:112")}
      >
        <span className="text-xl font-bold">!</span>
      </Button>

      {/* Offline Indicator */}
      {connectionStatus === "offline" && (
        <div className="fixed bottom-6 left-6 z-30">
          <div className="bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
            <WifiOff className="w-4 h-4" />
            <span className="text-sm">Çevrimdışı Modda Çalışıyor</span>
          </div>
        </div>
      )}
    </div>
  );
}
