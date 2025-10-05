import { tweetDataService } from "../tweetDataService";

export class TweetService {
  /**
   * Normalize timeframe string
   */
  private normalizeTimeframe(tf?: string): "7d" | "1m" | "1y" | undefined {
    if (!tf) return undefined;
    const v = String(tf).trim().toLowerCase();
    if (v === '7d' || v === '7g' || v === '1w' || v === '7gun' || v === 'son7gun') return '7d';
    if (v === '1m' || v === '30d' || v === '30g' || v === '1ay' || v === 'son1ay' || v === '30gun') return '1m';
    if (v === '1y' || v === '12m' || v === '365d' || v === '1yil' || v === 'son1yil') return '1y';
    return undefined;
  }

  /**
   * Get recent tweets with filters
   */
  async getTweets(params: {
    limit?: number;
    timeframe?: string;
    startDate?: string;
    endDate?: string;
    query?: string;
    il?: string;
    ilce?: string;
  }): Promise<{
    success: boolean;
    count: number;
    data: any[];
  }> {
    await tweetDataService.ensureLoaded();

    const limit = Math.min(params.limit || 20, 200);
    const timeframe = this.normalizeTimeframe(params.timeframe);

    // Get tweets
    let list = tweetDataService.getRecent(10000, timeframe, params.startDate, params.endDate);

    // Apply filters
    if (params.il) {
      list = list.filter(t => (t.il || '').toLowerCase() === params.il!.toLowerCase());
    }
    if (params.ilce) {
      list = list.filter(t => (t.ilce || '').toLowerCase() === params.ilce!.toLowerCase());
    }
    if (params.query) {
      const ql = params.query.toLowerCase();
      list = list.filter(t =>
        t.text.toLowerCase().includes(ql) ||
        (t.author || '').toLowerCase().includes(ql) ||
        (t.helpTopic || '').toLowerCase().includes(ql)
      );
    }

    return {
      success: true,
      count: Math.min(limit, list.length),
      data: list.slice(0, limit),
    };
  }

  /**
   * Get tweet analytics
   */
  async getAnalytics(params: {
    timeframe?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{
    success: boolean;
    data: any;
  }> {
    await tweetDataService.ensureLoaded();

    const timeframe = this.normalizeTimeframe(params.timeframe);
    const analytics = tweetDataService.getAnalytics(timeframe, params.startDate, params.endDate);

    return {
      success: true,
      data: analytics,
    };
  }

  /**
   * Get tweet density by city
   */
  async getTweetDensity(params: {
    timeframe?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{
    success: boolean;
    data: any;
  }> {
    await tweetDataService.ensureLoaded();

    const timeframe = this.normalizeTimeframe(params.timeframe);
    const density = tweetDataService.getTweetDensityByCity(timeframe, params.startDate, params.endDate);

    return {
      success: true,
      data: density,
    };
  }

  /**
   * Get trending topics by region
   */
  async getTrendingTopics(params: {
    timeframe?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{
    success: boolean;
    data: any;
  }> {
    await tweetDataService.ensureLoaded();

    const timeframe = this.normalizeTimeframe(params.timeframe);
    const trendingTopics = tweetDataService.getTrendingTopicsByRegion(timeframe, params.startDate, params.endDate);

    return {
      success: true,
      data: trendingTopics,
    };
  }
}

// Export singleton instance
export const tweetService = new TweetService();

