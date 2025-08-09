import { queryClient } from "./queryClient";

export interface ChatRequest {
  userId: string;
  message: string;
  userContext?: {
    location?: string;
    operator?: string;
    age?: number;
  };
}

export interface ChatResponse {
  userMessage: any;
  botMessage: any;
  aiResponse: {
    message: string;
    suggestions?: string[];
    actionItems?: any[];
  };
}

export const api = {
  // Chat
  sendMessage: async (data: ChatRequest): Promise<ChatResponse> => {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error("Failed to send message");
    }
    
    return response.json();
  },

  getChatHistory: async (userId: string) => {
    const response = await fetch(`/api/chat/${userId}`);
    if (!response.ok) {
      throw new Error("Failed to get chat history");
    }
    return response.json();
  },

  // User
  createUser: async (userData: any) => {
    const response = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });
    
    if (!response.ok) {
      throw new Error("Failed to create user");
    }
    
    return response.json();
  },

  updateUser: async (userId: string, updates: any) => {
    const response = await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    
    if (!response.ok) {
      throw new Error("Failed to update user");
    }
    
    return response.json();
  },

  // Network
  getNetworkStatus: async (location?: string) => {
    const url = location ? `/api/network-status?location=${encodeURIComponent(location)}` : "/api/network-status";
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error("Failed to get network status");
    }
    
    return response.json();
  },

  getNetworkRecommendation: async (location: string) => {
    const response = await fetch(`/api/network-recommendation/${encodeURIComponent(location)}`);
    
    if (!response.ok) {
      throw new Error("Failed to get network recommendation");
    }
    
    return response.json();
  },

  // Insights
  getSocialMediaInsights: async (location?: string, limit = 10) => {
    const params = new URLSearchParams();
    if (location) params.append("location", location);
    params.append("limit", limit.toString());
    
    const response = await fetch(`/api/insights?${params}`);
    
    if (!response.ok) {
      throw new Error("Failed to get social media insights");
    }
    
    return response.json();
  },

  // Emergency
  getEmergencyAlerts: async (location?: string) => {
    const url = location ? `/api/emergency-alerts?location=${encodeURIComponent(location)}` : "/api/emergency-alerts";
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error("Failed to get emergency alerts");
    }
    
    return response.json();
  },

  // Location
  getCurrentLocation: async () => {
    const response = await fetch("/api/location/current");
    
    if (!response.ok) {
      throw new Error("Failed to get current location");
    }
    
    return response.json();
  },

  getLocationByCoordinates: async (lat: number, lng: number) => {
    const response = await fetch(`/api/location/by-coordinates?lat=${lat}&lng=${lng}`);
    
    if (!response.ok) {
      throw new Error("Failed to get location by coordinates");
    }
    
    return response.json();
  },

  getNearestSafeArea: async () => {
    const response = await fetch("/api/location/nearest-safe-area");
    
    if (!response.ok) {
      throw new Error("Failed to get nearest safe area");
    }
    
    return response.json();
  },

  getSafeAreas: async (location: string) => {
    const response = await fetch(`/api/safe-areas/${encodeURIComponent(location)}`);
    
    if (!response.ok) {
      throw new Error("Failed to get safe areas");
    }
    
    return response.json();
  },
};
