import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, boolean, integer, real, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable(
  "users",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    email: text("email").notNull(),
    phone: text("phone"),
    ageYears: integer("age_years").notNull(),
    gender: text("gender"),
    locale: text("locale").notNull().default("tr-TR"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => ({
    usersEmailUnique: uniqueIndex("users_email_unique").on(table.email),
  })
);

export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  sessionId: varchar("session_id"),
  role: text("role").notNull(),
  content: text("content").notNull(),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
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

// Kullanıcı popup cevapları
export const userResponseSchema = pgTable("user_responses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  questionId: text("question_id").notNull(),
  answer: text("answer").notNull(),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
});

// Kullanıcı psikolojik profili
export const userProfileSchema = pgTable("user_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull().unique(),
  
  // Duygusal temel değerler
  positivity: real("positivity").default(0.5),
  anxietyLevel: real("anxiety_level").default(0.5),
  hopeLevel: real("hope_level").default(0.5),
  socialConnection: real("social_connection").default(0.5),
  
  // İhtiyaç öncelikleri
  shelterNeed: real("shelter_need").default(0.5),
  foodNeed: real("food_need").default(0.5),
  communicationNeed: real("communication_need").default(0.5),
  medicalNeed: real("medical_need").default(0.5),
  psychologicalNeed: real("psychological_need").default(0.5),
  
  // Travma göstergeleri
  traumaSeverity: text("trauma_severity").default('medium'), // low, medium, high
  recoveryTrend: text("recovery_trend").default('stable'), // improving, stable, declining
  
  // Sosyal bağlam
  supportNetworkSize: text("support_network_size").default('moderate'), // isolated, limited, moderate, strong
  familyConnection: text("family_connection").default('worried'), // disconnected, worried, connected
  trustLevel: real("trust_level").default(0.5),
  
  // Etkileşim kalıpları
  responseFrequency: real("response_frequency").default(0.5),
  engagementDepth: real("engagement_depth").default(0.5),
  helpSeekingBehavior: text("help_seeking_behavior").default('moderate'), // passive, moderate, active
  
  lastAssessment: timestamp("last_assessment").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Duygu analizi sonuçları
export const emotionalAnalysisSchema = pgTable("emotional_analysis", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  
  emotionalTrend: text("emotional_trend").notNull(), // improving, stable, declining
  riskFactors: jsonb("risk_factors").default([]),
  recommendations: jsonb("recommendations").default([]),
  
  timeframe: text("timeframe").notNull(), // daily, weekly, monthly
  analysisDate: timestamp("analysis_date").defaultNow(),
});

// Vapi call conversations
export const callConversations = pgTable("call_conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  callId: varchar("call_id").notNull(),
  assistantId: varchar("assistant_id"),
  status: text("status"),
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  messages: jsonb("messages").notNull().default([]),
  summary: text("summary"),
  transcript: text("transcript"),
  createdAt: timestamp("created_at").defaultNow(),
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

export const insertUserResponseSchema = createInsertSchema(userResponseSchema).omit({
  id: true,
  createdAt: true,
});

export const insertUserProfileSchema = createInsertSchema(userProfileSchema).omit({
  id: true,
  lastAssessment: true,
  updatedAt: true,
});

export const insertEmotionalAnalysisSchema = createInsertSchema(emotionalAnalysisSchema).omit({
  id: true,
  analysisDate: true,
});

export const insertCallConversationSchema = createInsertSchema(callConversations).omit({
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
export type UserResponse = typeof userResponseSchema.$inferSelect;
export type InsertUserResponse = z.infer<typeof insertUserResponseSchema>;
export type UserProfile = typeof userProfileSchema.$inferSelect;
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type EmotionalAnalysis = typeof emotionalAnalysisSchema.$inferSelect;
export type InsertEmotionalAnalysis = z.infer<typeof insertEmotionalAnalysisSchema>;
export type CallConversation = typeof callConversations.$inferSelect;
export type InsertCallConversation = z.infer<typeof insertCallConversationSchema>;
