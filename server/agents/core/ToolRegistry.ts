import { Tool } from '../types.js';
import { LocationTool } from '../tools/locationTool.js';
import { NetworkTool } from '../tools/networkTool.js';
import { SocialMediaTool } from '../tools/socialMediaTool.js';
import { EmergencyTool } from '../tools/emergencyTool.js';
import { NotificationTool } from '../tools/notificationTool.js';
import { WebSearchTool } from '../tools/webSearchTool.js';
import { RecommendationTool } from '../tools/recommendationTool.js';
import { IlkyardimTool } from '../tools/ilkyardimTool.js';
import { PopulationAnalysisTool } from '../tools/populationAnalysisTool.js';

export class ToolRegistry {
  private tools: Map<string, Tool>;

  constructor(tools?: Tool[]) {
    this.tools = new Map();
    
    if (tools) {
      tools.forEach(tool => this.registerTool(tool));
    }
  }

  /**
   * Register a tool
   */
  registerTool(tool: Tool): void {
    this.tools.set(tool.name, tool);
    console.log(`🔧 Tool registered: ${tool.name}`);
  }

  /**
   * Unregister a tool
   */
  unregisterTool(toolName: string): boolean {
    const removed = this.tools.delete(toolName);
    if (removed) {
      console.log(`🗑️ Tool unregistered: ${toolName}`);
    }
    return removed;
  }

  /**
   * Get a tool by name
   */
  getTool(toolName: string): Tool | undefined {
    return this.tools.get(toolName);
  }

  /**
   * Get all registered tools
   */
  getAllTools(): Tool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get all tool names
   */
  getToolNames(): string[] {
    return Array.from(this.tools.keys());
  }

  /**
   * Check if a tool is registered
   */
  hasTool(toolName: string): boolean {
    return this.tools.has(toolName);
  }

  /**
   * Get tool count
   */
  getToolCount(): number {
    return this.tools.size;
  }

  /**
   * Clear all tools
   */
  clearAll(): void {
    this.tools.clear();
    console.log('🗑️ All tools cleared');
  }

  /**
   * Create default tool registry with all standard tools
   */
  static createDefault(): ToolRegistry {
    const tools = [
      new LocationTool(),
      new NetworkTool(),
      new SocialMediaTool(),
      new EmergencyTool(),
      new NotificationTool(),
      new WebSearchTool(),
      new RecommendationTool(),
      new IlkyardimTool(),
      new PopulationAnalysisTool()
    ];

    const registry = new ToolRegistry(tools);
    console.log(`✅ Default tool registry created with ${registry.getToolCount()} tools`);
    return registry;
  }

  /**
   * Get tools by category
   */
  getToolsByCategory(category: string): Tool[] {
    // This could be extended to filter tools by category if Tool interface has category
    return this.getAllTools();
  }

  /**
   * Get tool statistics
   */
  getStatistics(): {
    totalTools: number;
    toolNames: string[];
  } {
    return {
      totalTools: this.getToolCount(),
      toolNames: this.getToolNames()
    };
  }
}

