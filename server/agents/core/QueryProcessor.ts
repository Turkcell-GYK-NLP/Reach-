import { UserContext } from '../types.js';

export interface QueryAnalysis {
  originalQuery: string;
  emergencyLevel: 'low' | 'medium' | 'high' | 'critical';
  isGreeting: boolean;
  categories: string[];
  keywords: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
}

export class QueryProcessor {
  /**
   * Analyze query and extract metadata
   */
  analyzeQuery(query: string, userContext: UserContext): QueryAnalysis {
    const lowerQuery = query.toLowerCase();
    
    return {
      originalQuery: query,
      emergencyLevel: this.detectEmergencyLevel(query),
      isGreeting: this.isGreetingMessage(query),
      categories: this.categorizeQuery(lowerQuery),
      keywords: this.extractKeywords(lowerQuery),
      sentiment: this.detectSentiment(lowerQuery)
    };
  }

  /**
   * Detect emergency level from query
   */
  detectEmergencyLevel(query: string): 'low' | 'medium' | 'high' | 'critical' {
    const lowerQuery = query.toLowerCase();
    
    // Critical keywords
    const criticalKeywords = [
      'acil yardım', 'ambulans', 'itfaiye', '112', 'kritik', 'tehlikede',
      'kurtarma', 'yardım et', 'ölüyor', 'bayıldı', 'kanama', 'yangın'
    ];
    
    // High keywords
    const highKeywords = [
      'acil', 'emergency', 'deprem', 'sel', 'yangın', 'tehlike', 'panik',
      'korkuyorum', 'korku', 'endişe', 'stres', 'kötü', 'iyi değil'
    ];
    
    // Medium keywords
    const mediumKeywords = [
      'sorun', 'problem', 'yardım', 'destek', 'bilgi', 'nasıl', 'ne yapmalı'
    ];
    
    // Check for critical
    if (criticalKeywords.some(keyword => lowerQuery.includes(keyword))) {
      console.log(`🚨 Critical emergency detected: "${query}"`);
      return 'critical';
    }
    
    // Check for high
    if (highKeywords.some(keyword => lowerQuery.includes(keyword))) {
      console.log(`⚠️ High emergency detected: "${query}"`);
      return 'high';
    }
    
    // Check for medium
    if (mediumKeywords.some(keyword => lowerQuery.includes(keyword))) {
      console.log(`🔶 Medium emergency detected: "${query}"`);
      return 'medium';
    }
    
    // Default to low
    return 'low';
  }

  /**
   * Check if query is a greeting
   */
  isGreetingMessage(query: string): boolean {
    const greetingPatterns = [
      /^merhaba$/i,
      /^selam$/i,
      /^selamlar$/i,
      /^hey$/i,
      /^hi$/i,
      /^hello$/i,
      /^günaydın$/i,
      /^iyi günler$/i,
      /^iyi akşamlar$/i,
      /^iyi geceler$/i,
      /^nasılsın$/i,
      /^naber$/i,
      /^ne haber$/i,
      /^merhaba!$/i,
      /^selam!$/i,
      /^hey!$/i,
      /^hi!$/i,
      /^hello!$/i
    ];
    
    return greetingPatterns.some(pattern => pattern.test(query.trim()));
  }

  /**
   * Categorize query into topics
   */
  private categorizeQuery(lowerQuery: string): string[] {
    const categories = [];

    if (lowerQuery.includes('konum') || lowerQuery.includes('nerede') || lowerQuery.includes('güvenli')) {
      categories.push('location');
    }

    if (lowerQuery.includes('şebeke') || lowerQuery.includes('internet') || lowerQuery.includes('sinyal')) {
      categories.push('network');
    }

    if (lowerQuery.includes('twitter') || lowerQuery.includes('sosyal') || lowerQuery.includes('trend')) {
      categories.push('social');
    }

    if (lowerQuery.includes('acil') || lowerQuery.includes('emergency') || lowerQuery.includes('112')) {
      categories.push('emergency');
    }

    if (lowerQuery.includes('hastane') || lowerQuery.includes('sağlık') || lowerQuery.includes('doktor')) {
      categories.push('hospital');
    }

    if (lowerQuery.includes('ilk yardım') || lowerQuery.includes('yaralı') || lowerQuery.includes('kanama')) {
      categories.push('firstaid');
    }

    if (lowerQuery.includes('nüfus') || lowerQuery.includes('demografik') || lowerQuery.includes('yaş') || 
        lowerQuery.includes('cinsiyet') || lowerQuery.includes('genç') || lowerQuery.includes('yaşlı') ||
        lowerQuery.includes('trend') || lowerQuery.includes('analiz')) {
      categories.push('population');
    }

    return categories;
  }

  /**
   * Extract keywords from query
   */
  private extractKeywords(lowerQuery: string): string[] {
    // Common stop words in Turkish
    const stopWords = ['ve', 'veya', 'ile', 'için', 'bir', 'bu', 'şu', 'o', 'ne', 'nasıl', 'nerede', 'neden'];
    
    const words = lowerQuery
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word));
    
    return words.slice(0, 5); // Top 5 keywords
  }

  /**
   * Detect sentiment from query
   */
  private detectSentiment(lowerQuery: string): 'positive' | 'negative' | 'neutral' {
    // Positive indicators
    const positiveWords = ['teşekkür', 'güzel', 'iyi', 'harika', 'mükemmel', 'süper'];
    if (positiveWords.some(word => lowerQuery.includes(word))) {
      return 'positive';
    }

    // Negative indicators
    const negativeWords = ['kötü', 'berbat', 'korkunç', 'acil', 'tehlike', 'yardım', 'panik', 'sorun'];
    if (negativeWords.some(word => lowerQuery.includes(word))) {
      return 'negative';
    }

    return 'neutral';
  }

  /**
   * Validate query
   */
  validateQuery(query: string): { valid: boolean; error?: string } {
    if (!query || query.trim().length === 0) {
      return { valid: false, error: 'Query cannot be empty' };
    }

    if (query.length > 1000) {
      return { valid: false, error: 'Query is too long (max 1000 characters)' };
    }

    return { valid: true };
  }
}

