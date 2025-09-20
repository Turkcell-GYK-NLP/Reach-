import OpenAI from 'openai';
import { UserContext, AgentResponse, ToolResult } from './types.js';
import { MemoryStore } from './memory/memoryStore.js';
import { SupervisorAgent } from './supervisor/supervisorAgent.js';
import { LocationTool } from './tools/locationTool.js';
import { NetworkTool } from './tools/networkTool.js';
import { SocialMediaTool } from './tools/socialMediaTool.js';
import { EmergencyTool } from './tools/emergencyTool.js';
import { NotificationTool } from './tools/notificationTool.js';
import { WebSearchTool } from './tools/webSearchTool.js';
import { RecommendationTool } from './tools/recommendationTool.js';

export class CoreAgent {
  private llm: OpenAI;
  private memory: MemoryStore;
  private supervisor: SupervisorAgent;
  private tools: Map<string, any>;

  constructor() {
    this.llm = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    this.memory = new MemoryStore();
    this.supervisor = new SupervisorAgent();
    
    // Tool'ları initialize et
    this.tools = new Map();
    this.tools.set('location', new LocationTool());
    this.tools.set('network', new NetworkTool());
    this.tools.set('social', new SocialMediaTool());
    this.tools.set('emergency', new EmergencyTool());
    this.tools.set('notification', new NotificationTool());
    this.tools.set('websearch', new WebSearchTool());
    this.tools.set('recommendation', new RecommendationTool());
  }

  async processQuery(query: string, userContext: UserContext): Promise<AgentResponse> {
    try {
      console.log(`🤖 CoreAgent processing query: "${query}" for user: ${userContext.userId}`);

      // 1. Emergency level'ı query'den tespit et
      const emergencyLevel = this.detectEmergencyLevel(query);
      const enhancedUserContext = {
        ...userContext,
        preferences: {
          ...userContext.preferences,
          emergencyLevel
        }
      };

      // 2. Memory'den context'i al
      const memoryContext = await this.memory.getContext(userContext.userId);
      const relevantContext = await this.memory.getRelevantContext(userContext.userId, query);

      // 3. Tool'ları çalıştır (enhanced context ile)
      const toolResults = await this.executeTools(query, enhancedUserContext);
      console.log(`🔧 Tool results: ${toolResults.length} results`);

      // 4. Supervisor ile koordinasyon
      const supervisorDecision = await this.supervisor.coordinate(query, enhancedUserContext, toolResults);
      console.log(`🎯 Supervisor decision: ${supervisorDecision.selectedAgents.join(', ')}`);

      // 5. Seçilen agent'ları çalıştır
      const agentResponses = await this.executeAgents(
        supervisorDecision.selectedAgents,
        query,
        enhancedUserContext,
        toolResults
      );

      // 6. Agent yanıtlarını birleştir
      const combinedResponse = await this.combineResponses(
        query,
        enhancedUserContext,
        toolResults,
        agentResponses,
        relevantContext
      );

      // 7. Memory'yi güncelle
      await this.memory.updateContext(userContext.userId, query, combinedResponse.message, enhancedUserContext);

      console.log(`✅ CoreAgent completed processing`);
      return combinedResponse;

    } catch (error) {
      console.error('CoreAgent error:', error);
      return this.createErrorResponse(query, error);
    }
  }

  private async executeTools(query: string, userContext: UserContext): Promise<ToolResult[]> {
    const results: ToolResult[] = [];

    // Tüm tool'ları paralel olarak çalıştır
    const toolPromises = Array.from(this.tools.entries()).map(async ([name, tool]) => {
      try {
        const result = await tool.execute({ query, userContext });
        if (result) {
          console.log(`🔧 Tool ${name} executed successfully`);
          return result;
        }
        return null;
      } catch (error) {
        console.error(`❌ Tool ${name} error:`, error);
        return null;
      }
    });

    const toolResults = await Promise.all(toolPromises);
    return toolResults.filter(result => result !== null) as ToolResult[];
  }

