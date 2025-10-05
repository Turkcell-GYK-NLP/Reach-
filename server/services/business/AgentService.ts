import { CoreAgent } from "../../agents/coreAgent.js";
import { type UserContext, type AgentResponse } from "../../agents/types.js";

export class AgentService {
  private coreAgent: CoreAgent;

  constructor(coreAgent: CoreAgent) {
    this.coreAgent = coreAgent;
  }

  /**
   * Process agent query
   */
  async processQuery(
    message: string,
    userContext: UserContext
  ): Promise<AgentResponse> {
    return this.coreAgent.processQuery(message, userContext);
  }

  /**
   * Get user memory
   */
  async getUserMemory(userId: string): Promise<any> {
    return this.coreAgent.getUserMemory(userId);
  }

  /**
   * Clear user memory
   */
  async clearUserMemory(userId: string): Promise<void> {
    return this.coreAgent.clearUserMemory(userId);
  }

  /**
   * Record RL feedback
   */
  recordRLFeedback(
    userId: string,
    actionId: string,
    reward: number,
    userContext?: any
  ): void {
    const recommendationTool = this.coreAgent.getRecommendationTool();
    if (!recommendationTool) {
      throw new Error("Recommendation tool not available");
    }

    recommendationTool.recordInteraction(userId, actionId, reward, userContext);
  }

  /**
   * Get RL model performance
   */
  getRLPerformance(): any {
    const recommendationTool = this.coreAgent.getRecommendationTool();
    if (!recommendationTool) {
      throw new Error("Recommendation tool not available");
    }

    return recommendationTool.getModelPerformance();
  }
}

// Export factory function (requires CoreAgent instance)
export function createAgentService(coreAgent: CoreAgent): AgentService {
  return new AgentService(coreAgent);
}

