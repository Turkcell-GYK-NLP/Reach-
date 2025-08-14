import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useLocation } from "@/hooks/useLocation";
import ChatInterface from "@/components/ChatInterface";
import NetworkStatus from "@/components/NetworkStatus";
import SocialMediaInsights from "@/components/SocialMediaInsights";
import EmergencyAlert from "@/components/EmergencyAlert";
import QuickActions from "@/components/QuickActions";
import EmergencyContacts from "@/components/EmergencyContacts";
import LocationStatus from "@/components/LocationStatus";
import UserProfile from "@/components/UserProfile";
import { Heart, Bell, User, LogOut } from "lucide-react";

export default function Dashboard() {
  const { location } = useLocation();
  const [connectionStatus, setConnectionStatus] = useState<"online" | "offline" | "emergency">("online");
  const [notifications] = useState(3);

  const handleLogout = () => {
    localStorage.removeItem("auth");
    window.location.href = "/auth";
  };

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

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case "online": return "bg-success";
      case "offline": return "bg-gray-400";
      case "emergency": return "bg-emergency";
      default: return "bg-success";
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case "online": return "Çevrimiçi";
      case "offline": return "Çevrimdışı";
      case "emergency": return "Acil Durum";
      default: return "Çevrimiçi";
    }
  };

  return (
    <div className="bg-light font-inter text-dark min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-trust to-accent rounded-lg flex items-center justify-center">
                <Heart className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-dark">REACH+</h1>
                <p className="text-xs text-gray-500">Akıllı Destek Servisi</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 ${getConnectionStatusColor()} rounded-full animate-pulse`}></div>
                <span className="text-sm text-gray-600">{getConnectionStatusText()}</span>
              </div>
              <button className="relative p-2 text-gray-600 hover:text-dark transition-colors">
                <Bell size={18} />
                {notifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-emergency text-white text-xs rounded-full flex items-center justify-center">
                    {notifications}
                  </span>
                )}
              </button>
              <div className="flex items-center space-x-2">
                <button className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <User className="text-gray-600" size={16} />
                </button>
                <button 
                  onClick={handleLogout}
                  className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                  title="Çıkış Yap"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Emergency Alert */}
      {emergencyAlerts.length > 0 && (
        <EmergencyAlert alert={emergencyAlerts[0]} />
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <ChatInterface />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <NetworkStatus location={location?.district} />
              <SocialMediaInsights location={location?.district} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <QuickActions />
            <EmergencyContacts />
            <LocationStatus location={location} />
            <UserProfile />
          </div>
        </div>

        {/* Offline Indicator */}
        {connectionStatus === "offline" && (
          <div className="fixed bottom-4 right-4">
            <div className="bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
              <div className="w-4 h-4 text-gray-300">⚠</div>
              <span className="text-sm">Çevrimdışı Modda Çalışıyor</span>
            </div>
          </div>
        )}
      </main>
      
      {/* Floating Emergency Button */}
      <button 
        className="fixed bottom-6 left-6 w-14 h-14 bg-emergency hover:bg-red-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105" 
        title="Acil Durum"
        onClick={() => window.open("tel:112")}
      >
        <span className="text-xl">!</span>
      </button>
    </div>
  );
}
