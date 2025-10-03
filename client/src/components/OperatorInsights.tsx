import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingUp, Users, Wifi, Heart, Shield, Car, Zap } from 'lucide-react';
import { api } from '@/lib/api';

interface TrendingTopic {
  topic: string;
  count: number;
  percentage: number;
  sentiment: number;
  category: string;
}

interface TrendingTopicData {
  il: string;
  latitude?: number;
  longitude?: number;
  topics: TrendingTopic[];
  totalTweets: number;
}

interface OperatorInsightsProps {
  timeframe?: "7d" | "1m" | "1y";
  startDate?: string;
  endDate?: string;
}

const categoryIcons: Record<string, React.ReactNode> = {
  "İnternet & İletişim": <Wifi className="w-4 h-4" />,
  "Deprem & Afet": <AlertTriangle className="w-4 h-4" />,
  "Yardım & Destek": <Heart className="w-4 h-4" />,
  "Sağlık & İlkyardım": <Heart className="w-4 h-4" />,
  "Güvenlik & Emniyet": <Shield className="w-4 h-4" />,
  "Ulaşım & Lojistik": <Car className="w-4 h-4" />,
  "Enerji & Altyapı": <Zap className="w-4 h-4" />,
  "Diğer": <TrendingUp className="w-4 h-4" />
};

const categoryColors: Record<string, string> = {
  "İnternet & İletişim": "bg-blue-100 text-blue-800",
  "Deprem & Afet": "bg-red-100 text-red-800",
  "Yardım & Destek": "bg-green-100 text-green-800",
  "Sağlık & İlkyardım": "bg-orange-100 text-orange-800",
  "Güvenlik & Emniyet": "bg-purple-100 text-purple-800",
  "Ulaşım & Lojistik": "bg-cyan-100 text-cyan-800",
  "Enerji & Altyapı": "bg-yellow-100 text-yellow-800",
  "Diğer": "bg-gray-100 text-gray-800"
};

