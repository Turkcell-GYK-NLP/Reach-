import { 
  users as usersTable,
  chatMessages as chatMessagesTable,
  networkStatus as networkStatusTable,
  socialMediaInsights as socialMediaInsightsTable,
  emergencyAlerts as emergencyAlertsTable,
  type User, 
  type InsertUser,
  type ChatMessage,
  type InsertChatMessage,
  type NetworkStatus,
  type InsertNetworkStatus,
  type SocialMediaInsight,
  type InsertSocialMediaInsight,
  type EmergencyAlert,
  type InsertEmergencyAlert
} from "@shared/schema";
import { randomUUID } from "crypto";
import { and, desc, eq } from "drizzle-orm";

// Try to import database synchronously
let db: any = null;

if (process.env.DATABASE_URL) {
  try {
    // Use dynamic import with top-level await equivalent
    import("./db.js").then(({ db: database }) => {
      db = database;
      console.log("✅ PostgreSQL bağlantısı başarılı");
    }).catch((e) => {
      console.error("❌ Database import hatası:", e);
      db = null;
    });
  } catch (e) {
    console.error("❌ Database import hatası:", e);
    db = null;
  }
}

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  
  // Chat Messages
  getChatMessages(userId: string): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  
  // Network Status
  getNetworkStatus(location?: string): Promise<NetworkStatus[]>;
  createNetworkStatus(status: InsertNetworkStatus): Promise<NetworkStatus>;
  updateNetworkStatus(operator: string, location: string, updates: Partial<InsertNetworkStatus>): Promise<NetworkStatus | undefined>;
  
  // Social Media Insights
  getSocialMediaInsights(location?: string, limit?: number): Promise<SocialMediaInsight[]>;
  createSocialMediaInsight(insight: InsertSocialMediaInsight): Promise<SocialMediaInsight>;
  
  // Emergency Alerts
  getActiveEmergencyAlerts(location?: string): Promise<EmergencyAlert[]>;
  createEmergencyAlert(alert: InsertEmergencyAlert): Promise<EmergencyAlert>;
  deactivateEmergencyAlert(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private emailToUserId: Map<string, string> = new Map();
  private chatMessages: Map<string, ChatMessage[]> = new Map();
  private networkStatuses: NetworkStatus[] = [];
  private socialMediaInsights: SocialMediaInsight[] = [];
  private emergencyAlerts: EmergencyAlert[] = [];

  constructor() {
    // Initialize with sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Sample network status
    const networkData: InsertNetworkStatus[] = [
      { operator: "Turkcell", location: "Kadıköy", coverage: 94, signalStrength: 85 },
      { operator: "Vodafone", location: "Kadıköy", coverage: 87, signalStrength: 78 },
      { operator: "Türk Telekom", location: "Kadıköy", coverage: 72, signalStrength: 65 },
      { operator: "Turkcell", location: "Beşiktaş", coverage: 91, signalStrength: 82 },
      { operator: "Vodafone", location: "Beşiktaş", coverage: 89, signalStrength: 80 },
    ];

    networkData.forEach(data => {
      const status: NetworkStatus = {
        id: randomUUID(),
        ...data,
        signalStrength: data.signalStrength || null,
        lastUpdated: new Date(),
      };
      this.networkStatuses.push(status);
    });

    // Sample emergency alert
    const emergencyAlert: EmergencyAlert = {
      id: randomUUID(),
      title: "Afet Uyarısı Aktif",
      description: "İstanbul Bölgesi - Son güncelleme: 2 dk önce",
      severity: "high",
      location: "İstanbul",
      isActive: true,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    };
    this.emergencyAlerts.push(emergencyAlert);
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const id = this.emailToUserId.get(email.toLowerCase());
    if (!id) return undefined;
    return this.users.get(id);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    if ((insertUser as any).email) {
      const existing = await this.getUserByEmail(((insertUser as any).email as string).toLowerCase());
      if (existing) {
        throw new Error("EMAIL_ALREADY_EXISTS");
      }
    }
    const id = randomUUID();
    const user: User = { 
      ...insertUser,
      id,
      operator: insertUser.operator || null,
      location: insertUser.location || null,
      age: insertUser.age || null,
      preferences: insertUser.preferences || {},
      notificationsEnabled: insertUser.notificationsEnabled ?? true,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    if ((user as any).email) {
      this.emailToUserId.set(((user as any).email as string).toLowerCase(), id);
    }
    console.log("🔐 Kullanıcı kaydedildi (MemStorage):", { id: user.id, name: user.name, email: (user as any).email });
    console.log("📊 Toplam kullanıcı sayısı:", this.users.size);
    return user;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getChatMessages(userId: string): Promise<ChatMessage[]> {
    return this.chatMessages.get(userId) || [];
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = randomUUID();
    const message: ChatMessage = {
      ...insertMessage,
      id,
      userId: insertMessage.userId || null,
      response: insertMessage.response || null,
      metadata: insertMessage.metadata || {},
      timestamp: new Date(),
    };

    const userId = insertMessage.userId || "default";
    const userMessages = this.chatMessages.get(userId) || [];
    userMessages.push(message);
    this.chatMessages.set(userId, userMessages);

    return message;
  }

  async getNetworkStatus(location?: string): Promise<NetworkStatus[]> {
    if (location) {
      return this.networkStatuses.filter(status => 
        status.location.toLowerCase().includes(location.toLowerCase())
      );
    }
    return this.networkStatuses;
  }

  async createNetworkStatus(insertStatus: InsertNetworkStatus): Promise<NetworkStatus> {
    const id = randomUUID();
    const status: NetworkStatus = {
      ...insertStatus,
      id,
      signalStrength: insertStatus.signalStrength || null,
      lastUpdated: new Date(),
    };
    this.networkStatuses.push(status);
    return status;
  }

  async updateNetworkStatus(operator: string, location: string, updates: Partial<InsertNetworkStatus>): Promise<NetworkStatus | undefined> {
    const index = this.networkStatuses.findIndex(
      status => status.operator === operator && status.location === location
    );
    
    if (index === -1) return undefined;

    this.networkStatuses[index] = {
      ...this.networkStatuses[index],
      ...updates,
      lastUpdated: new Date(),
    };

    return this.networkStatuses[index];
  }

  async getSocialMediaInsights(location?: string, limit = 10): Promise<SocialMediaInsight[]> {
    let insights = [...this.socialMediaInsights];
    
    if (location) {
      insights = insights.filter(insight => 
        !insight.location || insight.location.toLowerCase().includes(location.toLowerCase())
      );
    }

    return insights
      .sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0))
      .slice(0, limit);
  }

  async createSocialMediaInsight(insertInsight: InsertSocialMediaInsight): Promise<SocialMediaInsight> {
    const id = randomUUID();
    const insight: SocialMediaInsight = {
      ...insertInsight,
      id,
      location: insertInsight.location || null,
      timestamp: new Date(),
    };
    this.socialMediaInsights.push(insight);
    return insight;
  }

  async getActiveEmergencyAlerts(location?: string): Promise<EmergencyAlert[]> {
    let alerts = this.emergencyAlerts.filter(alert => alert.isActive);
    
    if (location) {
      alerts = alerts.filter(alert => 
        alert.location.toLowerCase().includes(location.toLowerCase())
      );
    }

    return alerts.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async createEmergencyAlert(insertAlert: InsertEmergencyAlert): Promise<EmergencyAlert> {
    const id = randomUUID();
    const alert: EmergencyAlert = {
      ...insertAlert,
      id,
      isActive: insertAlert.isActive ?? true,
      expiresAt: insertAlert.expiresAt || null,
      createdAt: new Date(),
    };
    this.emergencyAlerts.push(alert);
    return alert;
  }

  async deactivateEmergencyAlert(id: string): Promise<boolean> {
    const alert = this.emergencyAlerts.find(a => a.id === id);
    if (alert) {
      alert.isActive = false;
      return true;
    }
    return false;
  }
}

class DrizzleStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const rows = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
    return rows[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const rows = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase())).limit(1);
    return rows[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [row] = await db.insert(usersTable).values(insertUser).returning();
    console.log("🔐 Kullanıcı kaydedildi (DrizzleStorage):", { id: row.id, name: row.name, email: (row as any).email });
    return row;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const [row] = await db.update(usersTable).set(updates).where(eq(usersTable.id, id)).returning();
    return row;
  }

  async getChatMessages(userId: string): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessagesTable)
      .where(eq(chatMessagesTable.userId, userId))
      .orderBy(desc(chatMessagesTable.timestamp));
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [row] = await db.insert(chatMessagesTable).values(message).returning();
    return row;
  }

  async getNetworkStatus(location?: string): Promise<NetworkStatus[]> {
    if (!location) {
      return await db.select().from(networkStatusTable);
    }
    // basic contains: use ilike when available; neon-http supports sql template, but keep simple
    const all = await db.select().from(networkStatusTable);
    return all.filter((s: NetworkStatus) => s.location.toLowerCase().includes(location.toLowerCase()));
  }

  async createNetworkStatus(status: InsertNetworkStatus): Promise<NetworkStatus> {
    const [row] = await db.insert(networkStatusTable).values(status).returning();
    return row;
  }

  async updateNetworkStatus(operator: string, location: string, updates: Partial<InsertNetworkStatus>): Promise<NetworkStatus | undefined> {
    const [row] = await db
      .update(networkStatusTable)
      .set(updates)
      .where(and(eq(networkStatusTable.operator, operator), eq(networkStatusTable.location, location)))
      .returning();
    return row;
  }

  async getSocialMediaInsights(location?: string, limit = 10): Promise<SocialMediaInsight[]> {
    let query = db.select().from(socialMediaInsightsTable).orderBy(desc(socialMediaInsightsTable.timestamp)).limit(limit);
    const rows = await query;
    if (!location) return rows;
    return rows.filter((r: SocialMediaInsight) => !r.location || r.location.toLowerCase().includes(location.toLowerCase()));
  }

  async createSocialMediaInsight(insight: InsertSocialMediaInsight): Promise<SocialMediaInsight> {
    const [row] = await db.insert(socialMediaInsightsTable).values(insight).returning();
    return row;
  }

  async getActiveEmergencyAlerts(location?: string): Promise<EmergencyAlert[]> {
    const rows: EmergencyAlert[] = await db
      .select()
      .from(emergencyAlertsTable)
      .where(eq(emergencyAlertsTable.isActive, true))
      .orderBy(desc(emergencyAlertsTable.createdAt));
    if (!location) return rows;
    return rows.filter((a: EmergencyAlert) => a.location.toLowerCase().includes(location.toLowerCase()));
  }

  async createEmergencyAlert(alert: InsertEmergencyAlert): Promise<EmergencyAlert> {
    const [row] = await db.insert(emergencyAlertsTable).values(alert).returning();
    return row;
  }

  async deactivateEmergencyAlert(id: string): Promise<boolean> {
    const [row] = await db
      .update(emergencyAlertsTable)
      .set({ isActive: false })
      .where(eq(emergencyAlertsTable.id, id))
      .returning();
    return !!row;
  }
}

