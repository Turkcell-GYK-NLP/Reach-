import { UserContext, ToolResult, AgentResponse } from '../types.js';

export class InfoAgent {
  async execute(
    query: string, 
    userContext: UserContext, 
    toolResults: ToolResult[]
  ): Promise<AgentResponse> {
    // Tool sonuçlarını analiz et
    const relevantResults = toolResults.filter(result => 
      ['location', 'network', 'social', 'websearch'].includes(result.type)
    );

    // Bilgi özeti oluştur
    const infoSummary = this.createInfoSummary(relevantResults);
    
    // Yanıt oluştur
    const message = this.generateResponse(query, infoSummary, userContext);
    
    // Öneriler oluştur
    const suggestions = this.generateSuggestions(query, relevantResults);
    
    // Aksiyon öğeleri oluştur
    const actionItems = this.generateActionItems(relevantResults);

    return {
      message,
      suggestions,
      actionItems,
      toolResults: relevantResults,
      confidence: this.calculateConfidence(relevantResults),
      timestamp: new Date()
    };
  }

  private createInfoSummary(toolResults: ToolResult[]): string {
    const summaries = [];

    for (const result of toolResults) {
      switch (result.type) {
        case 'location':
          summaries.push(this.formatLocationInfo(result.data));
          break;
        case 'network':
          summaries.push(this.formatNetworkInfo(result.data));
          break;
        case 'social':
          summaries.push(this.formatSocialInfo(result.data));
          break;
        case 'websearch':
          summaries.push(this.formatWebSearchInfo(result.data));
          break;
      }
    }

    return summaries.join('\n\n');
  }

  private formatLocationInfo(data: any): string {
    if (data.error) {
      return `Konum bilgisi: ${data.error}`;
    }

    let info = `📍 Konum Bilgileri:\n`;
    
    if (data.currentLocation) {
      info += `• Mevcut konum: ${data.currentLocation.city}, ${data.currentLocation.district}\n`;
    }
    
    if (data.nearestSafeArea) {
      info += `• En yakın güvenli alan: ${data.nearestSafeArea.name} (${data.nearestSafeArea.distance})\n`;
    }
    
    if (data.safeAreas && data.safeAreas.length > 0) {
      info += `• Diğer güvenli alanlar: ${data.safeAreas.length} adet\n`;
    }

    return info;
  }

  private formatNetworkInfo(data: any): string {
    if (data.error) {
      return `Şebeke bilgisi: ${data.error}`;
    }

    let info = `📡 Şebeke Durumu (${data.location}):\n`;
    
    if (data.operators) {
      for (const [operator, status] of Object.entries(data.operators)) {
        if (status) {
          info += `• ${operator}: ${(status as any).status || 'Bilinmiyor'}\n`;
        }
      }
    }
    
    if (data.recommendation) {
      info += `• Öneri: ${data.recommendation}\n`;
    }

    return info;
  }

  private formatSocialInfo(data: any): string {
    if (data.error) {
      return `Sosyal medya bilgisi: ${data.error}`;
    }

    let info = `🐦 Sosyal Medya Analizi (${data.location}):\n`;
    
    if (data.insights && data.insights.length > 0) {
      info += `• ${data.insights.length} adet insight\n`;
    }
    
    if (data.trends && data.trends.length > 0) {
      info += `• Trend konular: ${data.trends.slice(0, 3).join(', ')}\n`;
    }
    
    if (data.sentimentSummary) {
      info += `• Genel duygu: ${data.sentimentSummary}\n`;
    }

    return info;
  }

  private formatWebSearchInfo(data: any): string {
    if (data.error) {
      return `Web araması: ${data.error}`;
    }

    let info = `🔍 Web Araştırması (${data.location}):\n`;
    
    if (data.results && data.results.length > 0) {
      // Toplanma alanları için özel formatlama
      const isToplanmaAlani = data.results.some((result: any) => 
        result.title.includes('toplanma') || 
        result.title.includes('alan') ||
        result.url.includes('toplanma-alanlari')
      );

      if (isToplanmaAlani) {
        info = `🏢 Toplanma Alanları (${data.location}):\n\n`;
        data.results.forEach((result: any, index: number) => {
          info += `${index + 1}. ${result.title}\n`;
          if (result.content) {
            info += `   ${result.content}\n`;
          }
          info += `\n`;
        });
      } else {
        // Genel web araması formatı
        data.results.forEach((result: any, index: number) => {
          info += `\n${index + 1}. ${result.title}\n`;
          info += `   ${result.snippet}\n`;
          if (result.content) {
            // İlk 200 karakteri göster
            const shortContent = result.content.length > 200 
              ? result.content.substring(0, 200) + '...' 
              : result.content;
            info += `   ${shortContent}\n`;
          }
        });
      }
    } else {
      info += `Arama sonucu bulunamadı.`;
    }

    return info;
  }

