import { SupervisorDecision, UserContext, ToolResult } from '../types.js';
// Dynamic imports will be handled in executeAgents method

export class SupervisorAgent {
  private agents: Map<string, any>;

  constructor() {
    this.agents = new Map();
  }

  async coordinate(
    query: string, 
    userContext: UserContext, 
    toolResults: ToolResult[]
  ): Promise<SupervisorDecision> {
    // Query'yi analiz et
    const analysis = await this.analyzeQuery(query, userContext);
    
    // Uygun agent'ları seç
    const selectedAgents = this.selectAgents(analysis, toolResults);
    
    // Öncelik belirle
    const priority = this.determinePriority(analysis, toolResults);
    
    // Tahmini süre hesapla
    const estimatedTime = this.calculateEstimatedTime(selectedAgents, analysis);
    
    // Karar verme gerekçesi
    const reasoning = this.generateReasoning(analysis, selectedAgents, priority);

    return {
      selectedAgents,
      priority,
      reasoning,
      estimatedTime
    };
  }

  private async analyzeQuery(query: string, userContext: UserContext): Promise<QueryAnalysis> {
    const lowerQuery = query.toLowerCase();
    
    // Acil durum kontrolü
    const isEmergency = this.isEmergencyQuery(lowerQuery);
    
    // Bilgi talebi kontrolü
    const isInfoRequest = this.isInfoRequest(lowerQuery);
    
    // Aksiyon talebi kontrolü
    const isActionRequest = this.isActionRequest(lowerQuery);
    
    // Rapor talebi kontrolü
    const isReportRequest = this.isReportRequest(lowerQuery);
    
    // Konu kategorileri
    const categories = this.categorizeQuery(lowerQuery);
    
    // Karmaşıklık seviyesi
    const complexity = this.assessComplexity(lowerQuery, categories);

    return {
      isEmergency,
      isInfoRequest,
      isActionRequest,
      isReportRequest,
      categories,
      complexity,
      userContext
    };
  }

  private selectAgents(analysis: QueryAnalysis, toolResults: ToolResult[]): string[] {
    const selectedAgents: string[] = [];

    // Acil durum varsa emergency agent'ı zorunlu
    if (analysis.isEmergency) {
      selectedAgents.push('emergency');
    }

    // Bilgi talebi varsa info agent'ı ekle
    if (analysis.isInfoRequest || analysis.categories.includes('location') || 
        analysis.categories.includes('network') || analysis.categories.includes('social')) {
      selectedAgents.push('info');
    }

    // Aksiyon talebi varsa action agent'ı ekle
    if (analysis.isActionRequest || analysis.categories.includes('notification') || 
        analysis.categories.includes('emergency')) {
      selectedAgents.push('action');
    }

    // Rapor talebi varsa report agent'ı ekle
    if (analysis.isReportRequest || analysis.complexity === 'high') {
      selectedAgents.push('report');
    }

    // Eğer hiç agent seçilmediyse, info agent'ı default olarak ekle
    if (selectedAgents.length === 0) {
      selectedAgents.push('info');
    }

    return Array.from(new Set(selectedAgents)); // Duplicate'ları kaldır
  }

  private determinePriority(analysis: QueryAnalysis, toolResults: ToolResult[]): 'low' | 'medium' | 'high' | 'critical' {
    if (analysis.isEmergency) {
      return 'critical';
    }

    if (toolResults.some(result => result.type === 'emergency' && result.confidence > 0.8)) {
      return 'critical';
    }

    if (analysis.complexity === 'high' || analysis.categories.includes('emergency')) {
      return 'high';
    }

    if (analysis.categories.length > 2 || analysis.isActionRequest) {
      return 'medium';
    }

    return 'low';
  }

  private calculateEstimatedTime(selectedAgents: string[], analysis: QueryAnalysis): number {
    let baseTime = 1000; // 1 saniye base

    // Agent sayısına göre süre ekle
    baseTime += selectedAgents.length * 500;

    // Karmaşıklığa göre süre ekle
    if (analysis.complexity === 'high') {
      baseTime += 2000;
    } else if (analysis.complexity === 'medium') {
      baseTime += 1000;
    }

    // Acil durum için ek süre
    if (analysis.isEmergency) {
      baseTime += 1500;
    }

    return baseTime;
  }

