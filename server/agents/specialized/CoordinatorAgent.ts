import { UserContext, ToolResult, AgentResponse } from '../types.js';
import { MedicalAgent } from './MedicalAgent.js';
import { LocationAgent } from './LocationAgent.js';

export class CoordinatorAgent {
  name = 'coordinator';
  description = 'Multi-agent koordinasyonu ve merkezi yönetim';

  private medicalAgent: MedicalAgent;
  private locationAgent: LocationAgent;

  constructor() {
    this.medicalAgent = new MedicalAgent();
    this.locationAgent = new LocationAgent();
  }

  async execute(
    query: string,
    userContext: UserContext,
    toolResults: ToolResult[]
  ): Promise<AgentResponse> {
    console.log(`🎯 CoordinatorAgent executing: "${query}"`);

    // Query analizi yap
    const queryAnalysis = this.analyzeQuery(query);
    
    // Hangi agent'ları kullanacağına karar ver (LLM ile)
    const selectedAgents = await this.selectAgents(query, queryAnalysis, toolResults);
    
    // Agent'ları koordine et
    const agentResponses = await this.coordinateAgents(
      selectedAgents,
      query,
      userContext,
      toolResults
    );
    
    // Sonuçları birleştir
    const coordinatedResponse = this.combineResponses(agentResponses, queryAnalysis);
    
    return coordinatedResponse;
  }

  private analyzeQuery(query: string): QueryAnalysis {
    const lowerQuery = query.toLowerCase();
    
    const analysis: QueryAnalysis = {
      primaryIntent: 'general',
      secondaryIntents: [],
      urgency: 'low',
      requiresMedical: false,
      requiresLocation: false,
      requiresEmergency: false,
      complexity: 'low',
      keywords: [],
      timestamp: new Date()
    };

    // Ana intent'i belirle
    if (this.isMedicalQuery(lowerQuery)) {
      analysis.primaryIntent = 'medical';
      analysis.requiresMedical = true;
    } else if (this.isLocationQuery(lowerQuery)) {
      analysis.primaryIntent = 'location';
      analysis.requiresLocation = true;
    } else if (this.isEmergencyQuery(lowerQuery)) {
      analysis.primaryIntent = 'emergency';
      analysis.requiresEmergency = true;
    }

    // İkincil intent'leri belirle
    if (this.isMedicalQuery(lowerQuery) && this.isLocationQuery(lowerQuery)) {
      analysis.secondaryIntents.push('location');
    }
    if (this.isEmergencyQuery(lowerQuery)) {
      analysis.secondaryIntents.push('emergency');
    }

    // Aciliyet seviyesini belirle
    if (lowerQuery.includes('acil') || lowerQuery.includes('emergency') || 
        lowerQuery.includes('112') || lowerQuery.includes('ambulans')) {
      analysis.urgency = 'critical';
    } else if (lowerQuery.includes('hastane') || lowerQuery.includes('doktor') ||
               lowerQuery.includes('yaralanma') || lowerQuery.includes('ağrı')) {
      analysis.urgency = 'high';
    } else if (lowerQuery.includes('ilkyardım') || lowerQuery.includes('yaşam üçgeni')) {
      analysis.urgency = 'medium';
    }

    // Karmaşıklık seviyesini belirle
    if (analysis.secondaryIntents.length > 0 || analysis.urgency === 'critical') {
      analysis.complexity = 'high';
    } else if (analysis.urgency === 'high' || analysis.urgency === 'medium') {
      analysis.complexity = 'medium';
    }

    // Anahtar kelimeleri çıkar
    analysis.keywords = this.extractKeywords(lowerQuery);

    return analysis;
  }

  private async selectAgents(
    query: string,
    queryAnalysis: QueryAnalysis,
    toolResults: ToolResult[]
  ): Promise<string[]> {
    // LLM ile agent seçimi yap
    const selectedAgents = await this.selectAgentsWithLLM(query, queryAnalysis, toolResults);
    
    console.log(`🎯 LLM Selected agents: ${selectedAgents.join(', ')}`);
    return selectedAgents;
  }

