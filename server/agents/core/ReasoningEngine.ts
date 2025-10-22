import { UserContext, ToolResult } from '../types.js';

export interface ReasoningStep {
  step: number;
  reasoning: string;
  action: string;
  observation: string;
  confidence: number;
  timestamp: Date;
}

export interface ReasoningContext {
  query: string;
  userContext: UserContext;
  toolResults: ToolResult[];
  previousSteps: ReasoningStep[];
  maxSteps: number;
}

export class ReasoningEngine {
  private maxReasoningSteps = 5;
  private reasoningHistory: Map<string, ReasoningStep[]> = new Map();

  /**
   * ReAct Pattern: Reasoning → Action → Observation
   */
  async executeReActPattern(
    query: string,
    userContext: UserContext,
    toolResults: ToolResult[]
  ): Promise<{
    finalResult: ToolResult | null;
    reasoningSteps: ReasoningStep[];
    success: boolean;
  }> {
    const context: ReasoningContext = {
      query,
      userContext,
      toolResults,
      previousSteps: [],
      maxSteps: this.maxReasoningSteps
    };

    console.log(`🧠 ReAct Pattern başlatılıyor: "${query}"`);
    
    let currentStep = 1;
    let currentResults = toolResults;
    let success = false;
    let finalResult: ToolResult | null = null;

    while (currentStep <= this.maxReasoningSteps && !success) {
      // 1. REASONING: Mevcut durumu analiz et
      const reasoning = await this.reason(context, currentResults, currentStep);
      
      // 2. ACTION: Hangi aksiyonu alacağına karar ver
      const action = await this.decideAction(context, reasoning, currentResults);
      
      // 3. OBSERVATION: Aksiyonun sonucunu gözlemle
      const observation = await this.observe(context, action, currentResults);
      
      // Reasoning step'i kaydet
      const reasoningStep: ReasoningStep = {
        step: currentStep,
        reasoning,
        action,
        observation,
        confidence: this.calculateConfidence(reasoning, action, observation),
        timestamp: new Date()
      };
      
      context.previousSteps.push(reasoningStep);
      console.log(`🔄 ReAct Step ${currentStep}: ${reasoning} → ${action} → ${observation}`);
      
      // Sonuç başarılı mı kontrol et
      if (this.isSuccess(observation, currentResults)) {
        success = true;
        finalResult = this.extractBestResult(currentResults);
        console.log(`✅ ReAct Pattern başarılı! Step ${currentStep}'te sonuç bulundu.`);
        break;
      }
      
      // Fallback gerekli mi kontrol et
      if (this.needsFallback(observation, currentResults)) {
        currentResults = await this.executeFallback(context, currentResults);
        console.log(`🔄 Fallback uygulandı, yeni sonuçlar: ${currentResults.length} adet`);
      }
      
      currentStep++;
    }

    if (!success) {
      console.log(`❌ ReAct Pattern ${this.maxReasoningSteps} step'te başarısız oldu.`);
    }

    return {
      finalResult,
      reasoningSteps: context.previousSteps,
      success
    };
  }

  /**
   * REASONING: Mevcut durumu analiz et
   */
  private async reason(
    context: ReasoningContext,
    currentResults: ToolResult[],
    step: number
  ): Promise<string> {
    const { query, userContext } = context;
    
    // Tool sonuçlarını analiz et
    const resultAnalysis = this.analyzeToolResults(currentResults);
    
    // Query türünü belirle
    const queryType = this.determineQueryType(query);
    
    // Kullanıcı konumunu analiz et
    const locationAnalysis = this.analyzeUserLocation(userContext);
    
    // Önceki step'lerden öğren
    const previousInsights = this.learnFromPreviousSteps(context.previousSteps);
    
    let reasoning = `Step ${step}: `;
    
    if (step === 1) {
      reasoning += `Query "${query}" analiz edildi. Tür: ${queryType}. `;
      reasoning += `Kullanıcı konumu: ${locationAnalysis}. `;
      reasoning += `Mevcut tool sonuçları: ${resultAnalysis.summary}. `;
    } else {
      reasoning += `Önceki step'lerden öğrenilen: ${previousInsights}. `;
      reasoning += `Mevcut durum: ${resultAnalysis.summary}. `;
    }
    
    if (resultAnalysis.hasErrors) {
      reasoning += `Hata tespit edildi: ${resultAnalysis.errors.join(', ')}. `;
    }
    
    if (resultAnalysis.isEmpty) {
      reasoning += `Sonuç bulunamadı, fallback gerekli. `;
    }
    
    return reasoning;
  }

