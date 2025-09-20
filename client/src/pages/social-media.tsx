import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Search, 
  TrendingUp, 
  Users, 
  MessageCircle, 
  Heart, 
  Share2, 
  BarChart3,
  Calendar,
  Filter,
  Download
} from "lucide-react";

export default function SocialMediaPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTimeframe, setSelectedTimeframe] = useState("24h");

  const mockData = {
    totalPosts: 1247,
    engagement: 89.2,
    sentiment: 76.5,
    trendingTopics: [
      { topic: "Acil Durum", posts: 234, sentiment: 85 },
      { topic: "Güvenlik", posts: 189, sentiment: 78 },
      { topic: "Toplanma Alanları", posts: 156, sentiment: 82 },
      { topic: "Haberler", posts: 143, sentiment: 65 },
      { topic: "Yardım", posts: 98, sentiment: 91 }
    ],
    recentPosts: [
      {
        id: 1,
        content: "Esenler'de acil durum toplanma alanları güncel mi? #acildurum #esenler",
        author: "@kullanici1",
        timestamp: "2 saat önce",
        likes: 23,
        retweets: 8,
        sentiment: "positive"
      },
      {
        id: 2,
        content: "Güvenli alanlar hakkında bilgi almak istiyorum. Nerede bulabilirim?",
        author: "@kullanici2",
        timestamp: "4 saat önce",
        likes: 15,
        retweets: 3,
        sentiment: "neutral"
      },
      {
        id: 3,
        content: "Deprem sonrası toplanma alanları çok işe yaradı. Teşekkürler! 🙏",
        author: "@kullanici3",
        timestamp: "6 saat önce",
        likes: 45,
        retweets: 12,
        sentiment: "positive"
      }
    ]
  };

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
                onClick={() => window.history.back()}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
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
            
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Rapor İndir
              </Button>
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
              <div className="flex gap-2">
                <Button
                  variant={selectedTimeframe === "24h" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTimeframe("24h")}
                >
                  24 Saat
                </Button>
                <Button
                  variant={selectedTimeframe === "7d" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTimeframe("7d")}
                >
                  7 Gün
                </Button>
                <Button
                  variant={selectedTimeframe === "30d" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTimeframe("30d")}
                >
                  30 Gün
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Toplam Gönderi</p>
                  <p className="text-2xl font-bold text-gray-900">{mockData.totalPosts.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Etkileşim Oranı</p>
                  <p className="text-2xl font-bold text-gray-900">%{mockData.engagement}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pozitif Duygu</p>
                  <p className="text-2xl font-bold text-gray-900">%{mockData.sentiment}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Heart className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Aktif Kullanıcı</p>
                  <p className="text-2xl font-bold text-gray-900">1,234</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
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
                {mockData.trendingTopics.map((topic, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">#{topic.topic}</p>
                      <p className="text-sm text-gray-600">{topic.posts} gönderi</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`${topic.sentiment > 80 ? 'bg-green-100 text-green-800' : topic.sentiment > 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                        %{topic.sentiment}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Posts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Son Gönderiler
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockData.recentPosts.map((post) => (
                  <div key={post.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{post.author}</p>
                        <p className="text-xs text-gray-500">{post.timestamp}</p>
                      </div>
                      <Badge className={getSentimentColor(post.sentiment)}>
                        {getSentimentText(post.sentiment)}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-800 mb-3">{post.content}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Heart className="w-3 h-3" />
                        {post.likes}
                      </div>
                      <div className="flex items-center gap-1">
                        <Share2 className="w-3 h-3" />
                        {post.retweets}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