  private async selectAgentsWithLLM(
    query: string,
    queryAnalysis: QueryAnalysis,
    toolResults: ToolResult[]
  ): Promise<string[]> {
    const { OpenAI } = await import('openai');
    const llm = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const availableAgents = [
      'medical: Tıbbi bilgiler, hastane araması, ilkyardım, sağlık konuları',
      'location: Konum bilgileri, güvenli alanlar, toplanma alanları, yol tarifi',
      'emergency: Acil durum müdahalesi, 112 çağrısı, kritik durumlar',
      'ilkyardim: İlk yardım bilgileri, yaşam üçgeni, deprem güvenliği',
      'population: Nüfus analizi, demografi, istatistik, nüfus değişimi',
      'info: Genel bilgi, diğer konular'
    ];

    // Tool sonuçlarını analiz et
    const toolAnalysis = this.analyzeToolResults(toolResults);
    
    const prompt = `Sen bir AI agent seçim uzmanısın. Kullanıcının sorusunu ve MEVCUT TOOL SONUÇLARINI analiz ederek hangi agent'ların gerekli olduğunu belirle.

Kullanıcı Sorusu: "${query}"

MEVCUT TOOL SONUÇLARI:
${toolAnalysis}

Mevcut Agent'lar:
${availableAgents.map(agent => `- ${agent}`).join('\n')}

Kurallar:
1. ÖNCE tool sonuçlarına bak - hangi veriler mevcut?
2. Tool sonuçlarına göre uygun agent'ı seç
3. Nüfus verisi varsa → population agent
4. Hastane/konum verisi varsa → medical + location
5. İlkyardım verisi varsa → ilkyardim
6. Acil durum varsa → emergency
7. Hiçbir özel veri yoksa → info

Örnekler:
- "İstanbul nüfus değişimi" + population_analysis tool sonucu → population
- "En yakın hastane nerede?" + location tool sonucu → medical, location
- "Deprem anında yaşam üçgeni nasıl oluşturulur?" + ilkyardim tool sonucu → ilkyardim
- "Acil durumda ne yapmalıyım?" → emergency, ilkyardim
- "Merhaba" → info

JSON formatında yanıt ver:
{
  "selectedAgents": ["agent1", "agent2"],
  "reasoning": "Neden bu agent'ları seçtiğin - tool sonuçlarına dayanarak"
}`;

    try {
      const response = await llm.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      const selectedAgents = result.selectedAgents || ['info'];
      
      console.log(`🧠 LLM Agent Selection Reasoning: ${result.reasoning || 'No reasoning provided'}`);
      
      return selectedAgents;
    } catch (error) {
      console.error('❌ LLM Agent selection error:', error);
      // Fallback to keyword-based selection
      return this.fallbackAgentSelection(query, queryAnalysis);
    }
  }

  private analyzeToolResults(toolResults: ToolResult[]): string {
    if (toolResults.length === 0) {
      return "Hiçbir tool sonucu yok.";
    }

    const analysis = toolResults.map(result => {
      const toolType = result.type;
      const hasData = result.data && Object.keys(result.data).length > 0;
      const confidence = result.confidence || 0;
      
      return `- ${toolType}: ${hasData ? 'Veri mevcut' : 'Veri yok'} (güven: ${confidence.toFixed(2)})`;
    }).join('\n');

    return `Tool Sonuçları (${toolResults.length} adet):\n${analysis}`;
  }

