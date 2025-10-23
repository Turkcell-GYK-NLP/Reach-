import { BaseTool } from './baseTool.js';
import { ToolResult, ToolInput } from '../types.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface PopulationData {
  year: number;
  total_population: number;
  male_population: number;
  female_population: number;
  age_groups: {
    [ageGroup: string]: {
      total: number;
      male: number;
      female: number;
    };
  };
}

interface PopulationDataset {
  [year: string]: any;
}

export class PopulationAnalysisTool extends BaseTool {
  name = 'population_analysis';
  description = 'Nüfus verilerini analiz eder ve il bazında demografik bilgiler sağlar';
  
  private populationData: PopulationDataset | null = null;

  constructor() {
    super();
    this.loadPopulationData();
  }

  private loadPopulationData(): void {
    try {
      // Tam veriyi yükle (cinsiyet ve yaş verileri ile)
      // Production ortamında dosya yolu sorunları için farklı yollar dene
      const possiblePaths = [
        path.join(process.cwd(), 'nufus_verileri.json'),
        path.join(__dirname, '../../../nufus_verileri.json'),
        path.join(__dirname, '../../../../nufus_verileri.json'),
        path.join(__dirname, '../../../../../nufus_verileri.json'),
        './nufus_verileri.json',
        '/app/nufus_verileri.json', // Docker container path
        path.join(process.cwd(), '..', 'nufus_verileri.json'),
        path.join(process.cwd(), '..', '..', 'nufus_verileri.json')
      ];
      
      console.log('🔍 Nüfus verileri dosyası aranıyor...');
      console.log('Current working directory:', process.cwd());
      console.log('__dirname:', __dirname);
      
      let dataPath = null;
      for (const testPath of possiblePaths) {
        console.log(`Denenen yol: ${testPath}`);
        if (fs.existsSync(testPath)) {
          dataPath = testPath;
          console.log(`✅ Nüfus verileri dosyası bulundu: ${testPath}`);
          break;
        }
      }
      
      if (!dataPath) {
        console.error('❌ Hiçbir yolda nüfus verileri dosyası bulunamadı');
        console.error('Denenen yollar:', possiblePaths);
        throw new Error(`Nüfus verileri dosyası bulunamadı. Denenen yollar: ${possiblePaths.join(', ')}`);
      }
      
      const rawData = fs.readFileSync(dataPath, 'utf-8');
      this.populationData = JSON.parse(rawData);
      console.log('✅ Nüfus verileri yüklendi (cinsiyet ve yaş verileri ile)');
      console.log(`📊 Toplam ${Object.keys(this.populationData?.['2024'] || {}).length} il verisi yüklendi`);
    } catch (error) {
      console.error('❌ Nüfus verileri yüklenemedi:', error);
      this.populationData = null;
    }
  }

  async execute(input: ToolInput): Promise<ToolResult | null> {
    if (!this.populationData) {
      return this.createResult(
        'population_analysis',
        { error: 'Nüfus verileri yüklenemedi' },
        0
      );
    }

    try {
      const analysis = this.analyzePopulationQuery(input.query);
      return this.createResult(
        'population_analysis',
        analysis,
        0.9
      );
    } catch (error) {
      console.error('Nüfus analizi hatası:', error);
      return this.createResult(
        'population_analysis',
        { error: 'Nüfus analizi yapılamadı' },
        0
      );
    }
  }

  private analyzePopulationQuery(query: string): any {
    const lowerQuery = query.toLowerCase();
    
    // İl ismini çıkar
    const province = this.extractProvinceFromQuery(query);
    if (!province) {
      return this.getGeneralPopulationInfo();
    }

    // İl bazında analiz
    const provinceData = this.getProvinceData(province);
    if (!provinceData) {
      return { error: `${province} ili için veri bulunamadı` };
    }

    // Analiz türünü belirle
    if (lowerQuery.includes('genç') || lowerQuery.includes('yaş') || lowerQuery.includes('demografik')) {
      return this.analyzeAgeDistribution(province, provinceData);
    }
    
    if (lowerQuery.includes('cinsiyet') || lowerQuery.includes('erkek') || lowerQuery.includes('kadın')) {
      return this.analyzeGenderDistribution(province, provinceData);
    }
    
    if (lowerQuery.includes('trend') || lowerQuery.includes('değişim') || lowerQuery.includes('artış') || lowerQuery.includes('azalış')) {
      return this.analyzePopulationTrends(province);
    }

    // Genel il bilgisi
    return this.getProvinceOverview(province, provinceData);
  }

