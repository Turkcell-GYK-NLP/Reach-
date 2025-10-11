import type { Express } from "express";
import { storage } from "../storage";
import { hashPassword, verifyPassword, signToken } from "../utils/auth";

export function registerAuthRoutes(app: Express): void {
  // Register
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { name, email, password, age, gender, phone } = req.body || {};
      if (!email || !password || !age) {
        return res.status(400).json({ error: "EMAIL_PASSWORD_AGE_REQUIRED" });
      }
      
      const existing = await storage.getUserByEmail(email.toLowerCase());
      if (existing) {
        return res.status(409).json({ error: "EMAIL_ALREADY_EXISTS" });
      }
      
      const hashedPassword = await hashPassword(password);
      
      const user = await storage.createUser({
        name: name || null,
        email: email.toLowerCase(),
        password_hash: hashedPassword,
        age_years: parseInt(age),
        location: null,
        operator: null,
        preferences: {},
        notifications_enabled: true
      } as any);
      
      const token = signToken(
        { sub: user.id, email: email.toLowerCase() }, 
        process.env.AUTH_SECRET || "dev_secret", 
        60 * 60 * 24 * 7
      );
      
      res.json({ 
        user: { 
          id: user.id, 
          name: user.name,
          email: user.email 
        }, 
        token 
      });
    } catch (error: any) {
      if (error?.message === "EMAIL_ALREADY_EXISTS") {
        return res.status(409).json({ error: "EMAIL_ALREADY_EXISTS" });
      }
      res.status(400).json({ error: "REGISTER_FAILED", details: String(error) });
    }
  });

  // Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body || {};
      if (!email || !password) {
        return res.status(400).json({ error: "EMAIL_PASSWORD_REQUIRED" });
      }
      
      const user = await storage.getUserByEmail(email.toLowerCase());
      if (!user) {
        console.log("Login: User not found for email:", email);
        return res.status(401).json({ error: "INVALID_CREDENTIALS" });
      }
      
      console.log("Login: User found:", { id: user.id, email: user.email, hasPasswordHash: !!user.password_hash });
      
      // Password hash kontrolü
      const isValidPassword = await verifyPassword(password, user.password_hash);
      console.log("Login: Password verification result:", isValidPassword);
      
      if (!isValidPassword) {
        return res.status(401).json({ error: "INVALID_CREDENTIALS" });
      }
      
      const token = signToken(
        { sub: user.id, email: email.toLowerCase() }, 
        process.env.AUTH_SECRET || "dev_secret", 
        60 * 60 * 24 * 7
      );
      
      res.json({ 
        user: { 
          id: user.id, 
          name: user.name,
          email: user.email 
        }, 
        token 
      });
    } catch (error) {
      res.status(400).json({ error: "LOGIN_FAILED", details: error });
    }
  });
}