export default function OperatorInsights({ timeframe, startDate, endDate }: OperatorInsightsProps) {
  const [trendingData, setTrendingData] = useState<TrendingTopicData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTrendingData() {
      try {
        setLoading(true);
        setError(null);
        const response = await api.getTrendingTopics(timeframe, { startDate, endDate });
        setTrendingData(response.data || []);
      } catch (err: any) {
        setError(err?.message || "Veri yüklenemedi");
      } finally {
        setLoading(false);
      }
    }

    loadTrendingData();
  }, [timeframe, startDate, endDate]);

  // Kategori bazında analiz (Diğer kategorisi hariç)
  const categoryAnalysis = trendingData.reduce((acc, city) => {
    city.topics.forEach(topic => {
      // Diğer kategorisini atla
      if (topic.category === "Diğer") return;
      
      if (!acc[topic.category]) {
        acc[topic.category] = {
          totalCount: 0,
          cities: new Set(),
          topTopics: new Map()
        };
      }
      acc[topic.category].totalCount += topic.count;
      acc[topic.category].cities.add(city.il);
      
      const existing = acc[topic.category].topTopics.get(topic.topic) || 0;
      acc[topic.category].topTopics.set(topic.topic, existing + topic.count);
    });
    return acc;
  }, {} as Record<string, { totalCount: number; cities: Set<string>; topTopics: Map<string, number> }>);

  // En kritik bölgeleri belirle
  const criticalRegions = trendingData
    .filter(city => city.topics.some(topic => 
      topic.category === "Deprem & Afet" || 
      topic.category === "Sağlık & İlkyardım" ||
      topic.category === "Güvenlik & Emniyet"
    ))
    .sort((a, b) => b.totalTweets - a.totalTweets)
    .slice(0, 5);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-sm text-gray-600">Analiz yükleniyor...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p className="text-sm">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Kategori Analizi */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Kategori Bazında Analiz
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(categoryAnalysis)
              .sort(([,a], [,b]) => b.totalCount - a.totalCount)
              .map(([category, data]) => {
                // Bu kategoride en çok etkilenen ili bul
                const mostAffectedCity = trendingData
                  .filter(city => city.topics.some(topic => topic.category === category))
                  .sort((a, b) => {
                    const aCount = a.topics.filter(t => t.category === category).reduce((sum, t) => sum + t.count, 0);
                    const bCount = b.topics.filter(t => t.category === category).reduce((sum, t) => sum + t.count, 0);
                    return bCount - aCount;
                  })[0];

                return (
                  <div key={category} className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      {categoryIcons[category]}
                      <span className="font-medium text-sm">{category}</span>
                    </div>
                    <div className="space-y-2 text-xs text-gray-600">
                      <div className="flex justify-between">
                        <span>Toplam:</span>
                        <span className="font-medium">{data.totalCount} konuşma</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Etkilenen İl:</span>
                        <span className="font-medium">{data.cities.size}</span>
                      </div>
                      
                      {mostAffectedCity && (
                        <div className="mt-3 p-2 bg-gray-50 rounded">
                          <p className="font-medium text-xs mb-1">En Çok Etkilenen İl:</p>
                          <p className="text-xs font-semibold capitalize">{mostAffectedCity.il}</p>
                          <p className="text-xs text-gray-500">
                            {mostAffectedCity.topics
                              .filter(t => t.category === category)
                              .reduce((sum, t) => sum + t.count, 0)} konuşma
                          </p>
                        </div>
                      )}
                      
                      <div className="mt-2">
                        <p className="font-medium mb-1 text-xs">En Çok Konuşulan:</p>
                        {Array.from(data.topTopics.entries())
                          .sort(([,a], [,b]) => b - a)
                          .slice(0, 2)
                          .map(([topic, count]) => (
                            <p key={topic} className="text-xs">• {topic} ({count})</p>
                          ))}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>

      {/* Kritik Bölgeler */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            Kritik Bölgeler - Operatör Dikkati Gerekli
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {criticalRegions.map((region, index) => (
              <div key={region.il} className="p-4 border border-red-200 rounded-lg bg-red-50">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold capitalize">{region.il}</h4>
                  <Badge variant="destructive">Kritik #{index + 1}</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Toplam Tweet: {region.totalTweets}</p>
                    <div className="space-y-1">
                      {region.topics
                        .filter(topic => 
                          topic.category === "Deprem & Afet" || 
                          topic.category === "Sağlık & İlkyardım" ||
                          topic.category === "Güvenlik & Emniyet"
                        )
                        .slice(0, 3)
                        .map((topic, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <Badge className={categoryColors[topic.category]}>
                              {topic.topic}
                            </Badge>
                            <span className="text-xs text-gray-600">
                              {topic.count} tweet (%{topic.percentage})
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">Önerilen Aksiyonlar:</p>
                    <ul className="text-xs space-y-1 text-gray-600">
                      {region.topics.some(t => t.category === "Deprem & Afet") && (
                        <li>• AFAD koordinasyonu gerekli</li>
                      )}
                      {region.topics.some(t => t.category === "Sağlık & İlkyardım") && (
                        <li>• Sağlık ekipleri yönlendir</li>
                      )}
                      {region.topics.some(t => t.category === "Güvenlik & Emniyet") && (
                        <li>• Güvenlik önlemleri artır</li>
                      )}
                      {region.topics.some(t => t.category === "İnternet & İletişim") && (
                        <li>• İletişim altyapısını kontrol et</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Genel Öneriler */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Operatör Önerileri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3 text-green-700">Acil Müdahale Gerekli</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                {Object.entries(categoryAnalysis)
                  .filter(([category]) => 
                    category === "Deprem & Afet" || 
                    category === "Sağlık & İlkyardım" ||
                    category === "Güvenlik & Emniyet"
                  )
                  .sort(([,a], [,b]) => b.totalCount - a.totalCount)
                  .map(([category, data]) => (
                    <li key={category} className="flex items-center gap-2">
                      {categoryIcons[category]}
                      <span>{category}: {data.cities.size} ilde {data.totalCount} konuşma</span>
                    </li>
                  ))}
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-3 text-blue-700">İzleme Gerekli</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                {Object.entries(categoryAnalysis)
                  .filter(([category]) => 
                    category === "İnternet & İletişim" || 
                    category === "Ulaşım & Lojistik" ||
                    category === "Enerji & Altyapı" ||
                    category === "Yardım & Destek"
                  )
                  .sort(([,a], [,b]) => b.totalCount - a.totalCount)
                  .map(([category, data]) => (
                    <li key={category} className="flex items-center gap-2">
                      {categoryIcons[category]}
                      <span>{category}: {data.cities.size} ilde {data.totalCount} konuşma</span>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
