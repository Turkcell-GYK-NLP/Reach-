import { useState } from "react";
import { useChat } from "@/hooks/useChat";
import { useLocation } from "@/hooks/useLocation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Send, Mic } from "lucide-react";
import { RecommendationEngine } from "./RecommendationEngine";

export default function ChatInterface() {
  const [inputMessage, setInputMessage] = useState("");
  const { location, error } = useLocation();
  const { messages, sendMessage, isTyping, isPending } = useChat();
  let isLoggedIn = false;
  try {
    const auth = JSON.parse(localStorage.getItem("auth") || "null");
    isLoggedIn = !!auth?.user?.id;
  } catch {}

  const handleSendMessage = (message?: string) => {
    const messageToSend = message || inputMessage;
    if (!messageToSend.trim() || isPending) return;

    const userContext = {
      location: {
        district: location?.district || (location?.city === "Esenler" ? "Esenler" : "Esenler"),
        city: location?.city || "İstanbul",
        neighborhood: location?.neighborhood || "Menderes",
        coordinates: location ? {
          lat: location.latitude,
          lng: location.longitude
        } : undefined
      },
      operator: "Turkcell", // This would come from user profile
      age: 22, // This would come from user profile
    };

    sendMessage(messageToSend, userContext);
    setInputMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleActionItemClick = (item: any) => {
    if (item.type === "transport" && item.data?.mapsUrl) {
      // Google Maps linkini yeni sekmede aç
      window.open(item.data.mapsUrl, '_blank');
    } else if (item.type === "location" && item.data?.coordinates) {
      // Koordinat varsa Google Maps linki oluştur ve aç
      const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${item.data.coordinates}&travelmode=walking`;
      window.open(mapsUrl, '_blank');
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-gray-100">
        <CardTitle>Soru Sor</CardTitle>
        <p className="text-sm text-gray-600">Doğal dilde sorularınızı yazabilirsiniz</p>
        {!isLoggedIn && (
          <div className="mt-2 text-xs text-red-600">
            Devam etmeden önce lütfen giriş yapın veya kayıt olun.
            <button className="ml-2 text-blue-600 underline" onClick={() => (window.location.href = "/auth")}>Giriş/Kayıt</button>
          </div>
        )}
        {location && (
          <div className="mt-2 text-xs text-gray-500">
            📍 Konum: {location.address || `${location.district || location.city}${location.country ? `, ${location.country}` : ""}`}
            <span className="ml-2">({location.latitude.toFixed(4)}, {location.longitude.toFixed(4)})</span>
          </div>
        )}
        {error && (
          <div className="mt-2 text-xs text-red-500">
            ⚠️ {error}
            <button 
              onClick={() => window.location.reload()} 
              className="ml-2 text-blue-500 hover:underline"
            >
              Tekrar Dene
            </button>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-0">
        {/* Chat Messages */}
        <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p>Merhaba! Size nasıl yardımcı olabilirim?</p>
              <p className="text-sm mt-2">Konum, operatör durumu veya güvenli alanlar hakkında soru sorabilirsiniz.</p>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-md rounded-lg px-4 py-2 ${
                  message.type === "user" 
                    ? "bg-trust text-white" 
                    : "bg-gray-100 text-dark"
                }`}>
                  <p className="text-sm">{message.content}</p>
                  
                  {/* Action Items */}
                  {message.actionItems && message.actionItems.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {message.actionItems.map((item, index) => (
                        <Badge 
                          key={index} 
                          variant="secondary" 
                          className="text-xs cursor-pointer hover:bg-gray-200 transition-colors"
                          onClick={() => handleActionItemClick(item)}
                        >
                          {item.title}
                        </Badge>
                      ))}
                    </div>
                  )}
                  

                  {/* RL Recommendation Engine */}
                  {message.toolResults && message.toolResults.find((result: any) => result.type === 'recommendation') && (
                    <div className="mt-3">
                      <RecommendationEngine
                        recommendationData={message.toolResults.find((result: any) => result.type === 'recommendation')?.data}
                        userId={isLoggedIn ? JSON.parse(localStorage.getItem("auth") || "{}").user?.id : "anonymous"}
                        userContext={{
                          location: {
                            district: location?.district || "Esenler",
                            city: location?.city || "İstanbul"
                          },
                          operator: "Turkcell",
                          age: 22
                        }}
                        onFeedback={(actionId, reward) => {
                          console.log(`RL Feedback: ${actionId} -> ${reward}`);
                        }}
                      />
                    </div>
                  )}

                  {/* Suggestions */}
                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {message.suggestions.map((suggestion, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          className="text-xs h-6 mr-1"
                          onClick={() => handleSendMessage(suggestion)}
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  )}

                  <span className="text-xs opacity-75 block mt-1">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
              </div>
            ))
          )}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg px-4 py-2 max-w-md">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Chat Input */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex space-x-3">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Sorunuzu buraya yazın..."
              className="flex-1"
              disabled={isPending}
            />
            <Button 
              onClick={() => handleSendMessage()} 
              disabled={!inputMessage.trim() || isPending}
              className="bg-trust hover:bg-blue-700"
            >
              <Send size={16} />
            </Button>
            <Button 
              variant="outline"
              className="text-gray-600 hover:bg-gray-100"
            >
              <Mic size={16} />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
