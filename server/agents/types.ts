// Agent System Types
export interface UserContext {
  userId: string;
  location?: {
    latitude: number;
    longitude: number;
    district: string;
    city: string;
  };
  operator?: string;
  age?: number;
  preferences?: Record<string, any>;
}

export interface ToolResult {
  type: string;
  data: any;
  confidence: number;
  timestamp: Date;
  source: string;
}

export interface Tool {
  name: string;
  description: string;
  execute(input: ToolInput): Promise<ToolResult | null>;
}

export interface ToolInput {
  query: string;
  userContext: UserContext;
  parameters?: Record<string, any>;
}

export interface AgentResponse {
  message: string;
  suggestions: string[];
  actionItems: ActionItem[];
  toolResults: ToolResult[];
  confidence: number;
  timestamp: Date;
}

export interface ActionItem {
  type: 'network' | 'location' | 'emergency' | 'social' | 'notification';
  title: string;
  data: Record<string, any>;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface MemoryContext {
  userId: string;
  recentQueries: string[];
  userPreferences: Record<string, any>;
  locationHistory: Array<{
    location: string;
    timestamp: Date;
  }>;
  conversationHistory: Array<{
    query: string;
    response: string;
    timestamp: Date;
  }>;
}

export interface SupervisorDecision {
  selectedAgents: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  reasoning: string;
  estimatedTime: number;
}