  private extractProvinceFromQuery(query: string): string | null {
    const metadata = this.populationData!.metadata as any;
    const provinces = metadata?.provinces || [];
    
    for (const province of provinces) {
      if (query.toLowerCase().includes(province.toLowerCase())) {
        return province;
      }
    }
    
    return null;
  }

  private getProvinceData(province: string): PopulationData | null {
    const data2024 = this.populationData!['2024'][province];
    return data2024 || null;
  }

  private getGeneralPopulationInfo(): any {
    const data2024 = this.populationData!['2024'] as any;
    const totalPopulation = Object.values(data2024).reduce((sum: number, province: any) => sum + province.total_population, 0);
    const metadata = this.populationData!.metadata as any;
    
    return {
      type: 'general_info',
      total_population: totalPopulation,
      total_provinces: metadata?.total_provinces || 0,
      message: `Türkiye genelinde 2024 yılında toplam ${totalPopulation.toLocaleString('tr-TR')} kişi yaşamaktadır.`
    };
  }

  private getProvinceOverview(province: string, data: PopulationData): any {
    const maleRatio = (data.male_population / data.total_population * 100).toFixed(1);
    const femaleRatio = (data.female_population / data.total_population * 100).toFixed(1);
    
    return {
      type: 'province_overview',
      province: province,
      year: data.year,
      total_population: data.total_population,
      male_population: data.male_population,
      female_population: data.female_population,
      male_ratio: parseFloat(maleRatio),
      female_ratio: parseFloat(femaleRatio),
      message: `${province} ilinde 2024 yılında toplam ${data.total_population.toLocaleString('tr-TR')} kişi yaşamaktadır. Nüfusun %${maleRatio}'i erkek, %${femaleRatio}'i kadındır.`
    };
  }

  private analyzeAgeDistribution(province: string, data: PopulationData): any {
    const ageGroups = data.age_groups;
    
    // Genç nüfus (0-24)
    const youngPopulation = this.calculateAgeGroupTotal(ageGroups, ['0-4', '5-9', '10-14', '15-19', '20-24']);
    const youngRatio = (youngPopulation / data.total_population * 100).toFixed(1);
    
    // Orta yaş nüfus (25-54)
    const middleAgePopulation = this.calculateAgeGroupTotal(ageGroups, ['25-29', '30-34', '35-39', '40-44', '45-49', '50-54']);
    const middleAgeRatio = (middleAgePopulation / data.total_population * 100).toFixed(1);
    
    // Yaşlı nüfus (55+)
    const elderlyPopulation = this.calculateAgeGroupTotal(ageGroups, ['55-59', '60-64', '65-69', '70-74', '75-79', '80-84', '85-89', '90+']);
    const elderlyRatio = (elderlyPopulation / data.total_population * 100).toFixed(1);
    
    return {
      type: 'age_distribution',
      province: province,
      year: data.year,
      young_population: youngPopulation,
      young_ratio: parseFloat(youngRatio),
      middle_age_population: middleAgePopulation,
      middle_age_ratio: parseFloat(middleAgeRatio),
      elderly_population: elderlyPopulation,
      elderly_ratio: parseFloat(elderlyRatio),
      message: `${province} ilinde yaş dağılımı: Genç nüfus (0-24 yaş) %${youngRatio}, Orta yaş nüfus (25-54 yaş) %${middleAgeRatio}, Yaşlı nüfus (55+ yaş) %${elderlyRatio}`
    };
  }

  private analyzeGenderDistribution(province: string, data: PopulationData): any {
    const maleRatio = (data.male_population / data.total_population * 100).toFixed(1);
    const femaleRatio = (data.female_population / data.total_population * 100).toFixed(1);
    
    return {
      type: 'gender_distribution',
      province: province,
      year: data.year,
      male_population: data.male_population,
      female_population: data.female_population,
      male_ratio: parseFloat(maleRatio),
      female_ratio: parseFloat(femaleRatio),
      message: `${province} ilinde cinsiyet dağılımı: Erkek nüfus %${maleRatio} (${data.male_population.toLocaleString('tr-TR')} kişi), Kadın nüfus %${femaleRatio} (${data.female_population.toLocaleString('tr-TR')} kişi)`
    };
  }

