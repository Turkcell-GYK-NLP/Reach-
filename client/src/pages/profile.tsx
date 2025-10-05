import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Menu, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Shield, 
  Bell, 
  Settings,
  Save,
  Camera,
  Edit
} from "lucide-react";
import HamburgerMenu from "@/components/HamburgerMenu";
import { api } from "@/lib/api";
import { useMutation } from "@tanstack/react-query";

export default function ProfilePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    age: "",
    operator: "",
    emergencyContact: "",
    notifications: {
      emergency: true,
      location: true,
      social: false,
      updates: true
    }
  });
  const [userId, setUserId] = useState<string | null>(null);
  const [createdAt, setCreatedAt] = useState<string | null>(null);

  // Kullanıcı bilgilerini localStorage'dan al
  useEffect(() => {
    try {
      const auth = JSON.parse(localStorage.getItem("auth") || "null");
      if (auth?.user) {
        const user = auth.user;
        setUserId(user.id);
        setCreatedAt(user.createdAt);
        setProfile({
          name: user.name || "",
          email: user.email || "",
          phone: user.phone || "",
          address: user.location || "",
          age: user.age?.toString() || "",
          operator: user.operator || "",
          emergencyContact: "",
          notifications: {
            emergency: user.notificationsEnabled ?? true,
            location: user.preferences?.locationSharing ?? true,
            social: user.preferences?.socialNotifications ?? false,
            updates: user.preferences?.updates ?? true
          }
        });
      }
    } catch (error) {
      console.error("Kullanıcı bilgileri yüklenemedi:", error);
    }
  }, []);

  const updateMutation = useMutation({
    mutationFn: (updates: any) => {
      if (!userId) throw new Error("User ID not found");
      return api.updateUser(userId, updates);
    },
    onSuccess: (data) => {
      // localStorage'daki auth objesini güncelle
      try {
        const auth = JSON.parse(localStorage.getItem("auth") || "null");
        if (auth?.user) {
          auth.user = { ...auth.user, ...data.user };
          localStorage.setItem("auth", JSON.stringify(auth));
        }
      } catch (error) {
        console.error("localStorage güncellenemedi:", error);
      }
      setIsEditing(false);
      alert("Profil başarıyla güncellendi!");
    },
    onError: (error: any) => {
      alert(error?.message || "Profil güncellenemedi");
    }
  });

  const handleSave = () => {
    // Kullanıcı bilgilerini güncelle
    const updates: any = {
      name: profile.name,
      email: profile.email,
      location: profile.address,
      operator: profile.operator,
      notificationsEnabled: profile.notifications.emergency,
      preferences: {
        locationSharing: profile.notifications.location,
        socialNotifications: profile.notifications.social,
        updates: profile.notifications.updates
      }
    };

    // Age'i number olarak ekle
    if (profile.age) {
      updates.age = parseInt(profile.age);
    }

    // Phone varsa ekle (schema'da yok ama ekleyebiliriz)
    if (profile.phone) {
      updates.phone = profile.phone;
    }

    updateMutation.mutate(updates);
  };

  const handleInputChange = (field: string, value: any) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNotificationChange = (field: string, value: boolean) => {
    setProfile(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [field]: value
      }
    }));
  };

  const handleNavigate = (path: string) => {
    window.location.href = path;
  };

  // Kullanıcı adının baş harflerini al
  const getInitials = (name: string) => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Tarihi formatla
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("tr-TR", { 
      year: "numeric", 
      month: "long", 
      day: "numeric" 
    });
  };

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
                onClick={() => setIsMenuOpen(true)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <Menu className="w-5 h-5" />
              </Button>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-700 rounded-xl flex items-center justify-center">
                  <User className="text-white" size={20} />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-800">Profil Ayarları</h1>
                  <p className="text-xs text-gray-500">Hesap ve kişisel bilgiler</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {isEditing ? (
                <Button 
                  onClick={handleSave} 
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Kaydediliyor...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Kaydet
                    </>
                  )}
                </Button>
              ) : (
                <Button onClick={() => setIsEditing(true)} variant="outline">
                  <Edit className="w-4 h-4 mr-2" />
                  Düzenle
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Temel Bilgiler
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Photo */}
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-700 rounded-full flex items-center justify-center">
                      {profile.name ? (
                        <span className="text-2xl font-bold text-white">
                          {getInitials(profile.name)}
                        </span>
                      ) : (
                        <User className="w-10 h-10 text-white" />
                      )}
                    </div>
                    {isEditing && (
                      <Button
                        size="sm"
                        className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full p-0"
                      >
                        <Camera className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {profile.name || "Yükleniyor..."}
                    </h3>
                    <p className="text-sm text-gray-500">Aktif Kullanıcı</p>
                    <Badge className="bg-green-100 text-green-800">Çevrimiçi</Badge>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Ad Soyad</Label>
                    <Input
                      id="name"
                      value={profile.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-posta</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefon</Label>
                    <Input
                      id="phone"
                      value={profile.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      disabled={!isEditing}
                      placeholder="+90 555 123 45 67"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Adres / Konum</Label>
                    <Input
                      id="address"
                      value={profile.address}
                      onChange={(e) => handleInputChange("address", e.target.value)}
                      disabled={!isEditing}
                      placeholder="Şehir, İlçe"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="age">Yaş</Label>
                    <Input
                      id="age"
                      type="number"
                      value={profile.age}
                      onChange={(e) => handleInputChange("age", e.target.value)}
                      disabled={!isEditing}
                      placeholder="25"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="operator">Operatör</Label>
                    <Input
                      id="operator"
                      value={profile.operator}
                      onChange={(e) => handleInputChange("operator", e.target.value)}
                      disabled={!isEditing}
                      placeholder="Turkcell, Vodafone, Türk Telekom"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Acil Durum İletişim
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContact">Acil Durum Kişisi</Label>
                    <Input
                      id="emergencyContact"
                      value={profile.emergencyContact}
                      onChange={(e) => handleInputChange("emergencyContact", e.target.value)}
                      disabled={!isEditing}
                      placeholder="+90 555 123 45 67"
                    />
                  </div>
                  <p className="text-sm text-gray-500">
                    Acil durumlarda bu kişiye otomatik olarak bildirim gönderilir.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Settings Sidebar */}
          <div className="space-y-6">
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
                  <div>
                    <Label className="text-sm font-medium">Acil Durum</Label>
                    <p className="text-xs text-gray-500">Kritik bildirimler</p>
                  </div>
                  <Switch
                    checked={profile.notifications.emergency}
                    onCheckedChange={(checked) => handleNotificationChange("emergency", checked)}
                    disabled={!isEditing}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Konum</Label>
                    <p className="text-xs text-gray-500">Konum güncellemeleri</p>
                  </div>
                  <Switch
                    checked={profile.notifications.location}
                    onCheckedChange={(checked) => handleNotificationChange("location", checked)}
                    disabled={!isEditing}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Sosyal Medya</Label>
                    <p className="text-xs text-gray-500">Sosyal medya analizi</p>
                  </div>
                  <Switch
                    checked={profile.notifications.social}
                    onCheckedChange={(checked) => handleNotificationChange("social", checked)}
                    disabled={!isEditing}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Güncellemeler</Label>
                    <p className="text-xs text-gray-500">Uygulama güncellemeleri</p>
                  </div>
                  <Switch
                    checked={profile.notifications.updates}
                    onCheckedChange={(checked) => handleNotificationChange("updates", checked)}
                    disabled={!isEditing}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Account Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Hesap İstatistikleri
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Üyelik Tarihi</span>
                  <span className="text-sm font-medium">{formatDate(createdAt)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Kullanıcı ID</span>
                  <span className="text-xs font-mono text-gray-500 truncate max-w-[150px]" title={userId || ""}>
                    {userId || "-"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">E-posta</span>
                  <span className="text-xs text-gray-500">{profile.email || "-"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Konum</span>
                  <span className="text-sm font-medium">{profile.address || "-"}</span>
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-600">Tehlikeli Bölge</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50">
                  Şifre Değiştir
                </Button>
                <Button variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50">
                  Hesabı Sil
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Hamburger Menu */}
      <HamburgerMenu 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)}
        onNavigate={handleNavigate}
      />
    </div>
  );
}