// Dynamic storage selection
function getStorage(): IStorage {
  if (db) {
    console.log("🔧 Storage seçimi: DrizzleStorage (PostgreSQL)");
    return new DrizzleStorage();
  } else {
    console.log("🔧 Storage seçimi: MemStorage (Bellek)");
    return new MemStorage();
  }
}

// Create a storage factory that checks db availability
function createStorage(): IStorage {
  // Geçici olarak sadece MemStorage kullan
  console.log("🔧 Storage seçimi: MemStorage (Bellek)");
  return new MemStorage();
}

// Create storage instance
export const storage: IStorage = createStorage();

// Update storage when db becomes available
// Geçici olarak devre dışı
/*
if (process.env.DATABASE_URL) {
  import("./db.js").then(({ db: database }) => {
    db = database;
    console.log("✅ PostgreSQL bağlantısı başarılı");
    // Update storage to use DrizzleStorage
    const newStorage = new DrizzleStorage();
    Object.setPrototypeOf(storage, newStorage);
    Object.assign(storage, newStorage);
    console.log("🔄 Storage DrizzleStorage'a güncellendi");
  }).catch((e) => {
    console.error("❌ Database import hatası:", e);
  });
}
*/

// Debug: DATABASE_URL durumu
console.log("🔧 DATABASE_URL:", process.env.DATABASE_URL ? "Tanımlı" : "Tanımlı değil");
