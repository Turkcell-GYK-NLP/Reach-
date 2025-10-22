import { UserContext, ToolResult } from '../types.js';
import { ToolRegistry } from './ToolRegistry.js';
import { ReasoningStep } from './ReasoningEngine.js';

export interface ActionPlan {
  actionType: 'tool_execution' | 'fallback' | 'web_search' | 'static_data';
  toolName?: string;
  parameters?: any;
  priority: number;
  expectedResult: string;
}

export interface ExecutionResult {
  success: boolean;
  results: ToolResult[];
  error?: string;
  executionTime: number;
  fallbackUsed: boolean;
}

export class ActionExecutor {
  private toolRegistry: ToolRegistry;
  private executionHistory: Map<string, ExecutionResult[]> = new Map();

  constructor(toolRegistry: ToolRegistry) {
    this.toolRegistry = toolRegistry;
  }

  /**
   * ReAct Pattern Action Execution
   */
  async executeAction(
    action: string,
    query: string,
    userContext: UserContext,
    previousResults: ToolResult[],
    reasoningSteps: ReasoningStep[]
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    console.log(`🎯 Action Executor: "${action}"`);

    try {
      // Action plan oluştur
      const actionPlan = this.createActionPlan(action, query, userContext, previousResults);
      
      // Action'ı execute et
      const results = await this.executeActionPlan(actionPlan, query, userContext);
      
      const executionTime = Date.now() - startTime;
      
      const executionResult: ExecutionResult = {
        success: results.length > 0 && results.some(r => r.confidence > 0.3),
        results,
        executionTime,
        fallbackUsed: actionPlan.actionType === 'fallback' || actionPlan.actionType === 'web_search'
      };

      console.log(`✅ Action Executor tamamlandı: ${executionTime}ms, ${results.length} sonuç`);
      return executionResult;

    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(`❌ Action Executor hatası:`, error);
      
      return {
        success: false,
        results: [],
        error: error instanceof Error ? error.message : 'Bilinmeyen hata',
        executionTime,
        fallbackUsed: false
      };
    }
  }

  /**
   * Action plan oluştur
   */
  private createActionPlan(
    action: string,
    query: string,
    userContext: UserContext,
    previousResults: ToolResult[]
  ): ActionPlan {
    const lowerAction = action.toLowerCase();
    
    // Python hatası tespit edildi, fallback tool'ları kullan
    if (lowerAction.includes('python hatası') || lowerAction.includes('fallback')) {
      return {
        actionType: 'fallback',
        priority: 1,
        expectedResult: 'Fallback tool\'ları ile sonuç bulma'
      };
    }
    
    // Sonuç bulunamadı, web search fallback'i uygula
    if (lowerAction.includes('sonuç bulunamadı') || lowerAction.includes('web search')) {
      return {
        actionType: 'web_search',
        priority: 2,
        expectedResult: 'Web araması ile sonuç bulma'
      };
    }
    
    // Hastane araması için location ve websearch tool'larını kullan
    if (lowerAction.includes('hastane') && lowerAction.includes('location')) {
      return {
        actionType: 'tool_execution',
        toolName: 'location',
        priority: 1,
        expectedResult: 'Hastane konum bilgisi'
      };
    }
    
    // İlkyardım bilgisi için ilkyardim tool'unu kullan
    if (lowerAction.includes('ilkyardım')) {
      return {
        actionType: 'tool_execution',
        toolName: 'ilkyardim',
        priority: 1,
        expectedResult: 'İlkyardım bilgisi'
      };
    }
    
    // Acil durum için emergency tool'unu kullan
    if (lowerAction.includes('acil durum')) {
      return {
        actionType: 'tool_execution',
        toolName: 'emergency',
        priority: 1,
        expectedResult: 'Acil durum bilgisi'
      };
    }
    
    // Konum bilgisi için location tool'unu kullan
    if (lowerAction.includes('konum')) {
      return {
        actionType: 'tool_execution',
        toolName: 'location',
        priority: 1,
        expectedResult: 'Konum bilgisi'
      };
    }
    
    // Genel bilgi için websearch tool'unu kullan
    return {
      actionType: 'tool_execution',
      toolName: 'websearch',
      priority: 3,
      expectedResult: 'Genel bilgi'
    };
  }

  /**
   * Action plan'ı execute et
   */
  private async executeActionPlan(
    actionPlan: ActionPlan,
    query: string,
    userContext: UserContext
  ): Promise<ToolResult[]> {
    switch (actionPlan.actionType) {
      case 'tool_execution':
        return await this.executeTool(actionPlan.toolName!, query, userContext);
      
      case 'fallback':
        return await this.executeFallback(query, userContext);
      
      case 'web_search':
        return await this.executeWebSearch(query, userContext);
      
      case 'static_data':
        return await this.executeStaticData(query, userContext);
      
      default:
        throw new Error(`Bilinmeyen action type: ${actionPlan.actionType}`);
    }
  }