  private generateReasoning(
    analysis: QueryAnalysis, 
    selectedAgents: string[], 
    priority: string
  ): string {
    const reasons = [];

    if (analysis.isEmergency) {
      reasons.push('Acil durum tespit edildi');
    }

    if (analysis.isInfoRequest) {
      reasons.push('Bilgi talebi tespit edildi');
    }

    if (analysis.isActionRequest) {
      reasons.push('Aksiyon talebi tespit edildi');
    }

    if (analysis.complexity === 'high') {
      reasons.push('Karmaşık sorgu, çoklu agent gerekli');
    }

    reasons.push(`Seçilen agent'lar: ${selectedAgents.join(', ')}`);
    reasons.push(`Öncelik: ${priority}`);

    return reasons.join('; ');
  }

  private isEmergencyQuery(query: string): boolean {
    const emergencyKeywords = [
      'acil', 'emergency', 'tehlike', 'yangın', 'deprem', 'sel',
      'kurtarma', 'yardım', '112', 'ambulans', 'itfaiye'
    ];
    return emergencyKeywords.some(keyword => query.includes(keyword));
  }

  private isInfoRequest(query: string): boolean {
    const infoKeywords = [
      'nedir', 'nasıl', 'nerede', 'ne zaman', 'hangi', 'bilgi',
      'durum', 'şebeke', 'konum', 'güvenli', 'trend'
    ];
    return infoKeywords.some(keyword => query.includes(keyword));
  }

  private isActionRequest(query: string): boolean {
    const actionKeywords = [
      'gönder', 'arama', 'çağır', 'bildirim', 'sms', 'email',
      'yap', 'et', 'git', 'gel', 'kaydet'
    ];
    return actionKeywords.some(keyword => query.includes(keyword));
  }

  private isReportRequest(query: string): boolean {
    const reportKeywords = [
      'rapor', 'özet', 'durum', 'analiz', 'istatistik',
      'grafik', 'chart', 'sonuç', 'bulgu'
    ];
    return reportKeywords.some(keyword => query.includes(keyword));
  }

  private categorizeQuery(query: string): string[] {
    const categories = [];

    if (query.includes('konum') || query.includes('nerede') || query.includes('güvenli')) {
      categories.push('location');
    }

    if (query.includes('şebeke') || query.includes('internet') || query.includes('sinyal')) {
      categories.push('network');
    }

    if (query.includes('twitter') || query.includes('sosyal') || query.includes('trend')) {
      categories.push('social');
    }

    if (query.includes('acil') || query.includes('emergency') || query.includes('112')) {
      categories.push('emergency');
    }

    if (query.includes('bildirim') || query.includes('sms') || query.includes('email')) {
      categories.push('notification');
    }

    return categories;
  }

  private assessComplexity(query: string, categories: string[]): 'low' | 'medium' | 'high' {
    let complexity = 'low';

    // Kategori sayısına göre
    if (categories.length > 3) {
      complexity = 'high';
    } else if (categories.length > 1) {
      complexity = 'medium';
    }

    // Query uzunluğuna göre
    if (query.length > 100) {
      complexity = complexity === 'high' ? 'high' : 'medium';
    }

    // Karmaşık kelimelere göre
    const complexWords = ['analiz', 'rapor', 'karşılaştır', 'değerlendir', 'hesapla'];
    if (complexWords.some(word => query.includes(word))) {
      complexity = 'high';
    }

    return complexity as 'low' | 'medium' | 'high';
  }
}

interface QueryAnalysis {
  isEmergency: boolean;
  isInfoRequest: boolean;
  isActionRequest: boolean;
  isReportRequest: boolean;
  categories: string[];
  complexity: 'low' | 'medium' | 'high';
  userContext: UserContext;
}
