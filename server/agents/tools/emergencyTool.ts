import { BaseTool } from './baseTool.js';
import { ToolInput, ToolResult } from '../types.js';
import { storage } from '../../storage.js';

export class EmergencyTool extends BaseTool {
  name = 'emergency';
  description = 'Acil durum yönetimi, uyarılar ve güvenlik bilgileri sağlar';

  private keywords = [
    'acil', 'emergency', 'uyarı', 'tehlike', 'güvenlik',
    '112', 'ambulans', 'itfaiye', 'polis', 'kurtarma',
    'afet', 'deprem', 'yangın', 'sel', 'fırtına'
  ];

  async execute(input: ToolInput): Promise<ToolResult | null> {
    const { query, userContext } = input;

    if (!this.shouldExecute(query, this.keywords)) {
      return null;
    }

    try {
      const location = userContext.location?.district || 'İstanbul';
      
      // Aktif acil durum uyarıları
      const emergencyAlerts = await storage.getActiveEmergencyAlerts(location);
      
      // Acil durum kişileri
      const emergencyContacts = [
        { name: 'Acil Çağrı Merkezi', number: '112', type: 'emergency' },
        { name: 'Ambulans', number: '112', type: 'medical' },
        { name: 'İtfaiye', number: '110', type: 'fire' },
        { name: 'Polis', number: '155', type: 'police' }
      ];

      // Güvenlik önerileri
      const safetyRecommendations = this.getSafetyRecommendations(query, location);

      return this.createResult('emergency', {
        location,
        emergencyAlerts,
        emergencyContacts,
        safetyRecommendations,
        isUrgent: this.isUrgentQuery(query),
        timestamp: new Date()
      }, 0.95);
    } catch (error) {
      console.error('EmergencyTool error:', error);
      return this.createResult('emergency', {
        error: 'Acil durum bilgisi alınamadı',
        location: userContext.location?.district || 'Bilinmiyor',
        emergencyAlerts: [],
        emergencyContacts: [],
        safetyRecommendations: []
      }, 0.1);
    }
  }

  private isUrgentQuery(query: string): boolean {
    const urgentKeywords = ['acil', 'emergency', 'hemen', 'immediately', 'sıkıştım', 'mahsur'];
    return urgentKeywords.some(keyword => 
      query.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  private getSafetyRecommendations(query: string, location: string): string[] {
    const recommendations = [];
    
    if (query.toLowerCase().includes('deprem')) {
      recommendations.push('Çök, kapan, tutun pozisyonu alın');
      recommendations.push('Güvenli bir yere geçin');
      recommendations.push('Asansör kullanmayın');
    }
    
    if (query.toLowerCase().includes('yangın')) {
      recommendations.push('Hemen binayı terk edin');
      recommendations.push('Asansör kullanmayın');
      recommendations.push('112\'yi arayın');
    }
    
    recommendations.push('Acil durum numarası: 112');
    recommendations.push('Güvenli alana gidin');
    
    return recommendations;
  }
}
