import { Tool, ToolInput, ToolResult, UserContext } from '../types.js';

interface RecommendationContext {
  userId: string;
  location: {
    district: string;
    city: string;
  };
  operator?: string;
  age?: number;
  emergencyLevel: 'low' | 'medium' | 'high' | 'critical';
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  userPreferences: Record<string, any>;
}

interface RecommendationAction {
  id: string;
  type: 'location' | 'network' | 'emergency' | 'notification' | 'social';
  title: string;
  description: string;
  confidence: number;
  expectedReward: number;
  contextRelevance: number;
}

interface UserInteraction {
  userId: string;
  actionId: string;
  reward: number; // 0-1 arası, kullanıcı memnuniyeti
  timestamp: Date;
  context: RecommendationContext;
}

export class RecommendationTool implements Tool {
  name = 'recommendation';
  description = 'Reinforcement Learning tabanlı kişiselleştirilmiş öneri motoru';

  private userInteractions: Map<string, UserInteraction[]> = new Map();
  private actionRewards: Map<string, number[]> = new Map();
  private contextActionRewards: Map<string, Map<string, number[]>> = new Map();

  async execute(input: ToolInput): Promise<ToolResult | null> {
    try {
      const { query, userContext } = input;
      
      // Context'i hazırla
      const context = this.prepareContext(userContext);
      
      // Query'yi analiz et ve context'i zenginleştir
      const queryAnalysis = this.analyzeQuery(query);
      const enhancedContext = { ...context, ...queryAnalysis };
      
      // Mevcut önerileri al
      const availableActions = this.getAvailableActions(enhancedContext);
      
      // RL ile en iyi öneriyi seç
      const selectedAction = this.selectBestAction(enhancedContext, availableActions);
      
      // Öneri sonucunu oluştur
      const recommendation = this.createRecommendation(selectedAction, enhancedContext);
      
      console.log(`🎯 RL Recommendation: ${selectedAction.title} (confidence: ${selectedAction.confidence})`);
      
      return {
        type: 'recommendation',
        data: recommendation,
        confidence: selectedAction.confidence,
        timestamp: new Date(),
        source: 'recommendation_tool'
      };
      
    } catch (error) {
      console.error('RecommendationTool error:', error);
      return null;
    }
  }

  private prepareContext(userContext: UserContext): RecommendationContext {
    const now = new Date();
    const hour = now.getHours();
    
    let timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
    if (hour >= 6 && hour < 12) timeOfDay = 'morning';
    else if (hour >= 12 && hour < 18) timeOfDay = 'afternoon';
    else if (hour >= 18 && hour < 22) timeOfDay = 'evening';
    else timeOfDay = 'night';

    return {
      userId: userContext.userId,
      location: {
        district: userContext.location?.district || 'Bilinmiyor',
        city: userContext.location?.city || 'İstanbul'
      },
      operator: userContext.operator,
      age: userContext.age,
      emergencyLevel: this.determineEmergencyLevel(userContext),
      timeOfDay,
      userPreferences: userContext.preferences || {}
    };
  }

  private determineEmergencyLevel(userContext: UserContext): 'low' | 'medium' | 'high' | 'critical' {
    // Emergency level'ı user context'ten al, yoksa default 'low'
    if (userContext.preferences?.emergencyLevel) {
      return userContext.preferences.emergencyLevel;
    }
    return 'low';
  }

  private analyzeQuery(query: string): any {
    const lowerQuery = query.toLowerCase();
    
    // Query türlerini tespit et
    const queryTypes = {
      isSocialMedia: this.containsSocialMediaKeywords(lowerQuery),
      isNetwork: this.containsNetworkKeywords(lowerQuery),
      isLocation: this.containsLocationKeywords(lowerQuery),
      isEmergency: this.containsEmergencyKeywords(lowerQuery),
      isNotification: this.containsNotificationKeywords(lowerQuery)
    };
    
    // Query intent'ini belirle
    let primaryIntent = 'general';
    if (queryTypes.isEmergency) primaryIntent = 'emergency';
    else if (queryTypes.isSocialMedia) primaryIntent = 'social';
    else if (queryTypes.isNetwork) primaryIntent = 'network';
    else if (queryTypes.isLocation) primaryIntent = 'location';
    else if (queryTypes.isNotification) primaryIntent = 'notification';
    
    console.log(`🔍 Query Analysis: "${query}" → ${primaryIntent} (${Object.entries(queryTypes).filter(([_, v]) => v).map(([k, _]) => k).join(', ')})`);
    
    return {
      queryTypes,
      primaryIntent,
      queryLength: query.length,
      hasQuestion: lowerQuery.includes('?') || lowerQuery.includes('nasıl') || lowerQuery.includes('nedir')
    };
  }

