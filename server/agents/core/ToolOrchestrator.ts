import { UserContext, ToolResult, AgentResponse } from '../types.js';
import { ToolRegistry } from './ToolRegistry.js';

export class ToolOrchestrator {
  private toolRegistry: ToolRegistry;

  constructor(toolRegistry: ToolRegistry) {
    this.toolRegistry = toolRegistry;
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
   * Execute agents dynamically
   */
  async executeAgents(
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

