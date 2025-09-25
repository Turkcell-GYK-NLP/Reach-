/**
 * Popup Questions Hook
 * Kullanıcı sorularını yönetir ve zamanlama mantığını sağlar
 */

import { useState, useEffect, useCallback } from 'react';

interface PopupQuestion {
  id: string;
  text: string;
  type: string;
  options: Array<{
    value: string;
    text: string;
  }>;
  frequency: string;
}

interface UsePopupQuestionsConfig {
  userId: string;
  enabled?: boolean;
  minIntervalMinutes?: number; // Sorular arası minimum süre
  maxIntervalMinutes?: number; // Sorular arası maksimum süre
  dailyLimit?: number; // Günlük maksimum soru sayısı
}

export const usePopupQuestions = ({
  userId,
  enabled = true,
  minIntervalMinutes = 60, // 1 saat
  maxIntervalMinutes = 240, // 4 saat
  dailyLimit = 3
}: UsePopupQuestionsConfig) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nextQuestionTime, setNextQuestionTime] = useState<Date | null>(null);
  const [dailyCount, setDailyCount] = useState(0);
  const [lastQuestionDate, setLastQuestionDate] = useState<string | null>(null);

  // LocalStorage keys
  const STORAGE_KEYS = {
    nextQuestionTime: `popup_next_${userId}`,
    dailyCount: `popup_count_${userId}`,
    lastDate: `popup_date_${userId}`
  };

  // İlk yükleme - localStorage'dan durumu al
  useEffect(() => {
    if (!enabled || !userId) return;

    const savedNextTime = localStorage.getItem(STORAGE_KEYS.nextQuestionTime);
    const savedDailyCount = localStorage.getItem(STORAGE_KEYS.dailyCount);
    const savedLastDate = localStorage.getItem(STORAGE_KEYS.lastDate);

    const today = new Date().toDateString();

    // Yeni gün başladıysa sayaçları sıfırla
    if (savedLastDate !== today) {
      setDailyCount(0);
      setLastQuestionDate(today);
      localStorage.setItem(STORAGE_KEYS.dailyCount, '0');
      localStorage.setItem(STORAGE_KEYS.lastDate, today);
      
      // İlk soru için zaman ayarla (1-3 saat arası)
      const firstQuestionDelay = Math.random() * (180 - 60) + 60; // 1-3 saat
      const nextTime = new Date(Date.now() + firstQuestionDelay * 60 * 1000);
      setNextQuestionTime(nextTime);
      localStorage.setItem(STORAGE_KEYS.nextQuestionTime, nextTime.toISOString());
    } else {
      // Mevcut gün devam ediyor
      setDailyCount(parseInt(savedDailyCount || '0'));
      setLastQuestionDate(savedLastDate);
      
      if (savedNextTime) {
        setNextQuestionTime(new Date(savedNextTime));
      }
    }
  }, [enabled, userId]);

  // Zamanlayıcı - her dakika kontrol et
  useEffect(() => {
    if (!enabled || !nextQuestionTime || dailyCount >= dailyLimit) return;

    const interval = setInterval(() => {
      const now = new Date();
      if (now >= nextQuestionTime && !isModalOpen) {
        setIsModalOpen(true);
      }
    }, 60000); // Her dakika kontrol et

    // İlk kontrol (hemen)
    const now = new Date();
    if (now >= nextQuestionTime && !isModalOpen) {
      setIsModalOpen(true);
    }

    return () => clearInterval(interval);
  }, [enabled, nextQuestionTime, dailyCount, dailyLimit, isModalOpen]);

  // Sonraki soru zamanını hesapla
  const scheduleNextQuestion = useCallback(() => {
    const now = new Date();
    const randomInterval = Math.random() * (maxIntervalMinutes - minIntervalMinutes) + minIntervalMinutes;
    const nextTime = new Date(now.getTime() + randomInterval * 60 * 1000);
    
    setNextQuestionTime(nextTime);
    localStorage.setItem(STORAGE_KEYS.nextQuestionTime, nextTime.toISOString());
  }, [minIntervalMinutes, maxIntervalMinutes, STORAGE_KEYS.nextQuestionTime]);

  // Soru cevaplandığında çağırılır
  const handleQuestionAnswered = useCallback((questionId: string, answer: string) => {
    const newCount = dailyCount + 1;
    setDailyCount(newCount);
    setIsModalOpen(false);
    
    localStorage.setItem(STORAGE_KEYS.dailyCount, newCount.toString());
    
    // Günlük limite ulaşmadıysa sonraki soruyu programla
    if (newCount < dailyLimit) {
      scheduleNextQuestion();
    } else {
      // Günlük limit doldu, sonraki günü bekle
      setNextQuestionTime(null);
      localStorage.removeItem(STORAGE_KEYS.nextQuestionTime);
    }

    // Analytics için event gönder (opsiyonel)
    try {
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'popup_question_answered', {
          question_id: questionId,
          answer_type: answer,
          user_id: userId,
          daily_count: newCount
        });
      }
    } catch (error) {
      // Analytics hatası önemli değil
    }
  }, [dailyCount, dailyLimit, scheduleNextQuestion, STORAGE_KEYS.dailyCount, userId]);

  // Modal kapatıldığında (cevaplamadan)
  const handleModalClosed = useCallback(() => {
    setIsModalOpen(false);
    
    // Cevaplamadan kapatıldıysa kısa süre sonra tekrar sor (30-60 dk)
    const shortInterval = Math.random() * 30 + 30; // 30-60 dakika
    const nextTime = new Date(Date.now() + shortInterval * 60 * 1000);
    
    setNextQuestionTime(nextTime);
    localStorage.setItem(STORAGE_KEYS.nextQuestionTime, nextTime.toISOString());
  }, [STORAGE_KEYS.nextQuestionTime]);

  // Manuel soru tetikleme (test için)
  const triggerQuestion = useCallback(() => {
    if (dailyCount < dailyLimit) {
      setIsModalOpen(true);
    }
  }, [dailyCount, dailyLimit]);

  // Durumu sıfırla (test için)
  const resetState = useCallback(() => {
    setDailyCount(0);
    setIsModalOpen(false);
    setNextQuestionTime(null);
    
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }, [STORAGE_KEYS]);

  // Debug bilgileri
  const debugInfo = {
    isModalOpen,
    nextQuestionTime,
    dailyCount,
    dailyLimit,
    lastQuestionDate,
    enabled,
    timeUntilNext: nextQuestionTime ? Math.max(0, nextQuestionTime.getTime() - Date.now()) : null
  };

  return {
    isModalOpen,
    dailyCount,
    dailyLimit,
    canShowQuestion: enabled && dailyCount < dailyLimit,
    nextQuestionTime,
    onQuestionAnswered: handleQuestionAnswered,
    onModalClosed: handleModalClosed,
    triggerQuestion,
    resetState, // Development için
    debugInfo // Development için
  };
};

export default usePopupQuestions;
