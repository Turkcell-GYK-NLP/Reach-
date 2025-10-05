import type { Express } from "express";
import { storage } from "../storage";
import { networkMonitor } from "../services/networkMonitor";

export function registerNetworkRoutes(app: Express): void {
  // Get network status
  app.get("/api/network-status", async (req, res) => {
    try {
      const location = req.query.location as string;
      const networkStatus = await storage.getNetworkStatus(location);
      res.json(networkStatus);
    } catch (error) {
      res.status(500).json({ error: "Failed to get network status", details: error });
    }
  });

  // Get network recommendation
  app.get("/api/network-recommendation/:location", async (req, res) => {
    try {
      const recommendation = await networkMonitor.getNetworkRecommendation(req.params.location);
      res.json(recommendation);
    } catch (error) {
      res.status(500).json({ error: "Failed to get network recommendation", details: error });
    }
  });
}