  private analyzePopulationTrends(province: string): any {
    const data2024 = this.populationData!['2024'][province];
    const data2023 = this.populationData!['2023'][province];
    
    if (!data2024 || !data2023) {
      return { error: `${province} ili için trend analizi yapılamadı` };
    }
    
    const populationChange = data2024.total_population - data2023.total_population;
    const changeRatio = (populationChange / data2023.total_population * 100).toFixed(2);
    
    // Genç nüfus değişimi
    const young2024 = this.calculateAgeGroupTotal(data2024.age_groups, ['0-4', '5-9', '10-14', '15-19', '20-24']);
    const young2023 = this.calculateAgeGroupTotal(data2023.age_groups, ['0-4', '5-9', '10-14', '15-19', '20-24']);
    const youngChange = young2024 - young2023;
    const youngChangeRatio = (youngChange / young2023 * 100).toFixed(2);
    
    let trendMessage = `${province} ilinde 2023-2024 arası toplam nüfus ${populationChange > 0 ? 'artış' : 'azalış'} gösterdi (${changeRatio}%). `;
    
    if (Math.abs(parseFloat(youngChangeRatio)) > 1) {
      trendMessage += `Genç nüfus oranı ${parseFloat(youngChangeRatio) > 0 ? 'artış' : 'azalış'} gösterdi (${youngChangeRatio}%).`;
    }
    
    return {
      type: 'population_trends',
      province: province,
      population_change: populationChange,
      population_change_ratio: parseFloat(changeRatio),
      young_population_change: youngChange,
      young_population_change_ratio: parseFloat(youngChangeRatio),
      message: trendMessage
    };
  }

  private calculateAgeGroupTotal(ageGroups: any, targetGroups: string[]): number {
    return targetGroups.reduce((total, group) => {
      return total + (ageGroups[group]?.total || 0);
    }, 0);
  }

  // Harita ve grafik için veri sağlama metodları
  getMapData(): any {
    if (!this.populationData) return null;
    
    const data2024 = this.populationData['2024'];
    
    // 2023 verilerini trend dosyasından al
    let data2023 = null;
    try {
      const possibleTrendPaths = [
        path.join(process.cwd(), 'nufus_trend_verileri.json'),
        path.join(__dirname, '../../../nufus_trend_verileri.json'),
        path.join(__dirname, '../../../../nufus_trend_verileri.json'),
        path.join(__dirname, '../../../../../nufus_trend_verileri.json'),
        './nufus_trend_verileri.json',
        '/app/nufus_trend_verileri.json', // Docker container path
        path.join(process.cwd(), '..', 'nufus_trend_verileri.json'),
        path.join(process.cwd(), '..', '..', 'nufus_trend_verileri.json')
      ];
      
      console.log('🔍 Trend verileri dosyası aranıyor...');
      let trendDataPath = null;
      for (const testPath of possibleTrendPaths) {
        console.log(`Trend dosyası denenen yol: ${testPath}`);
        if (fs.existsSync(testPath)) {
          trendDataPath = testPath;
          console.log(`✅ Trend verileri dosyası bulundu: ${testPath}`);
          break;
        }
      }
      
      if (trendDataPath) {
        const trendRawData = fs.readFileSync(trendDataPath, 'utf-8');
        const trendData = JSON.parse(trendRawData);
        data2023 = trendData['2023'];
        console.log('✅ 2023 trend verileri yüklendi');
      } else {
        console.warn('⚠️ Trend verileri dosyası bulunamadı, sadece 2024 verileri kullanılacak');
      }
    } catch (error) {
      console.error('❌ Trend verileri yüklenemedi:', error);
    }
    
    return Object.entries(data2024).map(([province, data]: [string, any]) => {
      const currentPopulation = data.total_population;
      const previousPopulation = data2023?.[province]?.total_population;
      
      // Nüfus değişimini hesapla
      let populationChange = 0;
      let changePercentage = 0;
      let trend = 'stable';
      
      if (previousPopulation && previousPopulation > 0) {
        populationChange = currentPopulation - previousPopulation;
        changePercentage = (populationChange / previousPopulation * 100);
        trend = populationChange > 0 ? 'up' : populationChange < 0 ? 'down' : 'stable';
      }
      
      return {
        province,
        total_population: currentPopulation,
        male_population: data.male_population || 0,
        female_population: data.female_population || 0,
        male_ratio: currentPopulation > 0 ? ((data.male_population || 0) / currentPopulation * 100).toFixed(1) : '0.0',
        female_ratio: currentPopulation > 0 ? ((data.female_population || 0) / currentPopulation * 100).toFixed(1) : '0.0',
        population_change: populationChange,
        change_percentage: changePercentage,
        trend: trend
      };
    });
  }

