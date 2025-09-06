import { BaseTool } from './baseTool.js';
import { ToolInput, ToolResult } from '../types.js';

export class WebSearchTool extends BaseTool {
  name = 'websearch';
  description = 'Web araması yapar, gerçek zamanlı veri toplar ve analiz eder';

  private keywords = [
    'araştır', 'internet', 'web', 'güncel', 'son veriler', 'istatistik',
    'nüfus', 'yoğunluk', 'operatör', 'karşılaştır', 'hangi', 'en iyi',
    'türk telekom', 'vodafone', 'turkcell', 'kapsama', 'hız', 'fiyat',
    'genç nüfus', 'demografi', 'yaş dağılımı', 'nüfus yoğunluğu'
  ];

  async execute(input: ToolInput): Promise<ToolResult | null> {
    const { query, userContext } = input;

    if (!this.shouldExecute(query, this.keywords)) {
      return null;
    }

    try {
      const searchResults = await this.performWebSearch(query, userContext);
      
      return this.createResult('websearch', {
        query,
        results: searchResults,
        location: userContext.location?.district || 'İstanbul',
        timestamp: new Date()
      }, 0.85);
    } catch (error) {
      console.error('WebSearchTool error:', error);
      return this.createResult('websearch', {
        query,
        results: [],
        error: 'Web araması yapılamadı',
        location: userContext.location?.district || 'Bilinmiyor'
      }, 0.1);
    }
  }

  private async performWebSearch(query: string, userContext: any): Promise<SearchResult[]> {
    // Gerçek web search implementasyonu için bir API kullanılabilir
    // Şimdilik mock data ile çalışıyoruz
    
    const location = userContext.location?.district || 'İstanbul';
    const lowerQuery = query.toLowerCase();

    // Operatör karşılaştırması
    if (this.isOperatorComparisonQuery(lowerQuery)) {
      return this.getOperatorComparisonData(location);
    }

    // Nüfus yoğunluğu sorgusu
    if (this.isPopulationDensityQuery(lowerQuery)) {
      return this.getPopulationDensityData(location);
    }

    // Genel web araması
    return this.getGeneralSearchResults(query, location);
  }

  private isOperatorComparisonQuery(query: string): boolean {
    const operatorKeywords = [
      'operatör', 'türk telekom', 'vodafone', 'turkcell', 'hangi operatör',
      'en iyi operatör', 'karşılaştır', 'seç', 'öner'
    ];
    return operatorKeywords.some(keyword => query.includes(keyword));
  }

  private isPopulationDensityQuery(query: string): boolean {
    const populationKeywords = [
      'nüfus', 'yoğunluk', 'genç nüfus', 'demografi', 'yaş dağılımı',
      'nüfus yoğunluğu', 'gençlik', 'öğrenci', 'üniversite'
    ];
    return populationKeywords.some(keyword => query.includes(keyword));
  }

  private getOperatorComparisonData(location: string): SearchResult[] {
    // Gerçek implementasyonda bu veriler web API'lerinden gelecek
    const operators = [
      {
        name: 'Türk Telekom',
        coverage: this.getRandomCoverage(85, 95),
        speed: this.getRandomSpeed(80, 120),
        price: 'Orta',
        advantages: ['En geniş kapsama', 'Stabil bağlantı', 'Müşteri hizmetleri'],
        disadvantages: ['Yüksek fiyat', 'Bazen yavaş'],
        score: 8.5
      },
      {
        name: 'Vodafone',
        coverage: this.getRandomCoverage(80, 90),
        speed: this.getRandomSpeed(90, 140),
        price: 'Yüksek',
        advantages: ['Hızlı internet', '5G desteği', 'Modern altyapı'],
        disadvantages: ['Kısıtlı kapsama', 'Pahalı'],
        score: 8.2
      },
      {
        name: 'Turkcell',
        coverage: this.getRandomCoverage(88, 98),
        speed: this.getRandomSpeed(75, 110),
        price: 'Düşük',
        advantages: ['Uygun fiyat', 'Geniş kapsama', 'Kampanyalar'],
        disadvantages: ['Bazen yavaş', 'Eski altyapı'],
        score: 7.8
      }
    ];

    return [{
      title: `${location} Operatör Karşılaştırması`,
      url: 'https://example.com/operator-comparison',
      snippet: `${location} bölgesinde operatör performans analizi`,
      content: this.formatOperatorComparison(operators, location),
      relevanceScore: 0.95,
      publishDate: new Date().toISOString()
    }];
  }

