import { UserContext, ToolResult, AgentResponse } from '../types.js';

export class MedicalAgent {
  name = 'medical';
  description = 'İlkyardım, hastane ve sağlık konularında uzman agent';

  async execute(
    query: string,
    userContext: UserContext,
    toolResults: ToolResult[]
  ): Promise<AgentResponse> {
    console.log(`🏥 MedicalAgent executing: "${query}"`);

    // Medical tool sonuçlarını filtrele
    const medicalResults = toolResults.filter(result => 
      ['ilkyardim', 'location', 'emergency'].includes(result.type) ||
      this.isMedicalQuery(query)
    );

    // Medical assessment yap
    const medicalAssessment = this.assessMedicalSituation(query, medicalResults, userContext);
    
    // Yanıt oluştur
    const message = this.generateMedicalResponse(query, medicalAssessment, userContext);
    
    // Öneriler oluştur
    const suggestions = this.generateMedicalSuggestions(query, medicalAssessment);
    
    // Aksiyon öğeleri oluştur
    const actionItems = this.generateMedicalActionItems(medicalAssessment);

    return {
      message,
      suggestions,
      actionItems,
      toolResults: medicalResults,
      confidence: this.calculateMedicalConfidence(medicalResults, medicalAssessment),
      timestamp: new Date()
    };
  }

  private assessMedicalSituation(
    query: string,
    toolResults: ToolResult[],
    userContext: UserContext
  ): MedicalAssessment {
    const assessment: MedicalAssessment = {
      urgency: 'low',
      medicalType: 'general',
      isEmergency: false,
      requiresImmediateAction: false,
      recommendedActions: [],
      safetyProtocols: [],
      contacts: [],
      location: userContext.location?.district || 'Bilinmiyor',
      timestamp: new Date()
    };

    const lowerQuery = query.toLowerCase();

    // Aciliyet seviyesini belirle - SADECE GERÇEK ACİL DURUM KELİMELERİ
    if (lowerQuery.includes('acil') || lowerQuery.includes('emergency') || 
        lowerQuery.includes('112') || lowerQuery.includes('ambulans') ||
        lowerQuery.includes('yaralanma') || lowerQuery.includes('kanama') ||
        lowerQuery.includes('ağrı') || lowerQuery.includes('bayıldı') ||
        lowerQuery.includes('kritik') || lowerQuery.includes('tehlikede')) {
      assessment.urgency = 'critical';
      assessment.isEmergency = true;
      assessment.requiresImmediateAction = true;
    } else if (lowerQuery.includes('hastane') || lowerQuery.includes('doktor')) {
      // Hastane araması NORMAL bir işlem, acil değil!
      assessment.urgency = 'low';
      assessment.requiresImmediateAction = false;
    } else if (lowerQuery.includes('ilkyardım') || lowerQuery.includes('yaşam üçgeni')) {
      assessment.urgency = 'medium';
    }

    // Medical türünü belirle
    if (lowerQuery.includes('yaşam üçgeni') || lowerQuery.includes('deprem')) {
      assessment.medicalType = 'earthquake_safety';
    } else if (lowerQuery.includes('hastane') || lowerQuery.includes('doktor')) {
      assessment.medicalType = 'hospital_search';
    } else if (lowerQuery.includes('ilkyardım') || lowerQuery.includes('first aid')) {
      assessment.medicalType = 'first_aid';
    } else if (lowerQuery.includes('kanama') || lowerQuery.includes('kırık') || 
               lowerQuery.includes('yanık') || lowerQuery.includes('bilinç')) {
      assessment.medicalType = 'emergency_care';
    }

    // Önerilen aksiyonları belirle
    assessment.recommendedActions = this.getRecommendedActions(assessment);
    
    // Güvenlik protokollerini belirle
    assessment.safetyProtocols = this.getSafetyProtocols(assessment);
    
    // İletişim bilgilerini belirle
    assessment.contacts = this.getEmergencyContacts(assessment);

    return assessment;
  }