  private async executeAgents(
    selectedAgents: string[],
    query: string,
    userContext: UserContext,
    toolResults: ToolResult[]
  ): Promise<AgentResponse[]> {
    const agentMap = {
      'info': () => import('./supervisor/infoAgent.js').then(m => new m.InfoAgent()),
      'action': () => import('./supervisor/actionAgent.js').then(m => new m.ActionAgent()),
      'report': () => import('./supervisor/reportAgent.js').then(m => new m.ReportAgent()),
      'emergency': () => import('./supervisor/emergencyAgent.js').then(m => new m.EmergencyAgent())
    };

    const agentPromises = selectedAgents.map(async (agentName) => {
      try {
        const AgentClass = await agentMap[agentName as keyof typeof agentMap]();
        const response = await AgentClass.execute(query, userContext, toolResults);
        console.log(`🎭 Agent ${agentName} executed successfully`);
        return response;
      } catch (error) {
        console.error(`❌ Agent ${agentName} error:`, error);
        return null;
      }
    });

    const agentResponses = await Promise.all(agentPromises);
    return agentResponses.filter(response => response !== null) as AgentResponse[];
  }

  private async combineResponses(
    query: string,
    userContext: UserContext,
    toolResults: ToolResult[],
    agentResponses: AgentResponse[],
    relevantContext: string[]
  ): Promise<AgentResponse> {
    // Agent yanıtlarını birleştir
    const combinedMessage = this.combineMessages(agentResponses);
    const combinedSuggestions = this.combineSuggestions(agentResponses);
    const combinedActionItems = this.combineActionItems(agentResponses);

    // RL öneri motorundan kişiselleştirilmiş öneriler al
    const recommendationResult = toolResults.find(result => result.type === 'recommendation');
    const personalizedSuggestions = recommendationResult ? 
      this.enhanceSuggestionsWithRL(combinedSuggestions, recommendationResult.data) : 
      combinedSuggestions;

    // LLM ile final yanıt oluştur
    const finalResponse = await this.generateFinalResponse(
      query,
      userContext,
      combinedMessage,
      personalizedSuggestions,
      combinedActionItems,
      relevantContext,
      recommendationResult?.data
    );

    return {
      message: finalResponse.message,
      suggestions: finalResponse.suggestions,
      actionItems: finalResponse.actionItems,
      toolResults: toolResults,
      confidence: this.calculateOverallConfidence(agentResponses, toolResults),
      timestamp: new Date()
    };
  }

  private combineMessages(agentResponses: AgentResponse[]): string {
    if (agentResponses.length === 0) {
      return 'Üzgünüm, bu konuda yardımcı olamıyorum.';
    }

    if (agentResponses.length === 1) {
      return agentResponses[0].message;
    }

    // Birden fazla agent yanıtı varsa birleştir
    const messages = agentResponses.map(response => response.message);
    return messages.join('\n\n---\n\n');
  }

  private combineSuggestions(agentResponses: AgentResponse[]): string[] {
    const allSuggestions = agentResponses.flatMap(response => response.suggestions);
    const uniqueSuggestions = Array.from(new Set(allSuggestions));
    return uniqueSuggestions.slice(0, 6); // Maksimum 6 öneri
  }

  private combineActionItems(agentResponses: AgentResponse[]): any[] {
    const allActionItems = agentResponses.flatMap(response => response.actionItems);
    
    // Öncelik sırasına göre sırala
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return allActionItems.sort((a, b) => 
      priorityOrder[a.priority] - priorityOrder[b.priority]
    );
  }

  private enhanceSuggestionsWithRL(originalSuggestions: string[], recommendationData: any): string[] {
    if (!recommendationData) return originalSuggestions;

    const rlSuggestions: string[] = [];
    
    // RL önerisini en üste ekle
    if (recommendationData.title) {
      rlSuggestions.push(`🎯 ${recommendationData.title}`);
    }
    
    // Alternatif önerileri ekle
    if (recommendationData.alternatives) {
      recommendationData.alternatives.forEach((alt: any) => {
        rlSuggestions.push(`💡 ${alt.title}`);
      });
    }
    
    // Orijinal önerileri ekle (çakışmaları önle)
    const uniqueOriginal = originalSuggestions.filter(suggestion => 
      !rlSuggestions.some(rlSuggestion => 
        rlSuggestion.toLowerCase().includes(suggestion.toLowerCase())
      )
    );
    
    return [...rlSuggestions, ...uniqueOriginal].slice(0, 6); // Maksimum 6 öneri
  }

