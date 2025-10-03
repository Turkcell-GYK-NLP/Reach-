import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertChatMessageSchema, insertCallConversationSchema } from "@shared/schema";
import { hashPassword, verifyPassword, signToken } from "./utils/auth";
import { processNaturalLanguageQuery } from "./services/openai";
import { socialMediaAnalyzer } from "./services/socialMediaAnalyzer";
import { tweetDataService } from "./services/tweetDataService";
import { networkMonitor } from "./services/networkMonitor";
import { locationService } from "./services/locationService";
import { CoreAgent } from "./agents/coreAgent.js";
import psychologicalRoutes from "./routes/psychological.js";

export async function registerRoutes(app: Express): Promise<Server> {
  // Start background services (optional)
  if (process.env.ENABLE_SOCIAL_ANALYZER === 'true') {
    socialMediaAnalyzer.start();
  }
  if (process.env.ENABLE_NETWORK_MONITOR === 'true') {
    networkMonitor.start();
  }
  await tweetDataService.ensureLoaded().catch(() => {});

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

  // Tweets from Excel (recent)
  app.get("/api/tweets", async (req, res) => {
    try {
      const limit = Math.min(parseInt(String(req.query.limit || '20')), 200) || 20;
      const rawTimeframe = (req.query.timeframe as string) || undefined;
      const timeframe = normalizeTimeframe(rawTimeframe); // '7d' | '1m' | '1y' | undefined
      const startDateStr = (req.query.startDate as string) || undefined;
      const endDateStr = (req.query.endDate as string) || undefined;
      const q = (req.query.q as string) || '';
      const il = (req.query.il as string) || '';
      const ilce = (req.query.ilce as string) || '';

      await tweetDataService.ensureLoaded();
      let list = tweetDataService.getRecent(10000, timeframe, startDateStr, endDateStr);

      if (il) list = list.filter(t => (t.il || '').toLowerCase() === il.toLowerCase());
      if (ilce) list = list.filter(t => (t.ilce || '').toLowerCase() === ilce.toLowerCase());
      if (q) {
        const ql = q.toLowerCase();
        list = list.filter(t =>
          t.text.toLowerCase().includes(ql) ||
          (t.author || '').toLowerCase().includes(ql) ||
          (t.helpTopic || '').toLowerCase().includes(ql)
        );
      }

      res.json({
        success: true,
        count: Math.min(limit, list.length),
        data: list.slice(0, limit),
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get tweets", details: String(error) });
    }
  });

  // Tweets analytics (from Excel)
  app.get("/api/tweets/analytics", async (req, res) => {
    try {
      const timeframe = normalizeTimeframe((req.query.timeframe as string) || undefined);
      const startDateStr = (req.query.startDate as string) || undefined;
      const endDateStr = (req.query.endDate as string) || undefined;
      await tweetDataService.ensureLoaded();
      const analytics = tweetDataService.getAnalytics(timeframe, startDateStr, endDateStr);
      res.json({ success: true, data: analytics });
    } catch (error) {
      res.status(500).json({ error: "Failed to get tweets analytics", details: String(error) });
    }
  });

  // Tweet density by city for map visualization
  app.get("/api/tweets/density", async (req, res) => {
    try {
      const timeframe = normalizeTimeframe((req.query.timeframe as string) || undefined);
      const startDateStr = (req.query.startDate as string) || undefined;
      const endDateStr = (req.query.endDate as string) || undefined;
      await tweetDataService.ensureLoaded();
      const density = tweetDataService.getTweetDensityByCity(timeframe, startDateStr, endDateStr);
      res.json({ success: true, data: density });
    } catch (error) {
      res.status(500).json({ error: "Failed to get tweet density", details: String(error) });
    }
  });

  // Trending topics by region for map visualization
  app.get("/api/tweets/trending-topics", async (req, res) => {
    try {
      const timeframe = normalizeTimeframe((req.query.timeframe as string) || undefined);
      const startDateStr = (req.query.startDate as string) || undefined;
      const endDateStr = (req.query.endDate as string) || undefined;
      await tweetDataService.ensureLoaded();
      const trendingTopics = tweetDataService.getTrendingTopicsByRegion(timeframe, startDateStr, endDateStr);
      res.json({ success: true, data: trendingTopics });
    } catch (error) {
      res.status(500).json({ error: "Failed to get trending topics", details: String(error) });
    }
  });

  function normalizeTimeframe(tf?: string): "7d" | "1m" | "1y" | undefined {
    if (!tf) return undefined;
    const v = String(tf).trim().toLowerCase();
    if (v === '7d' || v === '7g' || v === '1w' || v === '7gun' || v === 'son7gun') return '7d';
    if (v === '1m' || v === '30d' || v === '30g' || v === '1ay' || v === 'son1ay' || v === '30gun') return '1m';
    if (v === '1y' || v === '12m' || v === '365d' || v === '1yil' || v === 'son1yil') return '1y';
    return undefined;
  }

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

      pythonProcess.stdout.on('data', (data: any) => {
        output += data.toString();
      });

      pythonProcess.stderr.on('data', (data: any) => {
        errorOutput += data.toString();
      });

      pythonProcess.on('close', (code: any) => {
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

      pythonProcess.on('error', (error: any) => {
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

  // Psychological Profile Routes
  app.use("/api/psychological", psychologicalRoutes);

  // Hospital routes
  app.get("/api/hospitals", async (req, res) => {
    try {
      const fs = require('fs');
      const path = require('path');
      
      // Gerçek hastane verilerini oku
      const hospitalDataPath = path.join(__dirname, '../hospital_api/istanbul_hospitals_detailed.json');
      let hospitalData = [];
      
      try {
        const rawData = fs.readFileSync(hospitalDataPath, 'utf8');
        const allHospitals = JSON.parse(rawData);
        
        // Verileri frontend formatına dönüştür
        hospitalData = allHospitals
          .filter((h: any) => h.name && h.name !== 'İsimsiz Hospital' && h.coordinates)
          .map((h: any, index: number) => ({
            id: h.osm_metadata?.id || `hospital_${index}`,
            name: h.name,
            type: h.medical_info?.healthcare === 'hospital' ? 'Hastane' : 'Sağlık Tesisi',
            phone: h.contact?.phone || null,
            address: h.address?.full_address || 
                    `${h.address?.neighbourhood || ''} ${h.address?.district || 'İstanbul'}`.trim(),
            coordinates: {
              latitude: h.coordinates.latitude,
              longitude: h.coordinates.longitude
            },
            emergency: h.medical_info?.emergency || null,
            website: h.contact?.website || null,
            operator: h.medical_info?.operator || null,
            beds: h.medical_info?.beds || null,
            district: h.address?.district || 'Bilinmeyen'
          }))
          .slice(0, 100); // İlk 100 hastaneyi al (performans için)
          
      } catch (fileError) {
        console.error('Hastane dosyası okunamadı, mock data kullanılıyor:', fileError);
        // Fallback to mock data
        hospitalData = [
          {
            id: '1',
            name: 'Acıbadem Maslak Hastanesi',
            type: 'Özel Hastane',
            phone: '+90 212 304 44 44',
            address: 'Büyükdere Caddesi No:40, Maslak, İstanbul',
            coordinates: { latitude: 41.108889, longitude: 29.018333 },
            emergency: 'yes',
            website: 'https://www.acibadem.com.tr',
            operator: 'Acıbadem Sağlık Grubu',
            beds: '200',
            district: 'Sarıyer'
          },
          {
            id: '2',
            name: 'Florence Nightingale Hastanesi',
            type: 'Özel Hastane',
            phone: '+90 212 224 49 50',
            address: 'Abide-i Hürriyet Caddesi, Şişli, İstanbul',
            coordinates: { latitude: 41.039444, longitude: 29.027778 },
            emergency: 'yes',
            website: 'https://www.florence.com.tr',
            operator: 'Florence Nightingale',
            beds: '150',
            district: 'Şişli'
          }
        ];
      }

      // District filter
      const district = req.query.district as string;
      let filteredHospitals = hospitalData;
      
      if (district && district !== 'all') {
        filteredHospitals = hospitalData.filter((h: any) => 
          h.district && h.district.toLowerCase() === district.toLowerCase()
        );
      }

      res.json({
        success: true,
        count: filteredHospitals.length,
        data: filteredHospitals
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get hospitals", details: error });
    }
  });


  app.get("/api/hospitals/districts", async (req, res) => {
    try {
      const districts = [
        'Adalar', 'Arnavutköy', 'Ataşehir', 'Avcılar', 'Bağcılar', 'Bahçelievler',
        'Bakırköy', 'Başakşehir', 'Bayrampaşa', 'Beşiktaş', 'Beykoz', 'Beylikdüzü',
        'Beyoğlu', 'Büyükçekmece', 'Çatalca', 'Çekmeköy', 'Esenler', 'Esenyurt',
        'Eyüpsultan', 'Fatih', 'Gaziosmanpaşa', 'Güngören', 'Kadıköy', 'Kağıthane',
        'Kartal', 'Küçükçekmece', 'Maltepe', 'Pendik', 'Sancaktepe', 'Sarıyer',
        'Silivri', 'Sultanbeyli', 'Sultangazi', 'Şile', 'Şişli', 'Tuzla',
        'Ümraniye', 'Üsküdar', 'Zeytinburnu'
      ];

      res.json({
        success: true,
        data: districts
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get districts", details: error });
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
