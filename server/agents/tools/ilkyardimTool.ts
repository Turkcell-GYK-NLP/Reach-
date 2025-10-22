/**
 * İlkyardım Knowledge Base Tool
 * FAISS ile indexlenmiş ilkyardım bilgilerini arar
 */

import { BaseTool } from './baseTool.js';
import { spawn } from 'child_process';
import path from 'path';

export interface IlkyardimSearchResult {
  title: string;
  content: string;
  category: string;
  keywords: string[];
  similarity: number;
}

export class IlkyardimTool extends BaseTool {
  name = 'ilkyardim';
  description = 'İlkyardım Bilgi Tabanı';

  constructor() {
    super();
  }

  async execute(params: { query: string; userContext: any }): Promise<any> {
    const { query } = params;

    // İlkyardım ile ilgili anahtar kelimeler var mı kontrol et
    if (!this.isRelevant(query)) {
      return null;
    }

    try {
      console.log(`🏥 İlkyardım Tool searching for: "${query}"`);

      const searchResults = await this.searchIlkyardimDatabase(query);

      if (searchResults.length === 0) {
        return {
          type: 'ilkyardim',
          confidence: 0.1,
          data: {
            message: 'İlkyardım konusunda spesifik bilgi bulunamadı.',
            results: []
          }
        };
      }

      // En iyi 3 sonucu al
      const topResults = searchResults.slice(0, 3);
      
      return {
        type: 'ilkyardim',
        confidence: Math.max(0.7, topResults[0]?.similarity || 0),
        data: {
          query,
          results: topResults,
          totalFound: searchResults.length,
          message: this.formatSearchMessage(topResults)
        }
      };

    } catch (error) {
      console.error('İlkyardım arama hatası:', error);
      return {
        type: 'ilkyardim',
        confidence: 0.1,
        data: {
          error: 'İlkyardım bilgilerine erişimde sorun yaşanıyor.',
          results: []
        }
      };
    }
  }