  private containsSocialMediaKeywords(query: string): boolean {
    const keywords = ['instagram', 'twitter', 'facebook', 'sosyal medya', 'sosyal', 'medya', 'çöktü', 'giremiyorum'];
    return keywords.some(keyword => query.includes(keyword));
  }

  private containsNetworkKeywords(query: string): boolean {
    const keywords = ['şebeke', 'internet', 'çekmiyor', 'sinyal', 'kapsama', 'turkcell', 'vodafone', 'türk telekom'];
    return keywords.some(keyword => query.includes(keyword));
  }

  private containsLocationKeywords(query: string): boolean {
    const keywords = ['nerede', 'konum', 'güvenli', 'alan', 'hastane', 'toplanma', 'mahalle', 'ilçe'];
    return keywords.some(keyword => query.includes(keyword));
  }

  private containsEmergencyKeywords(query: string): boolean {
    const keywords = ['acil', 'emergency', 'deprem', 'yangın', 'sel', 'tehlike', 'korku', 'panik'];
    return keywords.some(keyword => query.includes(keyword));
  }

  private containsNotificationKeywords(query: string): boolean {
    const keywords = ['bildirim', 'sms', 'email', 'uyarı', 'haber', 'bilgilendir'];
    return keywords.some(keyword => query.includes(keyword));
  }

  private getAvailableActions(context: RecommendationContext): RecommendationAction[] {
    const actions: RecommendationAction[] = [];

    // Acil durum önerileri (en yüksek öncelik)
    if (context.emergencyLevel === 'critical') {
      actions.push({
        id: 'emergency_critical',
        type: 'emergency',
        title: '🚨 KRİTİK: Acil durum aksiyonları',
        description: 'Hemen yapmanız gereken kritik aksiyonlar',
        confidence: 0.95,
        expectedReward: 0.9,
        contextRelevance: 1.0
      });
    } else if (context.emergencyLevel === 'high') {
      actions.push({
        id: 'emergency_high',
        type: 'emergency',
        title: '⚠️ Acil durum hazırlığı',
        description: 'Acil durum için hazırlık yapmanız gerekenler',
        confidence: 0.9,
        expectedReward: 0.85,
        contextRelevance: 0.95
      });
    }

    // Konum bazlı öneriler
    if (context.location.district !== 'Bilinmiyor') {
      actions.push({
        id: `safe_area_${context.location.district}`,
        type: 'location',
        title: `📍 ${context.location.district} güvenli alanları`,
        description: `Yakınınızdaki güvenli toplanma alanları ve hastaneler`,
        confidence: 0.8,
        expectedReward: 0.7,
        contextRelevance: 0.9
      });
    }

    // Şebeke bazlı öneriler (sadece operatör varsa)
    if (context.operator && context.operator !== 'Bilinmiyor') {
      actions.push({
        id: `network_${context.operator}`,
        type: 'network',
        title: `📡 ${context.operator} kapsama durumu`,
        description: `Mevcut konumunuzda ${context.operator} şebeke kalitesi`,
        confidence: 0.85,
        expectedReward: 0.8,
        contextRelevance: 0.8
      });
    }

    // Genel şebeke önerileri
    actions.push({
      id: 'network_general',
      type: 'network',
      title: '📶 Şebeke durumu genel',
      description: 'Tüm operatörlerin mevcut durumu',
      confidence: 0.75,
      expectedReward: 0.7,
      contextRelevance: 0.6
    });

    // Bildirim önerileri (düşük öncelik)
    if (context.emergencyLevel === 'low' || context.emergencyLevel === 'medium') {
      actions.push({
        id: 'notification_setup',
        type: 'notification',
        title: '🔔 Bildirim ayarları',
        description: 'Acil durum bildirimlerini yapılandırın',
        confidence: 0.7,
        expectedReward: 0.6,
        contextRelevance: 0.7
      });
    }

    // Sosyal medya önerileri
    actions.push({
      id: 'social_media_insights',
      type: 'social',
      title: '📱 Sosyal medya durumu',
      description: 'Güncel sosyal medya analizi ve trendler',
      confidence: 0.7,
      expectedReward: 0.65,
      contextRelevance: 0.6
    });

    return actions;
  }

