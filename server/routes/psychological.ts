/**
 * Psikolojik Profil API Routes
 * Popup sorular ve profil yönetimi için endpoint'ler
 */

import { Router } from 'express';
import { psychologicalProfileService } from '../services/psychologicalProfileService.js';

const router = Router();

// Popup soru al
router.get('/popup-question/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID gerekli' });
    }

    const question = await psychologicalProfileService.getPopupQuestion(userId);
    
    if (!question) {
      return res.json({ 
        message: 'Bugün tüm sorular cevaplandı',
        question: null 
      });
    }

    res.json({
      success: true,
      question: {
        id: question.id,
        text: question.text,
        type: question.type,
        options: question.options.map(opt => ({
          value: opt.value,
          text: opt.text,
          // emotional_weight'i client'a gönderme (gizli kalmalı)
        })),
        frequency: question.frequency
      }
    });

  } catch (error) {
    console.error('Popup soru alma hatası:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Kullanıcı cevabını kaydet
router.post('/save-response', async (req, res) => {
  try {
    const { userId, questionId, answer, metadata } = req.body;

    if (!userId || !questionId || !answer) {
      return res.status(400).json({ error: 'Eksik parametreler' });
    }

    await psychologicalProfileService.saveUserResponse(
      userId, 
      questionId, 
      answer, 
      metadata
    );

    res.json({
      success: true,
      message: 'Cevap kaydedildi'
    });

  } catch (error) {
    console.error('Cevap kaydetme hatası:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Kullanıcı profil özeti al (sadece genel bilgiler)
router.get('/profile-summary/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const profile = await psychologicalProfileService.getUserProfile(userId);
    
    if (!profile) {
      return res.json({
        success: true,
        summary: {
          engagement_level: 'new_user',
          general_mood: 'unknown',
          support_level: 'assessing'
        }
      });
    }

    // Sadece genel bilgileri döndür (detaylı analiz bilgilerini gizle)
    res.json({
      success: true,
      summary: {
        engagement_level: profile.interaction_patterns.response_frequency > 0.7 ? 'high' : 
                         profile.interaction_patterns.response_frequency > 0.4 ? 'medium' : 'low',
        general_mood: profile.emotional_baseline.positivity > 0.6 ? 'positive' : 
                     profile.emotional_baseline.positivity > 0.4 ? 'neutral' : 'challenging',
        support_level: profile.social_context.support_network_size === 'strong' ? 'good' :
                      profile.social_context.support_network_size === 'moderate' ? 'fair' : 'needs_attention'
      }
    });

  } catch (error) {
    console.error('Profil özeti alma hatası:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Duygu analizi al (sadmin/personel için)
router.get('/emotional-analysis/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { timeframe = 'weekly' } = req.query;

    // TODO: Yetkilendirme kontrolü ekle (sadece yetkili personel)
    
    const analysis = await psychologicalProfileService.analyzeEmotionalState(
      userId, 
      timeframe as 'daily' | 'weekly' | 'monthly'
    );

    res.json({
      success: true,
      analysis
    });

  } catch (error) {
    console.error('Duygu analizi hatası:', error);
    res.status(500).json({ error: 'Sunucu hatası' });  
  }
});

// Toplu profil istatistikleri (admin için)
router.get('/admin/statistics', async (req, res) => {
  try {
    // TODO: Admin yetkilendirmesi kontrolü
    
    // Bu endpoint aggregate istatistikler sağlayacak
    // Örnek: günlük aktif kullanıcılar, genel mood dağılımı vs.
    
    res.json({
      success: true,
      statistics: {
        active_users_today: 0,
        mood_distribution: {
          positive: 0,
          neutral: 0,
          challenging: 0
        },
        engagement_metrics: {
          daily_responses: 0,
          average_response_rate: 0
        }
      }
    });

  } catch (error) {
    console.error('İstatistik alma hatası:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

export default router;
