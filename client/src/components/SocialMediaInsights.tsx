import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Info, CheckCircle } from "lucide-react";
import type { SocialMediaInsight } from "@/lib/types";

interface SocialMediaInsightsProps {
  location?: string;
}

export default function SocialMediaInsights({ location }: SocialMediaInsightsProps) {
  const { data: insights = [], isLoading } = useQuery({
    queryKey: ["/api/insights", location],
    queryFn: () => api.getSocialMediaInsights(location, 5),
    refetchInterval: 60000, // Refresh every minute
  });

  const getInsightIcon = (category: string, sentiment: string) => {
    if (sentiment === "negative" || category === "help") {
      return <AlertCircle className="text-emergency" size={16} />;
    }
    if (sentiment === "positive") {
      return <CheckCircle className="text-success" size={16} />;
    }
    return <Info className="text-trust" size={16} />;
  };

  const getInsightColor = (category: string, sentiment: string) => {
    if (sentiment === "negative" || category === "help") {
      return "bg-red-50 border-l-4 border-emergency";
    }
    if (sentiment === "positive") {
      return "bg-green-50 border-l-4 border-success";
    }
    return "bg-blue-50 border-l-4 border-trust";
  };

  const getCategoryTitle = (category: string, keyword: string) => {
    switch (category) {
      case "network":
        return "Şebeke Şikayeti";
      case "help":
        return "Yardım Çağrısı";
      case "positive":
        return "Pozitif Geri Bildirim";
      case "youth":
        return "Genç Kullanıcılar";
      default:
        return keyword;
    }
  };

  const getInsightDescription = (insight: SocialMediaInsight) => {
    const examples = {
      network: "internet çekmiyor, sinyal problemi",
      help: "toplanma alanı nerede, yardıma ihtiyaç var", 
      positive: "5G hızı arttı, servis iyileşti",
      youth: "kampüste internet, yurt problemi",
    };
    
    return `"${examples[insight.category as keyof typeof examples] || insight.keyword}" - ${insight.count} paylaşım`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sosyal Medya Analizi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="p-3 bg-gray-50 rounded-lg border-l-4 border-gray-300">
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2"></div>
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
        <CardTitle>Sosyal Medya Analizi</CardTitle>
        <span className="text-xs text-gray-500">Gerçek zamanlı</span>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {insights.slice(0, 3).map((insight: SocialMediaInsight) => (
            <div key={insight.id} className={`p-3 rounded-lg ${getInsightColor(insight.category, insight.sentiment)}`}>
              <div className="flex items-center space-x-2 mb-1">
                {getInsightIcon(insight.category, insight.sentiment)}
                <span className="text-sm font-medium">
                  {getCategoryTitle(insight.category, insight.keyword)}
                </span>
              </div>
              <p className="text-xs text-gray-600">
                {getInsightDescription(insight)}
              </p>
            </div>
          ))}
          
          {insights.length === 0 && (
            <div className="text-center text-gray-500 py-4">
              <p className="text-sm">Sosyal medya verileri analiz ediliyor...</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
