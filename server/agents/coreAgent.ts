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
  }

  async processQuery(query: string, userContext: UserContext): Promise<AgentResponse> {
    try {
      console.log(`🤖 CoreAgent processing query: "${query}" for user: ${userContext.userId}`);

      // 1. Memory'den context'i al
      const memoryContext = await this.memory.getContext(userContext.userId);
      const relevantContext = await this.memory.getRelevantContext(userContext.userId, query);

      // 2. Tool'ları çalıştır
      const toolResults = await this.executeTools(query, userContext);
      console.log(`🔧 Tool results: ${toolResults.length} results`);

      // 3. Supervisor ile koordinasyon
      const supervisorDecision = await this.supervisor.coordinate(query, userContext, toolResults);
      console.log(`🎯 Supervisor decision: ${supervisorDecision.selectedAgents.join(', ')}`);

      // 4. Seçilen agent'ları çalıştır
      const agentResponses = await this.executeAgents(
        supervisorDecision.selectedAgents,
        query,
        userContext,
        toolResults
      );

      // 5. Agent yanıtlarını birleştir
      const combinedResponse = await this.combineResponses(
        query,
        userContext,
        toolResults,
        agentResponses,
        relevantContext
      );

      // 6. Memory'yi güncelle
      await this.memory.updateContext(userContext.userId, query, combinedResponse.message, userContext);

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

    // LLM ile final yanıt oluştur
    const finalResponse = await this.generateFinalResponse(
      query,
      userContext,
      combinedMessage,
      combinedSuggestions,
      combinedActionItems,
      relevantContext
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

  private async generateFinalResponse(
    query: string,
    userContext: UserContext,
    combinedMessage: string,
    suggestions: string[],
    actionItems: any[],
    relevantContext: string[]
  ): Promise<{ message: string; suggestions: string[]; actionItems: any[] }> {
    try {
      const systemPrompt = `Sen REACH+ afet destek sisteminin ana AI asistanısın. 
Kullanıcıya net, pratik ve güvenilir bilgiler veriyorsun.

Kullanıcı Bağlamı:
- Kullanıcı ID: ${userContext.userId}
- Konum: ${userContext.location?.district || 'Bilinmiyor'}, ${userContext.location?.city || 'İstanbul'}
- Operatör: ${userContext.operator || 'Bilinmiyor'}
- Yaş: ${userContext.age || 'Genç'}

Mevcut Bilgiler:
${combinedMessage}

İlgili Geçmiş:
${relevantContext.join('\n')}

Kurallar:
- DIREKT ve NET yanıtlar ver
- Acil durumlarda öncelik ver
- Somut bilgi ve rakam ver
- Kullanıcıya nazik ol
- Belirsiz ifadeler kullanma

Yanıt formatı (JSON):
{
  "message": "Ana yanıt",
  "suggestions": ["Öneri 1", "Öneri 2"],
  "actionItems": [{"type": "network", "title": "Eylem", "priority": "high"}]
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
}
