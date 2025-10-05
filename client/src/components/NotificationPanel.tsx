/**
 * Bildirim Paneli - Popup sorular ve günlük check-in sistemi
 */

import React, { useState, useEffect } from 'react';
import { X, Heart, CheckCircle, MessageCircle, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import PopupQuestionModal from './PopupQuestionModal';
import usePopupQuestions from '@/hooks/usePopupQuestions';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

interface Notification {
  id: string;
  type: 'question' | 'reminder' | 'support';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  actionRequired?: boolean;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({
  isOpen,
  onClose,
  userId
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showQuestionModal, setShowQuestionModal] = useState(false);

  const {
    canShowQuestion,
    dailyCount,
    dailyLimit,
    onQuestionAnswered,
    triggerQuestion,
    debugInfo
  } = usePopupQuestions({
    userId,
    enabled: true,
    minIntervalMinutes: 60,
    maxIntervalMinutes: 180,
    dailyLimit: 3
  });

  // Bildirimleri oluştur
  useEffect(() => {
    const generateNotifications = () => {
      const notifs: Notification[] = [];

      // Günlük soru durumu bildirimi
      if (canShowQuestion) {
        notifs.push({
          id: 'daily-question',
          type: 'question',
          title: '💙 Bugün nasılsın?',
          message: 'Kısa bir soru cevaplayarak bize durumunu bildirebilirsin',
          timestamp: new Date(),
          isRead: false,
          actionRequired: true
        });
      }

      // Günlük soru tamamlandı bildirimi
      if (dailyCount >= dailyLimit) {
        notifs.push({
          id: 'questions-complete',
          type: 'support',
          title: '✅ Günlük sorular tamamlandı',
          message: 'Teşekkürler! Bugünkü sorularını tamamladın. Yarın yeni sorularla görüşürüz.',
          timestamp: new Date(),
          isRead: false
        });
      }

      // Destek mesajları
      if (dailyCount > 0) {
        notifs.push({
          id: 'support-message',
          type: 'support',
          title: '🤗 Sen değerlisin',
          message: 'Bugün kendine zaman ayırdığın için teşekkürler. Buradayız ve seninle birlikteyiz.',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 saat önce
          isRead: false
        });
      }

      // Genel hatırlatma
      notifs.push({
        id: 'general-reminder',
        type: 'reminder',
        title: '🌟 Unutma',
        message: 'Acil durumlarda 112\'yi arayabilir, konumunu paylaşabilirsin.',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 saat önce
        isRead: true
      });

      setNotifications(notifs);
    };

    if (isOpen) {
      generateNotifications();
    }
  }, [isOpen, canShowQuestion, dailyCount, dailyLimit]);

  const handleQuestionClick = () => {
    setShowQuestionModal(true);
    markAsRead('daily-question');
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, isRead: true }
          : notif
      )
    );
  };

  const handleQuestionAnswered = (questionId: string, answer: string) => {
    onQuestionAnswered(questionId, answer);
    setShowQuestionModal(false);
    
    // Notification listesini güncelle
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== 'daily-question'));
    }, 500);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'question':
        return <MessageCircle className="h-5 w-5 text-blue-500" />;
      case 'support':
        return <Heart className="h-5 w-5 text-pink-500" />;
      case 'reminder':
        return <Clock className="h-5 w-5 text-orange-500" />;
      default:
        return <MessageCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (hours > 0) {
      return `${hours} saat önce`;
    } else if (minutes > 0) {
      return `${minutes} dakika önce`;
    } else {
      return 'Şimdi';
    }
  };

  if (!isOpen) return null;


  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-[100]" onClick={onClose} />}
      <div className="fixed top-16 right-24 w-80 h-96 bg-white rounded-lg shadow-2xl z-[110] flex flex-col border border-gray-200">
        {/* Arrow pointing to bell icon */}
        <div className="absolute -top-2 right-24 w-4 h-4 bg-white transform rotate-45 border-l border-t border-gray-200"></div>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            <h3 className="font-semibold text-gray-800">Bildirimler</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-2">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Heart className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Henüz bildirim yok</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <Card 
                  key={notification.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    !notification.isRead ? 'border-blue-200 bg-blue-50/50' : 'border-gray-200'
                  }`}
                  onClick={() => {
                    if (notification.id === 'daily-question') {
                      handleQuestionClick();
                    } else {
                      markAsRead(notification.id);
                    }
                  }}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-800 truncate">
                            {notification.title}
                          </h4>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-400">
                            {formatTime(notification.timestamp)}
                          </span>
                          {notification.actionRequired && (
                            <Button size="sm" variant="outline" className="h-6 text-xs">
                              Cevapla
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Footer - Debug Info (sadece development için) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="p-2 border-t border-gray-200 bg-gray-50 text-xs text-gray-500">
            <div>Günlük: {dailyCount}/{dailyLimit}</div>
            <div>Soru gösterilebilir: {canShowQuestion ? 'Evet' : 'Hayır'}</div>
            {debugInfo.nextQuestionTime && (
              <div>Sonraki: {debugInfo.nextQuestionTime.toLocaleTimeString()}</div>
            )}
          </div>
        )}
      </div>

      {/* Popup Question Modal */}
      <PopupQuestionModal
        userId={userId}
        isOpen={showQuestionModal}
        onClose={() => setShowQuestionModal(false)}
        onAnswer={handleQuestionAnswered}
      />
    </>
  );
};

export default NotificationPanel;
