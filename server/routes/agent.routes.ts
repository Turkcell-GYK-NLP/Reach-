import type { Express } from "express";
import { storage } from "../storage";
import { insertCallConversationSchema } from "@shared/schema";
import { CoreAgent } from "../agents/coreAgent.js";

export function registerAgentRoutes(app: Express, coreAgent: CoreAgent): void {
  // Agent query
  app.post("/api/agent/query", async (req, res) => {
    try {
      const { userId, message, userContext } = req.body;
      
      const agentResponse = await coreAgent.processQuery(message, {
        userId,
        location: userContext?.location,
        operator: userContext?.operator,
        age: userContext?.age,
        preferences: userContext?.preferences
      });

      res.json(agentResponse);
    } catch (error) {
      console.error("Agent query error:", error);
      res.status(500).json({ error: "Failed to process agent query", details: error });
    }
  });

  // Get agent memory
  app.get("/api/agent/memory/:userId", async (req, res) => {
    try {
      const memory = await coreAgent.getUserMemory(req.params.userId);
      res.json(memory);
    } catch (error) {
      console.error("Memory retrieval error:", error);
      res.status(500).json({ error: "Failed to get user memory", details: error });
    }
  });

  // Clear agent memory
  app.delete("/api/agent/memory/:userId", async (req, res) => {
    try {
      await coreAgent.clearUserMemory(req.params.userId);
      res.json({ message: "User memory cleared successfully" });
    } catch (error) {
      console.error("Memory clear error:", error);
      res.status(500).json({ error: "Failed to clear user memory", details: error });
    }
  });

  // Save Vapi call conversation
  app.post("/api/call-conversations", async (req, res) => {
    try {
      const payload = insertCallConversationSchema.parse(req.body);
      const saved = await storage.createCallConversation(payload as any);
      res.json({ success: true, conversation: saved });
    } catch (error) {
      res.status(400).json({ error: "Failed to save call conversation", details: String(error) });
    }
  });

  // RL Recommendation Feedback
  app.post("/api/recommendation/feedback", async (req, res) => {
    try {
      const { userId, actionId, reward, userContext } = req.body;
      
      if (!userId || !actionId || reward === undefined) {
        return res.status(400).json({ error: "userId, actionId, and reward are required" });
      }

      // Get recommendation tool from core agent
      const recommendationTool = coreAgent.getRecommendationTool();
      if (!recommendationTool) {
        return res.status(500).json({ error: "Recommendation tool not available" });
      }

      // Record the feedback
      recommendationTool.recordInteraction(userId, actionId, reward, userContext);
      
      res.json({ 
        message: "Feedback recorded successfully",
        actionId,
        reward,
        timestamp: new Date()
      });
    } catch (error) {
      console.error("RL feedback error:", error);
      res.status(500).json({ error: "Failed to record feedback", details: error });
    }
  });

  // RL Model Performance
  app.get("/api/recommendation/performance", async (req, res) => {
    try {
      const recommendationTool = coreAgent.getRecommendationTool();
      if (!recommendationTool) {
        return res.status(500).json({ error: "Recommendation tool not available" });
      }

      const performance = recommendationTool.getModelPerformance();
      res.json(performance);
    } catch (error) {
      console.error("RL performance error:", error);
      res.status(500).json({ error: "Failed to get performance metrics", details: error });
    }
  });
}