  /**
   * ACTION: Hangi aksiyonu alacağına karar ver
   */
  private async decideAction(
    context: ReasoningContext,
    reasoning: string,
    currentResults: ToolResult[]
  ): Promise<string> {
    const { query } = context;
    
    // Tool sonuçlarını analiz et
    const resultAnalysis = this.analyzeToolResults(currentResults);
    
    if (resultAnalysis.hasErrors) {
      return `Python hatası tespit edildi, fallback tool'ları kullan`;
    }
    
    if (resultAnalysis.isEmpty) {
      return `Sonuç bulunamadı, web search fallback'i uygula`;
    }
    
    if (resultAnalysis.hasLowConfidence) {
      return `Düşük güven skoru, alternatif tool'ları dene`;
    }
    
    // Query türüne göre aksiyon belirle
    const queryType = this.determineQueryType(query);
    
    switch (queryType) {
      case 'hospital':
        return `Hastane araması için location ve websearch tool'larını kullan`;
      case 'first_aid':
        return `İlkyardım bilgisi için ilkyardim tool'unu kullan`;
      case 'emergency':
        return `Acil durum için emergency tool'unu kullan`;
      case 'location':
        return `Konum bilgisi için location tool'unu kullan`;
      default:
        return `Genel bilgi için websearch tool'unu kullan`;
    }
  }

  /**
   * OBSERVATION: Aksiyonun sonucunu gözlemle
   */
  private async observe(
    context: ReasoningContext,
    action: string,
    currentResults: ToolResult[]
  ): Promise<string> {
    const resultAnalysis = this.analyzeToolResults(currentResults);
    
    if (resultAnalysis.hasErrors) {
      return `Hata: ${resultAnalysis.errors.join(', ')}`;
    }
    
    if (resultAnalysis.isEmpty) {
      return `Sonuç bulunamadı: ${currentResults.length} tool çalıştı ama sonuç yok`;
    }
    
    if (resultAnalysis.hasLowConfidence) {
      return `Düşük güven: En yüksek güven skoru ${resultAnalysis.maxConfidence}`;
    }
    
    return `Başarılı: ${currentResults.length} tool'dan ${resultAnalysis.successfulCount} tanesi sonuç verdi. En yüksek güven: ${resultAnalysis.maxConfidence}`;
  }

  /**
   * Tool sonuçlarını analiz et
   */
  private analyzeToolResults(results: ToolResult[]): {
    summary: string;
    hasErrors: boolean;
    isEmpty: boolean;
    hasLowConfidence: boolean;
    maxConfidence: number;
    successfulCount: number;
    errors: string[];
  } {
    if (results.length === 0) {
      return {
        summary: 'Hiç tool sonucu yok',
        hasErrors: false,
        isEmpty: true,
        hasLowConfidence: false,
        maxConfidence: 0,
        successfulCount: 0,
        errors: []
      };
    }

    const errors: string[] = [];
    let successfulCount = 0;
    let maxConfidence = 0;
    let hasErrors = false;

    for (const result of results) {
      if (result.confidence > 0.1) {
        successfulCount++;
        maxConfidence = Math.max(maxConfidence, result.confidence);
      }
      
      if (result.data?.error) {
        hasErrors = true;
        errors.push(result.data.error);
      }
    }

    const isEmpty = successfulCount === 0;
    const hasLowConfidence = maxConfidence < 0.5;

    return {
      summary: `${results.length} tool, ${successfulCount} başarılı`,
      hasErrors,
      isEmpty,
      hasLowConfidence,
      maxConfidence,
      successfulCount,
      errors
    };
  }

