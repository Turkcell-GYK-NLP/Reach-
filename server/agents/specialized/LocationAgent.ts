import { UserContext, ToolResult, AgentResponse } from '../types.js';

export class LocationAgent {
  name = 'location';
  description = 'Konum, güvenli alan ve yol tarifi konularında uzman agent';

  async execute(
    query: string,
    userContext: UserContext,
    toolResults: ToolResult[]
  ): Promise<AgentResponse> {
    console.log(`📍 LocationAgent executing: "${query}"`);

    // Location tool sonuçlarını filtrele
    const locationResults = toolResults.filter(result => 
      ['location', 'websearch'].includes(result.type) ||
      this.isLocationQuery(query)
    );

    // Location assessment yap
    const locationAssessment = this.assessLocationSituation(query, locationResults, userContext);
    
    // Yanıt oluştur
    const message = this.generateLocationResponse(query, locationAssessment, userContext);
    
    // Öneriler oluştur
    const suggestions = this.generateLocationSuggestions(query, locationAssessment);
    
    // Aksiyon öğeleri oluştur
    const actionItems = this.generateLocationActionItems(locationAssessment);

    return {
      message,
      suggestions,
      actionItems,
      toolResults: locationResults,
      confidence: this.calculateLocationConfidence(locationResults, locationAssessment),
      timestamp: new Date()
    };
  }

  private assessLocationSituation(
    query: string,
    toolResults: ToolResult[],
    userContext: UserContext
  ): LocationAssessment {
    const assessment: LocationAssessment = {
      locationType: 'general',
      urgency: 'low',
      hasLocationData: !!userContext.location,
      userLocation: userContext.location,
      searchResults: toolResults,
      recommendedLocations: [],
      safetyLevel: 'unknown',
      accessibility: 'unknown',
      timestamp: new Date()
    };

    const lowerQuery = query.toLowerCase();

    // Location türünü belirle
    if (lowerQuery.includes('hastane') || lowerQuery.includes('doktor')) {
      assessment.locationType = 'hospital';
      assessment.urgency = 'low'; // Hastane araması normal bir işlem
    } else if (lowerQuery.includes('güvenli alan') || lowerQuery.includes('toplanma')) {
      assessment.locationType = 'safe_area';
      assessment.urgency = 'medium';
    } else if (lowerQuery.includes('yol tarifi') || lowerQuery.includes('nasıl giderim')) {
      assessment.locationType = 'directions';
      assessment.urgency = 'low';
    } else if (lowerQuery.includes('konum') || lowerQuery.includes('nerede')) {
      assessment.locationType = 'location_search';
      assessment.urgency = 'low';
    }

    // Güvenlik seviyesini belirle
    if (lowerQuery.includes('acil') || lowerQuery.includes('emergency')) {
      assessment.safetyLevel = 'critical';
      assessment.urgency = 'high';
    } else if (lowerQuery.includes('güvenli') || lowerQuery.includes('safe')) {
      assessment.safetyLevel = 'safe';
    } else {
      assessment.safetyLevel = 'normal';
    }

    // Erişilebilirlik seviyesini belirle
    if (lowerQuery.includes('engelli') || lowerQuery.includes('tekerlekli')) {
      assessment.accessibility = 'wheelchair_accessible';
    } else if (lowerQuery.includes('yürüyerek') || lowerQuery.includes('yaya')) {
      assessment.accessibility = 'walking';
    } else if (lowerQuery.includes('araç') || lowerQuery.includes('araba')) {
      assessment.accessibility = 'vehicle';
    } else {
      assessment.accessibility = 'general';
    }

    // Önerilen konumları belirle
    assessment.recommendedLocations = this.getRecommendedLocations(assessment);

    return assessment;
  }

