import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeft, 
  Settings, 
  Globe, 
  Bell, 
  Shield, 
  Wifi, 
  Bluetooth,
  Moon,
  Sun,
  Volume2,
  MapPin,
  Smartphone
} from "lucide-react";

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    language: "tr",
    theme: "light",
    notifications: {
      sound: true,
      vibration: true,
      emergency: true,
      location: true,
      social: false
    },
    privacy: {
      locationSharing: true,
      dataCollection: true,
      analytics: false
    },
    connection: {
      autoConnect: true,
      bluetoothEnabled: true,
      wifiOnly: false
    },
    display: {
      fontSize: "medium",
      darkMode: false,
      animations: true
    }
  });

  const handleSettingChange = (category: string, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...(prev[category as keyof typeof prev] as any),
        [field]: value
      }
    }));
  };

  const languages = [
    { value: "tr", label: "Türkçe" },
    { value: "en", label: "English" },
    { value: "de", label: "Deutsch" },
    { value: "ru", label: "Русский" }
  ];

  const themes = [
    { value: "light", label: "Açık Tema" },
    { value: "dark", label: "Koyu Tema" },
    { value: "auto", label: "Otomatik" }
  ];

  const fontSizes = [
    { value: "small", label: "Küçük" },
    { value: "medium", label: "Orta" },
    { value: "large", label: "Büyük" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.history.back()}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-700 rounded-xl flex items-center justify-center">
                  <Settings className="text-white" size={20} />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-800">Ayarlar</h1>
                  <p className="text-xs text-gray-500">Uygulama ayarları</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          {/* General Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Genel Ayarlar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="language">Dil</Label>
                  <Select
                    value={settings.language}
                    onValueChange={(value) => handleSettingChange("general", "language", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="theme">Tema</Label>
                  <Select
                    value={settings.theme}
                    onValueChange={(value) => handleSettingChange("general", "theme", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {themes.map((theme) => (
                        <SelectItem key={theme.value} value={theme.value}>
                          {theme.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Bildirimler
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Volume2 className="w-5 h-5 text-gray-600" />
                  <div>
                    <Label className="text-sm font-medium">Ses</Label>
                    <p className="text-xs text-gray-500">Bildirim sesleri</p>
                  </div>
                </div>
                <Switch
                  checked={settings.notifications.sound}
                  onCheckedChange={(checked) => handleSettingChange("notifications", "sound", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-5 h-5 text-gray-600" />
                  <div>
                    <Label className="text-sm font-medium">Titreşim</Label>
                    <p className="text-xs text-gray-500">Cihaz titreşimi</p>
                  </div>
                </div>
                <Switch
                  checked={settings.notifications.vibration}
                  onCheckedChange={(checked) => handleSettingChange("notifications", "vibration", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-gray-600" />
                  <div>
                    <Label className="text-sm font-medium">Acil Durum</Label>
                    <p className="text-xs text-gray-500">Kritik bildirimler</p>
                  </div>
                </div>
                <Switch
                  checked={settings.notifications.emergency}
                  onCheckedChange={(checked) => handleSettingChange("notifications", "emergency", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-gray-600" />
                  <div>
                    <Label className="text-sm font-medium">Konum</Label>
                    <p className="text-xs text-gray-500">Konum güncellemeleri</p>
                  </div>
                </div>
                <Switch
                  checked={settings.notifications.location}
                  onCheckedChange={(checked) => handleSettingChange("notifications", "location", checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Privacy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Gizlilik
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Konum Paylaşımı</Label>
                  <p className="text-xs text-gray-500">Acil durumlarda konum paylaş</p>
                </div>
                <Switch
                  checked={settings.privacy.locationSharing}
                  onCheckedChange={(checked) => handleSettingChange("privacy", "locationSharing", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Veri Toplama</Label>
                  <p className="text-xs text-gray-500">Anonim kullanım verileri</p>
                </div>
                <Switch
                  checked={settings.privacy.dataCollection}
                  onCheckedChange={(checked) => handleSettingChange("privacy", "dataCollection", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Analitik</Label>
                  <p className="text-xs text-gray-500">Kullanım analizi</p>
                </div>
                <Switch
                  checked={settings.privacy.analytics}
                  onCheckedChange={(checked) => handleSettingChange("privacy", "analytics", checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Connection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="w-5 h-5" />
                Bağlantı
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Otomatik Bağlantı</Label>
                  <p className="text-xs text-gray-500">Bluetooth otomatik bağlantı</p>
                </div>
                <Switch
                  checked={settings.connection.autoConnect}
                  onCheckedChange={(checked) => handleSettingChange("connection", "autoConnect", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bluetooth className="w-5 h-5 text-gray-600" />
                  <div>
                    <Label className="text-sm font-medium">Bluetooth</Label>
                    <p className="text-xs text-gray-500">Bluetooth özelliklerini etkinleştir</p>
                  </div>
                </div>
                <Switch
                  checked={settings.connection.bluetoothEnabled}
                  onCheckedChange={(checked) => handleSettingChange("connection", "bluetoothEnabled", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Sadece WiFi</Label>
                  <p className="text-xs text-gray-500">Mobil veri kullanma</p>
                </div>
                <Switch
                  checked={settings.connection.wifiOnly}
                  onCheckedChange={(checked) => handleSettingChange("connection", "wifiOnly", checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Display */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sun className="w-5 h-5" />
                Görünüm
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fontSize">Yazı Boyutu</Label>
                <Select
                  value={settings.display.fontSize}
                  onValueChange={(value) => handleSettingChange("display", "fontSize", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fontSizes.map((size) => (
                      <SelectItem key={size.value} value={size.value}>
                        {size.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Moon className="w-5 h-5 text-gray-600" />
                  <div>
                    <Label className="text-sm font-medium">Koyu Mod</Label>
                    <p className="text-xs text-gray-500">Gece teması</p>
                  </div>
                </div>
                <Switch
                  checked={settings.display.darkMode}
                  onCheckedChange={(checked) => handleSettingChange("display", "darkMode", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Animasyonlar</Label>
                  <p className="text-xs text-gray-500">Geçiş animasyonları</p>
                </div>
                <Switch
                  checked={settings.display.animations}
                  onCheckedChange={(checked) => handleSettingChange("display", "animations", checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button className="bg-blue-600 hover:bg-blue-700">
              Ayarları Kaydet
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