  private fallbackAgentSelection(
    query: string,
    queryAnalysis: QueryAnalysis
  ): string[] {
    const selectedAgents: string[] = [];
    const lowerQuery = query.toLowerCase();

    // Fallback keyword-based selection
    if (lowerQuery.includes('hastane') || lowerQuery.includes('doktor') || lowerQuery.includes('sağlık')) {
      selectedAgents.push('medical');
    }

    if (lowerQuery.includes('konum') || lowerQuery.includes('nerede') || lowerQuery.includes('yakın') || lowerQuery.includes('güvenli alan')) {
      selectedAgents.push('location');
    }

    if (lowerQuery.includes('acil') || lowerQuery.includes('emergency') || lowerQuery.includes('112') || lowerQuery.includes('ambulans')) {
      selectedAgents.push('emergency');
    }

    if (lowerQuery.includes('ilkyardım') || lowerQuery.includes('yaşam üçgeni') || lowerQuery.includes('deprem')) {
      selectedAgents.push('ilkyardim');
    }

    if (selectedAgents.length === 0) {
      selectedAgents.push('info');
    }

    console.log(`🔄 Fallback agent selection: ${selectedAgents.join(', ')}`);
    return selectedAgents;
  }

  private async coordinateAgents(
    selectedAgents: string[],
    query: string,
    userContext: UserContext,
    toolResults: ToolResult[]
  ): Promise<AgentResponse[]> {
    const agentResponses: AgentResponse[] = [];

    for (const agentName of selectedAgents) {
      try {
        let response: AgentResponse;

        switch (agentName) {
          case 'medical':
            response = await this.medicalAgent.execute(query, userContext, toolResults);
            break;
          case 'location':
            response = await this.locationAgent.execute(query, userContext, toolResults);
            break;
          case 'ilkyardim':
            // İlkyardım agent'ı oluştur
            response = await this.executeIlkyardimAgent(query, userContext, toolResults);
            break;
          case 'population':
            // Nüfus analizi agent'ı oluştur
            response = await this.executePopulationAgent(query, userContext, toolResults);
            break;
          case 'emergency':
            // Emergency agent'ı mevcut supervisor agent'ından al
            response = await this.executeEmergencyAgent(query, userContext, toolResults);
            break;
          case 'info':
            // Info agent'ı mevcut supervisor agent'ından al
            response = await this.executeInfoAgent(query, userContext, toolResults);
            break;
          default:
            console.warn(`⚠️ Unknown agent: ${agentName}`);
            continue;
        }

        agentResponses.push(response);
        console.log(`✅ Agent ${agentName} executed successfully`);

      } catch (error) {
        console.error(`❌ Agent ${agentName} error:`, error);
      }
    }

    return agentResponses;
  }

  private async executeEmergencyAgent(
    query: string,
    userContext: UserContext,
    toolResults: ToolResult[]
  ): Promise<AgentResponse> {
    // Mevcut emergency agent'ı kullan
    const { EmergencyAgent } = await import('../supervisor/emergencyAgent.js');
    const emergencyAgent = new EmergencyAgent();
    return await emergencyAgent.execute(query, userContext, toolResults);
  }

  private async executeInfoAgent(
    query: string,
    userContext: UserContext,
    toolResults: ToolResult[]
  ): Promise<AgentResponse> {
    // Mevcut info agent'ı kullan
    const { InfoAgent } = await import('../supervisor/infoAgent.js');
    const infoAgent = new InfoAgent();
    return await infoAgent.execute(query, userContext, toolResults);
  }

  private async executeIlkyardimAgent(
    query: string,
    userContext: UserContext,
    toolResults: ToolResult[]
  ): Promise<AgentResponse> {
    // İlkyardım tool'u kullanarak response oluştur
    const { IlkyardimTool } = await import('../tools/ilkyardimTool.js');
    const ilkyardimTool = new IlkyardimTool();
    
    const toolResult = await ilkyardimTool.execute({ query, userContext });
    
    if (toolResult) {
      return {
        message: toolResult.data.message || 'İlkyardım bilgisi sağlandı.',
        suggestions: [
          'Deprem anında yaşam üçgeni',
          'Kanama durdurma',
          'Yanık tedavisi',
          'CPR uygulaması'
        ],
        actionItems: [],
        toolResults: [toolResult],
        confidence: toolResult.confidence,
        timestamp: new Date()
      };
    }

    // Fallback response
    return {
      message: 'İlkyardım konusunda size yardımcı olmaya çalışıyorum. Daha spesifik bir soru sorabilir misiniz?',
      suggestions: ['Yaşam üçgeni', 'İlk yardım temel kuralları'],
      actionItems: [],
      toolResults: [],
      confidence: 0.5,
      timestamp: new Date()
    };
  }

