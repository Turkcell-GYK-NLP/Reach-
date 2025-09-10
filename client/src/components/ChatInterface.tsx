import { useState, useEffect } from "react";
import { useChat } from "@/hooks/useChat";
import { useLocation } from "@/hooks/useLocation";
import { useBluetooth } from "@/hooks/useBluetooth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Send, Mic, Bluetooth, Wifi, WifiOff, AlertTriangle } from "lucide-react";
import { RecommendationEngine } from "./RecommendationEngine";

export default function ChatInterface() {
  const [inputMessage, setInputMessage] = useState("");
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const { location, error } = useLocation();
  const { messages, sendMessage, isTyping, isPending } = useChat();
  const {
    isConnected: isBluetoothConnected,
    isScanning,
    connectionStatus,
    messages: bluetoothMessages,
    sendMessage: sendBluetoothMessage,
    sendEmergencyMessage,
    sendLocationMessage,
    connect: connectBluetooth,
    disconnect: disconnectBluetooth,
    error: bluetoothError,
    clearError: clearBluetoothError
  } = useBluetooth();

  let isLoggedIn = false;
  try {
    const auth = JSON.parse(localStorage.getItem("auth") || "null");
    isLoggedIn = !!auth?.user?.id;
  } catch {}

  // Online/offline durumunu takip et
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Internet bağlantısı yoksa otomatik offline moda geç
  useEffect(() => {
    if (!isOnline && !isOfflineMode) {
      setIsOfflineMode(true);
      // Kullanıcıya bildirim göster
      console.log('Internet bağlantısı kesildi, Bluetooth moduna geçiliyor...');
    }
  }, [isOnline, isOfflineMode]);

  // Internet bağlantısı geri geldiğinde online moda geç
  useEffect(() => {
    if (isOnline && isOfflineMode) {
      // Kullanıcıya seçenek sun
      console.log('Internet bağlantısı geri geldi, online moda geçebilirsiniz');
    }
  }, [isOnline, isOfflineMode]);

  // Offline modda otomatik Bluetooth bağlantısı
  useEffect(() => {
    if (isOfflineMode && !isBluetoothConnected && !isScanning) {
      connectBluetooth();
    }
  }, [isOfflineMode, isBluetoothConnected, isScanning, connectBluetooth]);

  const handleSendMessage = async (message?: string) => {
    const messageToSend = message || inputMessage;
    if (!messageToSend.trim() || isPending) return;

    // Offline modda Bluetooth ile gönder
    if (isOfflineMode) {
      if (isBluetoothConnected) {
        await sendBluetoothMessage(messageToSend);
        setInputMessage("");
      } else {
        console.error('Bluetooth bağlantısı yok');
      }
      return;
    }

    // Online modda normal API ile gönder
    const userContext = {
      location: {
        district: location?.district || (location?.city === "Esenler" ? "Esenler" : "Esenler"),
        city: location?.city || "İstanbul",
        neighborhood: (location as any)?.neighborhood || "Menderes",
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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Soru Sor
              {isOfflineMode && (
                <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                  <Bluetooth className="w-3 h-3 mr-1" />
                  Offline Mod
                </Badge>
              )}
            </CardTitle>
            <p className="text-sm text-gray-600">
              {isOfflineMode 
                ? "Bluetooth ile yakındaki cihazlarla mesajlaşın" 
                : "Doğal dilde sorularınızı yazabilirsiniz"
              }
            </p>
          </div>
          
          {/* Bağlantı Durumu ve Mod Geçişi */}
          <div className="flex items-center gap-3">
            {/* Bağlantı Durumu */}
            <div className="flex items-center gap-2">
              {isOnline ? (
                <div className="flex items-center gap-1 text-green-600">
                  <Wifi className="w-4 h-4" />
                  <span className="text-xs">Online</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-red-600">
                  <WifiOff className="w-4 h-4" />
                  <span className="text-xs">Offline</span>
                </div>
              )}
              
              {isBluetoothConnected && (
                <div className="flex items-center gap-1 text-blue-600">
                  <Bluetooth className="w-4 h-4" />
                  <span className="text-xs">Bluetooth</span>
                </div>
              )}
            </div>
            
            {/* Offline Mod Switch */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600">Offline Mod</span>
              <Switch
                checked={isOfflineMode}
                onCheckedChange={setIsOfflineMode}
                disabled={!isOnline && !isBluetoothConnected}
              />
            </div>
          </div>
        </div>

        {/* Internet Bağlantı Durumu Bildirimi */}
        {!isOnline && (
          <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center gap-2">
              <WifiOff className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-800">
                Internet bağlantısı yok - Bluetooth moduna geçildi
              </span>
            </div>
          </div>
        )}

        {/* Bluetooth Bağlantı Durumu */}
        {isOfflineMode && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bluetooth className={`w-4 h-4 ${isBluetoothConnected ? 'text-blue-600' : 'text-gray-400'}`} />
                <span className="text-sm font-medium">
                  {isBluetoothConnected 
                    ? `Bağlı: ${connectionStatus.currentDevice?.name || 'Bilinmeyen Cihaz'}`
                    : isScanning 
                      ? 'Cihaz aranıyor...'
                      : 'Bluetooth bağlantısı yok'
                  }
                </span>
              </div>
              
              {!isBluetoothConnected && !isScanning && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={connectBluetooth}
                  className="text-xs"
                >
                  Bağlan
                </Button>
              )}
              
              {isBluetoothConnected && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={disconnectBluetooth}
                  className="text-xs"
                >
                  Bağlantıyı Kes
                </Button>
              )}
            </div>
            
            {bluetoothError && (
              <div className="mt-2 text-xs text-red-600 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {bluetoothError}
                <button 
                  onClick={clearBluetoothError}
                  className="ml-2 text-blue-500 hover:underline"
                >
                  Kapat
                </button>
              </div>
            )}
          </div>
        )}

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
          {(() => {
            const allMessages = isOfflineMode ? bluetoothMessages : messages;
            const displayMessages = allMessages.map((msg: any) => ({
              ...msg,
              type: msg.type || (msg.senderId ? 'user' : 'bot'),
              content: msg.content || msg.message || '',
              timestamp: msg.timestamp || new Date(),
              actionItems: msg.actionItems || [],
              toolResults: msg.toolResults || [],
              suggestions: msg.suggestions || [],
              messageType: msg.messageType || 'text'
            }));

            if (displayMessages.length === 0) {
              return (
                <div className="text-center text-gray-500 py-8">
                  <p>Merhaba! Size nasıl yardımcı olabilirim?</p>
                  <p className="text-sm mt-2">
                    {isOfflineMode 
                      ? "Bluetooth ile yakındaki cihazlarla mesajlaşabilirsiniz"
                      : "Konum, operatör durumu veya güvenli alanlar hakkında soru sorabilirsiniz"
                    }
                  </p>
                </div>
              );
            }

            return displayMessages.map((message) => (
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
                      {message.actionItems.map((item: any, index: number) => (
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
                      {message.suggestions.map((suggestion: any, index: number) => (
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
                    {isOfflineMode && message.messageType && (
                      <span className="ml-2 px-1 py-0.5 bg-blue-100 text-blue-600 rounded text-xs">
                        {message.messageType === 'emergency' ? '🚨 Acil' : 
                         message.messageType === 'location' ? '📍 Konum' :
                         message.messageType === 'status' ? '📊 Durum' : '💬'}
                      </span>
                    )}
                  </span>
                </div>
              </div>
            ));
          })()}

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
          {/* Offline Mod Hızlı Aksiyonlar */}
          {isOfflineMode && isBluetoothConnected && (
            <div className="mb-3 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => sendEmergencyMessage("Acil durum! Yardım gerekli!")}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                🚨 Acil Durum
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (location) {
                    sendLocationMessage(location.latitude, location.longitude);
                  }
                }}
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
                disabled={!location}
              >
                📍 Konum Gönder
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => sendBluetoothMessage("Güvendeyim, endişelenmeyin")}
                className="text-green-600 border-green-200 hover:bg-green-50"
              >
                ✅ Güvendeyim
              </Button>
            </div>
          )}
          
          <div className="flex space-x-3">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isOfflineMode ? "Bluetooth mesajınızı yazın..." : "Sorunuzu buraya yazın..."}
              className="flex-1"
              disabled={isPending || (isOfflineMode && !isBluetoothConnected)}
            />
            <Button 
              onClick={() => handleSendMessage()} 
              disabled={!inputMessage.trim() || isPending || (isOfflineMode && !isBluetoothConnected)}
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
          
          {/* Offline Mod Bilgilendirmesi */}
          {isOfflineMode && !isBluetoothConnected && (
            <div className="mt-2 text-xs text-orange-600 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Bluetooth bağlantısı olmadan mesaj gönderemezsiniz
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