  private generateMedicalResponse(
    query: string,
    assessment: MedicalAssessment,
    userContext: UserContext
  ): string {
    const { urgency, medicalType, isEmergency } = assessment;
    
    if (isEmergency || urgency === 'critical') {
      return this.generateEmergencyResponse(query, assessment, userContext);
    }
    
    switch (medicalType) {
      case 'earthquake_safety':
        return this.generateEarthquakeSafetyResponse(query, assessment);
      case 'hospital_search':
        return this.generateHospitalSearchResponse(query, assessment);
      case 'first_aid':
        return this.generateFirstAidResponse(query, assessment);
      case 'emergency_care':
        return this.generateEmergencyCareResponse(query, assessment);
      default:
        return this.generateGeneralMedicalResponse(query, assessment);
    }
  }

  private generateEmergencyResponse(
    query: string,
    assessment: MedicalAssessment,
    userContext: UserContext
  ): string {
    return `🚨 **ACİL DURUM TESPİT EDİLDİ!**

Ben hemen 112'yi arayacağım! Siz sakin olun ve güvenli bir yerde kalın.

**Hemen Yapılacaklar:**
1. 🚨 **112'yi arayın** - Ben de arayacağım
2. 🏃‍♂️ **Güvenli alana geçin** - Pencerelerden uzak durun
3. 📱 **Ailenizi bilgilendirin** - Durumunuzu paylaşın
4. 🩹 **İlk yardım uygulayın** - Kanama varsa bastırın

**Konumunuz:** ${assessment.location}
**Durum:** ${assessment.urgency.toUpperCase()} ACİL

Ben buradayım, sizi yalnız bırakmam! Yardım geliyor! 🆘`;
  }

  private generateEarthquakeSafetyResponse(
    query: string,
    assessment: MedicalAssessment
  ): string {
    return `🏠 **DEPREM GÜVENLİĞİ - YAŞAM ÜÇGENİ**

**Deprem Anında Yaşam Üçgeni Oluşturma:**

1. 🪑 **Sağlam Masa/Sıra Yanına Geçin**
   - Masa, sıra veya yatak yanına çömelin
   - Başınızı ve boynunuzu koruyun

2. 🤲 **Çömel, Kapan, Tutun Pozisyonu**
   - Çömelin, kapanın, tutunun
   - Başınızı kollarınızla koruyun

3. 🚫 **Yapmamanız Gerekenler:**
   - Asansör kullanmayın
   - Merdivenlerden inmeyin
   - Dışarı çıkmaya çalışmayın
   - Pencerelerden uzak durun

4. 📱 **Sonrasında:**
   - 112'yi arayın
   - Ailenizi bilgilendirin
   - Güvenli alanda kalın

**Unutmayın:** İçeride kalmak dışarı çıkmaktan daha güvenlidir! 🏠`;
  }

  private generateHospitalSearchResponse(
    query: string,
    assessment: MedicalAssessment
  ): string {
    return `🏥 **HASTANE BİLGİLERİ**

**En Yakın Hastane Bulma:**

📍 **Konumunuz:** ${assessment.location}

**Hastane Arama Seçenekleri:**

1. 🗺️ **Online Arama (Önerilen)**
   - En yakın sağlık kuruluşlarını görün
   - Mesafe ve yol tarifi alın

2. 📱 **Dijital Kaynaklar**
   - Hastane web siteleri
   - Sağlık Bakanlığı uygulamaları
   - Online harita servisleri

3. 📞 **Telefon ile Arama**
   - Hastane direkt telefon numaraları
   - Sağlık Bakanlığı bilgi hattı
   - 112 (sadece acil durumlarda)

**Önemli Notlar:**
- Bu normal bir bilgi talebidir, acil durum değil
- 112'yi sadece gerçek acil durumlarda arayın
- Randevu almak için hastaneyi direkt arayın

**Arama Türü:** Normal bilgi talebi`;
  }

