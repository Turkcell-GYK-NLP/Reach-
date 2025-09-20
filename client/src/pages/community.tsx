import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Users, 
  MessageCircle, 
  Heart, 
  Share2, 
  Search,
  Filter,
  MapPin,
  Clock,
  User,
  AlertTriangle,
  Shield
} from "lucide-react";

export default function CommunityPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");

  const mockPosts = [
    {
      id: "1",
      author: {
        name: "Ayşe Yılmaz",
        avatar: "AY",
        location: "Esenler, İstanbul",
        verified: true
      },
      content: "Esenler'deki toplanma alanları güncel mi? Deprem sonrası güncelleme yapıldı mı?",
      timestamp: "2 saat önce",
      likes: 23,
      comments: 8,
      shares: 3,
      category: "safety",
      tags: ["toplanma-alanı", "esenler", "deprem"]
    },
    {
      id: "2",
      author: {
        name: "Mehmet Kaya",
        avatar: "MK",
        location: "Kadıköy, İstanbul",
        verified: false
      },
      content: "Acil durum çantası hazırlarken hangi malzemeleri unutmamalıyız? Deneyimli arkadaşlar önerilerini paylaşabilir mi?",
      timestamp: "4 saat önce",
      likes: 45,
      comments: 12,
      shares: 7,
      category: "preparation",
      tags: ["acil-çanta", "hazırlık", "malzeme"]
    },
    {
      id: "3",
      author: {
        name: "Dr. Ali Demir",
        avatar: "AD",
        location: "Beşiktaş, İstanbul",
        verified: true
      },
      content: "Deprem sırasında yapılması gerekenler hakkında bilgi paylaşmak istiyorum. İlk yardım konusunda sorularınızı yanıtlayabilirim.",
      timestamp: "6 saat önce",
      likes: 67,
      comments: 15,
      shares: 12,
      category: "education",
      tags: ["deprem", "ilk-yardım", "bilgi"]
    },
    {
      id: "4",
      author: {
        name: "Fatma Özkan",
        avatar: "FÖ",
        location: "Üsküdar, İstanbul",
        verified: false
      },
      content: "Çocuklarla deprem tatbikatı yaptık. Onlara nasıl anlattığınızı merak ediyorum. Deneyimlerinizi paylaşır mısınız?",
      timestamp: "1 gün önce",
      likes: 34,
      comments: 9,
      shares: 5,
      category: "family",
      tags: ["çocuk", "tatbikat", "eğitim"]
    }
  ];

  const categories = [
    { value: "all", label: "Tümü", count: 1247 },
    { value: "safety", label: "Güvenlik", count: 456 },
    { value: "preparation", label: "Hazırlık", count: 234 },
    { value: "education", label: "Eğitim", count: 189 },
    { value: "family", label: "Aile", count: 156 },
    { value: "emergency", label: "Acil Durum", count: 98 }
  ];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "safety": return "bg-green-100 text-green-800";
      case "preparation": return "bg-blue-100 text-blue-800";
      case "education": return "bg-purple-100 text-purple-800";
      case "family": return "bg-pink-100 text-pink-800";
      case "emergency": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "safety": return <Shield className="w-4 h-4" />;
      case "preparation": return <AlertTriangle className="w-4 h-4" />;
      case "education": return <MessageCircle className="w-4 h-4" />;
      case "family": return <Users className="w-4 h-4" />;
      case "emergency": return <AlertTriangle className="w-4 h-4" />;
      default: return <MessageCircle className="w-4 h-4" />;
    }
  };

  const filteredPosts = mockPosts.filter(post => {
    const matchesSearch = post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.author.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === "all" || post.category === selectedFilter;
    return matchesSearch && matchesFilter;
  });

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
                  <Users className="text-white" size={20} />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-800">Topluluk</h1>
                  <p className="text-xs text-gray-500">Kullanıcı topluluğu</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm">
                <MessageCircle className="w-4 h-4 mr-2" />
                Yeni Gönderi
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
                  placeholder="Toplulukta ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto">
                {categories.map((category) => (
                  <Button
                    key={category.value}
                    variant={selectedFilter === category.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedFilter(category.value)}
                    className="whitespace-nowrap"
                  >
                    {category.label} ({category.count})
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Community Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Toplam Üye</p>
                  <p className="text-2xl font-bold text-gray-900">2,847</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Aktif Gönderi</p>
                  <p className="text-2xl font-bold text-gray-900">1,247</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Bugünkü Mesaj</p>
                  <p className="text-2xl font-bold text-gray-900">89</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Çevrimiçi</p>
                  <p className="text-2xl font-bold text-gray-900">156</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <User className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Posts */}
        <div className="space-y-6">
          {filteredPosts.map((post) => (
            <Card key={post.id}>
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-700 rounded-full flex items-center justify-center text-white font-semibold">
                    {post.author.avatar}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900">{post.author.name}</h3>
                      {post.author.verified && (
                        <Badge className="bg-blue-100 text-blue-800 text-xs">
                          ✓ Doğrulanmış
                        </Badge>
                      )}
                      <span className="text-sm text-gray-500">•</span>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <MapPin className="w-3 h-3" />
                        {post.author.location}
                      </div>
                      <span className="text-sm text-gray-500">•</span>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Clock className="w-3 h-3" />
                        {post.timestamp}
                      </div>
                    </div>
                    
                    <p className="text-gray-800 mb-4 leading-relaxed">{post.content}</p>
                    
                    <div className="flex items-center gap-4 mb-4">
                      <Badge className={`${getCategoryColor(post.category)} flex items-center gap-1`}>
                        {getCategoryIcon(post.category)}
                        {categories.find(c => c.value === post.category)?.label}
                      </Badge>
                      <div className="flex flex-wrap gap-1">
                        {post.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <Button variant="ghost" size="sm" className="text-gray-500 hover:text-red-500">
                        <Heart className="w-4 h-4 mr-1" />
                        {post.likes}
                      </Button>
                      <Button variant="ghost" size="sm" className="text-gray-500 hover:text-blue-500">
                        <MessageCircle className="w-4 h-4 mr-1" />
                        {post.comments}
                      </Button>
                      <Button variant="ghost" size="sm" className="text-gray-500 hover:text-green-500">
                        <Share2 className="w-4 h-4 mr-1" />
                        {post.shares}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredPosts.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Gönderi bulunamadı</h3>
              <p className="text-gray-600 mb-4">
                Arama kriterlerinize uygun gönderi bulunamadı.
              </p>
              <Button 
                onClick={() => {
                  setSearchQuery("");
                  setSelectedFilter("all");
                }}
                variant="outline"
              >
                Filtreleri Temizle
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
