import { AgentResponse } from '../types.js';

export class GreetingHandler {
  /**
   * Generate greeting response
   */
  getGreetingResponse(): AgentResponse {
    return {
      message: "Merhaba! Ben Reach+ AI Destek Asistanı. Size nasıl yardımcı olabilirim? Eğer acil bir durumdaysanız veya herhangi bir konuda destek ihtiyacınız varsa, lütfen bana söyleyin. Buradayım ve sizinle birlikteyim! 🤖",
      suggestions: [
        "Acil durum bildir",
        "Güvenli alanları öğren", 
        "Konumumu paylaş",
        "Yardım talep et"
      ],
      actionItems: [],
      toolResults: [],
      confidence: 1.0,
      timestamp: new Date()
    };
  }

  /**
   * Get contextual greeting based on time of day
   */
  getContextualGreeting(): string {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 12) {
      return "Günaydın! 🌅";
    } else if (hour >= 12 && hour < 17) {
      return "İyi günler! ☀️";
    } else if (hour >= 17 && hour < 22) {
      return "İyi akşamlar! 🌆";
    } else {
      return "İyi geceler! 🌙";
    }
  }

  /**
   * Get personalized greeting with user context
   */
  getPersonalizedGreeting(userName?: string): string {
    const contextualGreeting = this.getContextualGreeting();
    
    if (userName) {
      return `${contextualGreeting} ${userName}! Ben Reach+ AI Destek Asistanı. Size nasıl yardımcı olabilirim?`;
    }
    
    return `${contextualGreeting} Ben Reach+ AI Destek Asistanı. Size nasıl yardımcı olabilirim?`;
  }
}

