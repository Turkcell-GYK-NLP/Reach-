import { BaseTool } from './baseTool.js';
import { ToolInput, ToolResult } from '../types.js';

export class NotificationTool extends BaseTool {
  name = 'notification';
  description = 'Bildirim gönderme, SMS, push notification ve e-posta servisleri sağlar';

  private keywords = [
    'bildirim', 'sms', 'e-posta', 'email', 'push', 'uyarı',
    'gönder', 'haber ver', 'bilgilendir', 'arama', 'çağır'
  ];

  async execute(input: ToolInput): Promise<ToolResult | null> {
    const { query, userContext } = input;

    if (!this.shouldExecute(query, this.keywords)) {
      return null;
    }

    try {
      // Bildirim türünü belirle
      const notificationType = this.determineNotificationType(query);
      
      // Hedef kişileri belirle
      const recipients = this.extractRecipients(query);
      
      // Mesaj içeriğini oluştur
      const message = this.generateMessage(query, userContext);

      return this.createResult('notification', {
        type: notificationType,
        recipients,
        message,
        userContext,
        timestamp: new Date(),
        canSend: true
      }, 0.9);
    } catch (error) {
      console.error('NotificationTool error:', error);
      return this.createResult('notification', {
        error: 'Bildirim oluşturulamadı',
        type: 'unknown',
        recipients: [],
        message: '',
        canSend: false
      }, 0.1);
    }
  }

  private determineNotificationType(query: string): string {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('sms') || lowerQuery.includes('mesaj')) {
      return 'sms';
    } else if (lowerQuery.includes('e-posta') || lowerQuery.includes('email')) {
      return 'email';
    } else if (lowerQuery.includes('push') || lowerQuery.includes('bildirim')) {
      return 'push';
    } else if (lowerQuery.includes('arama') || lowerQuery.includes('çağır')) {
      return 'call';
    }
    
    return 'push'; // Default
  }

  private extractRecipients(query: string): string[] {
    // Basit recipient extraction - gerçek implementasyonda daha gelişmiş olmalı
    const recipients = [];
    
    if (query.includes('aile') || query.includes('anne') || query.includes('baba')) {
      recipients.push('family');
    }
    
    if (query.includes('arkadaş') || query.includes('dost')) {
      recipients.push('friends');
    }
    
    if (query.includes('acil') || query.includes('112')) {
      recipients.push('emergency');
    }
    
    return recipients;
  }

  private generateMessage(query: string, userContext: any): string {
    const location = userContext.location?.district || 'Bilinmiyor';
    const timestamp = new Date().toLocaleString('tr-TR');
    
    if (query.toLowerCase().includes('acil')) {
      return `ACİL DURUM: ${location} konumunda yardıma ihtiyacım var. Zaman: ${timestamp}`;
    }
    
    if (query.toLowerCase().includes('güvenli')) {
      return `Güvenli alana ulaştım. Konum: ${location}. Zaman: ${timestamp}`;
    }
    
    return `REACH+ bildirimi: ${query}. Konum: ${location}. Zaman: ${timestamp}`;
  }
}
