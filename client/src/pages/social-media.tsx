import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Menu, 
  Search, 
  TrendingUp, 
  Users, 
  MessageCircle, 
  Heart, 
  Share2, 
  BarChart3,
  Calendar,
  Filter,
  Download,
  MapPin
} from "lucide-react";
import { api } from "@/lib/api";
import { DateRange } from "react-day-picker";
import TweetDensityMap from "@/components/TweetDensityMap";
import TrendingTopicsMap from "@/components/TrendingTopicsMap";
import OperatorInsights from "@/components/OperatorInsights";
import HamburgerMenu from "@/components/HamburgerMenu";

export default function SocialMediaPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTimeframe, setSelectedTimeframe] = useState<"all" | "7d" | "1m" | "1y">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tweets, setTweets] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<{ totalPosts: number; sentimentShare: { positive: number; neutral: number; negative: number }; trendingTopics: Array<{ topic: string; count: number; sentiment: number }>; } | null>(null);
  const [visibleCount, setVisibleCount] = useState<number>(5);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const timeframeParam = selectedTimeframe === "all" ? undefined : selectedTimeframe;
        const startDate = dateRange?.from ? dateRange.from.toISOString().slice(0, 10) : undefined;
        const endDate = dateRange?.to ? dateRange.to.toISOString().slice(0, 10) : undefined;
        const [tw, an] = await Promise.all([
          api.getTweets({ limit: 100, timeframe: timeframeParam, startDate, endDate, q: searchQuery }),
          api.getTweetAnalytics(timeframeParam, { startDate, endDate }),
        ]);
        if (cancelled) return;
        setTweets(tw?.data || []);
        setAnalytics(an?.data || null);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message || "Veriler yüklenemedi");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [selectedTimeframe, searchQuery, dateRange?.from, dateRange?.to]);

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive": return "text-green-600 bg-green-100";
      case "negative": return "text-red-600 bg-red-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const getSentimentText = (sentiment: string) => {
    switch (sentiment) {
      case "positive": return "Pozitif";
      case "negative": return "Negatif";
      default: return "Nötr";
    }
  };

  const handleNavigate = (path: string) => {
    window.location.href = path;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMenuOpen(true)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <Menu className="w-5 h-5" />
              </Button>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-700 rounded-xl flex items-center justify-center">
                  <BarChart3 className="text-white" size={20} />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-800">Sosyal Medya Analizi</h1>
                  <p className="text-xs text-gray-500">Twitter ve sosyal medya analizi</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Sosyal medyada ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2 items-center flex-wrap">
                <Button
                  variant={selectedTimeframe === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTimeframe("all")}
                >
                  Tümü
                </Button>
                <Button
                  variant={selectedTimeframe === "7d" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTimeframe("7d")}
                >
                  Son 7 Gün
                </Button>
                <Button
                  variant={selectedTimeframe === "1m" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTimeframe("1m")}
                >
                  Son 1 Ay
                </Button>
                <Button
                  variant={selectedTimeframe === "1y" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTimeframe("1y")}
                >
                  Son 1 Yıl
                </Button>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">Tarih Aralığı:</span>
                  {/* Basit iki input ile (takvim yerine) tarih seçimi */}
                  <Input
                    type="date"
                    value={dateRange?.from ? dateRange.from.toISOString().slice(0,10) : ""}
                    onChange={(e) => {
                      const from = e.target.value ? new Date(e.target.value + "T00:00:00") : undefined;
                      setDateRange({ from, to: dateRange?.to });
                      setSelectedTimeframe("all");
                    }}
                    className="h-8"
                  />
                  <span className="text-xs text-gray-500">-</span>
                  <Input
                    type="date"
                    value={dateRange?.to ? dateRange.to.toISOString().slice(0,10) : ""}
                    onChange={(e) => {
                      const to = e.target.value ? new Date(e.target.value + "T00:00:00") : undefined;
                      setDateRange({ from: dateRange?.from, to });
                      setSelectedTimeframe("all");
                    }}
                    className="h-8"
                  />
                  { (dateRange?.from || dateRange?.to) && (
                    <Button variant="ghost" size="sm" onClick={() => setDateRange(undefined)}>Temizle</Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Maps Section */}
        <div className="space-y-8 mb-6">
          {/* Trending Topics Map */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Trend Konular Haritası
              </CardTitle>
              <p className="text-sm text-gray-600">
                İllere göre trend konular ve kategoriler
              </p>
            </CardHeader>
            <CardContent>
              <TrendingTopicsMap 
                timeframe={selectedTimeframe === "all" ? undefined : selectedTimeframe}
                startDate={dateRange?.from ? dateRange.from.toISOString().slice(0, 10) : undefined}
                endDate={dateRange?.to ? dateRange.to.toISOString().slice(0, 10) : undefined}
                className="h-96"
              />
            </CardContent>
          </Card>
        </div>

        {/* Operator Insights */}
        <div className="mb-6">
          <OperatorInsights 
            timeframe={selectedTimeframe === "all" ? undefined : selectedTimeframe}
            startDate={dateRange?.from ? dateRange.from.toISOString().slice(0, 10) : undefined}
            endDate={dateRange?.to ? dateRange.to.toISOString().slice(0, 10) : undefined}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Trending Topics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Trend Konular
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(analytics?.trendingTopics || []).map((topic, index) => {
                  const percent = analytics && analytics.totalPosts
                    ? Math.round((topic.count / Math.max(analytics.totalPosts, 1)) * 100)
                    : 0;
                  return (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">#{topic.topic}</p>
                      <p className="text-sm text-gray-600">{topic.count} gönderi • %{percent}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`${percent >= 66 ? 'bg-green-100 text-green-800' : percent >= 33 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                        %{percent}
                      </Badge>
                    </div>
                  </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Recent Posts */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Son Gönderiler
                </CardTitle>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <span>Görünür:</span>
                  <Input
                    type="number"
                    min={3}
                    max={50}
                    value={visibleCount}
                    onChange={(e) => setVisibleCount(Math.max(3, Math.min(50, Number(e.target.value) || 7)))}
                    className="h-7 w-16"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 overflow-y-auto" style={{ maxHeight: `${visibleCount * 120}px` }}>
                {loading && <p className="text-sm text-gray-500">Yükleniyor…</p>}
                {error && <p className="text-sm text-red-600">{error}</p>}
                {!loading && !error && tweets.map((post: any) => (
                  <div key={post.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{post.author}</p>
                        <p className="text-xs text-gray-500">{post.timestampLabel}</p>
                      </div>
                      <Badge className={getSentimentColor(post.sentiment)}>
                        {getSentimentText(post.sentiment)}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-800 mb-3">{post.text}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      {post.il && <span>İl: {post.il}</span>}
                      {post.ilce && <span>İlçe: {post.ilce}</span>}
                      {post.disasterType && <span>Afet: {post.disasterType}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Hamburger Menu */}
      <HamburgerMenu 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)}
        onNavigate={handleNavigate}
      />
    </div>
  );
}
