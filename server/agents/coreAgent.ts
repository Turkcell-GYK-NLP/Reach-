import { UserContext, AgentResponse } from './types.js';
import { MemoryStore } from './memory/memoryStore.js';
import { SupervisorAgent } from './supervisor/supervisorAgent.js';
import { QueryProcessor } from './core/QueryProcessor.js';
import { GreetingHandler } from './core/GreetingHandler.js';
import { ToolRegistry } from './core/ToolRegistry.js';
import { ToolOrchestrator } from './core/ToolOrchestrator.js';
import { ResponseGenerator } from './core/ResponseGenerator.js';

export class CoreAgent {
  private memory: MemoryStore;
  private supervisor: SupervisorAgent;
  private queryProcessor: QueryProcessor;
  private greetingHandler: GreetingHandler;
  private toolRegistry: ToolRegistry;
  private toolOrchestrator: ToolOrchestrator;
  private responseGenerator: ResponseGenerator;

  constructor(toolRegistry?: ToolRegistry) {
    // Initialize core components
    this.memory = new MemoryStore();
    this.supervisor = new SupervisorAgent();
    this.queryProcessor = new QueryProcessor();
    this.greetingHandler = new GreetingHandler();
    
    // Initialize tool system with default or provided registry
    this.toolRegistry = toolRegistry || ToolRegistry.createDefault();
    this.toolOrchestrator = new ToolOrchestrator(this.toolRegistry);
    this.responseGenerator = new ResponseGenerator();

    console.log(`✅ CoreAgent initialized with ${this.toolRegistry.getToolCount()} tools`);
  }

  /**
   * Main query processing pipeline
   */
  async processQuery(query: string, userContext: UserContext): Promise<AgentResponse> {
    try {
      console.log(`🤖 CoreAgent processing query: "${query}" for user: ${userContext.userId}`);

      // 0. Validate query
      const validation = this.queryProcessor.validateQuery(query);
      if (!validation.valid) {
        return this.createErrorResponse(validation.error || 'Invalid query');
      }

      // 1. Check for greeting
      if (this.queryProcessor.isGreetingMessage(query)) {
        console.log(`👋 Greeting message detected: "${query}"`);
        return this.greetingHandler.getGreetingResponse();
      }

      // 2. Analyze query
      const queryAnalysis = this.queryProcessor.analyzeQuery(query, userContext);
      
      // 3. Enhance user context with emergency level
      const enhancedUserContext = {
        ...userContext,
        preferences: {
          ...userContext.preferences,
          emergencyLevel: queryAnalysis.emergencyLevel
        }
      };

      // 4. Get memory context
      const memoryContext = await this.memory.getContext(userContext.userId);
      const relevantContext = await this.memory.getRelevantContext(userContext.userId, query);

      // 5. Execute tools with ReAct Pattern
      const toolResults = await this.toolOrchestrator.executeReActTools(query, enhancedUserContext);
      console.log(`🔧 Tool results: ${toolResults.length} results`);

      // 6. Supervisor coordination
      const supervisorDecision = await this.supervisor.coordinate(query, enhancedUserContext, toolResults);
      console.log(`🎯 Supervisor decision: ${supervisorDecision.selectedAgents.join(', ')}`);

      // 7. Execute selected agents
      const agentResponses = await this.toolOrchestrator.executeAgents(
        supervisorDecision.selectedAgents,
        query,
        enhancedUserContext,
        toolResults
      );

      // 8. Generate combined response
      const combinedResponse = await this.responseGenerator.combineResponses(
        query,
        enhancedUserContext,
        toolResults,
        agentResponses,
        relevantContext
      );

      // 9. Update memory
      await this.memory.updateContext(
        userContext.userId, 
        query, 
        combinedResponse.message, 
        enhancedUserContext
      );

      console.log(`✅ CoreAgent completed processing`);
      return combinedResponse;

    } catch (error) {
      console.error('CoreAgent error:', error);
      return this.createErrorResponse(error);
    }
  }

  /**
   * Clear user memory
   */
  async clearUserMemory(userId: string): Promise<void> {
    this.memory.clearCache(userId);
  }

  /**
   * Get user memory
   */
  async getUserMemory(userId: string): Promise<any> {
    return this.memory.getContext(userId);
  }

  /**
   * Get recommendation tool (for RL feedback)
   */
  getRecommendationTool(): any {
    return this.toolRegistry.getTool('recommendation');
  }

  /**
   * Get tool registry (for advanced usage)
   */
  getToolRegistry(): ToolRegistry {
    return this.toolRegistry;
  }

  /**
   * Create error response
   */
  private createErrorResponse(error: any): AgentResponse {
    const errorMessage = typeof error === 'string' ? error : error.message || 'Bilinmeyen hata';
    
    return {
      message: `Üzgünüm, bir hata oluştu: ${errorMessage}. Lütfen tekrar deneyin.`,
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
}