  private async executePopulationAgent(
    query: string,
    userContext: UserContext,
    toolResults: ToolResult[]
  ): Promise<AgentResponse> {
    // Population analysis tool'u kullanarak response oluştur
    const { PopulationAnalysisTool } = await import('../tools/populationAnalysisTool.js');
    const populationTool = new PopulationAnalysisTool();
    
    const toolResult = await populationTool.execute({ query, userContext });
    
    if (toolResult && toolResult.data) {
      return {
        message: toolResult.data.message || 'Nüfus analizi verisi sağlandı.',
        suggestions: [
          'Nüfus trend analizi',
          'Yaş grupları dağılımı',
          'Cinsiyet dağılımı',
          'Bölgesel nüfus karşılaştırması'
        ],
        actionItems: [],
        toolResults: [toolResult],
        confidence: toolResult.confidence,
        timestamp: new Date()
      };
    }

    // Fallback response
    return {
      message: 'Nüfus analizi konusunda size yardımcı olmaya çalışıyorum. Daha spesifik bir soru sorabilir misiniz?',
      suggestions: ['İstanbul nüfus değişimi', 'Nüfus trend analizi', 'Demografik veriler'],
      actionItems: [],
      toolResults: [],
      confidence: 0.5,
      timestamp: new Date()
    };
  }

  private combineResponses(
    agentResponses: AgentResponse[],
    queryAnalysis: QueryAnalysis
  ): AgentResponse {
    if (agentResponses.length === 0) {
      return this.createDefaultResponse();
    }

    if (agentResponses.length === 1) {
      return agentResponses[0];
    }

    // Birden fazla agent response'u varsa, bunları birleştir
    const combinedMessage = this.combineMessages(agentResponses, queryAnalysis);
    const combinedSuggestions = this.combineSuggestions(agentResponses);
    const combinedActionItems = this.combineActionItems(agentResponses);
    const combinedToolResults = this.combineToolResults(agentResponses);
    const combinedConfidence = this.calculateCombinedConfidence(agentResponses);

    return {
      message: combinedMessage,
      suggestions: combinedSuggestions,
      actionItems: combinedActionItems,
      toolResults: combinedToolResults,
      confidence: combinedConfidence,
      timestamp: new Date()
    };
  }

  private combineMessages(
    agentResponses: AgentResponse[],
    queryAnalysis: QueryAnalysis
  ): string {
    // Acil durum varsa, emergency response'u öncelikle
    if (queryAnalysis.urgency === 'critical') {
      const emergencyResponse = agentResponses.find(r => 
        r.message.includes('ACİL DURUM') || r.message.includes('🚨')
      );
      if (emergencyResponse) {
        return emergencyResponse.message;
      }
    }

    // Medical ve location response'larını birleştir
    const medicalResponse = agentResponses.find(r => 
      r.message.includes('🏥') || r.message.includes('İlk Yardım')
    );
    const locationResponse = agentResponses.find(r => 
      r.message.includes('📍') || r.message.includes('Konum')
    );

    if (medicalResponse && locationResponse) {
      return `${medicalResponse.message}\n\n---\n\n${locationResponse.message}`;
    }

    if (medicalResponse) {
      return medicalResponse.message;
    }

    if (locationResponse) {
      return locationResponse.message;
    }

    // Varsayılan olarak ilk response'u kullan
    return agentResponses[0].message;
  }

