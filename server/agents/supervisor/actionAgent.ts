import { UserContext, ToolResult, AgentResponse } from '../types.js';

export class ActionAgent {
  async execute(
    query: string, 
    userContext: UserContext, 
    toolResults: ToolResult[]
  ): Promise<AgentResponse> {
    // Aksiyon gerektiren tool sonuçlarını filtrele
    const actionResults = toolResults.filter(result => 
      ['emergency', 'notification'].includes(result.type)
    );

    // Aksiyon planı oluştur
    const actionPlan = this.createActionPlan(query, actionResults, userContext);
    
    // Yanıt oluştur
    const message = this.generateResponse(query, actionPlan, userContext);
    
    // Öneriler oluştur
    const suggestions = this.generateSuggestions(query, actionResults);
    
    // Aksiyon öğeleri oluştur
    const actionItems = this.generateActionItems(actionPlan);

    return {
      message,
      suggestions,
      actionItems,
      toolResults: actionResults,
      confidence: this.calculateConfidence(actionResults),
      timestamp: new Date()
    };
  }

  private createActionPlan(
    query: string, 
    toolResults: ToolResult[], 
    userContext: UserContext
  ): ActionPlan {
    const plan: ActionPlan = {
      actions: [],
      priority: 'medium',
      estimatedTime: 0,
      requirements: []
    };

    // Acil durum aksiyonları
    if (toolResults.some(r => r.type === 'emergency')) {
      const emergencyResult = toolResults.find(r => r.type === 'emergency');
      if (emergencyResult) {
        plan.actions.push({
          type: 'emergency_call',
          title: '112 Acil Çağrı Merkezini Ara',
          description: 'Acil durum için 112 numarasını arayın',
          priority: 'critical',
          data: emergencyResult.data
        });

        if (emergencyResult.data.isUrgent) {
          plan.actions.push({
            type: 'safety_protocol',
            title: 'Güvenlik Protokolünü Uygula',
            description: 'Acil durum güvenlik önlemlerini alın',
            priority: 'critical',
            data: { recommendations: emergencyResult.data.safetyRecommendations }
          });
        }
      }
    }

    // Bildirim aksiyonları
    if (toolResults.some(r => r.type === 'notification')) {
      const notificationResult = toolResults.find(r => r.type === 'notification');
      if (notificationResult && notificationResult.data.canSend) {
        plan.actions.push({
          type: 'send_notification',
          title: 'Bildirim Gönder',
          description: `${notificationResult.data.type} ile bildirim gönder`,
          priority: 'medium',
          data: notificationResult.data
        });
      }
    }

    // Konum bazlı aksiyonlar
    if (query.toLowerCase().includes('güvenli') || query.toLowerCase().includes('güvenli alan')) {
      plan.actions.push({
        type: 'navigate_to_safe_area',
        title: 'Güvenli Alana Git',
        description: 'En yakın güvenli alana yönlendir',
        priority: 'high',
        data: { userLocation: userContext.location }
      });
    }

    // Şebeke aksiyonları
    if (query.toLowerCase().includes('şebeke') || query.toLowerCase().includes('internet')) {
      plan.actions.push({
        type: 'test_network',
        title: 'Şebeke Test Et',
        description: 'Mevcut şebeke bağlantısını test et',
        priority: 'medium',
        data: { operator: userContext.operator }
      });
    }

    // Öncelik belirleme
    if (plan.actions.some(a => a.priority === 'critical')) {
      plan.priority = 'critical';
    } else if (plan.actions.some(a => a.priority === 'high')) {
      plan.priority = 'high';
    }

    // Tahmini süre hesaplama
    plan.estimatedTime = plan.actions.reduce((total, action) => {
      const timeMap = { critical: 5000, high: 3000, medium: 2000, low: 1000 };
      return total + timeMap[action.priority];
    }, 0);

    return plan;
  }

  private generateResponse(query: string, actionPlan: ActionPlan, userContext: UserContext): string {
    if (actionPlan.actions.length === 0) {
      return 'Bu konuda herhangi bir aksiyon gerekmiyor. Başka bir konuda yardımcı olabilirim.';
    }

    let response = `🎯 Aksiyon Planı:\n\n`;

    actionPlan.actions.forEach((action, index) => {
      response += `${index + 1}. ${action.title}\n`;
      response += `   ${action.description}\n`;
      if (action.priority === 'critical') {
        response += `   ⚠️ ACİL - Hemen yapılmalı\n`;
      }
      response += `\n`;
    });

    if (actionPlan.priority === 'critical') {
      response += `🚨 Bu aksiyonlar acil durum için kritik önemde! Hemen uygulayın.`;
    } else if (actionPlan.priority === 'high') {
      response += `⚡ Bu aksiyonlar öncelikli olarak yapılmalı.`;
    } else {
      response += `✅ Bu aksiyonlar zamanınız olduğunda yapılabilir.`;
    }

    return response;
  }

  private generateSuggestions(query: string, toolResults: ToolResult[]): string[] {
    const suggestions = [];

    if (toolResults.some(r => r.type === 'emergency')) {
      suggestions.push('Acil durum protokolü nedir?');
      suggestions.push('Güvenlik önlemleri neler?');
    }

    if (toolResults.some(r => r.type === 'notification')) {
      suggestions.push('Bildirim göndermek istiyorum');
      suggestions.push('Aileme nasıl haber verebilirim?');
    }

    suggestions.push('Başka ne yapabilirim?');
    suggestions.push('Yardım nasıl isteyebilirim?');

    return suggestions.slice(0, 4);
  }

  private generateActionItems(actionPlan: ActionPlan): any[] {
    return actionPlan.actions.map(action => ({
      type: action.type,
      title: action.title,
      data: action.data,
      priority: action.priority
    }));
  }

  private calculateConfidence(toolResults: ToolResult[]): number {
    if (toolResults.length === 0) return 0.1;

    const avgConfidence = toolResults.reduce((sum, result) => sum + result.confidence, 0) / toolResults.length;
    return Math.min(avgConfidence, 0.95);
  }
}

interface ActionPlan {
  actions: Action[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedTime: number;
  requirements: string[];
}

interface Action {
  type: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  data: any;
}
