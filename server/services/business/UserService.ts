import { storage } from "../../storage";
import { hashPassword, verifyPassword, signToken } from "../../utils/auth";
import { type InsertUser, type User } from "@shared/schema";

export class UserService {
  /**
   * Register a new user
   */
  async register(data: {
    name: string;
    email: string;
    password: string;
    age?: number;
    location?: string;
    operator?: string;
  }): Promise<{ user: any; token: string }> {
    const { name, email, password, age, location, operator } = data;

    // Validate required fields
    if (!name || !email || !password) {
      throw new Error("NAME_EMAIL_PASSWORD_REQUIRED");
    }

    // Check if user already exists
    const existing = await storage.getUserByEmail(email.toLowerCase());
    if (existing) {
      throw new Error("EMAIL_ALREADY_EXISTS");
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await storage.createUser({
      name,
      email: email.toLowerCase(),
      passwordHash,
      age,
      location,
      operator,
    } as any);

    // Generate token
    const token = signToken(
      { sub: user.id, email: email.toLowerCase() },
      process.env.AUTH_SECRET || "dev_secret",
      60 * 60 * 24 * 7 // 7 days
    );

    return {
      user: {
        id: user.id,
        name: user.name,
        email: (user as any).email,
      },
      token,
    };
  }

  /**
   * Login user
   */
  async login(email: string, password: string): Promise<{ user: any; token: string }> {
    // Validate inputs
    if (!email || !password) {
      throw new Error("EMAIL_PASSWORD_REQUIRED");
    }

    // Get user
    const user = await storage.getUserByEmail(email.toLowerCase());
    if (!user) {
      throw new Error("INVALID_CREDENTIALS");
    }

    // Verify password
    const ok = await verifyPassword(password, (user as any).passwordHash || "");
    if (!ok) {
      throw new Error("INVALID_CREDENTIALS");
    }

    // Generate token
    const token = signToken(
      { sub: user.id, email: email.toLowerCase() },
      process.env.AUTH_SECRET || "dev_secret",
      60 * 60 * 24 * 7 // 7 days
    );

    return {
      user: {
        id: user.id,
        name: user.name,
        email: (user as any).email,
      },
      token,
    };
  }

  /**
   * Get user by ID
   */
  async getUser(userId: string): Promise<User | undefined> {
    return storage.getUser(userId);
  }

  /**
   * Update user
   */
  async updateUser(userId: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    return storage.updateUser(userId, updates);
  }

  /**
   * Create user (admin)
   */
  async createUser(userData: InsertUser): Promise<User> {
    return storage.createUser(userData);
  }
}

// Export singleton instance
export const userService = new UserService();

