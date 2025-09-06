import { MemoryContext, UserContext } from '../types.js';
import { storage } from '../../storage.js';

export class MemoryStore {
  private memoryCache: Map<string, MemoryContext> = new Map();
  private readonly MAX_HISTORY = 50;

  async getContext(userId: string): Promise<MemoryContext> {
    // Cache'den kontrol et
    if (this.memoryCache.has(userId)) {
      return this.memoryCache.get(userId)!;
    }

    // Veritabanından yükle
    const context = await this.loadFromDatabase(userId);
    this.memoryCache.set(userId, context);
    
    return context;
  }

  async updateContext(
    userId: string, 
    query: string, 
    response: string,
    userContext?: UserContext
  ): Promise<void> {
    const memory = await this.getContext(userId);
    
    // Konuşma geçmişini güncelle
    memory.conversationHistory.push({
      query,
      response,
      timestamp: new Date()
    });

    // Son sorguları güncelle
    memory.recentQueries.push(query);

    // Konum geçmişini güncelle
    if (userContext?.location) {
      memory.locationHistory.push({
        location: `${userContext.location.city}, ${userContext.location.district}`,
        timestamp: new Date()
      });
    }

    // Kullanıcı tercihlerini güncelle
    if (userContext?.preferences) {
      memory.userPreferences = {
        ...memory.userPreferences,
        ...userContext.preferences
      };
    }

    // Geçmişi sınırla
    this.limitHistory(memory);

    // Cache'i güncelle
    this.memoryCache.set(userId, memory);

    // Veritabanına kaydet (async)
    this.saveToDatabase(memory).catch(console.error);
  }

  async getRelevantContext(userId: string, currentQuery: string): Promise<string[]> {
    const memory = await this.getContext(userId);
    const relevantContext: string[] = [];

    // Son konuşmalardan ilgili olanları bul
    const recentConversations = memory.conversationHistory
      .slice(-10)
      .filter(conv => this.isRelevant(conv.query, currentQuery))
      .map(conv => `Soru: ${conv.query}\nYanıt: ${conv.response}`);

    relevantContext.push(...recentConversations);

    // Kullanıcı tercihlerini ekle
    if (Object.keys(memory.userPreferences).length > 0) {
      relevantContext.push(`Kullanıcı tercihleri: ${JSON.stringify(memory.userPreferences)}`);
    }

    // Son konumları ekle
    const recentLocations = memory.locationHistory
      .slice(-3)
      .map(loc => `Konum: ${loc.location} (${loc.timestamp.toLocaleString()})`);

    relevantContext.push(...recentLocations);

    return relevantContext;
  }

  private async loadFromDatabase(userId: string): Promise<MemoryContext> {
    try {
      // Veritabanından kullanıcı verilerini yükle
      const user = await storage.getUser(userId);
      const chatMessages = await storage.getChatMessages(userId);

      return {
        userId,
        recentQueries: chatMessages
          .filter(msg => (msg as any).metadata?.type === 'user')
          .slice(-10)
          .map(msg => msg.message),
        userPreferences: user?.preferences || {},
        locationHistory: [], // Bu veri henüz saklanmıyor
        conversationHistory: chatMessages
          .slice(-20)
          .map(msg => ({
            query: (msg as any).metadata?.type === 'user' ? msg.message : '',
            response: (msg as any).metadata?.type === 'bot' ? msg.message : '',
            timestamp: msg.timestamp || new Date()
          }))
          .filter(conv => conv.query && conv.response)
      };
    } catch (error) {
      console.error('Memory load error:', error);
      return this.createEmptyContext(userId);
    }
  }

  private async saveToDatabase(memory: MemoryContext): Promise<void> {
    // Bu implementasyonda sadece cache'de tutuyoruz
    // Gerçek implementasyonda veritabanına kaydetmek gerekir
  }

  private createEmptyContext(userId: string): MemoryContext {
    return {
      userId,
      recentQueries: [],
      userPreferences: {},
      locationHistory: [],
      conversationHistory: []
    };
  }

  private limitHistory(memory: MemoryContext): void {
    if (memory.recentQueries.length > this.MAX_HISTORY) {
      memory.recentQueries = memory.recentQueries.slice(-this.MAX_HISTORY);
    }

    if (memory.conversationHistory.length > this.MAX_HISTORY) {
      memory.conversationHistory = memory.conversationHistory.slice(-this.MAX_HISTORY);
    }

    if (memory.locationHistory.length > this.MAX_HISTORY) {
      memory.locationHistory = memory.locationHistory.slice(-this.MAX_HISTORY);
    }
  }

  private isRelevant(previousQuery: string, currentQuery: string): boolean {
    const prevWords = previousQuery.toLowerCase().split(' ');
    const currWords = currentQuery.toLowerCase().split(' ');
    
    // Ortak kelime sayısını hesapla
    const commonWords = prevWords.filter(word => 
      currWords.includes(word) && word.length > 3
    );
    
    return commonWords.length >= 2;
  }

  clearCache(userId?: string): void {
    if (userId) {
      this.memoryCache.delete(userId);
    } else {
      this.memoryCache.clear();
    }
  }
}
