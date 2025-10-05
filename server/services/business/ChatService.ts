import { storage } from "../../storage";
import { CoreAgent } from "../../agents/coreAgent.js";
import { type ChatMessage, type InsertChatMessage } from "@shared/schema";
import { type UserContext } from "../../agents/types.js";

export class ChatService {
  private coreAgent: CoreAgent;

  constructor(coreAgent: CoreAgent) {
    this.coreAgent = coreAgent;
  }

  /**
   * Process chat message with AI agent
   */
  async processMessage(data: {
    userId: string;
    message: string;
    userContext?: {
      location?: any;
      operator?: string;
      age?: number;
      preferences?: any;
    };
  }): Promise<{
    userMessage: ChatMessage;
    botMessage: ChatMessage;
    agentResponse: any;
  }> {
    const { userId, message, userContext } = data;

    // Process with Core Agent
    const agentResponse = await this.coreAgent.processQuery(message, {
      userId,
      location: userContext?.location,
      operator: userContext?.operator,
      age: userContext?.age,
      preferences: userContext?.preferences,
    });

    // Save user message
    const userMessage = await storage.createChatMessage({
      userId,
      message,
      response: null,
      metadata: { type: "user" },
    });

    // Save AI response
    const botMessage = await storage.createChatMessage({
      userId,
      message: agentResponse.message,
      response: null,
      metadata: {
        type: "bot",
        suggestions: agentResponse.suggestions,
        actionItems: agentResponse.actionItems,
        confidence: agentResponse.confidence,
        toolResults: agentResponse.toolResults,
      },
    });

    return {
      userMessage,
      botMessage,
      agentResponse,
    };
  }

  /**
   * Get chat messages for user
   */
  async getChatMessages(userId: string): Promise<ChatMessage[]> {
    return storage.getChatMessages(userId);
  }

  /**
   * Clear chat messages for user
   */
  async clearChatMessages(userId: string): Promise<boolean> {
    return storage.clearChatMessages(userId);
  }
}

// Export factory function (requires CoreAgent instance)
export function createChatService(coreAgent: CoreAgent): ChatService {
  return new ChatService(coreAgent);
}

