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
  // Auth
  register: async (data: { name: string; email: string; password: string; age?: number; location?: string; operator?: string; }) => {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.error || "Failed to register");
    }
    return response.json();
  },
  login: async (data: { email: string; password: string }) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.error || "Failed to login");
    }
    return response.json();
  },
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

  clearChat: async (userId: string) => {
    const response = await fetch(`/api/chat/${userId}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error("Failed to clear chat");
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

  // Tweets (Excel-backed)
  getTweets: async (params?: { limit?: number; timeframe?: "7d" | "1m" | "1y"; startDate?: string; endDate?: string; q?: string; il?: string; ilce?: string }) => {
    const search = new URLSearchParams();
    if (params?.limit) search.append("limit", String(params.limit));
    if (params?.timeframe) search.append("timeframe", params.timeframe);
    if (params?.startDate) search.append("startDate", params.startDate);
    if (params?.endDate) search.append("endDate", params.endDate);
    if (params?.q) search.append("q", params.q);
    if (params?.il) search.append("il", params.il);
    if (params?.ilce) search.append("ilce", params.ilce);
    const response = await fetch(`/api/tweets?${search.toString()}`);
    if (!response.ok) {
      throw new Error("Failed to get tweets");
    }
    return response.json();
  },

  getTweetAnalytics: async (timeframe?: "7d" | "1m" | "1y", opts?: { startDate?: string; endDate?: string }) => {
    const search = new URLSearchParams();
    if (timeframe) search.append("timeframe", timeframe);
    if (opts?.startDate) search.append("startDate", opts.startDate);
    if (opts?.endDate) search.append("endDate", opts.endDate);
    const response = await fetch(`/api/tweets/analytics?${search.toString()}`);
    if (!response.ok) {
      throw new Error("Failed to get tweet analytics");
    }
    return response.json();
  },

  getTweetDensity: async (timeframe?: "7d" | "1m" | "1y", opts?: { startDate?: string; endDate?: string }) => {
    const search = new URLSearchParams();
    if (timeframe) search.append("timeframe", timeframe);
    if (opts?.startDate) search.append("startDate", opts.startDate);
    if (opts?.endDate) search.append("endDate", opts.endDate);
    const response = await fetch(`/api/tweets/density?${search.toString()}`);
    if (!response.ok) {
      throw new Error("Failed to get tweet density");
    }
    return response.json();
  },

  getTrendingTopics: async (timeframe?: "7d" | "1m" | "1y", opts?: { startDate?: string; endDate?: string }) => {
    const search = new URLSearchParams();
    if (timeframe) search.append("timeframe", timeframe);
    if (opts?.startDate) search.append("startDate", opts.startDate);
    if (opts?.endDate) search.append("endDate", opts.endDate);
    const response = await fetch(`/api/tweets/trending-topics?${search.toString()}`);
    if (!response.ok) {
      throw new Error("Failed to get trending topics");
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

  // Emergency Location Send
  sendEmergencyLocation: async (locationData: { latitude: number; longitude: number; address?: string; city?: string; district?: string }) => {
    const response = await fetch("/api/emergency/send-location", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(locationData),
    });
    
    if (!response.ok) {
      throw new Error("Failed to send emergency location");
    }
    
    return response.json();
  },

  // Hospitals
  getHospitals: async (district?: string) => {
    const url = district ? `/api/hospitals?district=${encodeURIComponent(district)}` : "/api/hospitals";
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error("Failed to get hospitals");
    }
    
    return response.json();
  },


  getDistricts: async () => {
    const response = await fetch("/api/hospitals/districts");
    
    if (!response.ok) {
      throw new Error("Failed to get districts");
    }
    
    return response.json();
  },
};
