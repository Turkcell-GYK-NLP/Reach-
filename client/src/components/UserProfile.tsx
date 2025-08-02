import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

export default function UserProfile() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  
  // This would come from user context/authentication in a real app
  const user = {
    name: "Ahmet Kaya",
    age: 22,
    initials: "AK",
    operator: "Turkcell",
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
        </div>
      </CardContent>
    </Card>
  );
}
