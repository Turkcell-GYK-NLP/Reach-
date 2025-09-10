import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ThumbsUp, ThumbsDown, Star, TrendingUp, MapPin, Wifi, AlertTriangle } from 'lucide-react';

interface RecommendationData {
  actionId: string;
  type: 'location' | 'network' | 'emergency' | 'notification';
  title: string;
  description: string;
  confidence: number;
  reasoning: string;
  alternatives: Array<{
    id: string;
    title: string;
    confidence: number;
  }>;
  metadata: {
    contextKey: string;
    timestamp: string;
    userId: string;
  };
}

interface RecommendationEngineProps {
  recommendationData?: RecommendationData;
  userId: string;
  userContext?: any;
  onFeedback?: (actionId: string, reward: number) => void;
}

const typeIcons = {
  location: MapPin,
  network: Wifi,
  emergency: AlertTriangle,
  notification: TrendingUp
};

const typeColors = {
  location: 'bg-blue-100 text-blue-800',
  network: 'bg-green-100 text-green-800',
  emergency: 'bg-red-100 text-red-800',
  notification: 'bg-purple-100 text-purple-800'
};

export function RecommendationEngine({ 
  recommendationData, 
  userId, 
  userContext, 
  onFeedback 
}: RecommendationEngineProps) {
  const [feedbackGiven, setFeedbackGiven] = useState<string | null>(null);
  const [performance, setPerformance] = useState<any>(null);

  useEffect(() => {
    if (recommendationData) {
      setFeedbackGiven(null);
    }
  }, [recommendationData]);

  useEffect(() => {
    // Model performansını al
    fetchPerformance();
  }, []);

  const fetchPerformance = async () => {
    try {
      const response = await fetch('/api/recommendation/performance');
      if (response.ok) {
        const data = await response.json();
        setPerformance(data);
      }
    } catch (error) {
      console.error('Performance fetch error:', error);
    }
  };

  const handleFeedback = async (actionId: string, reward: number) => {
    try {
      const response = await fetch('/api/recommendation/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          actionId,
          reward,
          userContext
        })
      });

      if (response.ok) {
        setFeedbackGiven(actionId);
        onFeedback?.(actionId, reward);
        // Performansı yenile
        fetchPerformance();
      }
    } catch (error) {
      console.error('Feedback error:', error);
    }
  };

  if (!recommendationData) {
    return null;
  }

  const TypeIcon = typeIcons[recommendationData.type];
  const typeColor = typeColors[recommendationData.type];

  return (
    <div className="space-y-4">
      {/* Ana Öneri */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TypeIcon className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">🤖 Kişiselleştirilmiş Öneri</CardTitle>
            </div>
            <Badge className={typeColor}>
              {recommendationData.type.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold text-lg">{recommendationData.title}</h3>
              <p className="text-gray-600 text-sm mt-1">{recommendationData.description}</p>
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4" />
                <span>Güven: %{Math.round(recommendationData.confidence * 100)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <TrendingUp className="h-4 w-4" />
                <span>RL Motoru</span>
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>Gerekçe:</strong> {recommendationData.reasoning}
              </p>
            </div>

            {/* Feedback Butonları */}
            {!feedbackGiven && (
              <div className="flex space-x-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleFeedback(recommendationData.actionId, 1)}
                  className="flex items-center space-x-1 text-green-600 hover:text-green-700"
                >
                  <ThumbsUp className="h-4 w-4" />
                  <span>Faydalı</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleFeedback(recommendationData.actionId, 0)}
                  className="flex items-center space-x-1 text-red-600 hover:text-red-700"
                >
                  <ThumbsDown className="h-4 w-4" />
                  <span>Faydasız</span>
                </Button>
              </div>
            )}

            {feedbackGiven === recommendationData.actionId && (
              <div className="text-sm text-green-600 font-medium">
                ✅ Geri bildiriminiz kaydedildi!
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Alternatif Öneriler */}
      {recommendationData.alternatives && recommendationData.alternatives.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-md">💡 Alternatif Öneriler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recommendationData.alternatives.map((alt, index) => (
                <div key={alt.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm font-medium">{alt.title}</span>
                  <Badge variant="secondary">
                    %{Math.round(alt.confidence * 100)} güven
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Model Performansı */}
      {performance && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-md flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>RL Model Performansı</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="font-semibold text-lg text-blue-600">
                  {performance.totalInteractions || 0}
                </div>
                <div className="text-gray-600">Toplam Etkileşim</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-lg text-green-600">
                  %{Math.round((performance.averageReward || 0) * 100)}
                </div>
                <div className="text-gray-600">Ortalama Memnuniyet</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-lg text-purple-600">
                  {performance.uniqueUsers || 0}
                </div>
                <div className="text-gray-600">Benzersiz Kullanıcı</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-lg text-orange-600">
                  {performance.contextKeys || 0}
                </div>
                <div className="text-gray-600">Context Türü</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