  /**
   * Query türünü belirle
   */
  private determineQueryType(query: string): string {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('hastane') || lowerQuery.includes('doktor')) {
      return 'hospital';
    }
    
    if (lowerQuery.includes('ilkyardım') || lowerQuery.includes('yaşam üçgeni')) {
      return 'first_aid';
    }
    
    if (lowerQuery.includes('acil') || lowerQuery.includes('emergency')) {
      return 'emergency';
    }
    
    if (lowerQuery.includes('konum') || lowerQuery.includes('nerede')) {
      return 'location';
    }
    
    return 'general';
  }

  /**
   * Kullanıcı konumunu analiz et
   */
  private analyzeUserLocation(userContext: UserContext): string {
    const location = userContext.location;
    if (!location) {
      return 'Konum bilgisi yok';
    }
    
    return `${location.district || 'Bilinmiyor'}, ${location.city || 'İstanbul'}`;
  }

  /**
   * Önceki step'lerden öğren
   */
  private learnFromPreviousSteps(previousSteps: ReasoningStep[]): string {
    if (previousSteps.length === 0) {
      return 'İlk step';
    }
    
    const lastStep = previousSteps[previousSteps.length - 1];
    return `Son step: ${lastStep.action} → ${lastStep.observation}`;
  }

  /**
   * Başarı kontrolü
   */
  private isSuccess(observation: string, results: ToolResult[]): boolean {
    if (results.length === 0) return false;
    
    const hasSuccessfulResults = results.some(r => r.confidence > 0.5);
    const hasNoErrors = !results.some(r => r.data?.error);
    
    return hasSuccessfulResults && hasNoErrors;
  }

  /**
   * Fallback gerekli mi kontrol et
   */
  private needsFallback(observation: string, results: ToolResult[]): boolean {
    return observation.includes('Hata:') || 
           observation.includes('Sonuç bulunamadı') ||
           results.length === 0 ||
           results.every(r => r.confidence < 0.3);
  }

  /**
   * Fallback uygula
   */
  private async executeFallback(
    context: ReasoningContext,
    currentResults: ToolResult[]
  ): Promise<ToolResult[]> {
    console.log(`🔄 Fallback uygulanıyor...`);
    
    // Web search fallback'i ekle
    const webSearchFallback: ToolResult = {
      type: 'websearch',
      data: {
        query: context.query,
        results: [{
          title: `${context.query} - Web Arama Sonucu`,
          snippet: 'Web araması ile bulunan sonuç',
          url: 'https://example.com',
          content: `"${context.query}" için web araması sonucu. Detaylı bilgi için web sitesini ziyaret edin.`
        }],
        fallback: true
      },
      confidence: 0.6,
      timestamp: new Date(),
      source: 'websearch_fallback'
    };
    
    return [...currentResults, webSearchFallback];
  }

  /**
   * En iyi sonucu çıkar
   */
  private extractBestResult(results: ToolResult[]): ToolResult | null {
    if (results.length === 0) return null;
    
    return results.reduce((best, current) => {
      return current.confidence > best.confidence ? current : best;
    });
  }

  /**
   * Güven skoru hesapla
   */
  private calculateConfidence(reasoning: string, action: string, observation: string): number {
    let confidence = 0.5; // Base confidence
    
    if (observation.includes('Başarılı')) confidence += 0.3;
    if (observation.includes('Hata')) confidence -= 0.4;
    if (observation.includes('Sonuç bulunamadı')) confidence -= 0.3;
    
    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Reasoning geçmişini temizle
   */
  clearHistory(userId: string): void {
    this.reasoningHistory.delete(userId);
  }

  /**
   * Reasoning geçmişini al
   */
  getHistory(userId: string): ReasoningStep[] {
    return this.reasoningHistory.get(userId) || [];
  }
}