  private generateFirstAidResponse(
    query: string,
    assessment: MedicalAssessment
  ): string {
    return `🩹 **İLK YARDIM REHBERİ**

**Temel İlk Yardım Kuralları:**

1. 🚨 **Önce Güvenlik**
   - Kendi güvenliğinizi sağlayın
   - Ortamı güvenli hale getirin
   - 112'yi arayın

2. 🩸 **Kanama Kontrolü**
   - Temiz bezle bastırın
   - Yüksekte tutun
   - Hareket ettirmeyin

3. 🫁 **Solunum Kontrolü**
   - Nefes alıp almadığını kontrol edin
   - Gerekirse CPR uygulayın
   - Yan yatırın

4. 🦴 **Kırık Şüphesi**
   - Hareket ettirmeyin
   - Destekleyin
   - Soğuk uygulayın

5. 🔥 **Yanık Durumunda**
   - Soğuk suyla yıkayın
   - 15-20 dakika
   - Buz koymayın

**Acil durumlarda 112'yi arayın!** 🚨`;
  }

  private generateEmergencyCareResponse(
    query: string,
    assessment: MedicalAssessment
  ): string {
    return `🚑 **ACİL BAKIM REHBERİ**

**Acil Durum Müdahalesi:**

1. 🚨 **İlk Değerlendirme**
   - Bilinç durumunu kontrol edin
   - Nefes alıp almadığını kontrol edin
   - Kanama var mı kontrol edin

2. 📞 **Acil Çağrı**
   - 112'yi arayın
   - Durumu açıklayın
   - Konum bilgisi verin

3. 🩹 **Temel Müdahale**
   - Kanama varsa bastırın
   - Nefes yoksa CPR başlatın
   - Hareket ettirmeyin

4. ⏰ **Zaman Kritik**
   - Hızlı hareket edin
   - Profesyonel yardım bekleyin
   - Sakin kalın

**Unutmayın:** İlk yardım bilginiz sınırlıysa, 112'yi arayın! 📞`;
  }

  private generateGeneralMedicalResponse(
    query: string,
    assessment: MedicalAssessment
  ): string {
    return `🏥 **GENEL SAĞLIK BİLGİSİ**

**Sağlık Konularında Yardım:**

1. 📞 **Acil Durumlar**
   - 112 Acil Çağrı Merkezi
   - 7/24 hizmet
   - Ambulans ve hastane bilgisi

2. 🏥 **Hastane Bilgileri**
   - En yakın hastane
   - Acil servis bilgileri
   - Ulaşım rehberi

3. 🩹 **İlk Yardım**
   - Temel ilk yardım kuralları
   - Acil müdahale teknikleri
   - Güvenlik protokolleri

4. 📱 **Dijital Kaynaklar**
   - Sağlık Bakanlığı uygulamaları
   - Online sağlık rehberleri
   - Tele-sağlık hizmetleri

**Sağlık sorunlarınız için 112'yi arayabilirsiniz!** 🏥`;
  }

  private generateMedicalSuggestions(
    query: string,
    assessment: MedicalAssessment
  ): string[] {
    const suggestions: string[] = [];

    if (assessment.isEmergency) {
      suggestions.push('🚨 112 Acil Çağrı Merkezi\'ni arayın');
      suggestions.push('🏃‍♂️ Güvenli alana geçin');
      suggestions.push('📱 Ailenizi bilgilendirin');
    }

    if (assessment.medicalType === 'earthquake_safety') {
      suggestions.push('🏠 Yaşam üçgeni oluşturun');
      suggestions.push('🤲 Çömel, kapan, tutun pozisyonu alın');
      suggestions.push('🚫 Asansör kullanmayın');
    }

    if (assessment.medicalType === 'hospital_search') {
      suggestions.push('🏥 En yakın hastane bilgisi alın');
      suggestions.push('📞 112\'den hastane bilgisi isteyin');
      suggestions.push('🗺️ GPS ile konum belirleyin');
    }

    if (assessment.medicalType === 'first_aid') {
      suggestions.push('🩹 İlk yardım kurallarını uygulayın');
      suggestions.push('🚨 Acil durumda 112\'yi arayın');
      suggestions.push('🩸 Kanama kontrolü yapın');
    }

    suggestions.push('📚 Sağlık bilgilerini güncel tutun');
    suggestions.push('🏥 Düzenli sağlık kontrolü yaptırın');

    return suggestions.slice(0, 6); // Max 6 suggestions
  }

