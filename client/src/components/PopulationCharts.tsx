import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import { TrendingUp, Users, User, UserCheck } from 'lucide-react';

interface AgeGroupData {
  ageGroup: string;
  total: number;
  male: number;
  female: number;
}

interface PopulationData {
  province: string;
  total_population: number;
  male_population: number;
  female_population: number;
  male_ratio: string;
  female_ratio: string;
}

interface PopulationChartsProps {
  ageData: AgeGroupData[];
  populationData: PopulationData[];
  selectedProvince?: string;
  year?: number;
  populationTrendData?: any[];
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];

export default function PopulationCharts({ 
  ageData, 
  populationData, 
  selectedProvince, 
  year = 2024,
  populationTrendData = []
}: PopulationChartsProps) {
  
  // Yaş grupları için veri hazırlama
  const prepareAgeData = (data: AgeGroupData[]) => {
    return data.map(item => ({
      ...item,
      ageGroup: item.ageGroup.replace('-', '-'),
      malePercentage: ((item.male / item.total) * 100).toFixed(1),
      femalePercentage: ((item.female / item.total) * 100).toFixed(1)
    }));
  };

  // Cinsiyet dağılımı için veri hazırlama
  const prepareGenderData = (data: PopulationData[]) => {
    return data.slice(0, 10).map(item => ({
      province: item.province,
      erkek: parseInt(item.male_ratio),
      kadın: parseInt(item.female_ratio)
    }));
  };

  // Nüfus yoğunluğu için veri hazırlama

  // Yaş grupları kategorileri
  const categorizeAgeGroups = (data: AgeGroupData[]) => {
    const categories = {
      'Genç (0-24)': 0,
      'Orta Yaş (25-54)': 0,
      'Yaşlı (55+)': 0
    };

    data.forEach(item => {
      const age = parseInt(item.ageGroup.split('-')[0]);
      if (age <= 24) {
        categories['Genç (0-24)'] += item.total;
      } else if (age <= 54) {
        categories['Orta Yaş (25-54)'] += item.total;
      } else {
        categories['Yaşlı (55+)'] += item.total;
      }
    });

    return Object.entries(categories).map(([category, total]) => ({
      category,
      total,
      percentage: ((total / data.reduce((sum, item) => sum + item.total, 0)) * 100).toFixed(1)
    }));
  };

  const processedAgeData = prepareAgeData(ageData);
  const genderData = prepareGenderData(populationData);
  const ageCategories = categorizeAgeGroups(ageData);

  return (
    <div className="space-y-6">
      {/* Yaş Dağılımı Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Yaş Grupları Dağılımı {selectedProvince && `- ${selectedProvince}`} ({year})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={processedAgeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="ageGroup" 
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
              />
              <YAxis />
              <Tooltip 
                formatter={(value: number, name: string, props: any) => {
                  const dataKey = props.dataKey;
                  let label = 'Bilinmiyor';
                  if (dataKey === 'total') label = 'Toplam';
                  else if (dataKey === 'male') label = 'Erkek';
                  else if (dataKey === 'female') label = 'Kadın';
                  return [value.toLocaleString('tr-TR'), label];
                }}
                labelFormatter={(label) => `Yaş Grubu: ${label}`}
              />
              <Legend />
              <Bar dataKey="total" fill="#3B82F6" name="Toplam" />
              <Bar dataKey="male" fill="#10B981" name="Erkek" />
              <Bar dataKey="female" fill="#F59E0B" name="Kadın" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Yaş Kategorileri Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Yaş Kategorileri Dağılımı ({year})
          </CardTitle>
        </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={ageCategories}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, percentage }) => `${category}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="total"
                >
                  {ageCategories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [value.toLocaleString('tr-TR'), 'Nüfus']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Nüfus Trend Analizi */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Nüfus Trend Analizi {selectedProvince && `- ${selectedProvince}`} (Son 10 Yıl)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {populationTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={populationTrendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="year" 
                    tick={{ fontSize: 12 }}
                    tickLine={{ stroke: '#666' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickLine={{ stroke: '#666' }}
                    tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                  />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      `${(value / 1000000).toFixed(2)} Milyon`, 
                      'Nüfus'
                    ]}
                    labelFormatter={(label) => `Yıl: ${label}`}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #ccc',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="nüfus" 
                    stroke="#3B82F6" 
                    strokeWidth={3}
                    name="Nüfus"
                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 7, stroke: '#3B82F6', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Seçilen il için nüfus trend verisi bulunamadı</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>


      {/* Yaş Dağılımı Line Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Yaş Grupları Trend Analizi {selectedProvince && `- ${selectedProvince}`} ({year})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={processedAgeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="ageGroup" 
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
              />
              <YAxis />
              <Tooltip 
                formatter={(value: number, name: string, props: any) => {
                  const dataKey = props.dataKey;
                  let label = 'Bilinmiyor';
                  if (dataKey === 'total') label = 'Toplam';
                  else if (dataKey === 'male') label = 'Erkek';
                  else if (dataKey === 'female') label = 'Kadın';
                  return [value.toLocaleString('tr-TR'), label];
                }}
                labelFormatter={(label) => `Yaş Grubu: ${label}`}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="total" 
                stroke="#3B82F6" 
                strokeWidth={3}
                name="Toplam"
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="male" 
                stroke="#10B981" 
                strokeWidth={2}
                name="Erkek"
                dot={{ fill: '#10B981', strokeWidth: 2, r: 3 }}
              />
              <Line 
                type="monotone" 
                dataKey="female" 
                stroke="#F59E0B" 
                strokeWidth={2}
                name="Kadın"
                dot={{ fill: '#F59E0B', strokeWidth: 2, r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
