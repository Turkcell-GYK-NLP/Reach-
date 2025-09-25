/**
 * Psikolojik Profil Oluşturma Servisi
 * Kullanıcıların gizli profil verilerini toplar ve analiz eder
 */

import { db } from '../db.js';
import { emotionalAnalysisSchema, userResponseSchema } from '../../shared/schema.js';
import { eq, desc } from 'drizzle-orm';

export interface PopupQuestion {
  id: string;
  text: string;
  type: 'daily_mood' | 'needs_assessment' | 'social_support' | 'psychological_healing' | 'future_oriented';
  options: Array<{
    value: string;
    text: string;
    emotional_weight?: number; // -1 (negatif) to 1 (pozitif)
    category?: string;
  }>;
  context_tags: string[];
  frequency: 'daily' | 'weekly' | 'situational';
  priority_weight: number; // 1-5, yüksek = daha kritik veri
}

export interface UserProfile {
  userId: string;
  emotional_baseline: {
    positivity: number; // 0-1
    anxiety_level: number; // 0-1
    hope_level: number; // 0-1
    social_connection: number; // 0-1
  };
  needs_priority: {
    shelter: number; // 0-1
    food: number; // 0-1
    communication: number; // 0-1
    medical: number; // 0-1
    psychological: number; // 0-1
  };
  trauma_indicators: {
    severity: 'low' | 'medium' | 'high';
    recovery_trend: 'improving' | 'stable' | 'declining';
    last_assessment: Date;
  };
  social_context: {
    support_network_size: 'isolated' | 'limited' | 'moderate' | 'strong';
    family_connection: 'disconnected' | 'worried' | 'connected';
    trust_level: number; // 0-1
  };
  interaction_patterns: {
    response_frequency: number;
    engagement_depth: number;
    help_seeking_behavior: 'passive' | 'moderate' | 'active';
  };
}

export class PsychologicalProfileService {
  private static instance: PsychologicalProfileService;
  private questionPool: PopupQuestion[] = [];

  private constructor() {
    this.initializeQuestionPool();
  }

  public static getInstance(): PsychologicalProfileService {
    if (!PsychologicalProfileService.instance) {
      PsychologicalProfileService.instance = new PsychologicalProfileService();
    }
    return PsychologicalProfileService.instance;
  }

