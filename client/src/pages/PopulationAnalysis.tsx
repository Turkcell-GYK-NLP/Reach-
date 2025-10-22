import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Map, 
  BarChart3, 
  TrendingUp, 
  Users, 
  User, 
  UserCheck,
  Info,
  Search,
  TrendingDown,
  Minus
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import PopulationCharts from '@/components/PopulationCharts';

interface PopulationData {
  province: string;
  total_population: number;
  male_population: number;
  female_population: number;
  male_ratio: string;
  female_ratio: string;
  population_change?: number;
  change_percentage?: number;
  trend?: 'up' | 'down' | 'stable';
}

interface AgeDistributionData {
  province?: string;
  years: {
    2023?: any[];
    2024?: any[];
  };
}

interface PopulationAnalysis {
  type: string;
  province?: string;
  year?: number;
  total_population?: number;
  male_population?: number;
  female_population?: number;
  male_ratio?: number;
  female_ratio?: number;
  young_population?: number;
  young_ratio?: number;
  middle_age_population?: number;
  middle_age_ratio?: number;
  elderly_population?: number;
  elderly_ratio?: number;
  population_change?: number;
  population_change_ratio?: number;
  young_population_change?: number;
  young_population_change_ratio?: number;
  message?: string;
}

export default function PopulationAnalysis() {
  const [mapData, setMapData] = useState<PopulationData[]>([]);
  const [ageData, setAgeData] = useState<AgeDistributionData | null>(null);
  const [selectedProvince, setSelectedProvince] = useState<string>('');
  const [analysis, setAnalysis] = useState<PopulationAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<number>(2024);
  const [populationTrendData, setPopulationTrendData] = useState<any[]>([]);

  useEffect(() => {
    loadMapData();
  }, []);

  useEffect(() => {
    if (selectedProvince) {
      loadAgeData(selectedProvince);
      performAnalysis(selectedProvince);
      loadPopulationTrendData(selectedProvince);
    }
  }, [selectedProvince, selectedYear]);

  const loadMapData = async () => {
    try {
      const response = await fetch('/api/population/map-data');
      const result = await response.json();
      
      if (result.success) {
        setMapData(result.data);
        setLoading(false);
      }
    } catch (error) {
      console.error('Harita verisi yüklenemedi:', error);
      setLoading(false);
    }
  };

  const loadAgeData = async (province: string) => {
    try {
      const response = await fetch(`/api/population/age-distribution?province=${encodeURIComponent(province)}&year=${selectedYear}`);
      const result = await response.json();
      
      if (result.success) {
        setAgeData(result.data);
      }
    } catch (error) {
      console.error('Yaş dağılımı verisi yüklenemedi:', error);
    }
  };

  const performAnalysis = async (province: string) => {
    try {
      const response = await fetch(`/api/population/analysis?query=${encodeURIComponent(province + ' nüfus analizi')}`);
      const result = await response.json();
      
      if (result.success) {
        setAnalysis(result.data);
      }
    } catch (error) {
      console.error('Nüfus analizi yapılamadı:', error);
    }
  };

  const loadPopulationTrendData = async (province: string) => {
    try {
      const response = await fetch(`/api/population/population-trend?province=${encodeURIComponent(province)}`);
      const result = await response.json();
      
      if (result.success) {
        setPopulationTrendData(result.data);
      } else {
        setPopulationTrendData([]);
      }
    } catch (error) {
      console.error('Nüfus trend verisi yüklenemedi:', error);
      setPopulationTrendData([]);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      const response = await fetch(`/api/population/analysis?query=${encodeURIComponent(searchQuery)}`);
      const result = await response.json();
      
      if (result.success) {
        setAnalysis(result.data);
        if (result.data.province) {
          setSelectedProvince(result.data.province);
        }
      }
    } catch (error) {
      console.error('Arama yapılamadı:', error);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4" />;
      case 'down':
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <Minus className="w-4 h-4" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-600 bg-green-100';
      case 'down':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getTrendLabel = (trend: string, changePercentage: number) => {
    const percentage = Math.abs(changePercentage).toFixed(1);
    switch (trend) {
      case 'up':
        return `+${percentage}%`;
      case 'down':
        return `-${percentage}%`;
      default:
        return '0%';
    }
  };

  // Nüfus yoğunluğu verisi hazırlama
  const densityData = mapData
    .sort((a, b) => b.total_population - a.total_population)
    .slice(0, 15)
    .map(item => ({
      province: item.province,
      nüfus: item.total_population,
      erkek: item.male_population,
      kadın: item.female_population
    }));

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Nüfus verileri yükleniyor...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Nüfus Analizi</h1>
              <p className="text-gray-600">Türkiye genelinde il bazında nüfus ve demografik analizler</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Yıl:</label>
                <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2023">2023</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="map" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="map" className="flex items-center gap-2">
              <Map className="w-4 h-4" />
              Harita
            </TabsTrigger>
            <TabsTrigger value="charts" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Grafikler
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Analiz
            </TabsTrigger>
          </TabsList>

          {/* Map Tab */}
          <TabsContent value="map" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Map className="w-5 h-5" />
                  Nüfus Yoğunluk Haritası ({selectedYear})
                </CardTitle>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span>Artış</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingDown className="w-4 h-4 text-red-600" />
                    <span>Azalış</span>
                  </div>
                  <span className="text-gray-400">•</span>
                  <span>Son 1 yıldaki nüfus değişimi</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {mapData.map((province) => (
                    <Card 
                      key={province.province}
                      className={`cursor-pointer transition-all hover:shadow-lg ${
                        selectedProvince === province.province ? 'ring-2 ring-blue-500' : ''
                      }`}
                      onClick={() => setSelectedProvince(province.province)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-sm">{province.province}</h3>
                          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getTrendColor(province.trend || 'stable')}`}>
                            {getTrendIcon(province.trend || 'stable')}
                            <span>{getTrendLabel(province.trend || 'stable', province.change_percentage || 0)}</span>
                          </div>
                        </div>
                        <div className="space-y-1 text-xs text-gray-600">
                          <div className="flex justify-between">
                            <span>Toplam:</span>
                            <span className="font-medium">{province.total_population.toLocaleString('tr-TR')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Erkek:</span>
                            <span>{province.male_ratio || '0.0'}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Kadın:</span>
                            <span>{province.female_ratio || '0.0'}%</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Nüfus Yoğunluğu Grafiği */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5" />
                  Nüfus Yoğunluğu (En Yüksek 15 İl) ({selectedYear})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={densityData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="province" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      fontSize={12}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        value.toLocaleString('tr-TR'), 
                        name === 'nüfus' ? 'Toplam Nüfus' : name === 'erkek' ? 'Erkek Nüfus' : 'Kadın Nüfus'
                      ]}
                      labelFormatter={(label) => `İl: ${label}`}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="nüfus" 
                      stackId="1" 
                      stroke="#3B82F6" 
                      fill="#3B82F6" 
                      name="Toplam Nüfus"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="erkek" 
                      stackId="2" 
                      stroke="#10B981" 
                      fill="#10B981" 
                      name="Erkek Nüfus"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="kadın" 
                      stackId="3" 
                      stroke="#F59E0B" 
                      fill="#F59E0B" 
                      name="Kadın Nüfus"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Charts Tab */}
          <TabsContent value="charts" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Province Selector */}
              <Card>
                <CardHeader>
                  <CardTitle>İl Seçin</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={selectedProvince} onValueChange={setSelectedProvince}>
                    <SelectTrigger>
                      <SelectValue placeholder="Analiz edilecek ili seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {mapData.map((province) => (
                        <SelectItem key={province.province} value={province.province}>
                          {province.province}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Advanced Charts */}
              <div className="col-span-2">
                <PopulationCharts 
                  ageData={ageData?.years?.[selectedYear.toString() as '2023' | '2024'] || []}
                  populationData={mapData}
                  selectedProvince={selectedProvince}
                  year={selectedYear}
                  populationTrendData={populationTrendData}
                />
              </div>
            </div>
          </TabsContent>

          {/* Analysis Tab */}
          <TabsContent value="analysis" className="space-y-6">
            {analysis && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Nüfus Analizi
                    {analysis.province && (
                      <Badge variant="outline">{analysis.province}</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Analysis Message */}
                    {analysis.message && (
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-start gap-3">
                          <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                          <p className="text-blue-800">{analysis.message}</p>
                        </div>
                      </div>
                    )}

                    {/* Population Overview */}
                    {analysis.total_population && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                          <CardContent className="p-4 text-center">
                            <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                            <h3 className="font-semibold">Toplam Nüfus</h3>
                            <p className="text-2xl font-bold text-blue-600">
                              {analysis.total_population.toLocaleString('tr-TR')}
                            </p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4 text-center">
                            <User className="w-8 h-8 text-green-600 mx-auto mb-2" />
                            <h3 className="font-semibold">Erkek Nüfus</h3>
                            <p className="text-2xl font-bold text-green-600">
                              {analysis.male_ratio?.toFixed(1)}%
                            </p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4 text-center">
                            <UserCheck className="w-8 h-8 text-pink-600 mx-auto mb-2" />
                            <h3 className="font-semibold">Kadın Nüfus</h3>
                            <p className="text-2xl font-bold text-pink-600">
                              {analysis.female_ratio?.toFixed(1)}%
                            </p>
                          </CardContent>
                        </Card>
                      </div>
                    )}

                    {/* Age Distribution */}
                    {(analysis.young_ratio || analysis.middle_age_ratio || analysis.elderly_ratio) && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Yaş Grupları Dağılımı</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {analysis.young_ratio && (
                            <Card>
                              <CardContent className="p-4 text-center">
                                <h4 className="font-medium text-green-600">Genç Nüfus (0-24)</h4>
                                <p className="text-xl font-bold">{analysis.young_ratio.toFixed(1)}%</p>
                                <p className="text-sm text-gray-600">
                                  {analysis.young_population?.toLocaleString('tr-TR')} kişi
                                </p>
                              </CardContent>
                            </Card>
                          )}
                          {analysis.middle_age_ratio && (
                            <Card>
                              <CardContent className="p-4 text-center">
                                <h4 className="font-medium text-blue-600">Orta Yaş (25-54)</h4>
                                <p className="text-xl font-bold">{analysis.middle_age_ratio.toFixed(1)}%</p>
                                <p className="text-sm text-gray-600">
                                  {analysis.middle_age_population?.toLocaleString('tr-TR')} kişi
                                </p>
                              </CardContent>
                            </Card>
                          )}
                          {analysis.elderly_ratio && (
                            <Card>
                              <CardContent className="p-4 text-center">
                                <h4 className="font-medium text-purple-600">Yaşlı Nüfus (55+)</h4>
                                <p className="text-xl font-bold">{analysis.elderly_ratio.toFixed(1)}%</p>
                                <p className="text-sm text-gray-600">
                                  {analysis.elderly_population?.toLocaleString('tr-TR')} kişi
                                </p>
                              </CardContent>
                            </Card>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Population Trends */}
                    {analysis.population_change_ratio && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Nüfus Trendleri (2023-2024)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Card>
                            <CardContent className="p-4 text-center">
                              <h4 className="font-medium">Toplam Nüfus Değişimi</h4>
                              <p className={`text-xl font-bold ${
                                analysis.population_change_ratio > 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {analysis.population_change_ratio > 0 ? '+' : ''}{analysis.population_change_ratio.toFixed(2)}%
                              </p>
                            </CardContent>
                          </Card>
                          {analysis.young_population_change_ratio && (
                            <Card>
                              <CardContent className="p-4 text-center">
                                <h4 className="font-medium">Genç Nüfus Değişimi</h4>
                                <p className={`text-xl font-bold ${
                                  analysis.young_population_change_ratio > 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {analysis.young_population_change_ratio > 0 ? '+' : ''}{analysis.young_population_change_ratio.toFixed(2)}%
                                </p>
                              </CardContent>
                            </Card>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {!analysis && (
              <Card>
                <CardContent className="p-8 text-center">
                  <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">Analiz Bekleniyor</h3>
                  <p className="text-gray-500">
                    Yukarıdaki arama çubuğunu kullanarak bir il hakkında nüfus analizi yapabilir veya haritadan bir il seçebilirsiniz.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