  private generateResponse(query: string, infoSummary: string, userContext: UserContext): string {
    const location = userContext.location?.district || 'İstanbul';
    const lowerQuery = query.toLowerCase();
    
    // Toplanma alanları sorgusu için özel yanıt
    if (lowerQuery.includes('toplanma alanı') || lowerQuery.includes('toplanma') || 
        lowerQuery.includes('güvenli alan') || lowerQuery.includes('acil toplanma')) {
      return `🏢 ${location} bölgesindeki toplanma alanları:\n\n${infoSummary}\n\nBu alanlar acil durumlarda güvenli toplanma noktalarıdır. Koordinat bilgileri ile konumlarına ulaşabilirsiniz.`;
    }
    
    if (lowerQuery.includes('durum') || lowerQuery.includes('ne oluyor')) {
      return `📊 ${location} için güncel durum:\n\n${infoSummary}\n\nBu bilgiler gerçek zamanlı olarak güncellenmektedir.`;
    }
    
    if (lowerQuery.includes('konum') || lowerQuery.includes('nerede')) {
      return `📍 Konum bilgileriniz:\n\n${infoSummary}\n\nGüvenli alanlara ulaşım için yol tarifi alabilirsiniz.`;
    }
    
    if (lowerQuery.includes('şebeke') || lowerQuery.includes('internet')) {
      return `📡 Şebeke durumu:\n\n${infoSummary}\n\nEn iyi bağlantı için önerilen operatörü kullanabilirsiniz.`;
    }
    
    return `ℹ️ İstediğiniz bilgiler:\n\n${infoSummary}\n\nDaha detaylı bilgi için spesifik sorular sorabilirsiniz.`;
  }

  private generateSuggestions(query: string, toolResults: ToolResult[]): string[] {
    const suggestions = [];

    if (toolResults.some(r => r.type === 'location')) {
      suggestions.push('Güvenli alana nasıl giderim?');
      suggestions.push('Yakındaki hastaneler nerede?');
    }

    if (toolResults.some(r => r.type === 'network')) {
      suggestions.push('Şebekemi nasıl test ederim?');
      suggestions.push('Hangi operatörü kullanmalıyım?');
    }

    if (toolResults.some(r => r.type === 'social')) {
      suggestions.push('Son trendler neler?');
      suggestions.push('Sosyal medyada ne konuşuluyor?');
    }

    if (toolResults.some(r => r.type === 'websearch')) {
      suggestions.push('Daha detaylı araştırma yap');
      suggestions.push('Güncel verileri kontrol et');
    }

    suggestions.push('Acil durum numarası nedir?');
    suggestions.push('Yardım nasıl isteyebilirim?');

    return suggestions.slice(0, 4); // Maksimum 4 öneri
  }

  private generateActionItems(toolResults: ToolResult[]): any[] {
    const actionItems = [];

    for (const result of toolResults) {
      if (result.type === 'location' && result.data.nearestSafeArea) {
        actionItems.push({
          type: 'location',
          title: 'Güvenli alana git',
          data: { safeArea: result.data.nearestSafeArea },
          priority: 'medium'
        });
      }

      if (result.type === 'network' && result.data.recommendation) {
        actionItems.push({
          type: 'network',
          title: 'Operatör değiştir',
          data: { recommendation: result.data.recommendation },
          priority: 'low'
        });
      }
    }

    return actionItems;
  }

  private calculateConfidence(toolResults: ToolResult[]): number {
    if (toolResults.length === 0) return 0.1;

    const avgConfidence = toolResults.reduce((sum, result) => sum + result.confidence, 0) / toolResults.length;
    return Math.min(avgConfidence, 0.95);
  }
}