  private initializeQuestionPool(): void {
    this.questionPool = [
      // 1. Günlük Durum Değerlendirmesi
      {
        id: 'daily_mood_1',
        text: 'Bugün nasıldı senin için?',
        type: 'daily_mood',
        options: [
          { value: 'good', text: 'İyi', emotional_weight: 0.8 },
          { value: 'normal', text: 'Normal', emotional_weight: 0.0 },
          { value: 'difficult', text: 'Zor', emotional_weight: -0.6 }
        ],
        context_tags: ['daily_assessment', 'mood'],
        frequency: 'daily',
        priority_weight: 4
      },
      {
        id: 'daily_mood_2',
        text: 'Bugün en çok hangi kelime seni anlatır?',
        type: 'daily_mood',
        options: [
          { value: 'hopeful', text: 'Umudum var', emotional_weight: 0.9, category: 'hope' },
          { value: 'tired', text: 'Yorgunum', emotional_weight: -0.3, category: 'fatigue' },
          { value: 'scared', text: 'Korkuyorum', emotional_weight: -0.8, category: 'fear' },
          { value: 'grateful', text: 'Şükrediyorum', emotional_weight: 0.7, category: 'gratitude' }
        ],
        context_tags: ['emotional_state', 'self_perception'],
        frequency: 'daily',
        priority_weight: 5
      },

      // 2. İhtiyaç Değerlendirmesi
      {
        id: 'needs_1',
        text: 'Bugün seni en çok ne yordu?',
        type: 'needs_assessment',
        options: [
          { value: 'sleep', text: 'Uyku', category: 'physical' },
          { value: 'food', text: 'Yemek', category: 'physical' },
          { value: 'waiting', text: 'Beklemek', category: 'psychological' },
          { value: 'crowds', text: 'İnsan kalabalığı', category: 'social' },
          { value: 'no_news', text: 'Haber alamamak', category: 'communication' }
        ],
        context_tags: ['stress_factors', 'needs'],
        frequency: 'daily',
        priority_weight: 4
      },
      {
        id: 'needs_2',
        text: 'Şu an yanına sihirli bir kutu gelse içinde ne olsun isterdin?',
        type: 'needs_assessment',
        options: [
          { value: 'water', text: 'Su', category: 'survival' },
          { value: 'food', text: 'Yiyecek', category: 'survival' },
          { value: 'blanket', text: 'Battaniye', category: 'comfort' },
          { value: 'phone', text: 'Telefon', category: 'communication' },
          { value: 'medicine', text: 'İlaç', category: 'medical' }
        ],
        context_tags: ['immediate_needs', 'prioritization'],
        frequency: 'daily',
        priority_weight: 5
      },

      // 3. Sosyal Destek
      {
        id: 'social_1',
        text: 'Bugün yanında kim vardı?',
        type: 'social_support',
        options: [
          { value: 'family', text: 'Ailem', emotional_weight: 0.6 },
          { value: 'friends', text: 'Arkadaşlarım', emotional_weight: 0.5 },
          { value: 'alone', text: 'Yalnızdım', emotional_weight: -0.4 },
          { value: 'strangers', text: 'Tanımadıklarım', emotional_weight: -0.1 }
        ],
        context_tags: ['social_connection', 'isolation'],
        frequency: 'daily',
        priority_weight: 4
      },
      {
        id: 'social_2',
        text: 'Birini arayabilsen kime ulaşmak isterdin?',
        type: 'social_support',
        options: [
          { value: 'loved_one', text: 'Yakınım', category: 'family' },
          { value: 'doctor', text: 'Doktor', category: 'medical' },
          { value: 'official', text: 'Görevli', category: 'authority' },
          { value: 'no_one', text: 'Kimse', emotional_weight: -0.5 }
        ],
        context_tags: ['communication_needs', 'trust'],
        frequency: 'daily',
        priority_weight: 3
      },

      // 4. Psikolojik İyileşme
      {
        id: 'healing_1',
        text: 'Bugün seni biraz gülümseten bir şey oldu mu?',
        type: 'psychological_healing',
        options: [
          { value: 'yes', text: 'Evet', emotional_weight: 0.7 },
          { value: 'no', text: 'Hayır', emotional_weight: -0.3 }
        ],
        context_tags: ['positive_moments', 'resilience'],
        frequency: 'daily',
        priority_weight: 3
      },
      {
        id: 'healing_2',
        text: 'Şu an en çok hangi cümle sana iyi gelir?',
        type: 'psychological_healing',
        options: [
          { value: 'will_be_fine', text: 'Her şey düzelecek', category: 'hope' },
          { value: 'not_alone', text: 'Yalnız değilsin', category: 'connection' },
          { value: 'safe', text: 'Güvendesin', category: 'security' },
          { value: 'strong', text: 'Güçlüsün', category: 'empowerment' }
        ],
        context_tags: ['emotional_needs', 'coping'],
        frequency: 'daily',
        priority_weight: 4
      },

      // 5. Geleceğe Yönelik
      {
        id: 'future_1',
        text: 'Yarın için ne diliyorsun?',
        type: 'future_oriented',
        options: [
          { value: 'warm_meal', text: 'Sıcak yemek', category: 'basic_needs' },
          { value: 'health', text: 'Sağlık', category: 'wellbeing' },
          { value: 'news', text: 'Haber almak', category: 'information' },
          { value: 'silence', text: 'Sessizlik', category: 'peace' },
          { value: 'hope', text: 'Umut', category: 'emotional', emotional_weight: 0.8 }
        ],
        context_tags: ['future_planning', 'hopes'],
        frequency: 'daily',
        priority_weight: 3
      },
      {
        id: 'future_2',
        text: 'Bugün kendine 1 kelimelik not yazacak olsan ne olurdu?',
        type: 'future_oriented',
        options: [
          { value: 'text_input', text: '', category: 'free_text' }
        ],
        context_tags: ['self_reflection', 'emotional_expression'],
        frequency: 'weekly',
        priority_weight: 5
      }
    ];
  }

