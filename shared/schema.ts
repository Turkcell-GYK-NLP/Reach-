import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, boolean, integer, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable(
  "users",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    name: text("name").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    age: integer("age"),
    location: text("location"),
    operator: text("operator"),
    preferences: jsonb("preferences").default({}),
    notificationsEnabled: boolean("notifications_enabled").default(true),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    usersEmailUnique: uniqueIndex("users_email_unique").on(table.email),
  })
);

export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  message: text("message").notNull(),
  response: text("response"),
  timestamp: timestamp("timestamp").defaultNow(),
  metadata: jsonb("metadata").default({}),
});

export const networkStatus = pgTable("network_status", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  operator: text("operator").notNull(),
  location: text("location").notNull(),
  coverage: integer("coverage").notNull(),
  signalStrength: integer("signal_strength"),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const socialMediaInsights = pgTable("social_media_insights", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  keyword: text("keyword").notNull(),
  sentiment: text("sentiment").notNull(),
  count: integer("count").notNull(),
  category: text("category").notNull(),
  location: text("location"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const emergencyAlerts = pgTable("emergency_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  severity: text("severity").notNull(), // low, medium, high, critical
  location: text("location").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  timestamp: true,
});

export const insertNetworkStatusSchema = createInsertSchema(networkStatus).omit({
  id: true,
  lastUpdated: true,
});

export const insertSocialMediaInsightSchema = createInsertSchema(socialMediaInsights).omit({
  id: true,
  timestamp: true,
});

export const insertEmergencyAlertSchema = createInsertSchema(emergencyAlerts).omit({
  id: true,
  createdAt: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type NetworkStatus = typeof networkStatus.$inferSelect;
export type InsertNetworkStatus = z.infer<typeof insertNetworkStatusSchema>;
export type SocialMediaInsight = typeof socialMediaInsights.$inferSelect;
export type InsertSocialMediaInsight = z.infer<typeof insertSocialMediaInsightSchema>;
export type EmergencyAlert = typeof emergencyAlerts.$inferSelect;
export type InsertEmergencyAlert = z.infer<typeof insertEmergencyAlertSchema>;