  private generateLocationResponse(
    query: string,
    assessment: LocationAssessment,
    userContext: UserContext
  ): string {
    const { locationType, urgency, userLocation } = assessment;
    
    if (urgency === 'high') {
      return this.generateUrgentLocationResponse(query, assessment, userContext);
    }
    
    switch (locationType) {
      case 'hospital':
        return this.generateHospitalLocationResponse(query, assessment);
      case 'safe_area':
        return this.generateSafeAreaResponse(query, assessment);
      case 'directions':
        return this.generateDirectionsResponse(query, assessment);
      case 'location_search':
        return this.generateLocationSearchResponse(query, assessment);
      default:
        return this.generateGeneralLocationResponse(query, assessment);
    }
  }

  private generateUrgentLocationResponse(
    query: string,
    assessment: LocationAssessment,
    userContext: UserContext
  ): string {
    return `🚨 **ACİL KONUM DESTEĞİ**

**Acil Durum Konum Bilgisi:**

📍 **Mevcut Konumunuz:**
- İlçe: ${assessment.userLocation?.district || 'Bilinmiyor'}
- Şehir: ${assessment.userLocation?.city || 'İstanbul'}
- Koordinat: ${assessment.userLocation?.latitude || 'N/A'}, ${assessment.userLocation?.longitude || 'N/A'}

🚨 **Acil Durum Aksiyonları:**
1. **112'yi arayın** - Acil çağrı merkezi
2. **Güvenli alana geçin** - En yakın toplanma alanı
3. **Konumunuzu paylaşın** - Ailenizle iletişim kurun
4. **Yardım bekleyin** - Profesyonel ekipler geliyor

🏥 **En Yakın Hastaneler:**
- Acil durumlarda 112'den hastane bilgisi alın
- Ambulans hizmeti için 112'yi arayın
- GPS ile en yakın sağlık kuruluşunu bulun

**Ben buradayım, sizi yalnız bırakmam!** 🆘`;
  }

  private generateHospitalLocationResponse(
    query: string,
    assessment: LocationAssessment
  ): string {
    return `🏥 **HASTANE KONUM BİLGİLERİ**

**En Yakın Hastane Bulma:**

📍 **Konumunuz:** ${assessment.userLocation?.district || 'Bilinmiyor'}, ${assessment.userLocation?.city || 'İstanbul'}

**Hastane Arama Seçenekleri:**

1. 🗺️ **Online Harita Servisleri (Önerilen)**
   - Google Maps: "hastane" araması
   - Apple Maps: "hospital" araması
   - Yandex Maps: "hastane" araması
   - Mesafe ve yol tarifi alın

2. 📱 **Dijital Kaynaklar**
   - Sağlık Bakanlığı uygulamaları
   - Hastane web siteleri
   - Online sağlık rehberleri

3. 🏥 **Hastane Türleri**
   - Devlet Hastaneleri
   - Özel Hastaneler
   - Üniversite Hastaneleri
   - Acil Servisler

4. 📞 **Telefon ile Bilgi**
   - Hastane direkt telefon numaraları
   - Sağlık Bakanlığı bilgi hattı
   - 112 (sadece acil durumlarda)

**Önemli Notlar:**
- Bu normal bir bilgi talebidir, acil durum değil
- 112'yi sadece gerçek acil durumlarda arayın
- Randevu almak için hastaneyi direkt arayın

**Arama Türü:** Normal bilgi talebi`;
  }

  private generateSafeAreaResponse(
    query: string,
    assessment: LocationAssessment
  ): string {
    return `🏠 **GÜVENLİ ALAN REHBERİ**

**Güvenli Alan Bulma:**

1. 🏢 **Toplanma Alanları**
   - Okul bahçeleri
   - Spor tesisleri
   - Parklar ve meydanlar
   - Camii avluları

2. 🏠 **Bina İçi Güvenli Alanlar**
   - Sağlam masa altları
   - İç duvar yanları
   - Merdiven boşlukları
   - Banyo ve tuvaletler

3. 🚫 **Güvenli Olmayan Alanlar**
   - Pencerelerin yanı
   - Ağır eşyaların altı
   - Asansörler
   - Merdivenler

4. 📍 **Konum Tabanlı Arama**
   - GPS koordinatlarınızı kullanın
   - En yakın toplanma alanını bulun
   - Ulaşım süresini hesaplayın

**Konumunuz:** ${assessment.userLocation?.district || 'Bilinmiyor'}, ${assessment.userLocation?.city || 'İstanbul'}

**Güvenli alanlar için 112'den bilgi alabilirsiniz!** 🏠`;
  }