  getAgeDistributionData(province?: string): any {
    if (!this.populationData) return null;
    
    if (province) {
      const data2024 = this.populationData['2024'][province];
      const data2023 = this.populationData['2023'][province];
      
      if (!data2024 || !data2023) return null;
      
      return {
        province,
        years: {
          2023: this.formatAgeData(data2023),
          2024: this.formatAgeData(data2024)
        }
      };
    }
    
    // Tüm iller için genel yaş dağılımı
    const data2024 = this.populationData['2024'];
    const totalAgeGroups: { [key: string]: number } = {};
    
    Object.values(data2024).forEach((provinceData: any) => {
      if (provinceData.age_groups) {
        Object.entries(provinceData.age_groups).forEach(([ageGroup, data]: [string, any]) => {
          totalAgeGroups[ageGroup] = (totalAgeGroups[ageGroup] || 0) + data.total;
        });
      }
    });
    
    return {
      type: 'national',
      years: {
        2024: this.formatAgeDataFromGroups(totalAgeGroups)
      }
    };
  }

  private formatAgeData(data: PopulationData): any {
    if (!data.age_groups) {
      return [];
    }
    return Object.entries(data.age_groups).map(([ageGroup, groupData]: [string, any]) => ({
      ageGroup,
      total: groupData.total,
      male: groupData.male,
      female: groupData.female
    }));
  }

  private formatAgeDataFromGroups(ageGroups: { [key: string]: number }): any {
    return Object.entries(ageGroups).map(([ageGroup, total]) => ({
      ageGroup,
      total,
      male: 0, // Bu veri mevcut değil
      female: 0 // Bu veri mevcut değil
    }));
  }

  // Nüfus trend verisi sağlama metodu (son 10 yıl)
  getPopulationTrendData(province: string): any {
    try {
      // Trend verilerini ayrı dosyadan yükle
      const possibleTrendPaths = [
        path.join(process.cwd(), 'nufus_trend_verileri.json'),
        path.join(__dirname, '../../../nufus_trend_verileri.json'),
        path.join(__dirname, '../../../../nufus_trend_verileri.json'),
        path.join(__dirname, '../../../../../nufus_trend_verileri.json'),
        './nufus_trend_verileri.json',
        '/app/nufus_trend_verileri.json', // Docker container path
        path.join(process.cwd(), '..', 'nufus_trend_verileri.json'),
        path.join(process.cwd(), '..', '..', 'nufus_trend_verileri.json')
      ];
      
      console.log(`🔍 ${province} ili için trend verileri aranıyor...`);
      let trendDataPath = null;
      for (const testPath of possibleTrendPaths) {
        console.log(`Trend dosyası denenen yol: ${testPath}`);
        if (fs.existsSync(testPath)) {
          trendDataPath = testPath;
          console.log(`✅ Trend verileri dosyası bulundu: ${testPath}`);
          break;
        }
      }
      
      if (trendDataPath) {
        const trendRawData = fs.readFileSync(trendDataPath, 'utf-8');
        const trendData = JSON.parse(trendRawData);
        
        const result = [];
        const years = ['2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024'];
        
        for (const year of years) {
          const yearData = trendData[year];
          if (yearData && yearData[province]) {
            const provinceData = yearData[province];
            result.push({
              year: parseInt(year),
              nüfus: provinceData.total_population,
              nüfus_milyon: (provinceData.total_population / 1000000).toFixed(2)
            });
          }
        }
        
        console.log(`✅ ${province} ili için ${result.length} yıllık trend verisi bulundu`);
        return result.sort((a, b) => a.year - b.year);
      } else {
        console.warn(`⚠️ ${province} ili için trend verileri dosyası bulunamadı`);
      }
    } catch (error) {
      console.error('❌ Trend verileri yüklenemedi:', error);
    }
    
    return null;
  }
}
