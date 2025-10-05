import type { Express } from "express";
import { storage } from "../storage";

export function registerEmergencyRoutes(app: Express): void {
  // Get emergency alerts
  app.get("/api/emergency-alerts", async (req, res) => {
    try {
      const location = req.query.location as string;
      const alerts = await storage.getActiveEmergencyAlerts(location);
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ error: "Failed to get emergency alerts", details: error });
    }
  });

  // Create emergency alert
  app.post("/api/emergency-alerts", async (req, res) => {
    try {
      const alertData = req.body;
      const alert = await storage.createEmergencyAlert(alertData);
      res.json(alert);
    } catch (error) {
      res.status(400).json({ error: "Failed to create emergency alert", details: error });
    }
  });

  // Send emergency location
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
}

