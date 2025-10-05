import type { Express } from "express";
import { storage } from "../storage";
import { tweetDataService } from "../services/tweetDataService";

export function registerTweetRoutes(app: Express): void {
  // Helper function to normalize timeframe
  function normalizeTimeframe(tf?: string): "7d" | "1m" | "1y" | undefined {
    if (!tf) return undefined;
    const v = String(tf).trim().toLowerCase();
    if (v === '7d' || v === '7g' || v === '1w' || v === '7gun' || v === 'son7gun') return '7d';
    if (v === '1m' || v === '30d' || v === '30g' || v === '1ay' || v === 'son1ay' || v === '30gun') return '1m';
    if (v === '1y' || v === '12m' || v === '365d' || v === '1yil' || v === 'son1yil') return '1y';
    return undefined;
  }

  // Get social media insights
  app.get("/api/insights", async (req, res) => {
    try {
      const location = req.query.location as string;
      const limit = parseInt(req.query.limit as string) || 10;
      const insights = await storage.getSocialMediaInsights(location, limit);
      res.json(insights);
    } catch (error) {
      res.status(500).json({ error: "Failed to get social media insights", details: error });
    }
  });

  // Get tweets from Excel (recent)
  app.get("/api/tweets", async (req, res) => {
    try {
      const limit = Math.min(parseInt(String(req.query.limit || '20')), 200) || 20;
      const rawTimeframe = (req.query.timeframe as string) || undefined;
      const timeframe = normalizeTimeframe(rawTimeframe);
      const startDateStr = (req.query.startDate as string) || undefined;
      const endDateStr = (req.query.endDate as string) || undefined;
      const q = (req.query.q as string) || '';
      const il = (req.query.il as string) || '';
      const ilce = (req.query.ilce as string) || '';

      await tweetDataService.ensureLoaded();
      let list = tweetDataService.getRecent(10000, timeframe, startDateStr, endDateStr);

      if (il) list = list.filter(t => (t.il || '').toLowerCase() === il.toLowerCase());
      if (ilce) list = list.filter(t => (t.ilce || '').toLowerCase() === ilce.toLowerCase());
      if (q) {
        const ql = q.toLowerCase();
        list = list.filter(t =>
          t.text.toLowerCase().includes(ql) ||
          (t.author || '').toLowerCase().includes(ql) ||
          (t.helpTopic || '').toLowerCase().includes(ql)
        );
      }

      res.json({
        success: true,
        count: Math.min(limit, list.length),
        data: list.slice(0, limit),
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get tweets", details: String(error) });
    }
  });

  // Get tweets analytics
  app.get("/api/tweets/analytics", async (req, res) => {
    try {
      const timeframe = normalizeTimeframe((req.query.timeframe as string) || undefined);
      const startDateStr = (req.query.startDate as string) || undefined;
      const endDateStr = (req.query.endDate as string) || undefined;
      await tweetDataService.ensureLoaded();
      const analytics = tweetDataService.getAnalytics(timeframe, startDateStr, endDateStr);
      res.json({ success: true, data: analytics });
    } catch (error) {
      res.status(500).json({ error: "Failed to get tweets analytics", details: String(error) });
    }
  });

  // Get tweet density by city for map visualization
  app.get("/api/tweets/density", async (req, res) => {
    try {
      const timeframe = normalizeTimeframe((req.query.timeframe as string) || undefined);
      const startDateStr = (req.query.startDate as string) || undefined;
      const endDateStr = (req.query.endDate as string) || undefined;
      await tweetDataService.ensureLoaded();
      const density = tweetDataService.getTweetDensityByCity(timeframe, startDateStr, endDateStr);
      res.json({ success: true, data: density });
    } catch (error) {
      res.status(500).json({ error: "Failed to get tweet density", details: String(error) });
    }
  });

  // Get trending topics by region for map visualization
  app.get("/api/tweets/trending-topics", async (req, res) => {
    try {
      const timeframe = normalizeTimeframe((req.query.timeframe as string) || undefined);
      const startDateStr = (req.query.startDate as string) || undefined;
      const endDateStr = (req.query.endDate as string) || undefined;
      await tweetDataService.ensureLoaded();
      const trendingTopics = tweetDataService.getTrendingTopicsByRegion(timeframe, startDateStr, endDateStr);
      res.json({ success: true, data: trendingTopics });
    } catch (error) {
      res.status(500).json({ error: "Failed to get trending topics", details: String(error) });
    }
  });
}

