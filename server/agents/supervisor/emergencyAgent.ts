import { UserContext, ToolResult, AgentResponse } from '../types.js';

export class EmergencyAgent {
  async execute(
    query: string, 
    userContext: UserContext, 
    toolResults: ToolResult[]
  ): Promise<AgentResponse> {
    // Acil durum tool sonuçlarını filtrele
    const emergencyResults = toolResults.filter(result => 
      result.type === 'emergency' || result.type === 'notification'
    );

    // Acil durum değerlendirmesi yap
    const emergencyAssessment = this.assessEmergency(query, emergencyResults, userContext);
    
    // Yanıt oluştur
    const message = this.generateResponse(query, emergencyAssessment, userContext);
    
    // Öneriler oluştur
    const suggestions = this.generateSuggestions(query, emergencyAssessment);
    
    // Aksiyon öğeleri oluştur
    const actionItems = this.generateActionItems(emergencyAssessment);

    return {
      message,
      suggestions,
      actionItems,
      toolResults: emergencyResults,
      confidence: this.calculateConfidence(emergencyResults),
      timestamp: new Date()
    };
  }

  private assessEmergency(
    query: string, 
    toolResults: ToolResult[], 
    userContext: UserContext
  ): EmergencyAssessment {
    const assessment: EmergencyAssessment = {
      severity: 'low',
      isUrgent: false,
      immediateActions: [],
      safetyProtocols: [],
      contacts: [],
      location: userContext.location?.district || 'Bilinmiyor',
      timestamp: new Date()
    };

    // Query analizi
    const queryAnalysis = this.analyzeQuery(query);
    assessment.severity = queryAnalysis.severity;
    assessment.isUrgent = queryAnalysis.isUrgent;

    // Tool sonuçlarını analiz et
    for (const result of toolResults) {
      if (result.type === 'emergency') {
        this.processEmergencyResult(result, assessment);
      } else if (result.type === 'notification') {
        this.processNotificationResult(result, assessment);
      }
    }

    // Acil durum protokollerini belirle
    assessment.safetyProtocols = this.determineSafetyProtocols(assessment.severity, query);
    
    // Acil durum kişilerini belirle
    assessment.contacts = this.getEmergencyContacts(assessment.severity);

    return assessment;
  }

  private analyzeQuery(query: string): QueryAnalysis {
    const lowerQuery = query.toLowerCase();
    
    // Kritik kelimeler
    const criticalKeywords = [
      'acil', 'emergency', 'tehlike', 'yangın', 'deprem', 'sel',
      'kurtarma', 'yardım', '112', 'ambulans', 'itfaiye', 'polis',
      'sıkıştım', 'mahsur', 'enkaz', 'can kaybı', 'yaralı'
    ];

    // Yüksek öncelikli kelimeler
    const highPriorityKeywords = [
      'hastane', 'doktor', 'ilaç', 'kan', 'oksijen', 'nefes',
      'kalp', 'bayılma', 'koma', 'şok', 'travma'
    ];

    // Orta öncelikli kelimeler
    const mediumPriorityKeywords = [
      'güvenlik', 'kaçış', 'toplanma', 'sığınak', 'barınak',
      'yiyecek', 'su', 'elektrik', 'ısıtma'
    ];

    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
    let isUrgent = false;

    if (criticalKeywords.some(keyword => lowerQuery.includes(keyword))) {
      severity = 'critical';
      isUrgent = true;
    } else if (highPriorityKeywords.some(keyword => lowerQuery.includes(keyword))) {
      severity = 'high';
      isUrgent = true;
    } else if (mediumPriorityKeywords.some(keyword => lowerQuery.includes(keyword))) {
      severity = 'medium';
    }

    return { severity, isUrgent };
  }

  private processEmergencyResult(result: ToolResult, assessment: EmergencyAssessment): void {
    if (result.data.error) {
      assessment.immediateActions.push({
        type: 'error_handling',
        title: 'Veri Hatası',
        description: 'Acil durum verisi alınamadı, manuel kontrol gerekli',
        priority: 'high'
      });
      return;
    }

    if (result.data.isUrgent) {
      assessment.severity = 'critical';
      assessment.isUrgent = true;
    }

    if (result.data.emergencyAlerts && result.data.emergencyAlerts.length > 0) {
      assessment.immediateActions.push({
        type: 'alert_response',
        title: 'Aktif Uyarılar',
        description: `${result.data.emergencyAlerts.length} aktif uyarı tespit edildi`,
        priority: 'critical'
      });
    }

    if (result.data.safetyRecommendations && result.data.safetyRecommendations.length > 0) {
      assessment.safetyProtocols.push(...result.data.safetyRecommendations);
    }
  }

  private processNotificationResult(result: ToolResult, assessment: EmergencyAssessment): void {
    if (result.data.canSend) {
      assessment.immediateActions.push({
        type: 'send_notification',
        title: 'Bildirim Gönder',
        description: `${result.data.type} ile acil durum bildirimi gönder`,
        priority: assessment.severity === 'critical' ? 'critical' : 'high',
        data: result.data
      });
    }
  }

  private determineSafetyProtocols(severity: string, query: string): string[] {
    const protocols: string[] = [];

    if (severity === 'critical') {
      protocols.push('112 Acil Çağrı Merkezini hemen arayın');
      protocols.push('Güvenli bir yere geçin');
      protocols.push('Acil durum çantanızı alın');
    }

    if (query.toLowerCase().includes('deprem')) {
      protocols.push('Çök, kapan, tutun pozisyonu alın');
      protocols.push('Asansör kullanmayın');
      protocols.push('Pencere ve camlardan uzak durun');
    }

    if (query.toLowerCase().includes('yangın')) {
      protocols.push('Hemen binayı terk edin');
      protocols.push('Asansör kullanmayın');
      protocols.push('Kapıları kapatın');
    }

    if (query.toLowerCase().includes('sel')) {
      protocols.push('Yüksek yerlere çıkın');
      protocols.push('Su seviyesini takip edin');
      protocols.push('Elektrikli cihazları kapatın');
    }

    // Genel güvenlik protokolleri
    protocols.push('Acil durum numarası: 112');
    protocols.push('Güvenli alana gidin');
    protocols.push('Aile ve arkadaşlarınızı bilgilendirin');

    return protocols;
  }

