import type { Express } from "express";
import { storage } from "../storage";
import { CoreAgent } from "../agents/coreAgent.js";

export function registerChatRoutes(app: Express, coreAgent: CoreAgent): void {
  // Get chat messages
  app.get("/api/chat/:userId", async (req, res) => {
    try {
      const messages = await storage.getChatMessages(req.params.userId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to get chat messages", details: error });
    }
  });

  // Create chat message
  app.post("/api/chat", async (req, res) => {
    try {
      const { userId, message, userContext } = req.body;
      
      // Process with Core Agent (new agentic system)
      const agentResponse = await coreAgent.processQuery(message, {
        userId,
        location: userContext?.location,
        operator: userContext?.operator,
        age: userContext?.age,
        preferences: userContext?.preferences
      });
      
      // Save user message
      const userMessage = await storage.createChatMessage({
        userId,
        message,
        response: null,
        metadata: { type: "user" }
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
          toolResults: agentResponse.toolResults
        }
      });

      res.json({
        userMessage,
        botMessage,
        agentResponse
      });
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ error: "Failed to process chat message", details: error });
    }
  });

  // Clear chat messages
  app.delete("/api/chat/:userId", async (req, res) => {
    try {
      const success = await storage.clearChatMessages(req.params.userId);
      if (success) {
        res.json({ message: "Chat messages cleared successfully" });
      } else {
        res.status(500).json({ error: "Failed to clear chat messages" });
      }
    } catch (error) {
      console.error("Clear chat error:", error);
      res.status(500).json({ error: "Failed to clear chat messages", details: error });
    }
  });
}

