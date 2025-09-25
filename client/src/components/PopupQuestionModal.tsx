/**
 * Popup Soru Modal Komponenti
 * Kullanıcıya günlük sorular sorar ve gizli profil oluşturur
 */

import React, { useState, useEffect } from 'react';
import { X, Heart } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Textarea } from './ui/textarea';

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

interface PopupQuestionModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onAnswer: (questionId: string, answer: string) => void;
}

export const PopupQuestionModal: React.FC<PopupQuestionModalProps> = ({
  userId,
  isOpen,
  onClose,
  onAnswer
}) => {
  const [currentQuestion, setCurrentQuestion] = useState<PopupQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [freeTextAnswer, setFreeTextAnswer] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal açıldığında soru yükle
  useEffect(() => {
    if (isOpen && !currentQuestion) {
      loadQuestion();
    }
  }, [isOpen, currentQuestion]);

  const loadQuestion = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/psychological/popup-question/${userId}`);
      const data = await response.json();
      
      if (data.success && data.question) {
        setCurrentQuestion(data.question);
        setSelectedAnswer('');
        setFreeTextAnswer('');
      } else {
        // Bugün tüm sorular cevaplandı
        onClose();
      }
    } catch (error) {
      console.error('Soru yükleme hatası:', error);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!currentQuestion) return;
    
    const answer = currentQuestion.options[0]?.value === 'text_input' 
      ? freeTextAnswer 
      : selectedAnswer;
    
    if (!answer.trim()) return;

    try {
      setIsSubmitting(true);
      
      const response = await fetch('/api/psychological/save-response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          questionId: currentQuestion.id,
          answer,
          metadata: {
            timestamp: new Date().toISOString(),
            questionType: currentQuestion.type
          }
        })
      });

      if (response.ok) {
        onAnswer(currentQuestion.id, answer);
        
        // Kısa bir teşekkür mesajı göster
        setCurrentQuestion({
          id: 'thanks',
          text: 'Teşekkürler! Bu bilgiler sana daha iyi yardım etmemizi sağlıyor. 💙',
          type: 'thanks',
          options: [],
          frequency: ''
        });
        
        // 2 saniye sonra kapat
        setTimeout(() => {
          onClose();
          setCurrentQuestion(null);
        }, 2000);
      }
    } catch (error) {
      console.error('Cevap gönderme hatası:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    onClose();
    setCurrentQuestion(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-white dark:bg-gray-800 animate-in fade-in-0 zoom-in-95">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              <CardTitle className="text-lg">Bir dakikana...</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-600 mt-2">Yükleniyor...</p>
            </div>
          ) : currentQuestion ? (
            <>
              {currentQuestion.id === 'thanks' ? (
                <div className="text-center py-4">
                  <Heart className="h-8 w-8 text-red-500 mx-auto mb-2" />
                  <p className="text-gray-700 dark:text-gray-300">
                    {currentQuestion.text}
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <p className="text-gray-700 dark:text-gray-300 text-sm mb-3">
                      {currentQuestion.text}
                    </p>
                  </div>

                  {/* Çoktan seçmeli sorular */}
                  {currentQuestion.options[0]?.value !== 'text_input' && (
                    <div className="space-y-2">
                      {currentQuestion.options.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setSelectedAnswer(option.value)}
                          className={`w-full p-3 text-left rounded-lg border transition-all ${
                            selectedAnswer === option.value
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                              : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                          }`}
                        >
                          <span className="text-sm">{option.text}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Serbest metin sorular */}
                  {currentQuestion.options[0]?.value === 'text_input' && (
                    <div>
                      <Textarea
                        value={freeTextAnswer}
                        onChange={(e) => setFreeTextAnswer(e.target.value)}
                        placeholder="Düşüncelerini buraya yazabilirsin..."
                        className="w-full"
                        rows={3}
                      />
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      onClick={handleSkip}
                      className="flex-1"
                    >
                      Geç
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={
                        isSubmitting || 
                        (currentQuestion.options[0]?.value === 'text_input' 
                          ? !freeTextAnswer.trim() 
                          : !selectedAnswer)
                      }
                      className="flex-1"
                    >
                      {isSubmitting ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        'Gönder'
                      )}
                    </Button>
                  </div>

                  <p className="text-xs text-gray-500 text-center">
                    Bu sorular sana daha iyi yardım etmemiz için 💙
                  </p>
                </>
              )}
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-600">Şu an soru bulunmuyor.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PopupQuestionModal;