  private getEmergencyContacts(severity: string): EmergencyContact[] {
    const contacts: EmergencyContact[] = [
      { name: 'Acil Çağrı Merkezi', number: '112', type: 'emergency', priority: 'critical' },
      { name: 'Ambulans', number: '112', type: 'medical', priority: 'high' },
      { name: 'İtfaiye', number: '110', type: 'fire', priority: 'high' },
      { name: 'Polis', number: '155', type: 'police', priority: 'medium' }
    ];

    if (severity === 'critical') {
      return contacts.filter(c => c.priority === 'critical' || c.priority === 'high');
    }

    return contacts;
  }

  private generateResponse(query: string, assessment: EmergencyAssessment, userContext: UserContext): string {
    let response = '';

    if (assessment.severity === 'critical') {
      response += '🚨 ACİL DURUM TESPİT EDİLDİ! 🚨\n\n';
      response += 'Hemen aşağıdaki adımları takip edin:\n\n';
    } else if (assessment.severity === 'high') {
      response += '⚠️ YÜKSEK ÖNCELİKLİ DURUM ⚠️\n\n';
      response += 'Aşağıdaki önlemleri alın:\n\n';
    } else {
      response += '📋 Güvenlik Durumu\n\n';
      response += 'Mevcut durum ve öneriler:\n\n';
    }

    // Acil aksiyonlar
    if (assessment.immediateActions.length > 0) {
      response += '🎯 HEMEN YAPILACAKLAR:\n';
      assessment.immediateActions.forEach((action, index) => {
        const icon = action.priority === 'critical' ? '🚨' : '⚡';
        response += `${icon} ${index + 1}. ${action.title}\n`;
        response += `   ${action.description}\n\n`;
      });
    }

    // Güvenlik protokolleri
    if (assessment.safetyProtocols.length > 0) {
      response += '🛡️ GÜVENLİK PROTOKOLLERİ:\n';
      assessment.safetyProtocols.forEach((protocol, index) => {
        response += `${index + 1}. ${protocol}\n`;
      });
      response += '\n';
    }

    // Acil durum kişileri
    if (assessment.contacts.length > 0) {
      response += '📞 ACİL DURUM KİŞİLERİ:\n';
      assessment.contacts.forEach(contact => {
        const icon = contact.priority === 'critical' ? '🚨' : '📞';
        response += `${icon} ${contact.name}: ${contact.number}\n`;
      });
      response += '\n';
    }

    // Konum bilgisi
    response += `📍 Konum: ${assessment.location}\n`;
    response += `🕐 Zaman: ${assessment.timestamp.toLocaleString('tr-TR')}\n`;

    return response;
  }

  private generateSuggestions(query: string, assessment: EmergencyAssessment): string[] {
    const suggestions = [];

    if (assessment.severity === 'critical') {
      suggestions.push('112\'yi aramak istiyorum');
      suggestions.push('Güvenli alana nasıl giderim?');
      suggestions.push('Aileme nasıl haber verebilirim?');
    } else {
      suggestions.push('Güvenlik önlemleri neler?');
      suggestions.push('Acil durum çantası nedir?');
      suggestions.push('Toplanma alanları nerede?');
    }

    suggestions.push('Yardım nasıl isteyebilirim?');
    suggestions.push('Durum nasıl?');

    return suggestions.slice(0, 4);
  }

  private generateActionItems(assessment: EmergencyAssessment): any[] {
    const actionItems = [];

    // Acil aksiyonlar
    assessment.immediateActions.forEach(action => {
      actionItems.push({
        type: action.type,
        title: action.title,
        data: action.data || {},
        priority: action.priority
      });
    });

    // Güvenlik protokolleri
    if (assessment.safetyProtocols.length > 0) {
      actionItems.push({
        type: 'safety_protocol',
        title: 'Güvenlik protokollerini uygula',
        data: { protocols: assessment.safetyProtocols },
        priority: assessment.severity === 'critical' ? 'critical' : 'high'
      });
    }

    // Acil durum kişileri
    if (assessment.contacts.length > 0) {
      actionItems.push({
        type: 'emergency_contact',
        title: 'Acil durum kişilerini ara',
        data: { contacts: assessment.contacts },
        priority: assessment.severity === 'critical' ? 'critical' : 'medium'
      });
    }

    return actionItems;
  }

  private calculateConfidence(toolResults: ToolResult[]): number {
    if (toolResults.length === 0) return 0.1;

    const avgConfidence = toolResults.reduce((sum, result) => sum + result.confidence, 0) / toolResults.length;
    return Math.min(avgConfidence, 0.95);
  }
}

interface EmergencyAssessment {
  severity: 'low' | 'medium' | 'high' | 'critical';
  isUrgent: boolean;
  immediateActions: ImmediateAction[];
  safetyProtocols: string[];
  contacts: EmergencyContact[];
  location: string;
  timestamp: Date;
}

interface QueryAnalysis {
  severity: 'low' | 'medium' | 'high' | 'critical';
  isUrgent: boolean;
}

interface ImmediateAction {
  type: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  data?: any;
}

interface EmergencyContact {
  name: string;
  number: string;
  type: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}
