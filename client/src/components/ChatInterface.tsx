import { useState, useEffect } from "react";
import { useChat } from "@/hooks/useChat";
import { useLocation } from "@/hooks/useLocation";
import { useBluetooth } from "@/hooks/useBluetooth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Send, Mic, Bluetooth, Wifi, WifiOff, AlertTriangle, MessageCircle, Trash2 } from "lucide-react";
import { RecommendationEngine } from "./RecommendationEngine";
import EmergencyCallDialog from "./EmergencyCallDialog";
import LocationSendDialog from "./LocationSendDialog";
import { api } from "@/lib/api";

export default function ChatInterface() {
  const [inputMessage, setInputMessage] = useState("");
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSimulationMode, setIsSimulationMode] = useState(false);
  const [isSimulatedBluetoothConnected, setIsSimulatedBluetoothConnected] = useState(false);
  const [showEmergencyDialog, setShowEmergencyDialog] = useState(false);
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [isSendingLocation, setIsSendingLocation] = useState(false);
  
  const { location, error, refreshLocation } = useLocation();
  const { messages, sendMessage, clearChat, isTyping, isPending, isClearing } = useChat();
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
    const handleOnline = () => {
      if (!isSimulationMode) {
        setIsOnline(true);
      }
    };
    const handleOffline = () => {
      if (!isSimulationMode) {
        setIsOnline(false);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isSimulationMode]);

  // Internet bağlantısı yoksa otomatik offline moda geç
  useEffect(() => {
    if (!isOnline && !isOfflineMode) {
      setIsOfflineMode(true);
      // Kullanıcıya bildirim göster
      console.log('Internet bağlantısı kesildi, Bluetooth moduna geçiliyor...');
    }
  }, [isOnline, isOfflineMode]);

  // Simülasyon modu için offline durumu simüle et
  const simulateOffline = () => {
    setIsSimulationMode(true);
    setIsOnline(false);
    setIsOfflineMode(true);
    setIsSimulatedBluetoothConnected(false);
    console.log('Simülasyon: Offline duruma geçildi, Bluetooth moduna geçiliyor...');
    
    // Simülasyon modunda Bluetooth bağlantısını simüle et
    setTimeout(() => {
      setIsSimulatedBluetoothConnected(true);
      console.log('Simülasyon: Bluetooth bağlantısı kuruldu');
    }, 2000);
  };

  // Simülasyon modu için online durumu simüle et
  const simulateOnline = () => {
    setIsSimulationMode(false);
    setIsOnline(true);
    setIsOfflineMode(false);
    setIsSimulatedBluetoothConnected(false);
    console.log('Simülasyon: Online duruma geçildi');
  };

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
      if (isBluetoothConnected || (isSimulationMode && isSimulatedBluetoothConnected)) {
        if (isSimulationMode) {
          // Simülasyon modunda mesajı konsola yazdır
          console.log('Simülasyon: Bluetooth mesajı gönderildi:', messageToSend);
          setInputMessage("");
        } else {
          await sendBluetoothMessage(messageToSend);
          setInputMessage("");
        }
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

    try {
      await sendMessage(messageToSend, userContext);
      setInputMessage("");
    } catch (error) {
      console.error("Mesaj gönderme hatası:", error);
    }
  };

  // Emergency call handler
  const handleEmergencyCall = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowEmergencyDialog(true);
  };

  const confirmEmergencyCall = () => {
    window.open("tel:112");
  };

  // Location send handler
  const handleLocationSend = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowLocationDialog(true);
  };

  const confirmLocationSend = async () => {
    setIsSendingLocation(true);
    try {
      // Refresh location to get the latest coordinates
      await refreshLocation();
      
      if (location) {
        // Send location to emergency contacts
        await api.sendEmergencyLocation({
          latitude: location.latitude,
          longitude: location.longitude,
          address: location.address,
          city: location.city,
          district: location.district
        });
        
        console.log("Location sent to emergency contacts:", location);
      } else {
        throw new Error("Konum bilgisi alınamadı");
      }
    } catch (error) {
      console.error("Failed to send location:", error);
    } finally {
      setIsSendingLocation(false);
    }
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
    <div className="h-full flex flex-col bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-5 h-5" />
              </div>
              AI Destek Asistanı
            </h2>
            <p className="text-blue-100 mt-1">
              {isOfflineMode 
                ? "Bluetooth ile yakındaki cihazlarla mesajlaşın" 
                : "Size nasıl yardımcı olabilirim?"
              }
            </p>
          </div>
          
          {/* Status Indicators */}
          <div className="flex items-center gap-3">
            {isOnline ? (
              <div 
                className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 rounded-full cursor-pointer hover:bg-green-500/30 transition-colors"
                onClick={simulateOffline}
                title="Offline durumu simüle et (test için tıklayın)"
              >
                <Wifi className="w-4 h-4" />
                <span className="text-sm font-medium">Online</span>
              </div>
            ) : (
              <div 
                className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 rounded-full cursor-pointer hover:bg-red-500/30 transition-colors"
                onClick={simulateOnline}
                title="Online duruma geç (test için tıklayın)"
              >
                <WifiOff className="w-4 h-4" />
                <span className="text-sm font-medium">Offline</span>
              </div>
            )}
            
            {(isBluetoothConnected || (isSimulationMode && isSimulatedBluetoothConnected)) && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 rounded-full">
                <Bluetooth className="w-4 h-4" />
                <span className="text-sm font-medium">Bluetooth</span>
                {isSimulationMode && (
                  <span className="text-xs text-blue-600">(Sim)</span>
                )}
              </div>
            )}

            {isOfflineMode && (
              <Badge className="bg-orange-500/20 text-orange-100 border-orange-400/30">
                <Bluetooth className="w-3 h-3 mr-1" />
                Offline Mod
              </Badge>
            )}

            {/* Clear Chat Button */}
            <Button
              size="sm"
              variant="outline"
              onClick={clearChat}
              disabled={isClearing || (isOfflineMode ? bluetoothMessages.length === 0 : messages.length === 0)}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 disabled:opacity-50"
              title="Sohbeti Temizle"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Quick Questions */}
        <div className="mt-6">
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              onClick={handleEmergencyCall}
            >
              🚨 Acil Durum
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              onClick={handleLocationSend}
            >
              📍 Konum Paylaş
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              onClick={() => handleSendMessage("Güvenli alanlar nerede?")}
            >
              🛡️ Güvenli Alanlar
            </Button>
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {!isOnline && (
        <div className="p-4 bg-orange-50 border-b border-orange-200">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-orange-600" />
            <span className="text-sm font-medium text-orange-800">
              {isSimulationMode 
                ? "Simülasyon: Internet bağlantısı kesildi - Bluetooth moduna geçildi" 
                : "Internet bağlantısı yok - Bluetooth moduna geçildi"
              }
            </span>
            {isSimulationMode && (
              <button 
                onClick={simulateOnline}
                className="ml-2 text-blue-600 hover:underline text-xs"
              >
                Online'a dön
              </button>
            )}
          </div>
        </div>
      )}

      {isOfflineMode && (
        <div className="p-4 bg-blue-50 border-b border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bluetooth className={`w-4 h-4 ${isBluetoothConnected ? 'text-blue-600' : 'text-gray-400'}`} />
              <span className="text-sm font-medium">
                {(isBluetoothConnected || (isSimulationMode && isSimulatedBluetoothConnected))
                  ? `Bağlı: ${isSimulationMode ? 'Simüle Edilen Cihaz' : (connectionStatus.currentDevice?.name || 'Bilinmeyen Cihaz')}`
                  : isScanning 
                    ? 'Cihaz aranıyor...'
                    : 'Bluetooth bağlantısı yok'
                }
                {isSimulationMode && (
                  <span className="ml-2 text-xs text-blue-600">(Simülasyon)</span>
                )}
              </span>
            </div>
            
            {!isBluetoothConnected && !isScanning && !(isSimulationMode && isSimulatedBluetoothConnected) && (
              <Button
                size="sm"
                variant="outline"
                onClick={connectBluetooth}
                className="text-xs"
              >
                Bağlan
              </Button>
            )}
            
            {(isBluetoothConnected || (isSimulationMode && isSimulatedBluetoothConnected)) && (
              <Button
                size="sm"
                variant="outline"
                onClick={isSimulationMode ? simulateOnline : disconnectBluetooth}
                className="text-xs"
              >
                {isSimulationMode ? 'Online\'a Dön' : 'Bağlantıyı Kes'}
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
        <div className="p-4 bg-red-50 border-b border-red-200">
          <div className="text-sm text-red-600">
            Devam etmeden önce lütfen giriş yapın veya kayıt olun.
            <button className="ml-2 text-blue-600 underline font-medium" onClick={() => (window.location.href = "/auth")}>Giriş/Kayıt</button>
          </div>
        </div>
      )}
      
      {location && (
        <div className="p-3 bg-gray-50 border-b border-gray-200">
          <div className="text-xs text-gray-600 flex items-center gap-1">
            <span>📍</span>
            <span>{location.address || `${location.district || location.city}${location.country ? `, ${location.country}` : ""}`}</span>
            <span className="text-gray-400">({location.latitude.toFixed(4)}, {location.longitude.toFixed(4)})</span>
          </div>
        </div>
      )}
      
      {error && (
        <div className="p-3 bg-red-50 border-b border-red-200">
          <div className="text-xs text-red-500 flex items-center gap-1">
            <span>⚠️</span>
            <span>{error}</span>
            <button 
              onClick={() => window.location.reload()} 
              className="ml-2 text-blue-500 hover:underline"
            >
              Tekrar Dene
            </button>
          </div>
        </div>
      )}
      
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
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

          // Mesajları tarih sırasına göre sırala (en eski üstte, en yeni altta)
          const sortedMessages = displayMessages.sort((a, b) => {
            const timeA = new Date(a.timestamp).getTime();
            const timeB = new Date(b.timestamp).getTime();
            return timeA - timeB;
          });

          if (sortedMessages.length === 0) {
            return (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-4">
                  <MessageCircle className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Merhaba! 👋</h3>
                <p className="text-gray-600 mb-4">
                  {isOfflineMode 
                    ? "Bluetooth ile yakındaki cihazlarla mesajlaşabilirsiniz"
                    : "Size nasıl yardımcı olabilirim?"
                  }
                </p>

              </div>
            );
          }

          return sortedMessages.map((message) => (
            <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-md rounded-2xl px-4 py-3 ${
                message.type === "user" 
                  ? "bg-gradient-to-r from-blue-600 to-purple-700 text-white" 
                  : "bg-gray-100 text-gray-800"
              }`}>
                <p className="text-sm leading-relaxed">{message.content}</p>
                
                {/* Action Items */}
                {message.actionItems && message.actionItems.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {message.actionItems.map((item: any, index: number) => (
                      <Badge 
                        key={index} 
                        variant="secondary" 
                        className={`text-xs cursor-pointer transition-colors ${
                          message.type === "user" 
                            ? "bg-white/20 text-white hover:bg-white/30" 
                            : "bg-white hover:bg-gray-50"
                        }`}
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
                  <div className="mt-3 flex flex-wrap gap-2">
                    {message.suggestions.map((suggestion: any, index: number) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className={`text-xs h-7 ${
                          message.type === "user" 
                            ? "bg-white/10 border-white/20 text-white hover:bg-white/20" 
                            : "bg-white border-gray-200 hover:bg-gray-50"
                        }`}
                        onClick={() => handleSendMessage(suggestion)}
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs opacity-75">
                    {formatTime(message.timestamp)}
                  </span>
                  {isOfflineMode && message.messageType && (
                    <span className="ml-2 px-2 py-0.5 bg-white/20 text-white rounded-full text-xs">
                      {message.messageType === 'emergency' ? '🚨 Acil' : 
                       message.messageType === 'location' ? '📍 Konum' :
                       message.messageType === 'status' ? '📊 Durum' : '💬'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ));
        })()}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl px-4 py-3 max-w-md">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                </div>
                <span className="text-xs text-gray-500">Yazıyor...</span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Chat Input */}
      <div className="p-6 bg-gray-50 border-t border-gray-200">
        {/* Offline Mod Hızlı Aksiyonlar */}
        {isOfflineMode && (isBluetoothConnected || (isSimulationMode && isSimulatedBluetoothConnected)) && (
          <div className="mb-4 flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (isSimulationMode) {
                  console.log('Simülasyon: Acil durum mesajı gönderildi');
                } else {
                  sendEmergencyMessage("Acil durum! Yardım gerekli!");
                }
              }}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              🚨 Acil Durum
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (isSimulationMode) {
                  console.log('Simülasyon: Konum mesajı gönderildi');
                } else if (location) {
                  sendLocationMessage(location.latitude, location.longitude);
                }
              }}
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
              disabled={!location && !isSimulationMode}
            >
              📍 Konum Gönder
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (isSimulationMode) {
                  console.log('Simülasyon: Güvenlik mesajı gönderildi');
                } else {
                  sendBluetoothMessage("Güvendeyim, endişelenmeyin");
                }
              }}
              className="text-green-600 border-green-200 hover:bg-green-50"
            >
              ✅ Güvendeyim
            </Button>
          </div>
        )}
        
        <div className="flex items-end space-x-3">
          <div className="flex-1 relative">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isOfflineMode ? "Bluetooth mesajınızı yazın..." : "Sorunuzu buraya yazın..."}
              className="w-full h-12 pr-12 pl-4 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              disabled={isPending || (isOfflineMode && !isBluetoothConnected)}
            />
            <Button 
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600"
            >
              <Mic size={16} />
            </Button>
          </div>
          <Button 
            onClick={() => handleSendMessage()} 
              disabled={!inputMessage.trim() || isPending || (isOfflineMode && !isBluetoothConnected && !(isSimulationMode && isSimulatedBluetoothConnected))}
            className="h-12 w-12 bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white rounded-xl flex items-center justify-center transition-all duration-200 transform hover:scale-105"
          >
            <Send size={18} />
          </Button>
        </div>
        
        {/* Offline Mod Bilgilendirmesi */}
        {isOfflineMode && !isBluetoothConnected && !(isSimulationMode && isSimulatedBluetoothConnected) && (
          <div className="mt-3 text-xs text-orange-600 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Bluetooth bağlantısı olmadan mesaj gönderemezsiniz
          </div>
        )}
      </div>

      {/* Emergency Call Dialog */}
      <EmergencyCallDialog
        isOpen={showEmergencyDialog}
        onClose={() => setShowEmergencyDialog(false)}
        onConfirm={confirmEmergencyCall}
      />

      {/* Location Send Dialog */}
      <LocationSendDialog
        isOpen={showLocationDialog}
        onClose={() => setShowLocationDialog(false)}
        onConfirm={confirmLocationSend}
        location={location ? `${location.city}, ${location.district}` : "Konum bilgisi alınıyor..."}
        isLoading={isSendingLocation}
      />
    </div>
  );
}
