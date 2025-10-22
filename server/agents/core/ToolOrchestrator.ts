import { UserContext, ToolResult, AgentResponse } from '../types.js';
import { ToolRegistry } from './ToolRegistry.js';
import { ReasoningEngine } from './ReasoningEngine.js';
import { ActionExecutor } from './ActionExecutor.js';

export class ToolOrchestrator {
  private toolRegistry: ToolRegistry;
  private reasoningEngine: ReasoningEngine;
  private actionExecutor: ActionExecutor;

  constructor(toolRegistry: ToolRegistry) {
    this.toolRegistry = toolRegistry;
    this.reasoningEngine = new ReasoningEngine();
    this.actionExecutor = new ActionExecutor(toolRegistry);
  }

  /**
   * Execute all registered tools in parallel
   */
  async executeTools(query: string, userContext: UserContext): Promise<ToolResult[]> {
    const results: ToolResult[] = [];
    const tools = this.toolRegistry.getAllTools();

    console.log(`🔧 Executing ${tools.length} tools...`);

    // Execute all tools in parallel
    const toolPromises = tools.map(async (tool) => {
      try {
        const result = await tool.execute({ query, userContext });
        if (result) {
          console.log(`✅ Tool ${tool.name} executed successfully`);
          return result;
        }
        return null;
      } catch (error) {
        console.error(`❌ Tool ${tool.name} error:`, error);
        return null;
      }
    });

    const toolResults = await Promise.all(toolPromises);
    const validResults = toolResults.filter(result => result !== null) as ToolResult[];

    console.log(`✅ ${validResults.length}/${tools.length} tools succeeded`);
    return validResults;
  }

  /**
   * Execute tools using ReAct Pattern (Reasoning → Action → Observation)
   */
  async executeReActTools(query: string, userContext: UserContext): Promise<ToolResult[]> {
    console.log(`🧠 ReAct Pattern ile tool execution başlatılıyor: "${query}"`);
    
    // İlk olarak smart tool selection ile başla
    const initialResults = await this.executeSmartTools(query, userContext);
    
    // ReAct Pattern uygula
    const reactResult = await this.reasoningEngine.executeReActPattern(
      query,
      userContext,
      initialResults
    );
    
    if (reactResult.success && reactResult.finalResult) {
      console.log(`✅ ReAct Pattern başarılı, sonuç bulundu`);
      return [reactResult.finalResult];
    }
    
    // ReAct Pattern başarısız olursa, fallback sonuçları döndür
    console.log(`⚠️ ReAct Pattern başarısız, fallback sonuçları döndürülüyor`);
    return initialResults.length > 0 ? initialResults : await this.executeFallbackChain(query, userContext);
  }

  /**
   * Fallback chain execution
   */
  private async executeFallbackChain(query: string, userContext: UserContext): Promise<ToolResult[]> {
    console.log(`🔄 Fallback chain başlatılıyor: "${query}"`);
    
    const results: ToolResult[] = [];
    
    // 1. WebSearchTool fallback
    try {
      const webSearchTool = this.toolRegistry.getTool('websearch');
      if (webSearchTool) {
        const result = await webSearchTool.execute({ query, userContext });
        if (result) {
          results.push(result);
          console.log(`✅ WebSearchTool fallback başarılı`);
        }
      }
    } catch (error) {
      console.error('WebSearchTool fallback hatası:', error);
    }
    
    // 2. Static data fallback
    if (results.length === 0) {
      const staticResult = await this.actionExecutor.executeAction(
        'static_data',
        query,
        userContext,
        [],
        []
      );
      if (staticResult.success) {
        results.push(...staticResult.results);
        console.log(`✅ Static data fallback başarılı`);
      }
    }
    
    return results;
  }

  /**
   * Execute tools based on query analysis (smart tool selection)
   */
  async executeSmartTools(query: string, userContext: UserContext): Promise<ToolResult[]> {
    const queryLower = query.toLowerCase();
    const selectedTools: string[] = [];
    const allTools = this.toolRegistry.getAllTools();

    console.log(`🧠 Smart tool selection for: "${query}"`);

    // Analyze query to determine which tools to use
    if (this.isHospitalQuery(queryLower)) {
      selectedTools.push('location', 'websearch');
      console.log(`🏥 Hospital query detected - using location and websearch tools`);
    }
    
    if (this.isFirstAidQuery(queryLower)) {
      selectedTools.push('ilkyardim');
      console.log(`🏥 First aid query detected - using ilkyardim tool`);
    }
    
    if (this.isEmergencyQuery(queryLower)) {
      selectedTools.push('emergency');
      console.log(`🚨 Emergency query detected - using emergency tool`);
    }
    
    if (this.isLocationQuery(queryLower)) {
      selectedTools.push('location');
      console.log(`📍 Location query detected - using location tool`);
    }
    
    if (this.isPopulationQuery(queryLower)) {
      selectedTools.push('population_analysis');
      console.log(`📊 Population query detected - using population analysis tool`);
    }

    // Always include recommendation tool
    selectedTools.push('recommendation');

    // Remove duplicates
    const uniqueTools = Array.from(new Set(selectedTools));
    console.log(`🎯 Selected tools: ${uniqueTools.join(', ')}`);

    // Execute only selected tools
    const toolPromises = uniqueTools.map(async (toolName) => {
      const tool = this.toolRegistry.getTool(toolName);
      if (!tool) {
        console.warn(`⚠️ Tool not found: ${toolName}`);
        return null;
      }

      try {
        const result = await tool.execute({ query, userContext });
        if (result) {
          console.log(`✅ Tool ${toolName} executed successfully`);
          return result;
        }
        return null;
      } catch (error) {
        console.error(`❌ Tool ${toolName} error:`, error);
        return null;
      }
    });

    const toolResults = await Promise.all(toolPromises);
    const validResults = toolResults.filter(result => result !== null) as ToolResult[];

    console.log(`✅ ${validResults.length}/${uniqueTools.length} selected tools succeeded`);
    return validResults;
  }

