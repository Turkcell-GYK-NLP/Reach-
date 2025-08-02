import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, MapPin, Signal, BarChart } from "lucide-react";

export default function QuickActions() {
  const actions = [
    {
      icon: AlertTriangle,
      label: "Acil Durum",
      color: "bg-emergency hover:bg-red-600",
      action: () => window.open("tel:112"),
    },
    {
      icon: MapPin,
      label: "Güvenli Alan",
      color: "bg-trust hover:bg-blue-700",
      action: () => console.log("Show safe areas"),
    },
    {
      icon: Signal,
      label: "Şebeke Test",
      color: "bg-success hover:bg-green-600",
      action: () => console.log("Run network test"),
    },
    {
      icon: BarChart,
      label: "Raporlar",
      color: "bg-accent hover:bg-purple-600",
      action: () => console.log("Show reports"),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hızlı Erişim</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action, index) => (
            <Button
              key={index}
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
  );
}