  // Kullanıcıya gösterilecek popup soruyu seç
  public async getPopupQuestion(userId: string): Promise<PopupQuestion | null> {
    try {
      // Kullanıcının son cevapladığı soruları al
      const recentResponses = await db.select()
        .from(userResponseSchema)
        .where(eq(userResponseSchema.userId, userId))
        .orderBy(desc(userResponseSchema.createdAt))
        .limit(10);

      // Son 24 saat içinde cevaplanan soruları filtrele
      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      
      const todaysQuestions = recentResponses.filter(response => 
        response.createdAt && new Date(response.createdAt) > yesterday
      ).map(r => r.questionId);

      // Henüz cevaplamadığı soruları bul
      const availableQuestions = this.questionPool.filter(q => 
        !todaysQuestions.includes(q.id)
      );

      if (availableQuestions.length === 0) {
        return null; // Bugün tüm sorular cevaplandı
      }

      // Öncelik ağırlığına göre soru seç
      const weightedQuestions = availableQuestions.map(q => ({
        question: q,
        weight: q.priority_weight * (Math.random() * 0.5 + 0.5) // Biraz rastgelelik ekle
      }));

      weightedQuestions.sort((a, b) => b.weight - a.weight);
      
      return weightedQuestions[0].question;

    } catch (error) {
      console.error('Popup soru seçme hatası:', error);
      return null;
    }
  }

  // Kullanıcı cevabını kaydet ve analiz et
  public async saveUserResponse(
    userId: string, 
    questionId: string, 
    answer: string, 
    metadata?: any
  ): Promise<void> {
    try {
      // Cevabı veritabanına kaydet
      await db.insert(userResponseSchema).values({
        userId,
        questionId,
        answer,
        metadata: JSON.stringify(metadata || {}),
        createdAt: new Date()
      });

      // Profil güncelleme için analiz yap
      await this.updateUserProfile(userId, questionId, answer);

    } catch (error) {
      console.error('Kullanıcı cevabı kaydetme hatası:', error);
    }
  }

  // Kullanıcı profilini güncelle
  private async updateUserProfile(userId: string, questionId: string, answer: string): Promise<void> {
    try {
      const question = this.questionPool.find(q => q.id === questionId);
      if (!question) return;

      const selectedOption = question.options.find(opt => opt.value === answer);
      if (!selectedOption) return;

      // Mevcut profili al veya yeni oluştur
      let profile = await this.getUserProfile(userId);
      if (!profile) {
        profile = this.createDefaultProfile(userId);
      }

      // Profili güncelle
      this.applyResponseToProfile(profile, question, selectedOption);

      // Veritabanına kaydet
      await this.saveUserProfile(profile);

    } catch (error) {
      console.error('Profil güncelleme hatası:', error);
    }
  }

