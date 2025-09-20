import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertChatMessageSchema } from "@shared/schema";
import { hashPassword, verifyPassword, signToken } from "./utils/auth";
import { processNaturalLanguageQuery } from "./services/openai";
import { socialMediaAnalyzer } from "./services/socialMediaAnalyzer";
import { networkMonitor } from "./services/networkMonitor";
import { locationService } from "./services/locationService";
import { CoreAgent } from "./agents/coreAgent.js";

export async function registerRoutes(app: Express): Promise<Server> {
  // Start background services
  socialMediaAnalyzer.start();
  networkMonitor.start();

  // Initialize Core Agent
  const coreAgent = new CoreAgent();

  // User routes
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: "Invalid user data", details: error });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to get user", details: error });
    }
  });

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { name, email, password, age, location, operator } = req.body || {};
      if (!name || !email || !password) {
        return res.status(400).json({ error: "NAME_EMAIL_PASSWORD_REQUIRED" });
      }
      const existing = await storage.getUserByEmail(email.toLowerCase());
      if (existing) {
        return res.status(409).json({ error: "EMAIL_ALREADY_EXISTS" });
      }
      const passwordHash = await hashPassword(password);
      const user = await storage.createUser({
        name,
        email: email.toLowerCase(),
        passwordHash,
        age,
        location,
        operator,
      } as any);
      const token = signToken({ sub: user.id, email: email.toLowerCase() }, process.env.AUTH_SECRET || "dev_secret", 60 * 60 * 24 * 7);
      res.json({ user: { id: user.id, name: user.name, email: (user as any).email }, token });
    } catch (error: any) {
      if (error?.message === "EMAIL_ALREADY_EXISTS") {
        return res.status(409).json({ error: "EMAIL_ALREADY_EXISTS" });
      }
      res.status(400).json({ error: "REGISTER_FAILED", details: String(error) });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body || {};
      if (!email || !password) {
        return res.status(400).json({ error: "EMAIL_PASSWORD_REQUIRED" });
      }
      const user = await storage.getUserByEmail(email.toLowerCase());
      if (!user) {
        return res.status(401).json({ error: "INVALID_CREDENTIALS" });
      }
      const ok = await verifyPassword(password, (user as any).passwordHash || "");
      if (!ok) {
        return res.status(401).json({ error: "INVALID_CREDENTIALS" });
      }
      const token = signToken({ sub: user.id, email: email.toLowerCase() }, process.env.AUTH_SECRET || "dev_secret", 60 * 60 * 24 * 7);
      res.json({ user: { id: user.id, name: user.name, email: (user as any).email }, token });
    } catch (error) {
      res.status(400).json({ error: "LOGIN_FAILED", details: error });
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    try {
      const updates = req.body;
      const user = await storage.updateUser(req.params.id, updates);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to update user", details: error });
    }
  });

  // Chat routes
  app.get("/api/chat/:userId", async (req, res) => {
    try {
      const messages = await storage.getChatMessages(req.params.userId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to get chat messages", details: error });
    }
  });

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

  // Network status routes
  app.get("/api/network-status", async (req, res) => {
    try {
      const location = req.query.location as string;
      const networkStatus = await storage.getNetworkStatus(location);
      res.json(networkStatus);
    } catch (error) {
      res.status(500).json({ error: "Failed to get network status", details: error });
    }
  });

  app.get("/api/network-recommendation/:location", async (req, res) => {
    try {
      const recommendation = await networkMonitor.getNetworkRecommendation(req.params.location);
      res.json(recommendation);
    } catch (error) {
      res.status(500).json({ error: "Failed to get network recommendation", details: error });
    }
  });

  // Social media insights routes
  app.get("/api/insights", async (req, res) => {
    try {
      const location = req.query.location as string;
      const limit = parseInt(req.query.limit as string) || 10;
      const insights = await storage.getSocialMediaInsights(location, limit);
      res.json(insights);
    } catch (error) {
      res.status(500).json({ error: "Failed to get social media insights", details: error });
    }
  });

  // Emergency alerts routes
  app.get("/api/emergency-alerts", async (req, res) => {
    try {
      const location = req.query.location as string;
      const alerts = await storage.getActiveEmergencyAlerts(location);
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ error: "Failed to get emergency alerts", details: error });
    }
  });

  app.post("/api/emergency-alerts", async (req, res) => {
    try {
      const alertData = req.body;
      const alert = await storage.createEmergencyAlert(alertData);
      res.json(alert);
    } catch (error) {
      res.status(400).json({ error: "Failed to create emergency alert", details: error });
    }
  });

  // Emergency location send
  app.post("/api/emergency/send-location", async (req, res) => {
    try {
      const { latitude, longitude, address, city, district } = req.body;
      
      if (!latitude || !longitude) {
        return res.status(400).json({ error: "Latitude and longitude are required" });
      }

      // Log the emergency location send (in a real app, you'd send to emergency contacts)
      console.log("Emergency location sent:", {
        coordinates: { latitude, longitude },
        address,
        city,
        district,
        timestamp: new Date().toISOString()
      });

      // In a real implementation, you would:
      // 1. Get emergency contacts from user profile
      // 2. Send SMS/email with location to each contact
      // 3. Log the emergency event
      // 4. Possibly notify emergency services

      res.json({ 
        message: "Emergency location sent successfully",
        location: {
          latitude,
          longitude,
          address,
          city,
          district
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Emergency location send error:", error);
      res.status(500).json({ error: "Failed to send emergency location", details: error });
    }
  });

  // Location-based services
  app.get("/api/location/current", async (req, res) => {
    try {
      const location = await locationService.getCurrentLocation();
      res.json(location);
    } catch (error) {
      res.status(500).json({ error: "Failed to get current location", details: error });
    }
  });

  app.get("/api/location/by-coordinates", async (req, res) => {
    try {
      console.log("Location by coordinates isteği:", req.query);
      
      const lat = parseFloat(req.query.lat as string);
      const lng = parseFloat(req.query.lng as string);
      
      console.log("Parsed coordinates:", lat, lng);
      
      if (isNaN(lat) || isNaN(lng)) {
        console.error("Invalid coordinates:", req.query);
        return res.status(400).json({ error: "Invalid coordinates" });
      }
      
      const location = await locationService.getLocationByCoordinates(lat, lng);
      console.log("Location service response:", location);
      
      res.json(location);
    } catch (error) {
      console.error("Location by coordinates error:", error);
      res.status(500).json({ error: "Failed to get location by coordinates", details: error });
    }
  });

  app.get("/api/location/nearest-safe-area", async (req, res) => {
    try {
      const nearestArea = await locationService.getNearestSafeArea();
      res.json(nearestArea);
    } catch (error) {
      res.status(500).json({ error: "Failed to get nearest safe area", details: error });
    }
  });

  app.get("/api/safe-areas/:location", async (req, res) => {
    try {
      const location = req.params.location;
      
      // FAISS'den gerçek toplanma alanları ara
      const { spawn } = require('child_process');
      const path = require('path');
      
      const pythonScript = path.join(process.cwd(), 'faiss_search.py');
      const pythonProcess = spawn('python3', [pythonScript, location], {
        cwd: process.cwd(),
        env: { ...process.env, PATH: process.env.PATH }
      });

      let output = '';
      let errorOutput = '';

      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          try {
            const results = JSON.parse(output);
            const safeAreas = results.map((result: any) => ({
              name: result.metadata.alan_adi,
              district: result.metadata.ilce,
              neighborhood: result.metadata.mahalle,
              coordinates: {
                lat: result.metadata.koordinat.lat,
                lng: result.metadata.koordinat.lng
              },
              area: result.metadata.alan_bilgileri.toplam_alan,
              facilities: extractFacilities(result.metadata.altyapi),
              similarity: result.similarity
            }));
            res.json(safeAreas);
          } catch (parseError) {
            res.status(500).json({ error: "JSON parse hatası", details: parseError });
          }
        } else {
          res.status(500).json({ error: "Python script hatası", details: errorOutput });
        }
      });

      pythonProcess.on('error', (error) => {
        res.status(500).json({ error: "Python process hatası", details: error });
      });

    } catch (error) {
      res.status(500).json({ error: "Failed to get safe areas", details: error });
    }
  });

  function extractFacilities(altyapi: any): string[] {
    const facilities = [];
    if (altyapi.elektrik) facilities.push('Elektrik');
    if (altyapi.su) facilities.push('Su');
    if (altyapi.wc) facilities.push('WC');
    if (altyapi.kanalizasyon) facilities.push('Kanalizasyon');
    return facilities;
  }

  // Agent-specific routes
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

  app.get("/api/agent/memory/:userId", async (req, res) => {
    try {
      const memory = await coreAgent.getUserMemory(req.params.userId);
      res.json(memory);
    } catch (error) {
      console.error("Memory retrieval error:", error);
      res.status(500).json({ error: "Failed to get user memory", details: error });
    }
  });

  app.delete("/api/agent/memory/:userId", async (req, res) => {
    try {
      await coreAgent.clearUserMemory(req.params.userId);
      res.json({ message: "User memory cleared successfully" });
    } catch (error) {
      console.error("Memory clear error:", error);
      res.status(500).json({ error: "Failed to clear user memory", details: error });
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

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "healthy", 
      timestamp: new Date().toISOString(),
      services: {
        socialMediaAnalyzer: socialMediaAnalyzer ? "running" : "stopped",
        networkMonitor: networkMonitor ? "running" : "stopped",
        coreAgent: coreAgent ? "running" : "stopped"
      }
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
