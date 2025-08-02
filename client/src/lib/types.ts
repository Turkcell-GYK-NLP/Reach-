export interface User {
  id: string;
  name: string;
  age?: number;
  location?: string;
  operator?: string;
  preferences?: any;
  notificationsEnabled?: boolean;
  createdAt?: Date;
}

export interface ChatMessage {
  id: string;
  userId?: string;
  message: string;
  response?: string;
  timestamp?: Date;
  metadata?: {
    type?: "user" | "bot";
    suggestions?: string[];
    actionItems?: ActionItem[];
  };
}

export interface ActionItem {
  type: "location" | "network" | "emergency" | "general";
  title: string;
  data: any;
}

export interface NetworkStatus {
  id: string;
  operator: string;
  location: string;
  coverage: number;
  signalStrength?: number;
  lastUpdated?: Date;
}

export interface SocialMediaInsight {
  id: string;
  keyword: string;
  sentiment: "positive" | "negative" | "neutral";
  count: number;
  category: string;
  location?: string;
  timestamp?: Date;
}

export interface EmergencyAlert {
  id: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  location: string;
  isActive?: boolean;
  createdAt?: Date;
  expiresAt?: Date;
}

export interface SafeArea {
  name: string;
  distance: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  capacity: number;
  facilities: string[];
}

export interface NetworkRecommendation {
  bestOperator: string;
  coverage: number;
  reason: string;
}

export interface ChatRequest {
  userId: string;
  message: string;
  userContext?: {
    location?: string;
    operator?: string;
    age?: number;
  };
}