  private generateDirectionsResponse(
    query: string,
    assessment: LocationAssessment
  ): string {
    return `🗺️ **YOL TARİFİ REHBERİ**

**Yol Tarifi Alma Yöntemleri:**

1. 📱 **Harita Uygulamaları**
   - Google Maps
   - Apple Maps
   - Yandex Maps
   - Waze

2. 🚗 **Ulaşım Seçenekleri**
   - Yürüyerek
   - Toplu taşıma
   - Özel araç
   - Taksi

3. 📞 **Telefon Destekli Yol Tarifi**
   - 112 Acil Çağrı Merkezi
   - Hastane bilgi hatları
   - Turizm bilgi hatları

4. 🏥 **Hastane Yol Tarifi**
   - Acil durumlarda 112'den ambulans
   - Normal durumlarda harita uygulamaları
   - Toplu taşıma ile ulaşım

**Konumunuz:** ${assessment.userLocation?.district || 'Bilinmiyor'}, ${assessment.userLocation?.city || 'İstanbul'}

**Yol tarifi için harita uygulamalarını kullanabilirsiniz!** 🗺️`;
  }

  private generateLocationSearchResponse(
    query: string,
    assessment: LocationAssessment
  ): string {
    return `📍 **KONUM ARAMA REHBERİ**

**Konum Bulma Yöntemleri:**

1. 📱 **GPS ve Konum Servisleri**
   - Telefon GPS'i
   - Harita uygulamaları
   - Konum paylaşımı

2. 🗺️ **Harita Tabanlı Arama**
   - Google Maps arama
   - Apple Maps arama
   - Yandex Maps arama

3. 📞 **Telefon Destekli Arama**
   - 112 Acil Çağrı Merkezi
   - Bilgi hatları
   - Turizm ofisleri

4. 🏥 **Hastane Konum Arama**
   - Hastane web siteleri
   - Sağlık Bakanlığı uygulamaları
   - Online sağlık rehberleri

**Mevcut Konumunuz:**
- İlçe: ${assessment.userLocation?.district || 'Bilinmiyor'}
- Şehir: ${assessment.userLocation?.city || 'İstanbul'}
- Koordinat: ${assessment.userLocation?.latitude || 'N/A'}, ${assessment.userLocation?.longitude || 'N/A'}

**Konum araması için harita uygulamalarını kullanabilirsiniz!** 📍`;
  }

  private generateGeneralLocationResponse(
    query: string,
    assessment: LocationAssessment
  ): string {
    return `📍 **GENEL KONUM BİLGİSİ**

**Konum Hizmetleri:**

1. 📱 **Dijital Araçlar**
   - Harita uygulamaları
   - GPS servisleri
   - Konum paylaşımı

2. 🏥 **Sağlık Konumları**
   - Hastane bilgileri
   - Eczane konumları
   - Sağlık merkezleri

3. 🏠 **Güvenli Alanlar**
   - Toplanma alanları
   - Güvenli bölgeler
   - Acil durum merkezleri

4. 📞 **Destek Hizmetleri**
   - 112 Acil Çağrı Merkezi
   - Bilgi hatları
   - Turizm ofisleri

**Konumunuz:** ${assessment.userLocation?.district || 'Bilinmiyor'}, ${assessment.userLocation?.city || 'İstanbul'}

**Konum bilgileri için 112'yi arayabilirsiniz!** 📍`;
  }

