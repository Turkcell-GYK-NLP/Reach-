import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { NetworkStatus as NetworkStatusType } from "@/lib/types";

interface NetworkStatusProps {
  location?: string;
}

export default function NetworkStatus({ location }: NetworkStatusProps) {
  const { data: networkStatus = [], isLoading } = useQuery({
    queryKey: ["/api/network-status", location],
    queryFn: () => api.getNetworkStatus(location),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const getStatusColor = (coverage: number) => {
    if (coverage >= 90) return "bg-success";
    if (coverage >= 80) return "bg-yellow-500";
    return "bg-emergency";
  };

  const getStatusTextColor = (coverage: number) => {
    if (coverage >= 90) return "text-success";
    if (coverage >= 80) return "text-yellow-600";
    return "text-emergency";
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Şebeke Durumu</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                    <div className="h-4 bg-gray-300 rounded w-20"></div>
                  </div>
                  <div className="h-4 bg-gray-300 rounded w-12"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Şebeke Durumu</CardTitle>
        <span className="text-xs text-gray-500">Son güncelleme: 30sn önce</span>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {networkStatus.map((status: NetworkStatusType) => (
            <div key={status.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 ${getStatusColor(status.coverage)} rounded-full`}></div>
                <span className="font-medium text-sm">{status.operator}</span>
              </div>
              <div className="text-right">
                <div className={`text-sm font-semibold ${getStatusTextColor(status.coverage)}`}>
                  %{status.coverage}
                </div>
                <div className="text-xs text-gray-500">Kapsama</div>
              </div>
            </div>
          ))}
          
          {networkStatus.length === 0 && (
            <div className="text-center text-gray-500 py-4">
              <p className="text-sm">Şebeke durumu bilgisi yükleniyor...</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