  private selectBestAction(context: RecommendationContext, actions: RecommendationAction[]): RecommendationAction {
    if (actions.length === 0) {
      throw new Error('No actions available');
    }

    // Contextual Multi-Armed Bandit algoritması
    const actionScores = actions.map(action => {
      const baseScore = action.expectedReward * action.contextRelevance;
      const explorationBonus = this.calculateExplorationBonus(action.id, context);
      const exploitationScore = this.calculateExploitationScore(action.id, context);
      
      // Emergency level'a göre bonus
      let emergencyBonus = 0;
      if (action.type === 'emergency' && context.emergencyLevel === 'critical') {
        emergencyBonus = 2.0; // Kritik durumda emergency önerilerine büyük bonus
      } else if (action.type === 'emergency' && context.emergencyLevel === 'high') {
        emergencyBonus = 1.0;
      }
      
      // Time-based scoring
      let timeBonus = 0;
      if (context.timeOfDay === 'night' && action.type === 'emergency') {
        timeBonus = 0.5; // Gece acil durum önerilerine bonus
      }
      
      // Location-based scoring
      let locationBonus = 0;
      if (action.type === 'location' && context.location.district !== 'Bilinmiyor') {
        locationBonus = 0.3;
      }
      
      // Query intent-based scoring
      let intentBonus = 0;
      if (context.primaryIntent === 'social' && action.type === 'social') {
        intentBonus = 1.5; // Sosyal medya sorgusu için sosyal medya önerisi
      } else if (context.primaryIntent === 'network' && action.type === 'network') {
        intentBonus = 1.2; // Şebeke sorgusu için şebeke önerisi
      } else if (context.primaryIntent === 'location' && action.type === 'location') {
        intentBonus = 1.2; // Konum sorgusu için konum önerisi
      } else if (context.primaryIntent === 'emergency' && action.type === 'emergency') {
        intentBonus = 1.0; // Acil durum sorgusu için acil durum önerisi
      } else if (context.primaryIntent === 'notification' && action.type === 'notification') {
        intentBonus = 1.0; // Bildirim sorgusu için bildirim önerisi
      }
      
      const totalScore = baseScore + explorationBonus + exploitationScore + emergencyBonus + timeBonus + locationBonus + intentBonus;
      
      return {
        action,
        score: totalScore,
        breakdown: {
          baseScore,
          explorationBonus,
          exploitationScore,
          emergencyBonus,
          timeBonus,
          locationBonus,
          intentBonus
        }
      };
    });

    // En yüksek skorlu aksiyonu seç
    actionScores.sort((a, b) => b.score - a.score);
    
    // Debug için skorları logla
    console.log(`🎯 RL Action Selection for ${context.userId} (Intent: ${context.primaryIntent}):`);
    actionScores.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.action.title} (score: ${item.score.toFixed(3)})`);
      console.log(`     Breakdown: base=${item.breakdown.baseScore.toFixed(3)}, exploration=${item.breakdown.explorationBonus.toFixed(3)}, exploitation=${item.breakdown.exploitationScore.toFixed(3)}, intent=${item.breakdown.intentBonus.toFixed(3)}`);
    });
    
    return actionScores[0].action;
  }

  private calculateExplorationBonus(actionId: string, context: RecommendationContext): number {
    const contextKey = this.getContextKey(context);
    const interactions = this.userInteractions.get(context.userId) || [];
    const actionInteractions = interactions.filter(i => i.actionId === actionId);
    
    // UCB1 (Upper Confidence Bound) exploration bonus
    const totalInteractions = interactions.length;
    const actionCount = actionInteractions.length;
    
    if (totalInteractions === 0 || actionCount === 0) {
      return 1.0; // Yeni aksiyonlar için yüksek bonus
    }
    
    const explorationFactor = 2.0; // Exploration vs exploitation dengesi
    return explorationFactor * Math.sqrt(Math.log(totalInteractions) / actionCount);
  }

  private calculateExploitationScore(actionId: string, context: RecommendationContext): number {
    const contextKey = this.getContextKey(context);
    const contextRewards = this.contextActionRewards.get(contextKey);
    
    if (!contextRewards) {
      return 0.5; // Default score
    }
    
    const actionRewards = contextRewards.get(actionId);
    if (!actionRewards || actionRewards.length === 0) {
      return 0.5; // Default score
    }
    
    // Ortalama reward
    const avgReward = actionRewards.reduce((sum, reward) => sum + reward, 0) / actionRewards.length;
    return avgReward;
  }

  private getContextKey(context: RecommendationContext): string {
    return `${context.location.district}_${context.location.city}_${context.emergencyLevel}_${context.timeOfDay}`;
  }

  private createRecommendation(action: RecommendationAction, context: RecommendationContext): any {
    return {
      actionId: action.id,
      type: action.type,
      title: action.title,
      description: action.description,
      confidence: action.confidence,
      reasoning: this.generateReasoning(action, context),
      alternatives: this.getAlternatives(action, context),
      metadata: {
        contextKey: this.getContextKey(context),
        timestamp: new Date(),
        userId: context.userId
      }
    };
  }

  private generateReasoning(action: RecommendationAction, context: RecommendationContext): string {
    const reasons = [];
    
    if (action.contextRelevance > 0.8) {
      reasons.push('Mevcut durumunuza çok uygun');
    }
    
    if (action.expectedReward > 0.8) {
      reasons.push('Yüksek fayda potansiyeli');
    }
    
    if (context.emergencyLevel === 'critical') {
      reasons.push('Acil durum önceliği');
    }
    
    if (context.timeOfDay === 'night') {
      reasons.push('Gece saatleri için optimize edilmiş');
    }
    
    return reasons.join(', ') || 'Genel öneri';
  }

  private getAlternatives(selectedAction: RecommendationAction, context: RecommendationContext): any[] {
    // Seçilen aksiyon dışındaki alternatifleri döndür
    const allActions = this.getAvailableActions(context);
    return allActions
      .filter(action => action.id !== selectedAction.id)
      .slice(0, 2) // En fazla 2 alternatif
      .map(action => ({
        id: action.id,
        title: action.title,
        confidence: action.confidence
      }));
  }

  // Kullanıcı etkileşimlerini kaydet (feedback için)
  public recordInteraction(userId: string, actionId: string, reward: number, context: RecommendationContext): void {
    const interaction: UserInteraction = {
      userId,
      actionId,
      reward,
      timestamp: new Date(),
      context
    };

    // Kullanıcı etkileşimlerini kaydet
    if (!this.userInteractions.has(userId)) {
      this.userInteractions.set(userId, []);
    }
    this.userInteractions.get(userId)!.push(interaction);

    // Action reward'larını güncelle
    if (!this.actionRewards.has(actionId)) {
      this.actionRewards.set(actionId, []);
    }
    this.actionRewards.get(actionId)!.push(reward);

    // Context-specific reward'ları güncelle
    const contextKey = this.getContextKey(context);
    if (!this.contextActionRewards.has(contextKey)) {
      this.contextActionRewards.set(contextKey, new Map());
    }
    const contextRewards = this.contextActionRewards.get(contextKey)!;
    if (!contextRewards.has(actionId)) {
      contextRewards.set(actionId, []);
    }
    contextRewards.get(actionId)!.push(reward);

    console.log(`📊 RL Feedback recorded: ${actionId} -> ${reward} (user: ${userId})`);
  }

  // Model performansını değerlendir
  public getModelPerformance(): any {
    const totalInteractions = Array.from(this.userInteractions.values())
      .reduce((sum, interactions) => sum + interactions.length, 0);
    
    const avgReward = Array.from(this.actionRewards.values())
      .flat()
      .reduce((sum, reward) => sum + reward, 0) / totalInteractions;

    return {
      totalInteractions,
      averageReward: avgReward,
      uniqueUsers: this.userInteractions.size,
      uniqueActions: this.actionRewards.size,
      contextKeys: this.contextActionRewards.size
    };
  }
}