  /**
   * Tool execute et
   */
  private async executeTool(
    toolName: string,
    query: string,
    userContext: UserContext
  ): Promise<ToolResult[]> {
    const tool = this.toolRegistry.getTool(toolName);
    if (!tool) {
      console.warn(`⚠️ Tool bulunamadı: ${toolName}`);
      return [];
    }

    try {
      const result = await tool.execute({ query, userContext });
      return result ? [result] : [];
    } catch (error) {
      console.error(`❌ Tool execution hatası (${toolName}):`, error);
      return [];
    }
  }

  /**
   * Fallback execute et
   */
  private async executeFallback(
    query: string,
    userContext: UserContext
  ): Promise<ToolResult[]> {
    console.log(`🔄 Fallback execution: "${query}"`);
    
    const results: ToolResult[] = [];
    
    // WebSearchTool'u dene
    try {
      const webSearchTool = this.toolRegistry.getTool('websearch');
      if (webSearchTool) {
        const result = await webSearchTool.execute({ query, userContext });
        if (result) {
          results.push(result);
        }
      }
    } catch (error) {
      console.error('WebSearchTool fallback hatası:', error);
    }
    
    // Static data fallback
    if (results.length === 0) {
      const staticResult = await this.executeStaticData(query, userContext);
      results.push(...staticResult);
    }
    
    return results;
  }

  /**
   * Web search execute et
   */
  private async executeWebSearch(
    query: string,
    userContext: UserContext
  ): Promise<ToolResult[]> {
    console.log(`🔍 Web search execution: "${query}"`);
    
    const webSearchTool = this.toolRegistry.getTool('websearch');
    if (!webSearchTool) {
      return [];
    }

    try {
      const result = await webSearchTool.execute({ query, userContext });
      return result ? [result] : [];
    } catch (error) {
      console.error('Web search execution hatası:', error);
      return [];
    }
  }

  /**
   * Static data execute et
   */
  private async executeStaticData(
    query: string,
    userContext: UserContext
  ): Promise<ToolResult[]> {
    console.log(`📚 Static data execution: "${query}"`);
    
    const lowerQuery = query.toLowerCase();
    
    // Hastane bilgisi
    if (lowerQuery.includes('hastane')) {
      return [{
        type: 'static_hospital',
        data: {
          query,
          results: [{
            title: 'Genel Hastane Bilgisi',
            content: 'Hastane bilgileri için lütfen 112 Acil Çağrı Merkezi\'ni arayın veya en yakın sağlık kuruluşuna başvurun.',
            location: userContext.location?.district || 'Bilinmiyor',
            phone: '112'
          }],
          fallback: true
        },
        confidence: 0.4,
        timestamp: new Date(),
        source: 'static_data'
      }];
    }
    
    // İlkyardım bilgisi
    if (lowerQuery.includes('yaşam üçgeni') || lowerQuery.includes('ilkyardım')) {
      return [{
        type: 'static_first_aid',
        data: {
          query,
          results: [{
            title: 'Yaşam Üçgeni - Deprem Anında',
            content: `Deprem anında yaşam üçgeni oluşturmak için:
1. Sağlam masa, sıra veya yatak yanına geçin
2. Çömel, kapan, tutun pozisyonu alın
3. Başınızı ve boynunuzu koruyacak şekilde kapanın
4. Pencerelerden, ağır eşyalardan uzak durun
5. Asansör kullanmayın, merdivenlerden inmeyin
6. Dışarı çıkmaya çalışmayın, içeride kalın`,
            category: 'deprem_güvenlik'
          }],
          fallback: true
        },
        confidence: 0.8,
        timestamp: new Date(),
        source: 'static_data'
      }];
    }
    
    // Genel bilgi
    return [{
      type: 'static_general',
      data: {
        query,
        results: [{
          title: 'Genel Bilgi',
          content: `"${query}" konusunda detaylı bilgi için lütfen daha spesifik bir soru sorun veya 112 Acil Çağrı Merkezi'ni arayın.`,
          fallback: true
        }],
        fallback: true
      },
      confidence: 0.3,
      timestamp: new Date(),
      source: 'static_data'
    }];
  }

  /**
   * Execution geçmişini temizle
   */
  clearHistory(userId: string): void {
    this.executionHistory.delete(userId);
  }

  /**
   * Execution geçmişini al
   */
  getHistory(userId: string): ExecutionResult[] {
    return this.executionHistory.get(userId) || [];
  }

  /**
   * Execution istatistikleri
   */
  getExecutionStats(): {
    totalExecutions: number;
    successfulExecutions: number;
    averageExecutionTime: number;
    fallbackUsage: number;
  } {
    const allResults = Array.from(this.executionHistory.values()).flat();
    
    return {
      totalExecutions: allResults.length,
      successfulExecutions: allResults.filter(r => r.success).length,
      averageExecutionTime: allResults.length > 0 
        ? allResults.reduce((sum, r) => sum + r.executionTime, 0) / allResults.length 
        : 0,
      fallbackUsage: allResults.filter(r => r.fallbackUsed).length
    };
  }
}