  private combineSuggestions(agentResponses: AgentResponse[]): string[] {
    const allSuggestions = agentResponses.flatMap(response => response.suggestions);
    const uniqueSuggestions = Array.from(new Set(allSuggestions));
    return uniqueSuggestions.slice(0, 6); // Max 6 suggestions
  }

  private combineActionItems(agentResponses: AgentResponse[]): any[] {
    const allActionItems = agentResponses.flatMap(response => response.actionItems);
    
    // Priority'ye göre sırala
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return allActionItems.sort((a, b) => 
      priorityOrder[a.priority] - priorityOrder[b.priority]
    );
  }

  private combineToolResults(agentResponses: AgentResponse[]): ToolResult[] {
    const allToolResults = agentResponses.flatMap(response => response.toolResults);
    
    // Duplicate'ları kaldır
    const uniqueToolResults = allToolResults.filter((result, index, self) => 
      index === self.findIndex(r => r.type === result.type && r.timestamp === result.timestamp)
    );
    
    return uniqueToolResults;
  }

  private calculateCombinedConfidence(agentResponses: AgentResponse[]): number {
    if (agentResponses.length === 0) return 0.1;
    
    const totalConfidence = agentResponses.reduce((sum, response) => sum + response.confidence, 0);
    return Math.min(totalConfidence / agentResponses.length, 0.95);
  }

  private createDefaultResponse(): AgentResponse {
    return {
      message: 'Üzgünüm, bu konuda yardımcı olamıyorum. Lütfen daha spesifik bir soru sorun.',
      suggestions: [
        '🏥 Hastane bilgisi için 112\'yi arayın',
        '📍 Konum bilgisi için harita uygulamalarını kullanın',
        '🚨 Acil durumlarda 112\'yi arayın'
      ],
      actionItems: [],
      toolResults: [],
      confidence: 0.1,
      timestamp: new Date()
    };
  }

  private isMedicalQuery(query: string): boolean {
    const medicalKeywords = [
      'hastane', 'doktor', 'ilkyardım', 'yaşam üçgeni', 'acil', 'emergency',
      'kanama', 'kırık', 'yanık', 'bilinç', 'ambulans', '112', 'sağlık',
      'tıbbi', 'medikal', 'first aid'
    ];
    return medicalKeywords.some(keyword => query.includes(keyword));
  }

  private isLocationQuery(query: string): boolean {
    const locationKeywords = [
      'konum', 'nerede', 'güvenli alan', 'toplanma', 'hastane', 'doktor',
      'yol tarifi', 'nasıl giderim', 'yakın', 'mesafe', 'koordinat',
      'park', 'meydan', 'mahalle', 'ilçe', 'bölge'
    ];
    return locationKeywords.some(keyword => query.includes(keyword));
  }

  private isEmergencyQuery(query: string): boolean {
    const emergencyKeywords = [
      'acil', 'emergency', 'tehlike', 'güvenlik', '112', 'ambulans',
      'itfaiye', 'polis', 'kurtarma', 'afet', 'deprem', 'yangın', 'sel'
    ];
    return emergencyKeywords.some(keyword => query.includes(keyword));
  }

  private extractKeywords(query: string): string[] {
    const words = query.toLowerCase().split(/\s+/);
    const stopWords = ['ve', 'ile', 'için', 'olan', 'olan', 'bu', 'şu', 'o', 'bir', 'bir', 'da', 'de', 'ta', 'te'];
    return words.filter(word => word.length > 2 && !stopWords.includes(word));
  }
}

interface QueryAnalysis {
  primaryIntent: 'general' | 'medical' | 'location' | 'emergency';
  secondaryIntents: string[];
  urgency: 'low' | 'medium' | 'high' | 'critical';
  requiresMedical: boolean;
  requiresLocation: boolean;
  requiresEmergency: boolean;
  complexity: 'low' | 'medium' | 'high';
  keywords: string[];
  timestamp: Date;
}
