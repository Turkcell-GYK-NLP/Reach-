import { UserContext, ToolResult, AgentResponse } from '../types.js';

export class ReportAgent {
  async execute(
    query: string, 
    userContext: UserContext, 
    toolResults: ToolResult[]
  ): Promise<AgentResponse> {
    // Rapor oluştur
    const report = this.createReport(query, toolResults, userContext);
    
    // Yanıt oluştur
    const message = this.generateResponse(query, report, userContext);
    
    // Öneriler oluştur
    const suggestions = this.generateSuggestions(query, toolResults);
    
    // Aksiyon öğeleri oluştur
    const actionItems = this.generateActionItems(report);

    return {
      message,
      suggestions,
      actionItems,
      toolResults: toolResults,
      confidence: this.calculateConfidence(toolResults),
      timestamp: new Date()
    };
  }

  private createReport(
    query: string, 
    toolResults: ToolResult[], 
    userContext: UserContext
  ): Report {
    const location = userContext.location?.district || 'İstanbul';
    const timestamp = new Date().toLocaleString('tr-TR');

    const report: Report = {
      title: `REACH+ Durum Raporu - ${location}`,
      timestamp,
      location,
      summary: '',
      sections: [],
      metrics: {},
      recommendations: []
    };

    // Özet oluştur
    report.summary = this.generateSummary(toolResults, location);

    // Bölümler oluştur
    report.sections = this.createSections(toolResults);

    // Metrikler oluştur
    report.metrics = this.calculateMetrics(toolResults);

    // Öneriler oluştur
    report.recommendations = this.generateRecommendations(toolResults, userContext);

    return report;
  }

  private generateSummary(toolResults: ToolResult[], location: string): string {
    const activeResults = toolResults.filter(r => r.confidence > 0.5);
    
    if (activeResults.length === 0) {
      return `${location} için yeterli veri bulunamadı. Lütfen daha sonra tekrar deneyin.`;
    }

    let summary = `${location} için güncel durum raporu:\n\n`;
    
    const locationResults = activeResults.filter(r => r.type === 'location');
    const networkResults = activeResults.filter(r => r.type === 'network');
    const socialResults = activeResults.filter(r => r.type === 'social');
    const emergencyResults = activeResults.filter(r => r.type === 'emergency');

    if (locationResults.length > 0) {
      summary += `📍 Konum: ${locationResults.length} güvenli alan tespit edildi\n`;
    }

    if (networkResults.length > 0) {
      summary += `📡 Şebeke: ${networkResults.length} operatör durumu analiz edildi\n`;
    }

    if (socialResults.length > 0) {
      summary += `🐦 Sosyal Medya: ${socialResults.length} insight toplandı\n`;
    }

    if (emergencyResults.length > 0) {
      summary += `🚨 Acil Durum: ${emergencyResults.length} uyarı aktif\n`;
    }

    return summary;
  }

  private createSections(toolResults: ToolResult[]): ReportSection[] {
    const sections: ReportSection[] = [];

    // Konum bölümü
    const locationResults = toolResults.filter(r => r.type === 'location');
    if (locationResults.length > 0) {
      sections.push({
        title: 'Konum ve Güvenlik',
        content: this.formatLocationSection(locationResults),
        priority: 'high'
      });
    }

    // Şebeke bölümü
    const networkResults = toolResults.filter(r => r.type === 'network');
    if (networkResults.length > 0) {
      sections.push({
        title: 'Şebeke Durumu',
        content: this.formatNetworkSection(networkResults),
        priority: 'medium'
      });
    }

    // Sosyal medya bölümü
    const socialResults = toolResults.filter(r => r.type === 'social');
    if (socialResults.length > 0) {
      sections.push({
        title: 'Sosyal Medya Analizi',
        content: this.formatSocialSection(socialResults),
        priority: 'low'
      });
    }

    // Acil durum bölümü
    const emergencyResults = toolResults.filter(r => r.type === 'emergency');
    if (emergencyResults.length > 0) {
      sections.push({
        title: 'Acil Durum Uyarıları',
        content: this.formatEmergencySection(emergencyResults),
        priority: 'critical'
      });
    }

    return sections;
  }