  private generateLocationSuggestions(
    query: string,
    assessment: LocationAssessment
  ): string[] {
    const suggestions: string[] = [];

    if (assessment.urgency === 'high') {
      suggestions.push('🚨 112 Acil Çağrı Merkezi\'ni arayın');
      suggestions.push('🏃‍♂️ Güvenli alana geçin');
      suggestions.push('📱 Konumunuzu paylaşın');
    }

    if (assessment.locationType === 'hospital') {
      suggestions.push('🏥 En yakın hastane bilgisi alın');
      suggestions.push('📞 112\'den hastane bilgisi isteyin');
      suggestions.push('🗺️ GPS ile konum belirleyin');
    }

    if (assessment.locationType === 'safe_area') {
      suggestions.push('🏠 En yakın toplanma alanını bulun');
      suggestions.push('🚫 Güvenli olmayan alanlardan uzak durun');
      suggestions.push('📱 Ailenizi bilgilendirin');
    }

    if (assessment.locationType === 'directions') {
      suggestions.push('🗺️ Harita uygulaması kullanın');
      suggestions.push('🚗 Ulaşım seçeneklerini değerlendirin');
      suggestions.push('⏰ Yol süresini hesaplayın');
    }

    suggestions.push('📍 GPS konumunuzu kontrol edin');
    suggestions.push('📱 Harita uygulamalarını güncel tutun');

    return suggestions.slice(0, 6); // Max 6 suggestions
  }

  private generateLocationActionItems(assessment: LocationAssessment): any[] {
    const actionItems: any[] = [];

    if (assessment.urgency === 'high') {
      actionItems.push({
        type: 'emergency_location',
        title: 'Acil Konum Desteği',
        priority: 'critical',
        description: 'Acil durum konum bilgisi'
      });
    }

    if (assessment.locationType === 'hospital') {
      actionItems.push({
        type: 'hospital_search',
        title: 'Hastane Konum Arama',
        priority: 'high',
        description: 'En yakın hastane bulma'
      });
    }

    if (assessment.locationType === 'safe_area') {
      actionItems.push({
        type: 'safe_area_search',
        title: 'Güvenli Alan Arama',
        priority: 'medium',
        description: 'En yakın güvenli alan bulma'
      });
    }

    return actionItems;
  }

  private getRecommendedLocations(assessment: LocationAssessment): string[] {
    const locations: string[] = [];

    if (assessment.locationType === 'hospital') {
      locations.push('En yakın devlet hastanesi');
      locations.push('En yakın özel hastane');
      locations.push('En yakın acil servis');
    }

    if (assessment.locationType === 'safe_area') {
      locations.push('En yakın toplanma alanı');
      locations.push('En yakın park');
      locations.push('En yakın okul bahçesi');
    }

    return locations;
  }

  private calculateLocationConfidence(
    toolResults: ToolResult[],
    assessment: LocationAssessment
  ): number {
    let confidence = 0.5; // Base confidence

    // Tool sonuçlarına göre confidence artır
    if (toolResults.length > 0) {
      confidence += 0.2;
    }

    // Location assessment'e göre confidence artır
    if (assessment.locationType !== 'general') {
      confidence += 0.2;
    }

    // Konum verisi varsa confidence artır
    if (assessment.hasLocationData) {
      confidence += 0.1;
    }

    return Math.min(confidence, 0.95);
  }

  private isLocationQuery(query: string): boolean {
    const locationKeywords = [
      'konum', 'nerede', 'güvenli alan', 'toplanma', 'hastane', 'doktor',
      'yol tarifi', 'nasıl giderim', 'yakın', 'mesafe', 'koordinat',
      'park', 'meydan', 'mahalle', 'ilçe', 'bölge', 'harita'
    ];

    const lowerQuery = query.toLowerCase();
    return locationKeywords.some(keyword => lowerQuery.includes(keyword));
  }
}

interface LocationAssessment {
  locationType: 'general' | 'hospital' | 'safe_area' | 'directions' | 'location_search';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  hasLocationData: boolean;
  userLocation?: any;
  searchResults: ToolResult[];
  recommendedLocations: string[];
  safetyLevel: 'unknown' | 'safe' | 'normal' | 'critical';
  accessibility: 'unknown' | 'general' | 'walking' | 'vehicle' | 'wheelchair_accessible';
  timestamp: Date;
}
