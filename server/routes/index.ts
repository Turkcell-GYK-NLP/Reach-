import type { Express } from "express";
import { createServer, type Server } from "http";
import { registerAuthRoutes } from "./auth.routes.js";
import { registerUserRoutes } from "./user.routes.js";
import { registerChatRoutes } from "./chat.routes.js";
import { registerNetworkRoutes } from "./network.routes.js";
import { registerTweetRoutes } from "./tweet.routes.js";
import { registerEmergencyRoutes } from "./emergency.routes.js";
import { registerLocationRoutes } from "./location.routes.js";
import { registerHospitalRoutes } from "./hospital.routes.js";
import { registerAgentRoutes } from "./agent.routes.js";
import { registerHealthRoutes } from "./health.routes.js";
import { registerEmergencyContactsRoutes } from "./emergency-contacts.routes.js";
import tarifeOnerisiRoutes from "./tarife-onerisi.routes.js";
import { socialMediaAnalyzer } from "../services/socialMediaAnalyzer";
import { networkMonitor } from "../services/networkMonitor";
import { tweetDataService } from "../services/tweetDataService";
import { CoreAgent } from "../agents/coreAgent.js";

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

  // Register all routes
  registerAuthRoutes(app);
  registerUserRoutes(app);
  registerChatRoutes(app, coreAgent);
  registerNetworkRoutes(app);
  registerTweetRoutes(app);
  registerEmergencyRoutes(app);
  registerEmergencyContactsRoutes(app);
  registerLocationRoutes(app);
  registerHospitalRoutes(app);
  registerAgentRoutes(app, coreAgent);
  registerHealthRoutes(app);
  
  // Tarife önerisi routes
  app.use('/api/tarife', tarifeOnerisiRoutes);

  const httpServer = createServer(app);
  return httpServer;
}