  private formatLocationSection(results: ToolResult[]): string {
    let content = '';
    
    for (const result of results) {
      if (result.data.error) {
        content += `❌ Konum bilgisi alınamadı: ${result.data.error}\n`;
        continue;
      }

      if (result.data.currentLocation) {
        content += `📍 Mevcut Konum: ${result.data.currentLocation.city}, ${result.data.currentLocation.district}\n`;
      }

      if (result.data.nearestSafeArea) {
        content += `🏃‍♂️ En Yakın Güvenli Alan: ${result.data.nearestSafeArea.name} (${result.data.nearestSafeArea.distance})\n`;
      }

      if (result.data.safeAreas && result.data.safeAreas.length > 0) {
        content += `🏢 Toplam Güvenli Alan: ${result.data.safeAreas.length} adet\n`;
        result.data.safeAreas.slice(0, 3).forEach((area: any, index: number) => {
          content += `   ${index + 1}. ${area.name} (${area.distance})\n`;
        });
      }
    }

    return content;
  }

  private formatNetworkSection(results: ToolResult[]): string {
    let content = '';
    
    for (const result of results) {
      if (result.data.error) {
        content += `❌ Şebeke bilgisi alınamadı: ${result.data.error}\n`;
        continue;
      }

      content += `📡 Şebeke Durumu (${result.data.location}):\n`;
      
      if (result.data.operators) {
        for (const [operator, status] of Object.entries(result.data.operators)) {
          if (status) {
            content += `   • ${operator}: ${(status as any).status || 'Bilinmiyor'}\n`;
          }
        }
      }

      if (result.data.recommendation) {
        content += `💡 Öneri: ${result.data.recommendation}\n`;
      }
    }

    return content;
  }

  private formatSocialSection(results: ToolResult[]): string {
    let content = '';
    
    for (const result of results) {
      if (result.data.error) {
        content += `❌ Sosyal medya verisi alınamadı: ${result.data.error}\n`;
        continue;
      }

      content += `🐦 Sosyal Medya Analizi (${result.data.location}):\n`;
      
      if (result.data.insights && result.data.insights.length > 0) {
        content += `   • Toplam Insight: ${result.data.insights.length}\n`;
      }

      if (result.data.trends && result.data.trends.length > 0) {
        content += `   • Trend Konular: ${result.data.trends.slice(0, 5).join(', ')}\n`;
      }

      if (result.data.sentimentSummary) {
        content += `   • Genel Duygu: ${result.data.sentimentSummary}\n`;
      }
    }

    return content;
  }

  private formatEmergencySection(results: ToolResult[]): string {
    let content = '';
    
    for (const result of results) {
      if (result.data.error) {
        content += `❌ Acil durum bilgisi alınamadı: ${result.data.error}\n`;
        continue;
      }

      content += `🚨 Acil Durum Uyarıları (${result.data.location}):\n`;
      
      if (result.data.emergencyAlerts && result.data.emergencyAlerts.length > 0) {
        result.data.emergencyAlerts.forEach((alert: any, index: number) => {
          content += `   ${index + 1}. ${alert.title}: ${alert.description}\n`;
        });
      } else {
        content += `   ✅ Aktif acil durum uyarısı yok\n`;
      }

      if (result.data.emergencyContacts) {
        content += `📞 Acil Durum Kişileri:\n`;
        result.data.emergencyContacts.forEach((contact: any) => {
          content += `   • ${contact.name}: ${contact.number}\n`;
        });
      }
    }

    return content;
  }

