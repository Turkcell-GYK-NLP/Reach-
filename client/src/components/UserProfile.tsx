import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export default function UserProfile() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  let user = { name: "Misafir", age: 0, initials: "M", operator: "-" } as any;
  let isLoggedIn = false;
  try {
    const auth = JSON.parse(localStorage.getItem("auth") || "null");
    if (auth?.user) {
      isLoggedIn = true;
      const name: string = auth.user.name || auth.user.email;
      user = {
        name,
        age: auth.user.age || 0,
        initials: (name || "M").split(" ").map((s: string) => s[0]).join("").slice(0,2).toUpperCase(),
        operator: auth.user.operator || "-",
      };
    }
  } catch {}

  const handleLogout = () => {
    localStorage.removeItem("auth");
    window.location.href = "/auth";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profil Ayarları</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-trust to-accent rounded-full flex items-center justify-center">
              <span className="text-white font-semibold">{user.initials}</span>
            </div>
            <div>
              <p className="font-medium text-dark">{user.name}</p>
              <p className="text-xs text-gray-500">{user.age} yaşında</p>
            </div>
          </div>
          
          <div className="border-t pt-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Operatör</span>
              <span className="text-sm font-medium">{user.operator}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Bildirimler</span>
              <Switch
                checked={notificationsEnabled}
                onCheckedChange={setNotificationsEnabled}
              />
            </div>
          </div>

          {isLoggedIn && (
            <div className="border-t pt-3">
              <Button 
                variant="outline" 
                className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleLogout}
              >
                <LogOut size={16} className="mr-2" />
                Çıkış Yap
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