  // Kullanıcı profilini al
  public async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      // Bu kısım veritabanı şeması tamamlandıktan sonra implement edilecek
      // Şimdilik null dönelim
      return null;
    } catch (error) {
      console.error('Profil alma hatası:', error);
      return null;
    }
  }

  // Varsayılan profil oluştur
  private createDefaultProfile(userId: string): UserProfile {
    return {
      userId,
      emotional_baseline: {
        positivity: 0.5,
        anxiety_level: 0.5,
        hope_level: 0.5,
        social_connection: 0.5
      },
      needs_priority: {
        shelter: 0.5,
        food: 0.5,
        communication: 0.5,
        medical: 0.5,
        psychological: 0.5
      },
      trauma_indicators: {
        severity: 'medium',
        recovery_trend: 'stable',
        last_assessment: new Date()
      },
      social_context: {
        support_network_size: 'moderate',
        family_connection: 'worried',
        trust_level: 0.5
      },
      interaction_patterns: {
        response_frequency: 0.5,
        engagement_depth: 0.5,
        help_seeking_behavior: 'moderate'
      }
    };
  }

  // Cevabı profile uygula
  private applyResponseToProfile(
    profile: UserProfile, 
    question: PopupQuestion, 
    selectedOption: any
  ): void {
    const weight = 0.1; // Günceleme ağırlığı (10%)

    // Duygusal durumu güncelle
    if (selectedOption.emotional_weight !== undefined) {
      const newValue = selectedOption.emotional_weight;
      
      if (question.type === 'daily_mood') {
        profile.emotional_baseline.positivity = this.weightedUpdate(
          profile.emotional_baseline.positivity, 
          (newValue + 1) / 2, // -1,1 araligindan 0,1 aralığına çevir
          weight
        );
      }
    }

    // Kategori bazlı güncellemeler
    if (selectedOption.category) {
      switch (selectedOption.category) {
        case 'fear':
          profile.emotional_baseline.anxiety_level = this.weightedUpdate(
            profile.emotional_baseline.anxiety_level, 0.8, weight
          );
          break;
        case 'hope':
          profile.emotional_baseline.hope_level = this.weightedUpdate(
            profile.emotional_baseline.hope_level, 0.8, weight
          );
          break;
        case 'survival':
          if (selectedOption.value === 'water' || selectedOption.value === 'food') {
            profile.needs_priority.food = this.weightedUpdate(
              profile.needs_priority.food, 0.9, weight
            );
          }
          break;
        case 'medical':
          profile.needs_priority.medical = this.weightedUpdate(
            profile.needs_priority.medical, 0.8, weight
          );
          break;
        case 'communication':
          profile.needs_priority.communication = this.weightedUpdate(
            profile.needs_priority.communication, 0.8, weight
          );
          break;
      }
    }

    // Sosyal bağlantı güncellemeleri
    if (question.type === 'social_support') {
      if (selectedOption.value === 'alone') {
        profile.social_context.support_network_size = 'isolated';
        profile.emotional_baseline.social_connection = this.weightedUpdate(
          profile.emotional_baseline.social_connection, 0.2, weight
        );
      } else if (selectedOption.value === 'family') {
        profile.social_context.family_connection = 'connected';
        profile.emotional_baseline.social_connection = this.weightedUpdate(
          profile.emotional_baseline.social_connection, 0.8, weight
        );
      }
    }
  }

  // Ağırlıklı güncelleme
  private weightedUpdate(currentValue: number, newValue: number, weight: number): number {
    const updated = currentValue * (1 - weight) + newValue * weight;
    return Math.max(0, Math.min(1, updated)); // 0-1 aralığında tut
  }

  // Profili kaydet (placeholder)
  private async saveUserProfile(profile: UserProfile): Promise<void> {
    // Bu kısım veritabanı şeması tamamlandıktan sonra implement edilecek
    console.log('Profil güncellendi:', profile.userId);
  }

  // Duygu analizi yap
  public async analyzeEmotionalState(userId: string, timeframe: 'daily' | 'weekly' | 'monthly' = 'weekly'): Promise<{
    emotional_trend: 'improving' | 'stable' | 'declining';
    risk_factors: string[];
    recommendations: string[];
  }> {
    try {
      // Son cevapları al
      const responses = await db.select()
        .from(userResponseSchema)
        .where(eq(userResponseSchema.userId, userId))
        .orderBy(desc(userResponseSchema.createdAt))
        .limit(timeframe === 'daily' ? 10 : timeframe === 'weekly' ? 50 : 200);

      // Trend analizi yap
      const emotionalScores = responses.map(response => {
        const question = this.questionPool.find(q => q.id === response.questionId);
        const option = question?.options.find(opt => opt.value === response.answer);
        return option?.emotional_weight || 0;
      });

      const recentScores = emotionalScores.slice(0, Math.floor(emotionalScores.length / 2));
      const olderScores = emotionalScores.slice(Math.floor(emotionalScores.length / 2));

      const recentAvg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
      const olderAvg = olderScores.reduce((a, b) => a + b, 0) / olderScores.length;

      let emotional_trend: 'improving' | 'stable' | 'declining' = 'stable';
      if (recentAvg > olderAvg + 0.1) emotional_trend = 'improving';
      else if (recentAvg < olderAvg - 0.1) emotional_trend = 'declining';

      // Risk faktörleri tespit et
      const risk_factors: string[] = [];
      if (recentAvg < -0.3) risk_factors.push('Yüksek negatif duygu durumu');
      if (responses.filter(r => r.answer === 'alone').length > 3) risk_factors.push('Sosyal izolasyon');
      if (responses.filter(r => r.answer === 'scared').length > 2) risk_factors.push('Yüksek korku seviyesi');

      // Öneriler oluştur
      const recommendations: string[] = [];
      if (emotional_trend === 'declining') recommendations.push('Psikolojik destek talep etmeyi düşünün');
      if (risk_factors.includes('Sosyal izolasyon')) recommendations.push('Çevrenizle iletişim kurmaya çalışın');
      if (risk_factors.includes('Yüksek korku seviyesi')) recommendations.push('Nefes egzersizleri ve sakinleşme tekniklerini uygulayın');

      return {
        emotional_trend,
        risk_factors,
        recommendations
      };

    } catch (error) {
      console.error('Duygu analizi hatası:', error);
      return {
        emotional_trend: 'stable',
        risk_factors: [],
        recommendations: []
      };
    }
  }
}

export const psychologicalProfileService = PsychologicalProfileService.getInstance();
