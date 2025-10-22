import OpenAI from 'openai';
import { UserContext, AgentResponse, ToolResult } from '../types.js';

export class ResponseGenerator {
  private llm: OpenAI;

  constructor() {
    this.llm = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  /**
   * Combine agent responses into a single response
   */
  async combineResponses(
    query: string,
    userContext: UserContext,
    toolResults: ToolResult[],
    agentResponses: AgentResponse[],
    relevantContext: string[]
  ): Promise<AgentResponse> {
    // Combine messages
    const combinedMessage = this.combineMessages(agentResponses);
    
    // Combine suggestions
    const combinedSuggestions = this.combineSuggestions(agentResponses);
    
    // Combine action items
    const combinedActionItems = this.combineActionItems(agentResponses);

    // Get RL recommendations
    const recommendationResult = toolResults.find(result => result.type === 'recommendation');
    const personalizedSuggestions = recommendationResult ? 
      this.enhanceSuggestionsWithRL(combinedSuggestions, recommendationResult.data) : 
      combinedSuggestions;

    // Generate final response with LLM
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
      actionItems: [], // Action items'ı kaldırıyoruz - sadece suggestions gösterilecek
      toolResults: toolResults,
      confidence: this.calculateOverallConfidence(agentResponses, toolResults),
      timestamp: new Date()
    };
  }

  /**
   * Combine messages from multiple agents
   */
  private combineMessages(agentResponses: AgentResponse[]): string {
    if (agentResponses.length === 0) {
      return 'Üzgünüm, bu konuda yardımcı olamıyorum.';
    }

    if (agentResponses.length === 1) {
      return agentResponses[0].message;
    }

    // Combine multiple agent responses
    const messages = agentResponses.map(response => response.message);
    return messages.join('\n\n---\n\n');
  }

  /**
   * Combine suggestions from multiple agents
   */
  private combineSuggestions(agentResponses: AgentResponse[]): string[] {
    const allSuggestions = agentResponses.flatMap(response => response.suggestions);
    const uniqueSuggestions = Array.from(new Set(allSuggestions));
    return uniqueSuggestions.slice(0, 6); // Max 6 suggestions
  }

  /**
   * Combine action items from multiple agents
   */
  private combineActionItems(agentResponses: AgentResponse[]): any[] {
    const allActionItems = agentResponses.flatMap(response => response.actionItems);
    
    // Sort by priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return allActionItems.sort((a, b) => 
      priorityOrder[a.priority] - priorityOrder[b.priority]
    );
  }

  /**
   * Enhance suggestions with RL recommendations
   */
  private enhanceSuggestionsWithRL(originalSuggestions: string[], recommendationData: any): string[] {
    if (!recommendationData) return originalSuggestions;

    const rlSuggestions: string[] = [];
    
    // Add RL recommendation to top
    if (recommendationData.title) {
      rlSuggestions.push(`🎯 ${recommendationData.title}`);
    }
    
    // Add alternative recommendations
    if (recommendationData.alternatives) {
      recommendationData.alternatives.forEach((alt: any) => {
        rlSuggestions.push(`💡 ${alt.title}`);
      });
    }
    
    // Add original suggestions (avoid duplicates)
    const uniqueOriginal = originalSuggestions.filter(suggestion => 
      !rlSuggestions.some(rlSuggestion => 
        rlSuggestion.toLowerCase().includes(suggestion.toLowerCase())
      )
    );
    
    return [...rlSuggestions, ...uniqueOriginal].slice(0, 6); // Max 6 suggestions
  }

  /**
   * Generate final response using LLM
   */
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
        actionItems: [] // Action items'ı kaldırıyoruz
      };

    } catch (error) {
      console.error('LLM generation error:', error);
      return {
        message: combinedMessage,
        suggestions: suggestions,
        actionItems: [] // Action items'ı kaldırıyoruz
      };
    }
  }

  /**
   * Calculate overall confidence score
   */
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
}

