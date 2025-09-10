/**
 * Bluetooth Manager Service
 * Chrome'da Web Bluetooth API kullanarak offline mesajlaşma sağlar
 */

export interface BluetoothMessage {
  id: string;
  content: string;
  timestamp: Date;
  senderId: string;
  receiverId?: string;
  encrypted: boolean;
  messageType: 'text' | 'emergency' | 'location' | 'status';
}

export interface BluetoothDevice {
  id: string;
  name: string;
  connected: boolean;
  lastSeen: Date;
}

export interface BluetoothConnectionStatus {
  isConnected: boolean;
  isScanning: boolean;
  availableDevices: BluetoothDevice[];
  currentDevice: BluetoothDevice | null;
  error: string | null;
}

export class BluetoothManager {
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;
  private service: BluetoothRemoteGATTService | null = null;
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private messageQueue: BluetoothMessage[] = [];
  private connectionStatus: BluetoothConnectionStatus = {
    isConnected: false,
    isScanning: false,
    availableDevices: [],
    currentDevice: null,
    error: null
  };

  // Bluetooth servis ve karakteristik UUID'leri
  private readonly SERVICE_UUID = '12345678-1234-1234-1234-123456789abc';
  private readonly CHARACTERISTIC_UUID = '87654321-4321-4321-4321-cba987654321';
  private readonly DEVICE_NAME_PREFIX = 'REACH+';

  private statusCallbacks: ((status: BluetoothConnectionStatus) => void)[] = [];
  private messageCallbacks: ((message: BluetoothMessage) => void)[] = [];

  constructor() {
    this.checkBluetoothSupport();
  }

  /**
   * Bluetooth desteğini kontrol et
   */
  private checkBluetoothSupport(): boolean {
    if (!navigator.bluetooth) {
      this.updateStatus({ error: 'Bu tarayıcı Web Bluetooth API\'yi desteklemiyor. Chrome kullanın.' });
      return false;
    }
    return true;
  }

  /**
   * Bluetooth cihazına bağlan
   */
  async connect(): Promise<boolean> {
    try {
      if (!this.checkBluetoothSupport()) {
        return false;
      }

      this.updateStatus({ isScanning: true, error: null });

      // Bluetooth cihazını seç
      const device = await navigator.bluetooth!.requestDevice({
        filters: [
          { namePrefix: this.DEVICE_NAME_PREFIX },
          { services: [this.SERVICE_UUID] }
        ],
        optionalServices: [this.SERVICE_UUID]
      });

      this.device = {
        id: device.id,
        name: device.name || 'Bilinmeyen Cihaz',
        connected: false,
        lastSeen: new Date()
      };

      // GATT sunucusuna bağlan
      this.server = await device.gatt?.connect() || null;
      if (!this.server) {
        throw new Error('GATT sunucusuna bağlanılamadı');
      }

      // Servisi al
      this.service = await this.server.getPrimaryService(this.SERVICE_UUID);
      if (!this.service) {
        throw new Error('Bluetooth servisi bulunamadı');
      }

      // Karakteristiği al
      this.characteristic = await this.service.getCharacteristic(this.CHARACTERISTIC_UUID);
      if (!this.characteristic) {
        throw new Error('Bluetooth karakteristiği bulunamadı');
      }

      // Mesaj alma dinleyicisini başlat
      await this.startMessageListener();

      this.updateStatus({
        isConnected: true,
        isScanning: false,
        currentDevice: this.device,
        error: null
      });

      console.log('Bluetooth bağlantısı başarılı:', this.device.name);
      return true;

    } catch (error) {
      console.error('Bluetooth bağlantı hatası:', error);
      this.updateStatus({
        isConnected: false,
        isScanning: false,
        error: error instanceof Error ? error.message : 'Bilinmeyen hata'
      });
      return false;
    }
  }

  /**
   * Bluetooth bağlantısını kes
   */
  async disconnect(): Promise<void> {
    try {
      if (this.server?.connected) {
        this.server.disconnect();
      }
      
      this.device = null;
      this.server = null;
      this.service = null;
      this.characteristic = null;

      this.updateStatus({
        isConnected: false,
        isScanning: false,
        currentDevice: null,
        error: null
      });

      console.log('Bluetooth bağlantısı kesildi');
    } catch (error) {
      console.error('Bluetooth bağlantı kesme hatası:', error);
    }
  }

