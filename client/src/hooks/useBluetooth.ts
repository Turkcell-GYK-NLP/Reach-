/**
 * Bluetooth Hook
 * React component'lerinde Bluetooth özelliklerini kullanmak için
 */

import { useState, useEffect, useCallback } from 'react';
import { bluetoothManager, BluetoothConnectionStatus, BluetoothMessage } from '../services/bluetoothManager';

export interface UseBluetoothReturn {
  // Bağlantı durumu
  isConnected: boolean;
  isScanning: boolean;
  connectionStatus: BluetoothConnectionStatus;
  
  // Mesajlaşma
  messages: BluetoothMessage[];
  sendMessage: (content: string, messageType?: BluetoothMessage['messageType']) => Promise<boolean>;
  sendEmergencyMessage: (content: string) => Promise<boolean>;
  sendLocationMessage: (latitude: number, longitude: number) => Promise<boolean>;
  
  // Bağlantı yönetimi
  connect: () => Promise<boolean>;
  disconnect: () => Promise<void>;
  
  // Hata yönetimi
  error: string | null;
  clearError: () => void;
}

export function useBluetooth(): UseBluetoothReturn {
  const [connectionStatus, setConnectionStatus] = useState<BluetoothConnectionStatus>(
    bluetoothManager.getConnectionStatus()
  );
  const [messages, setMessages] = useState<BluetoothMessage[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Bağlantı durumu güncellemelerini dinle
  useEffect(() => {
    const handleStatusChange = (status: BluetoothConnectionStatus) => {
      setConnectionStatus(status);
      if (status.error) {
        setError(status.error);
      }
    };

    bluetoothManager.onStatusChange(handleStatusChange);
    
    // Mevcut durumu al
    setConnectionStatus(bluetoothManager.getConnectionStatus());
    setMessages(bluetoothManager.getMessageHistory());

    return () => {
      // Cleanup - callback'leri temizle
    };
  }, []);

  // Mesaj güncellemelerini dinle
  useEffect(() => {
    const handleMessage = (message: BluetoothMessage) => {
      setMessages(prev => [...prev, message]);
    };

    bluetoothManager.onMessage(handleMessage);

    return () => {
      // Cleanup
    };
  }, []);

  // Bağlantı kur
  const connect = useCallback(async (): Promise<boolean> => {
    setError(null);
    const success = await bluetoothManager.connect();
    if (!success) {
      setError('Bluetooth bağlantısı kurulamadı');
    }
    return success;
  }, []);

  // Bağlantıyı kes
  const disconnect = useCallback(async (): Promise<void> => {
    setError(null);
    await bluetoothManager.disconnect();
  }, []);

  // Mesaj gönder
  const sendMessage = useCallback(async (
    content: string, 
    messageType: BluetoothMessage['messageType'] = 'text'
  ): Promise<boolean> => {
    setError(null);
    const success = await bluetoothManager.sendMessage(content, messageType);
    if (!success) {
      setError('Mesaj gönderilemedi');
    }
    return success;
  }, []);

  // Acil durum mesajı gönder
  const sendEmergencyMessage = useCallback(async (content: string): Promise<boolean> => {
    setError(null);
    const success = await bluetoothManager.sendEmergencyMessage(content);
    if (!success) {
      setError('Acil durum mesajı gönderilemedi');
    }
    return success;
  }, []);

  // Konum mesajı gönder
  const sendLocationMessage = useCallback(async (
    latitude: number, 
    longitude: number
  ): Promise<boolean> => {
    setError(null);
    const success = await bluetoothManager.sendLocationMessage(latitude, longitude);
    if (!success) {
      setError('Konum mesajı gönderilemedi');
    }
    return success;
  }, []);

  // Hata temizle
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isConnected: connectionStatus.isConnected,
    isScanning: connectionStatus.isScanning,
    connectionStatus,
    messages,
    sendMessage,
    sendEmergencyMessage,
    sendLocationMessage,
    connect,
    disconnect,
    error,
    clearError
  };
}
