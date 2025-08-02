import { AlertTriangle, ChevronRight } from "lucide-react";
import type { EmergencyAlert as EmergencyAlertType } from "@/lib/types";

interface EmergencyAlertProps {
  alert: EmergencyAlertType;
}

export default function EmergencyAlert({ alert }: EmergencyAlertProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-600";
      case "high":
        return "bg-emergency";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-blue-500";
      default:
        return "bg-emergency";
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
    
    if (diffInMinutes < 1) return "Az önce";
    if (diffInMinutes < 60) return `${diffInMinutes} dk önce`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} saat önce`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} gün önce`;
  };

  return (
    <div className={`${getSeverityColor(alert.severity)} text-white px-4 py-3 shadow-lg`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <AlertTriangle size={20} />
          <div>
            <p className="font-semibold">{alert.title}</p>
            <p className="text-sm opacity-90">
              {alert.location} - Son güncelleme: {alert.createdAt ? formatTimeAgo(new Date(alert.createdAt)) : "Bilinmiyor"}
            </p>
          </div>
        </div>
        <button className="text-white hover:text-red-200 transition-colors">
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
