import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Menu, 
  X, 
  Home, 
  MessageCircle, 
  BarChart3, 
  Settings, 
  User, 
  LogOut, 
  Bell, 
  Shield, 
  Users, 
  MapPin, 
  Wifi,
  Bluetooth,
  Heart,
  ChevronRight
} from "lucide-react";

interface HamburgerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
}

export default function HamburgerMenu({ isOpen, onClose, onNavigate }: HamburgerMenuProps) {

  const menuItems = [
    {
      id: "dashboard",
      title: "Ana Sayfa",
      icon: Home,
      path: "/",
      description: "Chat ve hızlı erişim"
    },
    {
      id: "social-media",
      title: "Sosyal Medya Analizi",
      icon: BarChart3,
      path: "/social-media",
      description: "Twitter ve sosyal medya analizi"
    },
    {
      id: "profile",
      title: "Profil Ayarları",
      icon: User,
      path: "/profile",
      description: "Hesap ve kişisel bilgiler"
    },
    {
      id: "settings",
      title: "Ayarlar",
      icon: Settings,
      path: "/settings",
      description: "Uygulama ayarları"
    },
    {
      id: "emergency-contacts",
      title: "Acil Durum Kişileri",
      icon: Shield,
      path: "/emergency-contacts",
      description: "Acil durum iletişim listesi"
    },
    {
      id: "community",
      title: "Topluluk",
      icon: Users,
      path: "/community",
      description: "Kullanıcı topluluğu"
    }
  ];

  const quickActions = [
    {
      id: "emergency",
      title: "Acil Durum",
      icon: Shield,
      action: () => window.open("tel:112"),
      color: "text-red-600 bg-red-50 hover:bg-red-100"
    },
    {
      id: "location",
      title: "Konum Paylaş",
      icon: MapPin,
      action: () => navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
        window.open(mapsUrl, '_blank');
      }),
      color: "text-blue-600 bg-blue-50 hover:bg-blue-100"
    },
    {
      id: "bluetooth",
      title: "Bluetooth",
      icon: Bluetooth,
      action: () => console.log("Bluetooth toggle"),
      color: "text-purple-600 bg-purple-50 hover:bg-purple-100"
    }
  ];

  const handleLogout = () => {
    localStorage.removeItem("auth");
    window.location.href = "/auth";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="fixed left-0 top-0 h-full w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-700 rounded-xl flex items-center justify-center">
                  <Heart className="text-white" size={20} />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-800">REACH+</h1>
                  <p className="text-xs text-gray-500">Akıllı Destek Servisi</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

          </div>

          {/* Navigation Menu */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2 mb-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Menü
              </h3>
              {menuItems.map((item) => (
                <Button
                  key={item.id}
                  variant="ghost"
                  className="w-full justify-start h-auto p-4 hover:bg-gray-50 rounded-lg"
                  onClick={() => {
                    onNavigate(item.path);
                    onClose();
                  }}
                >
                  <div className="flex items-center w-full">
                    <item.icon className="w-5 h-5 text-gray-600 mr-3" />
                    <div className="flex-1 text-left">
                      <div className="font-medium text-gray-800">{item.title}</div>
                      <div className="text-xs text-gray-500">{item.description}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </Button>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="space-y-2 mb-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Hızlı Erişim
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {quickActions.map((action) => (
                  <Button
                    key={action.id}
                    variant="ghost"
                    className={`w-full justify-start h-auto p-3 rounded-lg ${action.color}`}
                    onClick={action.action}
                  >
                    <action.icon className="w-4 h-4 mr-3" />
                    <span className="font-medium">{action.title}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* User Info */}
            <Card className="mb-4">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">Kullanıcı</div>
                    <div className="text-xs text-gray-500">user@example.com</div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full text-red-600 border-red-200 hover:bg-red-50"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Çıkış Yap
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <div className="text-center text-xs text-gray-500">
              <p>© 2024 REACH+</p>
              <p className="mt-1">v1.0.0</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