  private generateMedicalActionItems(assessment: MedicalAssessment): any[] {
    const actionItems: any[] = [];

    if (assessment.isEmergency) {
      actionItems.push({
        type: 'emergency_call',
        title: '112 Acil Çağrı Merkezi\'ni Ara',
        priority: 'critical',
        description: 'Acil durum için 112\'yi arayın'
      });
    }

    if (assessment.medicalType === 'hospital_search') {
      actionItems.push({
        type: 'hospital_search',
        title: 'En Yakın Hastane Bul',
        priority: 'high',
        description: 'Konum bazlı hastane araması yapın'
      });
    }

    if (assessment.medicalType === 'first_aid') {
      actionItems.push({
        type: 'first_aid',
        title: 'İlk Yardım Uygula',
        priority: 'high',
        description: 'Temel ilk yardım kurallarını uygulayın'
      });
    }

    return actionItems;
  }

  private getRecommendedActions(assessment: MedicalAssessment): string[] {
    const actions: string[] = [];

    if (assessment.isEmergency) {
      actions.push('112 Acil Çağrı Merkezi\'ni arayın');
      actions.push('Güvenli alana geçin');
      actions.push('Ailenizi bilgilendirin');
    }

    if (assessment.medicalType === 'earthquake_safety') {
      actions.push('Yaşam üçgeni oluşturun');
      actions.push('Çömel, kapan, tutun pozisyonu alın');
    }

    return actions;
  }

  private getSafetyProtocols(assessment: MedicalAssessment): string[] {
    const protocols: string[] = [];

    if (assessment.medicalType === 'earthquake_safety') {
      protocols.push('Asansör kullanmayın');
      protocols.push('Merdivenlerden inmeyin');
      protocols.push('Pencerelerden uzak durun');
    }

    protocols.push('Kendi güvenliğinizi sağlayın');
    protocols.push('Profesyonel yardım alın');

    return protocols;
  }

  private getEmergencyContacts(assessment: MedicalAssessment): any[] {
    return [
      { name: 'Acil Çağrı Merkezi', number: '112', type: 'emergency' },
      { name: 'Ambulans', number: '112', type: 'medical' },
      { name: 'İtfaiye', number: '110', type: 'fire' },
      { name: 'Polis', number: '155', type: 'police' }
    ];
  }

  private calculateMedicalConfidence(
    toolResults: ToolResult[],
    assessment: MedicalAssessment
  ): number {
    let confidence = 0.5; // Base confidence

    // Tool sonuçlarına göre confidence artır
    if (toolResults.length > 0) {
      confidence += 0.2;
    }

    // Medical assessment'e göre confidence artır
    if (assessment.medicalType !== 'general') {
      confidence += 0.2;
    }

    // Acil durum tespit edilmişse confidence artır
    if (assessment.isEmergency) {
      confidence += 0.1;
    }

    return Math.min(confidence, 0.95);
  }

  private isMedicalQuery(query: string): boolean {
    const medicalKeywords = [
      'hastane', 'doktor', 'ilkyardım', 'yaşam üçgeni', 'acil', 'emergency',
      'kanama', 'kırık', 'yanık', 'bilinç', 'ambulans', '112', 'sağlık',
      'tıbbi', 'medikal', 'deprem', 'güvenlik', 'first aid'
    ];

    const lowerQuery = query.toLowerCase();
    return medicalKeywords.some(keyword => lowerQuery.includes(keyword));
  }
}

interface MedicalAssessment {
  urgency: 'low' | 'medium' | 'high' | 'critical';
  medicalType: 'general' | 'earthquake_safety' | 'hospital_search' | 'first_aid' | 'emergency_care';
  isEmergency: boolean;
  requiresImmediateAction: boolean;
  recommendedActions: string[];
  safetyProtocols: string[];
  contacts: any[];
  location: string;
  timestamp: Date;
}