  private isHospitalQuery(query: string): boolean {
    const hospitalKeywords = [
      'hastane', 'hastaneler', 'en yakın hastane', 'yakın hastane', 
      'hastane nerede', 'doktor', 'acil servis', 'tıbbi', 'medikal'
    ];
    return hospitalKeywords.some(keyword => query.includes(keyword));
  }

  private isFirstAidQuery(query: string): boolean {
    const firstAidKeywords = [
      'ilkyardım', 'first aid', 'yaşam üçgeni', 'life triangle',
      'kalp masajı', 'cpr', 'kanama', 'kırık', 'yanık', 'bilinç kaybı',
      'zehirlenme', 'yaralanma', 'nefes alma', 'ambulans', '112',
      'bayılma', 'ağrı', 'kan', 'yara', 'şok', 'boğulma', 'burkulma',
      'çıkık', 'donma', 'sıcak çarpması', 'hayvan ısırığı', 'deprem',
      'güvenli alan', 'masa', 'sıra', 'korunma', 'protection'
    ];
    return firstAidKeywords.some(keyword => query.includes(keyword));
  }

  private isEmergencyQuery(query: string): boolean {
    const emergencyKeywords = [
      'acil', 'emergency', 'tehlike', 'güvenlik', '112', 'ambulans',
      'itfaiye', 'polis', 'kurtarma', 'afet', 'deprem', 'yangın', 'sel'
    ];
    return emergencyKeywords.some(keyword => query.includes(keyword));
  }

  private isLocationQuery(query: string): boolean {
    const locationKeywords = [
      'konum', 'nerede', 'güvenli alan', 'toplanma', 'toplanma alanı',
      'yol tarifi', 'nasıl giderim', 'yakın', 'mesafe', 'en yakın',
      'koordinat', 'park', 'meydan', 'mahalle', 'ilçe', 'bölge'
    ];
    return locationKeywords.some(keyword => query.includes(keyword));
  }

  private isPopulationQuery(query: string): boolean {
    const populationKeywords = [
      'nüfus', 'demografi', 'yaş dağılımı', 'nüfus yoğunluğu',
      'genç nüfus', 'yaşlı nüfus', 'cinsiyet dağılımı', 'istatistik'
    ];
    return populationKeywords.some(keyword => query.includes(keyword));
  }

  /**
   * Execute specific tools by name
   */
  async executeSpecificTools(
    toolNames: string[],
    query: string,
    userContext: UserContext
  ): Promise<ToolResult[]> {
    const results: ToolResult[] = [];

    for (const toolName of toolNames) {
      const tool = this.toolRegistry.getTool(toolName);
      if (!tool) {
        console.warn(`⚠️ Tool not found: ${toolName}`);
        continue;
      }

      try {
        const result = await tool.execute({ query, userContext });
        if (result) {
          results.push(result);
          console.log(`✅ Tool ${toolName} executed successfully`);
        }
      } catch (error) {
        console.error(`❌ Tool ${toolName} error:`, error);
      }
    }

    return results;
  }

  /**
   * Execute agents dynamically with Multi-Agent Pattern
   */
  async executeAgents(
    selectedAgents: string[],
    query: string,
    userContext: UserContext,
    toolResults: ToolResult[]
  ): Promise<AgentResponse[]> {
    // Önce CoordinatorAgent'ı kullan
    const { CoordinatorAgent } = await import('../specialized/CoordinatorAgent.js');
    const coordinatorAgent = new CoordinatorAgent();
    
    const coordinatedResponse = await coordinatorAgent.execute(query, userContext, toolResults);
    
    // Coordinator'dan gelen response'u döndür
    return [coordinatedResponse];
  }

  /**
   * Execute legacy agents (fallback)
   */
  async executeLegacyAgents(
    selectedAgents: string[],
    query: string,
    userContext: UserContext,
    toolResults: ToolResult[]
  ): Promise<AgentResponse[]> {
    const agentMap = {
      'info': () => import('../supervisor/infoAgent.js').then(m => new m.InfoAgent()),
      'action': () => import('../supervisor/actionAgent.js').then(m => new m.ActionAgent()),
      'report': () => import('../supervisor/reportAgent.js').then(m => new m.ReportAgent()),
      'emergency': () => import('../supervisor/emergencyAgent.js').then(m => new m.EmergencyAgent())
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

  /**
   * Get tool execution statistics
   */
  getExecutionStats(toolResults: ToolResult[]): {
    totalTools: number;
    successfulTools: number;
    averageConfidence: number;
    toolTypes: string[];
  } {
    const totalTools = this.toolRegistry.getToolCount();
    const successfulTools = toolResults.length;
    const averageConfidence = toolResults.length > 0
      ? toolResults.reduce((sum, result) => sum + result.confidence, 0) / toolResults.length
      : 0;
    const toolTypes = toolResults.map(result => result.type);

    return {
      totalTools,
      successfulTools,
      averageConfidence: Math.round(averageConfidence * 100) / 100,
      toolTypes
    };
  }
}