  private getPopulationDensityData(location: string): SearchResult[] {
    // Gerçek implementasyonda TÜİK verilerinden gelecek
    const populationData = {
      totalPopulation: this.getRandomPopulation(50000, 500000),
      youthPopulation: this.getRandomPopulation(15000, 150000),
      youthPercentage: 0,
      ageGroups: {
        '0-14': this.getRandomPercentage(15, 25),
        '15-24': this.getRandomPercentage(20, 35),
        '25-34': this.getRandomPercentage(15, 25),
        '35-44': this.getRandomPercentage(10, 20),
        '45+': this.getRandomPercentage(10, 25)
      },
      density: this.getRandomDensity(500, 5000),
      universityCount: this.getRandomCount(1, 5),
      studentCount: this.getRandomCount(5000, 50000)
    };

    populationData.youthPercentage = (populationData.youthPopulation / populationData.totalPopulation) * 100;

    return [{
      title: `${location} Nüfus ve Demografi Analizi`,
      url: 'https://example.com/population-data',
      snippet: `${location} bölgesi nüfus yoğunluğu ve genç nüfus oranı`,
      content: this.formatPopulationData(populationData, location),
      relevanceScore: 0.92,
      publishDate: new Date().toISOString()
    }];
  }

  private getGeneralSearchResults(query: string, location: string): SearchResult[] {
    return [{
      title: `${query} - ${location} için arama sonuçları`,
      url: 'https://example.com/search-results',
      snippet: `${query} konusunda ${location} için güncel bilgiler`,
      content: `Arama sorgusu: "${query}"\nKonum: ${location}\n\nBu konuda daha detaylı bilgi için spesifik sorular sorabilirsiniz.`,
      relevanceScore: 0.7,
      publishDate: new Date().toISOString()
    }];
  }

  private formatOperatorComparison(operators: any[], location: string): string {
    let content = `${location} Bölgesi Operatör Karşılaştırması:\n\n`;
    
    operators.forEach((op, index) => {
      content += `${index + 1}. ${op.name}\n`;
      content += `   Kapsama: %${op.coverage}\n`;
      content += `   Hız: ${op.speed} Mbps\n`;
      content += `   Fiyat: ${op.price}\n`;
      content += `   Puan: ${op.score}/10\n`;
      content += `   Avantajlar: ${op.advantages.join(', ')}\n`;
      content += `   Dezavantajlar: ${op.disadvantages.join(', ')}\n\n`;
    });

    // En iyi öneri
    const bestOperator = operators.reduce((best, current) => 
      current.score > best.score ? current : best
    );

    content += `🏆 ÖNERİ: ${bestOperator.name}\n`;
    content += `Neden: ${bestOperator.advantages[0]} ve ${bestOperator.advantages[1]}`;

    return content;
  }

  private formatPopulationData(data: any, location: string): string {
    let content = `${location} Nüfus ve Demografi Analizi:\n\n`;
    
    content += `📊 Genel Bilgiler:\n`;
    content += `• Toplam Nüfus: ${data.totalPopulation.toLocaleString()}\n`;
    content += `• Genç Nüfus (15-24): ${data.youthPopulation.toLocaleString()} (%${data.youthPercentage.toFixed(1)})\n`;
    content += `• Nüfus Yoğunluğu: ${data.density} kişi/km²\n\n`;
    
    content += `🎓 Eğitim:\n`;
    content += `• Üniversite Sayısı: ${data.universityCount}\n`;
    content += `• Öğrenci Sayısı: ${data.studentCount.toLocaleString()}\n\n`;
    
    content += `👥 Yaş Dağılımı:\n`;
    Object.entries(data.ageGroups).forEach(([age, percentage]) => {
      content += `• ${age} yaş: %${percentage}\n`;
    });

    content += `\n💡 Analiz:\n`;
    if (data.youthPercentage > 30) {
      content += `• Bu bölge genç nüfus yoğunluğu yüksek\n`;
      content += `• Mobil internet talebi yüksek olabilir\n`;
      content += `• 5G ve hızlı internet önemli\n`;
    } else if (data.youthPercentage > 20) {
      content += `• Bu bölge orta düzeyde genç nüfus\n`;
      content += `• Dengeli operatör seçimi yapılabilir\n`;
    } else {
      content += `• Bu bölge daha yaşlı nüfus ağırlıklı\n`;
      content += `• Kapsama ve güvenilirlik öncelikli\n`;
    }

    return content;
  }

  private getRandomCoverage(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private getRandomSpeed(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private getRandomPopulation(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private getRandomPercentage(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private getRandomDensity(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private getRandomCount(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  content: string;
  relevanceScore: number;
  publishDate: string;
}
