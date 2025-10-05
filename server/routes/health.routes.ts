import type { Express } from "express";
import { socialMediaAnalyzer } from "../services/socialMediaAnalyzer";
import { networkMonitor } from "../services/networkMonitor";
import psychologicalRoutes from "./psychological.js";

export function registerHealthRoutes(app: Express): void {
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

  // Psychological Profile Routes
  app.use("/api/psychological", psychologicalRoutes);
}

