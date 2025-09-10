/**
 * Bluetooth Test Sayfası
 * Chrome'da Bluetooth özelliklerini test etmek için
 */

import { useState } from 'react';
import { useBluetooth } from '@/hooks/useBluetooth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Bluetooth, Wifi, WifiOff, Send, AlertTriangle } from 'lucide-react';

export default function BluetoothTest() {
  const [testMessage, setTestMessage] = useState('');
  const {
    isConnected,
    isScanning,
    connectionStatus,
    messages,
    sendMessage,
    sendEmergencyMessage,
    sendLocationMessage,
    connect,
    disconnect,
    error,
    clearError
  } = useBluetooth();

  const handleSendTestMessage = async () => {
    if (testMessage.trim()) {
      await sendMessage(testMessage);
      setTestMessage('');
    }
  };

  const handleSendEmergency = async () => {
    await sendEmergencyMessage('Test acil durum mesajı!');
  };

  const handleSendLocation = async () => {
    // Test koordinatları (İstanbul)
    await sendLocationMessage(41.0082, 28.9784);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Bluetooth Test Sayfası</h1>
      
      {/* Durum Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Wifi className="w-4 h-4" />
              Internet Bağlantısı
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={navigator.onLine ? "default" : "destructive"}>
              {navigator.onLine ? "Online" : "Offline"}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Bluetooth className="w-4 h-4" />
              Bluetooth Durumu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={isConnected ? "default" : "secondary"}>
              {isConnected ? "Bağlı" : isScanning ? "Aranıyor..." : "Bağlı Değil"}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Cihaz Bilgisi</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              {connectionStatus.currentDevice?.name || "Cihaz seçilmedi"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bluetooth Kontrolleri */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Bluetooth Kontrolleri</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              onClick={connect}
              disabled={isConnected || isScanning}
              className="flex-1"
            >
              {isScanning ? "Bağlanıyor..." : "Bluetooth Bağlan"}
            </Button>
            <Button
              onClick={disconnect}
              disabled={!isConnected}
              variant="outline"
              className="flex-1"
            >
              Bağlantıyı Kes
            </Button>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-600">{error}</span>
              <Button size="sm" variant="outline" onClick={clearError}>
                Kapat
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mesaj Gönderme */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Mesaj Gönder</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="Test mesajınızı yazın..."
              disabled={!isConnected}
            />
            <Button
              onClick={handleSendTestMessage}
              disabled={!isConnected || !testMessage.trim()}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSendEmergency}
              disabled={!isConnected}
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              🚨 Acil Durum Mesajı
            </Button>
            <Button
              onClick={handleSendLocation}
              disabled={!isConnected}
              variant="outline"
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              📍 Konum Gönder
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Mesaj Geçmişi */}
      <Card>
        <CardHeader>
          <CardTitle>Mesaj Geçmişi ({messages.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {messages.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              Henüz mesaj yok. Bluetooth bağlantısı kurup mesaj gönderin.
            </p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className="p-3 bg-gray-50 rounded-lg border"
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-sm font-medium">
                      {message.senderId ? 'Gönderen' : 'Alıcı'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm">{message.content}</p>
                  <div className="flex gap-1 mt-2">
                    <Badge variant="outline" className="text-xs">
                      {message.messageType}
                    </Badge>
                    {message.encrypted && (
                      <Badge variant="outline" className="text-xs">
                        🔒 Şifreli
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tarayıcı Desteği Bilgisi */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-sm">Tarayıcı Desteği</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-2">
            <p><strong>✅ Desteklenen:</strong> Chrome 56+, Edge 79+, Opera 43+</p>
            <p><strong>❌ Desteklenmeyen:</strong> Safari (iOS/macOS), Firefox</p>
            <p><strong>📱 Mobil:</strong> Chrome Android, Edge Android</p>
            <p><strong>🔒 Gereksinim:</strong> HTTPS bağlantısı gerekli</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