  private async generateFinalResponse(
    query: string,
    userContext: UserContext,
    combinedMessage: string,
    suggestions: string[],
    actionItems: any[],
    relevantContext: string[],
    recommendationData?: any
  ): Promise<{ message: string; suggestions: string[]; actionItems: any[] }> {
    try {
      const rlContext = recommendationData ? `
🤖 Kişiselleştirilmiş Öneri (RL Motoru):
- Ana Öneri: ${recommendationData.title}
- Açıklama: ${recommendationData.description}
- Güven Skoru: ${recommendationData.confidence}
- Gerekçe: ${recommendationData.reasoning}
- Alternatifler: ${recommendationData.alternatives?.map((alt: any) => alt.title).join(', ') || 'Yok'}
` : '';

      const systemPrompt = `Sen REACH+ afet destek sisteminin ana AI asistanısın. 
Acil durumlarda kullanıcıyı sakinleştiren, ilk yardım konusunda rehberlik eden ve panik halindeki insanlara empatiyle yaklaşan bir asistan.

Kullanıcı Bağlamı:
- Kullanıcı ID: ${userContext.userId}
- Konum: ${userContext.location?.district || 'Bilinmiyor'}, ${userContext.location?.city || 'İstanbul'}
- Operatör: ${userContext.operator || 'Bilinmiyor'}
- Yaş: ${userContext.age || 'Genç'}

Mevcut Bilgiler:
${combinedMessage}
${rlContext}

İlgili Geçmiş:
${relevantContext.join('\n')}

ACİL DURUM YAKLAŞIMI:
- HEMEN PROAKTİF OL: "Ben 112'yi arayacağım, siz sakin olun!"
- Kullanıcıyı sakinleştir: "Ben buradayım, seni koruyacağım, yardım geliyor"
- Panik halindeki kullanıcıya: "Derin nefes al, ben seninle birlikteyim, 112'yi arıyorum"
- Yaralı kullanıcıya: "Hareket etme, ben 112'yi arayacağım, seni kurtaracaklar"
- Aile endişesi olan kullanıcıya: "Ben 112'yi arayacağım, ailen de güvende olacak"

İLK YARDIM REHBERLİĞİ:
- Yaralanma durumunda: "Kanama varsa temiz bezle bastır, hareket etme"
- Bilinç kaybı durumunda: "Yan yatır, nefes alıp almadığını kontrol et"
- Kırık şüphesi: "Hareket ettirme, destekle sabitle"
- Yanık durumunda: "Soğuk suyla 15-20 dakika yıka, buz koyma"
- Zehirlenme: "Kusturma, hemen 112'yi ara"

SOHBET TARZI:
- Sıcak ve empatik ton kullan
- "Seni anlıyorum", "Birlikte çözeceğiz" gibi destekleyici ifadeler
- Panik halindeki kullanıcıya kısa, net cümleler
- Sürekli güven ver: "Ben buradayım, seni yalnız bırakmam"
- Aile ve sevdiklerini merak eden kullanıcıya: "Önce seni güvende tutalım, sonra onları buluruz"

ACİL DURUM SORGULAMA:
- "Yanınızda ne var? Kimse var mı?"
- "Yaralı mısınız? Nerede ağrınız var?"
- "Nefes alabiliyor musunuz? Konuşabiliyor musunuz?"
- "Hareket edebiliyor musunuz? Çıkış yolu görüyor musunuz?"
- "Telefonunuz çalışıyor mu? Başka iletişim aracınız var mı?"
- "Aileniz nerede? Onlarla iletişim kurabiliyor musunuz?"

KURALLAR:
- Acil durumlarda öncelik: Proaktif müdahale → Sakinleştir → Sorgula → İlk yardım → Güvenli alan
- HEMEN "Ben 112'yi arayacağım" de ve kullanıcıyı sakinleştir
- Kullanıcının durumunu detaylı sorgula (yaralanma, yanındakiler, çıkış yolu)
- Panik halindeki kullanıcıya kısa, net talimatlar
- Yaralı kullanıcıya hareket etmemesini söyle
- Sürekli "Ben buradayım, yardım geliyor" mesajı ver
- Kullanıcının duygusal durumunu anla ve ona göre yaklaş
- RL önerilerini öncelikle kullan
- Kişiselleştirilmiş önerileri vurgula

Yanıt formatı (JSON):
{
  "message": "Empatik ve sakinleştirici ana yanıt",
  "suggestions": ["Sakinleştirici öneri 1", "Pratik adım 2"],
  "actionItems": [{"type": "emergency|firstaid|location", "title": "Acil eylem", "priority": "high"}]
}

Lütfen yanıtınızı JSON formatında verin.`;

      const response = await this.llm.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: query }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      return {
        message: result.message || combinedMessage,
        suggestions: result.suggestions || suggestions,
        actionItems: result.actionItems || actionItems
      };

    } catch (error) {
      console.error('LLM generation error:', error);
      return {
        message: combinedMessage,
        suggestions: suggestions,
        actionItems: actionItems
      };
    }
  }

  private calculateOverallConfidence(agentResponses: AgentResponse[], toolResults: ToolResult[]): number {
    if (agentResponses.length === 0 && toolResults.length === 0) {
      return 0.1;
    }

    const agentConfidence = agentResponses.length > 0 
      ? agentResponses.reduce((sum, response) => sum + response.confidence, 0) / agentResponses.length
      : 0;

    const toolConfidence = toolResults.length > 0
      ? toolResults.reduce((sum, result) => sum + result.confidence, 0) / toolResults.length
      : 0;

    const overallConfidence = (agentConfidence + toolConfidence) / 2;
    return Math.min(overallConfidence, 0.95);
  }

  private createErrorResponse(query: string, error: any): AgentResponse {
    return {
      message: `Üzgünüm, bir hata oluştu: ${error.message || 'Bilinmeyen hata'}. Lütfen tekrar deneyin.`,
      suggestions: [
        'Tekrar deneyin',
        'Farklı bir soru sorun',
        'Yardım isteyin'
      ],
      actionItems: [],
      toolResults: [],
      confidence: 0.1,
      timestamp: new Date()
    };
  }

  // Memory yönetimi
  async clearUserMemory(userId: string): Promise<void> {
    this.memory.clearCache(userId);
  }

  async getUserMemory(userId: string): Promise<any> {
    return this.memory.getContext(userId);
  }

  // RL Recommendation Tool erişimi
  getRecommendationTool(): any {
    return this.tools.get('recommendation');
  }

  // Emergency level detection
  private detectEmergencyLevel(query: string): 'low' | 'medium' | 'high' | 'critical' {
    const lowerQuery = query.toLowerCase();
    
    // Critical keywords
    const criticalKeywords = [
      'acil yardım', 'ambulans', 'itfaiye', '112', 'kritik', 'tehlikede',
      'kurtarma', 'yardım et', 'ölüyor', 'bayıldı', 'kanama', 'yangın'
    ];
    
    // High keywords
    const highKeywords = [
      'acil', 'emergency', 'deprem', 'sel', 'yangın', 'tehlike', 'panik',
      'korkuyorum', 'korku', 'endişe', 'stres', 'kötü', 'iyi değil'
    ];
    
    // Medium keywords
    const mediumKeywords = [
      'sorun', 'problem', 'yardım', 'destek', 'bilgi', 'nasıl', 'ne yapmalı'
    ];
    
    // Check for critical
    if (criticalKeywords.some(keyword => lowerQuery.includes(keyword))) {
      console.log(`🚨 Critical emergency detected: "${query}"`);
      return 'critical';
    }
    
    // Check for high
    if (highKeywords.some(keyword => lowerQuery.includes(keyword))) {
      console.log(`⚠️ High emergency detected: "${query}"`);
      return 'high';
    }
    
    // Check for medium
    if (mediumKeywords.some(keyword => lowerQuery.includes(keyword))) {
      console.log(`🔶 Medium emergency detected: "${query}"`);
      return 'medium';
    }
    
    // Default to low
    return 'low';
  }
}
