import { BaseTool } from './baseTool.js';
import { ToolInput, ToolResult } from '../types.js';

export class WebSearchTool extends BaseTool {
  name = 'websearch';
  description = 'Web araması yapar, gerçek zamanlı veri toplar ve analiz eder';

  private keywords = [
    'araştır', 'internet', 'web', 'güncel', 'son veriler', 'istatistik',
    'nüfus', 'yoğunluk', 'operatör', 'karşılaştır', 'hangi', 'en iyi',
    'türk telekom', 'vodafone', 'turkcell', 'kapsama', 'hız', 'fiyat',
    'genç nüfus', 'demografi', 'yaş dağılımı', 'nüfus yoğunluğu',
    'toplanma alanı', 'toplanma', 'güvenli alan', 'park', 'meydan',
    'mahalle', 'ilçe', 'bölge', 'konum', 'nerede', 'yakın',
    'koordinat', 'alan', 'elektrik', 'su', 'wc', 'kanalizasyon', 
    'altyapı', 'ulaşım', 'esenler', 'menderes', 'bağcılar', 'kadıköy',
    'beşiktaş', 'şişli', 'fatih', 'beyoğlu', 'üsküdar', 'sarıyer', 'ataşehir'
  ];

  async execute(input: ToolInput): Promise<ToolResult | null> {
    const { query, userContext } = input;

    if (!this.shouldExecute(query, this.keywords)) {
      return null;
    }

    try {
      console.log(`🔍 WebSearchTool: Searching for "${query}" in location: ${userContext.location?.district || 'Esenler'}`);
      const searchResults = await this.performWebSearch(query, userContext);
      
      return this.createResult('websearch', {
        query,
        results: searchResults,
        location: userContext.location?.district || 'Esenler',
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
    const location = userContext.location?.district || 'Esenler';
    const lowerQuery = query.toLowerCase();

    // Toplanma alanları sorgusu
    if (this.isToplanmaAlaniQuery(lowerQuery)) {
      return await this.searchToplanmaAlanlari(query, location);
    }

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

  private isToplanmaAlaniQuery(query: string): boolean {
    const toplanmaKeywords = [
      'toplanma alanı', 'toplanma', 'güvenli alan', 'park', 'meydan',
      'mahalle', 'ilçe', 'bölge', 'konum', 'nerede', 'yakın',
      'koordinat', 'alan', 'elektrik', 'su', 'wc', 'kanalizasyon', 
      'altyapı', 'ulaşım', 'acil durum', 'afet', 'acil toplanma',
      'esenler', 'menderes', 'bağcılar', 'kadıköy', 'beşiktaş', 
      'şişli', 'fatih', 'beyoğlu', 'üsküdar', 'sarıyer', 'ataşehir',
      'beykoz', 'bakırköy', 'bayrampaşa', 'eyüpsultan', 'gaziosmanpaşa',
      'küçükçekmece', 'pendik', 'sultanbeyli', 'sultangazi', 'tuzla',
      'ümraniye', 'şile'
    ];
    
    const isToplanma = toplanmaKeywords.some(keyword => query.includes(keyword));
    console.log(`🔍 isToplanmaAlaniQuery - Query: "${query}", Sonuç: ${isToplanma}`);
    
    if (isToplanma) {
      const matchedKeywords = toplanmaKeywords.filter(keyword => query.includes(keyword));
      console.log(`✅ Eşleşen anahtar kelimeler: ${matchedKeywords.join(', ')}`);
    }
    
    return isToplanma;
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

  /**
   * Static data fallback - Python ve JSON fallback başarısız olursa
   */
  private async performStaticDataFallback(query: string, location: string): Promise<SearchResult[]> {
    console.log(`📚 Static data fallback: "${query}" in ${location}`);
    
    const lowerQuery = query.toLowerCase();
    
    // Hastane araması için static data
    if (lowerQuery.includes('hastane') || lowerQuery.includes('doktor')) {
      return [{
        title: 'Hastane Bilgisi - Acil Durum',
        url: 'local://hastane-bilgi',
        snippet: 'Acil durumlarda hastane bilgileri',
        content: `Acil durumlarda hastane bilgileri için:
• 112 Acil Çağrı Merkezi'ni arayın
• En yakın sağlık kuruluşuna başvurun
• Ambulans hizmeti için 112'yi arayın
• Acil servis bilgileri için hastaneleri arayın`,
        relevanceScore: 0.7,
        publishDate: new Date().toISOString()
      }];
    }
    
    // İlkyardım araması için static data
    if (lowerQuery.includes('ilkyardım') || lowerQuery.includes('yaşam üçgeni')) {
      return [{
        title: 'İlkyardım Bilgileri - Yaşam Üçgeni',
        url: 'local://ilkyardim-bilgi',
        snippet: 'Deprem anında yaşam üçgeni oluşturma',
        content: `Deprem anında yaşam üçgeni oluşturmak için:
1. Sağlam masa, sıra veya yatak yanına geçin
2. Çömel, kapan, tutun pozisyonu alın
3. Başınızı ve boynunuzu koruyacak şekilde kapanın
4. Pencerelerden, ağır eşyalardan uzak durun
5. Asansör kullanmayın, merdivenlerden inmeyin
6. Dışarı çıkmaya çalışmayın, içeride kalın`,
        relevanceScore: 0.8,
        publishDate: new Date().toISOString()
      }];
    }
    
    // Konum araması için static data
    if (lowerQuery.includes('konum') || lowerQuery.includes('nerede')) {
      return [{
        title: 'Konum Bilgileri',
        url: 'local://konum-bilgi',
        snippet: 'Konum ve güvenli alan bilgileri',
        content: `Konum bilgileri için:
• GPS koordinatlarınızı kontrol edin
• En yakın güvenli alanları arayın
• Toplanma alanlarını öğrenin
• Acil durum planınızı hazırlayın`,
        relevanceScore: 0.6,
        publishDate: new Date().toISOString()
      }];
    }
    
    // Genel fallback
    return [{
      title: 'Genel Bilgi',
      url: 'local://genel-bilgi',
      snippet: 'Genel bilgi ve yardım',
      content: `"${query}" konusunda detaylı bilgi için:
• 112 Acil Çağrı Merkezi'ni arayın
• Daha spesifik bir soru sorun
• Acil durumlarda profesyonel yardım alın`,
      relevanceScore: 0.4,
      publishDate: new Date().toISOString()
    }];
  }

  private async searchToplanmaAlanlari(query: string, location: string): Promise<SearchResult[]> {
    console.log(`🔍 searchToplanmaAlanlari çağrıldı - Query: "${query}", Location: "${location}"`);
    
    try {
      // Önce FAISS search'i dene
      console.log('🚀 FAISS search deneniyor...');
      const faissResults = await this.performFaissSearch(query);
      console.log(`📊 FAISS sonuçları: ${faissResults.length} adet`);
      
      // Eğer FAISS sonuç vermezse veya sonuçlar yetersizse, fallback kullan
      if (faissResults.length === 0 || faissResults.every(r => r.relevanceScore < 0.1)) {
        console.log('⚠️ FAISS search sonuç vermedi veya yetersiz, fallback kullanılıyor...');
        const fallbackResults = await this.performFallbackSearch(query, location);
        console.log(`📊 Fallback sonuçları: ${fallbackResults.length} adet`);
        
        // Fallback de sonuç vermezse, static data fallback'i kullan
        if (fallbackResults.length === 0) {
          console.log('⚠️ Fallback de sonuç vermedi, static data fallback kullanılıyor...');
          return await this.performStaticDataFallback(query, location);
        }
        
        return fallbackResults;
      }
      
      console.log('✅ FAISS search başarılı, sonuçlar döndürülüyor');
      return faissResults;
    } catch (error) {
      console.error('❌ FAISS arama hatası, fallback kullanılıyor:', error);
      const fallbackResults = await this.performFallbackSearch(query, location);
      console.log(`📊 Fallback sonuçları: ${fallbackResults.length} adet`);
      
      // Fallback de sonuç vermezse, static data fallback'i kullan
      if (fallbackResults.length === 0) {
        console.log('⚠️ Fallback de sonuç vermedi, static data fallback kullanılıyor...');
        return await this.performStaticDataFallback(query, location);
      }
      
      return fallbackResults;
    }
  }

  private async performFaissSearch(query: string): Promise<SearchResult[]> {
    const { spawn } = await import('child_process');
    const path = await import('path');
    
    const pythonScript = path.join(process.cwd(), 'faiss_search.py');
    const pythonProcess = spawn('python3', [pythonScript, query], {
      cwd: process.cwd(),
      env: { 
        ...process.env, 
        PATH: process.env.PATH,
        VIRTUAL_ENV: path.join(process.cwd(), 'venv'),
        PYTHONPATH: path.join(process.cwd(), 'venv', 'lib', 'python3.11', 'site-packages')
      }
    });

    return new Promise((resolve, reject) => {
      let output = '';
      let errorOutput = '';

      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          try {
            const results = JSON.parse(output);
            const searchResults = results.map((result: any) => ({
              title: `${result.metadata.alan_adi} - ${result.metadata.ilce}`,
              url: `local://toplanma-alanlari/${result.metadata.ilce}/${result.metadata.alan_id}`,
              snippet: `${result.metadata.mahalle} mahallesinde bulunan ${result.metadata.alan_adi}`,
              content: this.formatToplanmaAlaniResult(result),
              relevanceScore: result.similarity,
              publishDate: new Date().toISOString()
            }));
            resolve(searchResults);
          } catch (parseError) {
            reject(new Error(`JSON parse hatası: ${parseError}`));
          }
        } else {
          reject(new Error(`Python script hatası: ${errorOutput}`));
        }
      });

      pythonProcess.on('error', (error) => {
        reject(new Error(`Python process hatası: ${error}`));
      });
    });
  }

  private async performFallbackSearch(query: string, location: string): Promise<SearchResult[]> {
    console.log(`🔄 performFallbackSearch çağrıldı - Query: "${query}", Location: "${location}"`);
    
    try {
      const fs = await import('fs');
      const path = await import('path');
      
      const dataDir = path.join(process.cwd(), 'new_datas');
      const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json') && f !== '00_ozet.json');
      console.log(`📁 Bulunan JSON dosyaları: ${files.length} adet`);
      
      const results: SearchResult[] = [];
      const lowerQuery = query.toLowerCase();
      console.log(`🔍 Arama sorgusu (küçük harf): "${lowerQuery}"`);
      
      // Query'den anahtar kelimeleri çıkar (bir kez)
      const queryKeywords = this.extractKeywords(lowerQuery);
      console.log(`🔑 Çıkarılan anahtar kelimeler: ${queryKeywords.join(', ')}`);
      
      for (const file of files) {
        try {
          const filePath = path.join(dataDir, file);
          const fileContent = fs.readFileSync(filePath, 'utf-8');
          const data = JSON.parse(fileContent);
          
          const ilce = data.ilce?.toLowerCase() || '';
          const toplanmaAlanlari = data.toplanma_alanlari || [];
          console.log(`📄 ${file} - İlçe: ${ilce}, Alan sayısı: ${toplanmaAlanlari.length}`);
          
          // İlçe eşleşme skoru hesapla
          const ilceScore = this.calculateSimilarity(lowerQuery, ilce);
          console.log(`📊 ${ilce} ilçe skoru: ${ilceScore}`);
          
          // Eğer ilçe skoru yeterliyse veya genel arama ise
          if (ilceScore > 0.3 || lowerQuery.includes('toplanma') || lowerQuery.includes('alan')) {
            console.log(`✅ ${file} eşleşti (skor: ${ilceScore}), alanlar aranıyor...`);
            
            for (const alan of toplanmaAlanlari) {
              const mahalle = alan.mahalle?.toLowerCase() || '';
              const alanAdi = alan.ad?.toLowerCase() || '';
              
              // Mahalle ve alan adı skorlarını hesapla
              const mahalleScore = this.calculateSimilarity(lowerQuery, mahalle);
              const alanScore = this.calculateSimilarity(lowerQuery, alanAdi);
              
              // Anahtar kelime eşleşmelerini kontrol et
              const keywordMatches = this.checkKeywordMatches(queryKeywords, [mahalle, alanAdi, ilce]);
              
              // Toplam skor hesapla
              const totalScore = Math.max(ilceScore, mahalleScore, alanScore) + (keywordMatches * 0.2);
              
              console.log(`🎯 ${alan.ad} (${alan.mahalle}) - Mahalle skoru: ${mahalleScore}, Alan skoru: ${alanScore}, Anahtar kelime: ${keywordMatches}, Toplam: ${totalScore}`);
              
              // Eşik değeri (threshold) 0.4
              if (totalScore > 0.4) {
                console.log(`✅ Eşleşen alan bulundu: ${alan.ad} (${alan.mahalle}) - Skor: ${totalScore}`);
                
                const result: SearchResult = {
                  title: `${alan.ad} - ${data.ilce}`,
                  url: `local://toplanma-alanlari/${data.ilce}/${alan.id}`,
                  snippet: `${alan.mahalle} mahallesinde bulunan ${alan.ad}`,
                  content: this.formatToplanmaAlaniFromData(alan, data.ilce),
                  relevanceScore: Math.min(totalScore, 0.95), // Maksimum 0.95
                  publishDate: new Date().toISOString()
                };
                
                results.push(result);
              }
            }
          }
        } catch (fileError) {
          console.error(`❌ Dosya okuma hatası ${file}:`, fileError);
        }
      }
      
      console.log(`📊 Toplam bulunan sonuç: ${results.length} adet`);
      
      // Sonuçları skorlarına göre sırala ve ilk 5'ini döndür
      const finalResults = results
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, 5);
      
      console.log(`📋 Döndürülen sonuç sayısı: ${finalResults.length} adet`);
      return finalResults;
        
    } catch (error) {
      console.error('❌ Fallback search hatası:', error);
      return [{
        title: 'Toplanma Alanları Arama Hatası',
        url: 'https://example.com/error',
        snippet: 'Arama sırasında bir hata oluştu',
        content: 'Toplanma alanları veritabanında arama yapılamadı. Lütfen daha sonra tekrar deneyin.',
        relevanceScore: 0.1,
        publishDate: new Date().toISOString()
      }];
    }
  }

  private extractKeywords(query: string): string[] {
    // Türkçe stop words
    const stopWords = ['ve', 'ile', 'için', 'olan', 'neler', 'nerede', 'hangi', 'nasıl', 'ne', 'bir', 'bu', 'şu', 'o'];
    
    return query
      .toLowerCase()
      .replace(/[^\w\sğüşıöçĞÜŞİÖÇ]/g, ' ') // Özel karakterleri kaldır
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word))
      .map(word => word.replace(/\.$/, '')); // Nokta kaldır
  }

  private calculateSimilarity(str1: string, str2: string): number {
    if (!str1 || !str2) return 0;
    
    // Türkçe karakterleri normalize et
    const normalize = (str: string) => str
      .toLowerCase()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/\./g, '') // Nokta kaldır
      .replace(/\s+/g, ' ') // Çoklu boşlukları tek boşluk yap
      .trim();
    
    const normStr1 = normalize(str1);
    const normStr2 = normalize(str2);
    
    // Önce basit eşleşme kontrolü
    if (normStr1.includes(normStr2) || normStr2.includes(normStr1)) {
      return 0.9;
    }
    
    // Levenshtein distance tabanlı benzerlik
    const distance = this.levenshteinDistance(normStr1, normStr2);
    const maxLength = Math.max(normStr1.length, normStr2.length);
    
    if (maxLength === 0) return 1;
    
    const similarity = 1 - (distance / maxLength);
    
    // Eğer benzerlik yüksekse (0.7'den büyük) kabul et
    return similarity > 0.7 ? similarity : 0;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  private checkKeywordMatches(queryKeywords: string[], targetStrings: string[]): number {
    let matches = 0;
    
    for (const keyword of queryKeywords) {
      for (const target of targetStrings) {
        // Normalize both strings for comparison
        const normalize = (str: string) => str
          .toLowerCase()
          .replace(/ğ/g, 'g')
          .replace(/ü/g, 'u')
          .replace(/ş/g, 's')
          .replace(/ı/g, 'i')
          .replace(/ö/g, 'o')
          .replace(/ç/g, 'c')
          .replace(/\./g, '')
          .replace(/\s+/g, ' ')
          .trim();
        
        const normKeyword = normalize(keyword);
        const normTarget = normalize(target);
        
        if (normTarget.includes(normKeyword) || normKeyword.includes(normTarget)) {
          matches++;
          break; // Her anahtar kelime için sadece bir eşleşme say
        }
      }
    }
    
    return matches;
  }

  private formatToplanmaAlaniFromData(alan: any, ilce: string): string {
    let content = `🏢 ${alan.ad}\n`;
    content += `📍 İlçe: ${ilce}\n`;
    content += `🏘️ Mahalle: ${alan.mahalle || 'Bilinmiyor'}\n`;
    
    if (alan.koordinat?.lat !== 0 && alan.koordinat?.lng !== 0) {
      content += `🗺️ Koordinat: ${alan.koordinat.lat}, ${alan.koordinat.lng}\n`;
    }
    
    if (alan.alan_bilgileri?.toplam_alan > 0) {
      content += `📏 Alan: ${alan.alan_bilgileri.toplam_alan} m²\n`;
    }
    
    // Altyapı bilgileri
    const altyapi = alan.altyapi || {};
    const altyapiList = [];
    if (altyapi.elektrik) altyapiList.push('⚡ Elektrik');
    if (altyapi.su) altyapiList.push('💧 Su');
    if (altyapi.wc) altyapiList.push('🚻 WC');
    if (altyapi.kanalizasyon) altyapiList.push('🚰 Kanalizasyon');
    
    if (altyapiList.length > 0) {
      content += `🔧 Altyapı: ${altyapiList.join(', ')}\n`;
    }
    
    // Ulaşım bilgileri
    if (alan.ulasim?.yol_durumu) {
      content += `🛣️ Yol Durumu: ${alan.ulasim.yol_durumu}\n`;
    }
    
    // Özellikler
    if (alan.ozellikler?.tur) {
      content += `🏷️ Tür: ${alan.ozellikler.tur}\n`;
    }
    
    if (alan.ozellikler?.durum) {
      content += `✅ Durum: ${alan.ozellikler.durum}\n`;
    }
    
    return content;
  }

  private formatToplanmaAlaniResult(result: any): string {
    const meta = result.metadata;
    let content = `🏢 ${meta.alan_adi}\n`;
    content += `📍 İlçe: ${meta.ilce}\n`;
    content += `🏘️ Mahalle: ${meta.mahalle}\n`;
    
    if (meta.koordinat.lat !== 0 && meta.koordinat.lng !== 0) {
      content += `🗺️ Koordinat: ${meta.koordinat.lat}, ${meta.koordinat.lng}\n`;
    }
    
    if (meta.alan_bilgileri.toplam_alan > 0) {
      content += `📏 Alan: ${meta.alan_bilgileri.toplam_alan} m²\n`;
    }
    
    // Altyapı bilgileri
    const altyapi = meta.altyapi;
    const altyapiList = [];
    if (altyapi.elektrik) altyapiList.push('⚡ Elektrik');
    if (altyapi.su) altyapiList.push('💧 Su');
    if (altyapi.wc) altyapiList.push('🚻 WC');
    if (altyapi.kanalizasyon) altyapiList.push('🚰 Kanalizasyon');
    
    if (altyapiList.length > 0) {
      content += `🔧 Altyapı: ${altyapiList.join(', ')}\n`;
    }
    
    // Ulaşım bilgileri
    if (meta.ulasim.yol_durumu) {
      content += `🛣️ Yol Durumu: ${meta.ulasim.yol_durumu}\n`;
    }
    
    // Özellikler
    if (meta.ozellikler.tur) {
      content += `🏷️ Tür: ${meta.ozellikler.tur}\n`;
    }
    
    if (meta.ozellikler.durum) {
      content += `✅ Durum: ${meta.ozellikler.durum}\n`;
    }
    
    content += `\n📊 Benzerlik Skoru: ${(result.similarity * 100).toFixed(1)}%`;
    
    return content;
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