  private async searchIlkyardimDatabase(query: string): Promise<IlkyardimSearchResult[]> {
    return new Promise((resolve, reject) => {
      const pythonScript = path.join(process.cwd(), 'ilkyardim_search.py');
      const pythonProcess = spawn('python3', [pythonScript, query], {
        cwd: process.cwd(),
        env: { 
          ...process.env, 
          PATH: process.env.PATH,
          VIRTUAL_ENV: path.join(process.cwd(), 'venv'),
          PYTHONPATH: path.join(process.cwd(), 'venv', 'lib', 'python3.11', 'site-packages')
        }
      });

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
            const formattedResults: IlkyardimSearchResult[] = results.map((result: any) => ({
              title: result.metadata.title,
              content: result.metadata.content,
              category: result.metadata.category,
              keywords: result.metadata.keywords || [],
              similarity: result.similarity
            }));
            resolve(formattedResults);
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

  private formatSearchMessage(results: IlkyardimSearchResult[]): string {
    if (results.length === 0) {
      return 'İlkyardım konusunda spesifik bilgi bulunamadı.';
    }

    const topResult = results[0];
    let message = `📚 **${topResult.title}**\n\n`;
    
    // İçeriği özetle (ilk 300 karakter)
    const contentPreview = topResult.content.length > 300 
      ? topResult.content.substring(0, 300) + '...' 
      : topResult.content;
    
    message += contentPreview;

    if (results.length > 1) {
      message += `\n\n🔍 **Diğer İlgili Konular:**\n`;
      results.slice(1).forEach((result, index) => {
        message += `${index + 2}. ${result.title}\n`;
      });
    }

    return message;
  }

  protected isRelevant(query: string): boolean {
    const ilkyardimKeywords = [
      'ilkyardım', 'first aid', 'acil', 'emergency', 'kalp masajı', 'cpr',
      'kanama', 'bleeding', 'kırık', 'fracture', 'yanık', 'burn',
      'bilinç kaybı', 'unconscious', 'zehirlenme', 'poisoning',
      'yaralanma', 'injury', 'nefes alma', 'breathing', 'solunum',
      'ambulans', '112', 'tedavi', 'treatment', 'müdahale',
      'bayılma', 'fainting', 'ağrı', 'pain', 'kan', 'blood',
      'yara', 'wound', 'şok', 'shock', 'boğulma', 'choking',
      'burkulma', 'sprain', 'çıkık', 'dislocation', 'donma', 'frostbite',
      'sıcak çarpması', 'heat stroke', 'hayvan ısırığı', 'animal bite',
      'yaşam üçgeni', 'life triangle', 'deprem', 'earthquake', 'güvenli alan',
      'masa', 'table', 'sıra', 'desk', 'korunma', 'protection'
    ];

    const queryLower = query.toLowerCase();
    return ilkyardimKeywords.some(keyword => 
      queryLower.includes(keyword.toLowerCase())
    );
  }

  async searchSpecific(topic: string): Promise<IlkyardimSearchResult[]> {
    return this.searchIlkyardimDatabase(topic);
  }

  getEmergencyResponse(emergencyType: string): string {
    const emergencyResponses = {
      'kalp_durması': `🚨 **KALP DURMASI ACİL MÜDAHALE**

1. ✅ **HEMEN 112\'Yİ ARAYIN**
2. 🤲 **KALP MASAJI BAŞLATIN:**
   - Göğüs kemiği üzerine el topuğunu yerleştirin
   - Diğer elinizi üzerine koyun
   - 5 cm derinlikte, dakikada 100-120 basış
   - 30 basış + 2 nefes verme

3. 🫁 **YAPAY SOLUNUM:**
   - Baş geri-çene yukarı pozisyonu
   - Burun kapatın, ağızdan 2 nefes verin

‼️ **DURMAYIN! Ambulans gelene kadar devam edin!**`,

      'kanama': `🩸 **KANAMA KONTROLÜ**

1. 🚨 **Ağır kanamada 112\'yi arayın**
2. 🧤 **Eldiven kullanın (varsa)**
3. 👐 **DİREKT BASINÇ:**
   - Temiz bez/giysi ile kanama yerine bastırın
   - Baskıyı sürdürün
   - Durmazsa üzerine ikinci bez ekleyin

4. 📍 **BASINÇ NOKTASI:**
   - Kanama yerine yakın arteryal nokta
   - Kol: koltukaltı, Bacak: kasık

5. ⬆️ **YÜKSEKTE TUTUN:** Kanayan bölgeyi kalp seviyesinden yukarı kaldırın`,

      'yanık': `🔥 **YANIK MÜDAHALESİ**

1. 🚨 **Geniş yanıklarda 112\'yi arayın**
2. ❄️ **SOĞUK SU:** 15-20 dakika çeşme suyu altında
3. ❌ **YAPMAYIN:**
   - Buz koymayın
   - Krema/yağ sürmeyin
   - Kabarcıkları patlatmayın

4. 🧻 **ÖRTÜN:** Temiz, nemli bezle örtün
5. 💍 **ÇIKARIN:** Şişmeden önce takı/saat çıkarın

‼️ **YÜZ/SOLUK BORUSU YANIKLARI NDA:** Hemen 112!`,

      'boğulma': `😱 **BOĞULMA MÜDAHALESİ**

**BİLİNÇLİ KİŞİDE:**
1. 🤜 **SIRT VURMA:** 5 kez kürek kemikleri arası
2. 🤗 **HEİMLİCH MANEVRA SI:**
   - Arkasından sarın
   - Göbek-göğüs kemiği arası
   - Yukarı-geriye doğru 5 kez bastırın

**BİLİNÇSİZ OLURSA:**
- Yere yatırın
- 112\'yi arayın  
- CPR başlatın (30:2)

‼️ **BEBEKLERDE:** Yüzüstü, sırt vurma + göğüs basısı`
    };

    return emergencyResponses[emergencyType as keyof typeof emergencyResponses] || 
           '🚨 Acil durumlarda hemen 112\'yi arayın ve profesyonel yardım isteyin.';
  }
}