  private calculateMetrics(toolResults: ToolResult[]): Record<string, any> {
    const metrics: Record<string, any> = {
      totalResults: toolResults.length,
      highConfidenceResults: toolResults.filter(r => r.confidence > 0.8).length,
      averageConfidence: 0,
      dataFreshness: new Date().toISOString()
    };

    if (toolResults.length > 0) {
      metrics.averageConfidence = toolResults.reduce((sum, r) => sum + r.confidence, 0) / toolResults.length;
    }

    // Kategori bazlı metrikler
    const categories = ['location', 'network', 'social', 'emergency', 'notification'];
    categories.forEach(category => {
      const categoryResults = toolResults.filter(r => r.type === category);
      metrics[`${category}Count`] = categoryResults.length;
      metrics[`${category}Confidence`] = categoryResults.length > 0 
        ? categoryResults.reduce((sum, r) => sum + r.confidence, 0) / categoryResults.length 
        : 0;
    });

    return metrics;
  }

  private generateRecommendations(toolResults: ToolResult[], userContext: UserContext): string[] {
    const recommendations = [];

    // Acil durum önerileri
    const emergencyResults = toolResults.filter(r => r.type === 'emergency');
    if (emergencyResults.length > 0) {
      recommendations.push('Acil durum protokollerini gözden geçirin');
      recommendations.push('Güvenli alanların yerlerini öğrenin');
    }

    // Şebeke önerileri
    const networkResults = toolResults.filter(r => r.type === 'network');
    if (networkResults.length > 0) {
      recommendations.push('En iyi operatörü kullanın');
      recommendations.push('Alternatif bağlantı yöntemleri hazırlayın');
    }

    // Genel öneriler
    recommendations.push('Düzenli olarak durum güncellemelerini kontrol edin');
    recommendations.push('Acil durum çantasını hazır bulundurun');

    return recommendations.slice(0, 5); // Maksimum 5 öneri
  }

  private generateResponse(query: string, report: Report, userContext: UserContext): string {
    let response = `📊 ${report.title}\n`;
    response += `🕐 ${report.timestamp}\n\n`;
    response += `${report.summary}\n\n`;

    // Bölümleri ekle
    report.sections.forEach(section => {
      const priorityIcon = section.priority === 'critical' ? '🚨' : 
                          section.priority === 'high' ? '⚡' : 
                          section.priority === 'medium' ? '📋' : '📝';
      
      response += `${priorityIcon} ${section.title}:\n`;
      response += `${section.content}\n\n`;
    });

    // Önerileri ekle
    if (report.recommendations.length > 0) {
      response += `💡 Öneriler:\n`;
      report.recommendations.forEach((rec, index) => {
        response += `${index + 1}. ${rec}\n`;
      });
    }

    return response;
  }

  private generateSuggestions(query: string, toolResults: ToolResult[]): string[] {
    const suggestions = [];

    suggestions.push('Detaylı analiz istiyorum');
    suggestions.push('Grafik görünümü göster');
    suggestions.push('PDF olarak indir');
    suggestions.push('E-posta ile gönder');

    return suggestions.slice(0, 4);
  }

  private generateActionItems(report: Report): any[] {
    const actionItems = [];

    if (report.sections.some(s => s.priority === 'critical')) {
      actionItems.push({
        type: 'emergency',
        title: 'Acil durum protokolünü uygula',
        data: { report },
        priority: 'critical'
      });
    }

    actionItems.push({
      type: 'report',
      title: 'Raporu paylaş',
      data: { report },
      priority: 'medium'
    });

    return actionItems;
  }

  private calculateConfidence(toolResults: ToolResult[]): number {
    if (toolResults.length === 0) return 0.1;

    const avgConfidence = toolResults.reduce((sum, result) => sum + result.confidence, 0) / toolResults.length;
    return Math.min(avgConfidence, 0.95);
  }
}

interface Report {
  title: string;
  timestamp: string;
  location: string;
  summary: string;
  sections: ReportSection[];
  metrics: Record<string, any>;
  recommendations: string[];
}

interface ReportSection {
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}