  /**
   * Mesaj gönder
   */
  async sendMessage(content: string, messageType: BluetoothMessage['messageType'] = 'text'): Promise<boolean> {
    try {
      if (!this.isConnected() || !this.characteristic) {
        throw new Error('Bluetooth bağlantısı yok');
      }

      const message: BluetoothMessage = {
        id: this.generateMessageId(),
        content,
        timestamp: new Date(),
        senderId: this.getDeviceId(),
        encrypted: true,
        messageType
      };

      // Mesajı şifrele (basit şifreleme - production'da daha güçlü olmalı)
      const encryptedMessage = this.encryptMessage(message);
      
      // Bluetooth üzerinden gönder
      const data = new TextEncoder().encode(JSON.stringify(encryptedMessage));
      await this.characteristic.writeValue(data);

      // Queue'ya ekle
      this.messageQueue.push(message);

      console.log('Mesaj gönderildi:', message.content);
      return true;

    } catch (error) {
      console.error('Mesaj gönderme hatası:', error);
      this.updateStatus({ error: 'Mesaj gönderilemedi: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata') });
      return false;
    }
  }

  /**
   * Mesaj alma dinleyicisini başlat
   */
  private async startMessageListener(): Promise<void> {
    if (!this.characteristic) return;

    try {
      // Karakteristik değişikliklerini dinle
      await this.characteristic.startNotifications();
      
      this.characteristic.addEventListener('characteristicvaluechanged', (event: Event) => {
        const value = (event.target as unknown as BluetoothRemoteGATTCharacteristic).value;
        if (value) {
          const data = new TextDecoder().decode(value);
          try {
            const message = JSON.parse(data);
            const decryptedMessage = this.decryptMessage(message);
            this.handleReceivedMessage(decryptedMessage);
          } catch (error) {
            console.error('Mesaj parse hatası:', error);
          }
        }
      });

    } catch (error) {
      console.error('Mesaj dinleyici başlatma hatası:', error);
    }
  }

  /**
   * Gelen mesajı işle
   */
  private handleReceivedMessage(message: BluetoothMessage): void {
    // Kendi mesajımızı işleme
    if (message.senderId === this.getDeviceId()) {
      return;
    }

    // Mesajı queue'ya ekle
    this.messageQueue.push(message);

    // Callback'leri çağır
    this.messageCallbacks.forEach(callback => callback(message));

    console.log('Yeni mesaj alındı:', message.content);
  }

  /**
   * Acil durum mesajı gönder
   */
  async sendEmergencyMessage(content: string): Promise<boolean> {
    return this.sendMessage(content, 'emergency');
  }

  /**
   * Konum mesajı gönder
   */
  async sendLocationMessage(latitude: number, longitude: number): Promise<boolean> {
    const locationContent = `Konum: ${latitude}, ${longitude}`;
    return this.sendMessage(locationContent, 'location');
  }

  /**
   * Durum mesajı gönder
   */
  async sendStatusMessage(status: string): Promise<boolean> {
    return this.sendMessage(status, 'status');
  }

  /**
   * Bağlantı durumunu kontrol et
   */
  isConnected(): boolean {
    return this.connectionStatus.isConnected && this.server?.connected === true;
  }

  /**
   * Mevcut durumu al
   */
  getConnectionStatus(): BluetoothConnectionStatus {
    return { ...this.connectionStatus };
  }

  /**
   * Mesaj geçmişini al
   */
  getMessageHistory(): BluetoothMessage[] {
    return [...this.messageQueue];
  }

  /**
   * Durum değişikliği dinleyicisi ekle
   */
  onStatusChange(callback: (status: BluetoothConnectionStatus) => void): void {
    this.statusCallbacks.push(callback);
  }

  /**
   * Mesaj dinleyicisi ekle
   */
  onMessage(callback: (message: BluetoothMessage) => void): void {
    this.messageCallbacks.push(callback);
  }

  /**
   * Durumu güncelle
   */
  private updateStatus(updates: Partial<BluetoothConnectionStatus>): void {
    this.connectionStatus = { ...this.connectionStatus, ...updates };
    this.statusCallbacks.forEach(callback => callback(this.connectionStatus));
  }

  /**
   * Mesaj ID oluştur
   */
  private generateMessageId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Cihaz ID al
   */
  private getDeviceId(): string {
    return this.device?.id || 'unknown';
  }

  /**
   * Mesajı şifrele (basit XOR şifreleme)
   */
  private encryptMessage(message: BluetoothMessage): any {
    const key = 'REACH_PLUS_KEY_2024';
    const messageStr = JSON.stringify(message);
    let encrypted = '';
    
    for (let i = 0; i < messageStr.length; i++) {
      encrypted += String.fromCharCode(
        messageStr.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      );
    }
    
    return {
      encrypted: btoa(encrypted),
      timestamp: Date.now()
    };
  }

  /**
   * Mesajı çöz (basit XOR şifreleme)
   */
  private decryptMessage(encryptedData: any): BluetoothMessage {
    const key = 'REACH_PLUS_KEY_2024';
    const encrypted = atob(encryptedData.encrypted);
    let decrypted = '';
    
    for (let i = 0; i < encrypted.length; i++) {
      decrypted += String.fromCharCode(
        encrypted.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      );
    }
    
    return JSON.parse(decrypted);
  }
}

// Singleton instance
export const bluetoothManager = new BluetoothManager();
