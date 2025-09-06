import { Tool, ToolInput, ToolResult } from '../types.js';

export abstract class BaseTool implements Tool {
  abstract name: string;
  abstract description: string;

  abstract execute(input: ToolInput): Promise<ToolResult | null>;

  protected createResult(
    type: string,
    data: any,
    confidence: number,
    source: string = this.name
  ): ToolResult {
    return {
      type,
      data,
      confidence,
      timestamp: new Date(),
      source
    };
  }

  protected shouldExecute(query: string, keywords: string[]): boolean {
    const lowerQuery = query.toLowerCase();
    return keywords.some(keyword => lowerQuery.includes(keyword.toLowerCase()));
  }
}
