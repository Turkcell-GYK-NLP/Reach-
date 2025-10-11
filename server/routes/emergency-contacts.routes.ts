import type { Express } from "express";
import { storage } from "../storage";
import { insertEmergencyContactSchema } from "@shared/schema";

export function registerEmergencyContactsRoutes(app: Express): void {
  // Get emergency contacts for a user
  app.get("/api/emergency-contacts/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const contacts = await storage.getEmergencyContacts(userId);
      res.json(contacts);
    } catch (error) {
      console.error("Get emergency contacts error:", error);
      res.status(500).json({ error: "Failed to get emergency contacts", details: error });
    }
  });

  // Create emergency contact
  app.post("/api/emergency-contacts", async (req, res) => {
    try {
      const contactData = insertEmergencyContactSchema.parse(req.body);
      const contact = await storage.createEmergencyContact(contactData);
      res.json(contact);
    } catch (error) {
      console.error("Create emergency contact error:", error);
      res.status(400).json({ error: "Invalid emergency contact data", details: error });
    }
  });

  // Update emergency contact
  app.patch("/api/emergency-contacts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const contact = await storage.updateEmergencyContact(id, updates);
      if (!contact) {
        return res.status(404).json({ error: "Emergency contact not found" });
      }
      res.json(contact);
    } catch (error) {
      console.error("Update emergency contact error:", error);
      res.status(500).json({ error: "Failed to update emergency contact", details: error });
    }
  });

  // Delete emergency contact
  app.delete("/api/emergency-contacts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteEmergencyContact(id);
      if (!success) {
        return res.status(404).json({ error: "Emergency contact not found" });
      }
      res.json({ message: "Emergency contact deleted successfully" });
    } catch (error) {
      console.error("Delete emergency contact error:", error);
      res.status(500).json({ error: "Failed to delete emergency contact", details: error });
    }
  });

  // Set primary emergency contact
  app.patch("/api/emergency-contacts/:id/set-primary", async (req, res) => {
    try {
      const { id } = req.params;
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }

      const contact = await storage.setPrimaryEmergencyContact(id, userId);
      if (!contact) {
        return res.status(404).json({ error: "Emergency contact not found" });
      }
      res.json(contact);
    } catch (error) {
      console.error("Set primary emergency contact error:", error);
      res.status(500).json({ error: "Failed to set primary emergency contact", details: error });
    }
  });
}
