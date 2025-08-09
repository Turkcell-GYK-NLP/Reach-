import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertChatMessageSchema } from "@shared/schema";
import { processNaturalLanguageQuery } from "./services/openai";
import { socialMediaAnalyzer } from "./services/socialMediaAnalyzer";
import { networkMonitor } from "./services/networkMonitor";
import { locationService } from "./services/locationService";

export async function registerRoutes(app: Express): Promise<Server> {
  // Start background services
  socialMediaAnalyzer.start();
  networkMonitor.start();

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
      
      // Process with OpenAI
      const aiResponse = await processNaturalLanguageQuery(message, userContext || {});
      
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
        message: aiResponse.message,
        response: null,
        metadata: { 
          type: "bot", 
          suggestions: aiResponse.suggestions,
          actionItems: aiResponse.actionItems
        }
      });

      res.json({
        userMessage,
        botMessage,
        aiResponse
      });
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ error: "Failed to process chat message", details: error });
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
      
      // Mock safe areas data - in real implementation this would come from a GIS database
      const safeAreas = [
        {
          name: "Fenerbahçe Parkı",
          distance: "400m",
          coordinates: { lat: 40.9839, lng: 29.0365 },
          capacity: 5000,
          facilities: ["Su", "Elektrik", "Tıbbi Yardım"]
        },
        {
          name: "Göztepe 60.Yıl Parkı", 
          distance: "800m",
          coordinates: { lat: 40.9751, lng: 29.0515 },
          capacity: 8000,
          facilities: ["Su", "WC", "Oyun Alanı"]
        },
        {
          name: "Kadıköy Meydanı",
          distance: "1.2km", 
          coordinates: { lat: 40.9903, lng: 29.0264 },
          capacity: 10000,
          facilities: ["Su", "Elektrik", "Ulaşım", "Mağazalar"]
        }
      ];

      res.json(safeAreas);
    } catch (error) {
      res.status(500).json({ error: "Failed to get safe areas", details: error });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "healthy", 
      timestamp: new Date().toISOString(),
      services: {
        socialMediaAnalyzer: socialMediaAnalyzer ? "running" : "stopped",
        networkMonitor: networkMonitor ? "running" : "stopped"
      }
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
