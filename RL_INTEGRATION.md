# 🤖 Reinforcement Learning Öneri Motoru Entegrasyonu

## 📋 Genel Bakış

REACH+ projesine **Contextual Multi-Armed Bandit (CMAB)** tabanlı reinforcement learning öneri motoru başarıyla entegre edilmiştir. Bu sistem, kullanıcı etkileşimlerinden öğrenerek kişiselleştirilmiş öneriler sunar.

## 🎯 Neden Contextual Multi-Armed Bandit?

### Afet Yönetimi Bağlamında Avantajları:
- **Hızlı Karar Verme**: Acil durumlarda anlık öneriler
- **Düşük Veri Gereksinimi**: Başlangıçta az veriyle çalışabilir
- **Gerçek Zamanlı Öğrenme**: Kullanıcı feedback'lerinden anlık öğrenme
- **Kişiselleştirme**: Kullanıcı context'ine göre özelleştirilmiş öneriler
- **Exploration vs Exploitation**: Yeni öneriler keşfetme ve mevcut başarılı önerileri kullanma dengesi

## 🏗️ Mimari

### 1. RecommendationTool (`server/agents/tools/recommendationTool.ts`)
- **Contextual Bandit Algoritması**: UCB1 (Upper Confidence Bound) exploration bonus
- **Context Features**: Konum, operatör, yaş, acil durum seviyesi, zaman
- **Action Types**: Konum, şebeke, acil durum, bildirim önerileri
- **Feedback System**: Kullanıcı memnuniyet skorları (0-1 arası)

### 2. CoreAgent Entegrasyonu
- **Tool Registration**: RecommendationTool otomatik olarak tool listesine eklenir
- **Response Enhancement**: RL önerileri diğer tool sonuçlarıyla birleştirilir
- **Context Integration**: Kullanıcı context'i RL motoruna aktarılır

### 3. Frontend Bileşeni (`client/src/components/RecommendationEngine.tsx`)
- **Görsel Gösterim**: RL önerilerini kullanıcı dostu arayüzde sunar
- **Feedback Interface**: Kullanıcılar önerileri değerlendirebilir
- **Performance Metrics**: Model performansını gerçek zamanlı gösterir

## 🔧 Teknik Detaylar

### Context Features
```typescript
interface RecommendationContext {
  userId: string;
  location: { district: string; city: string; };
  operator?: string;
  age?: number;
  emergencyLevel: 'low' | 'medium' | 'high' | 'critical';
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  userPreferences: Record<string, any>;
}
```

### Action Types
- **location**: Güvenli alan önerileri
- **network**: Operatör ve şebeke önerileri  
- **emergency**: Acil durum aksiyonları
- **notification**: Bildirim tercihleri

### Reward Function
- **1.0**: Kullanıcı "Faydalı" olarak işaretledi
- **0.0**: Kullanıcı "Faydasız" olarak işaretledi
- **Implicit**: Kullanıcı öneriyi takip etti (gelecekte eklenebilir)

## 🚀 Kullanım

### 1. Otomatik Öneri Üretimi
RL motoru her chat mesajında otomatik olarak çalışır ve uygun öneriler üretir:

```bash
# Örnek API çağrısı
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "message": "Kadıköy'\''de güvenli alanlar nerede?",
    "userContext": {
      "location": {"district": "Kadıköy", "city": "İstanbul"},
      "operator": "Turkcell",
      "age": 25
    }
  }'
```

### 2. Feedback Gönderme
Kullanıcılar önerileri değerlendirebilir:

```bash
# Feedback gönderme
curl -X POST http://localhost:5000/api/recommendation/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "actionId": "safe_area_Kadıköy",
    "reward": 0.8,
    "userContext": {...}
  }'
```

### 3. Performans İzleme
Model performansını gerçek zamanlı izleyin:

```bash
# Performans metrikleri
curl http://localhost:5000/api/recommendation/performance
```

## 📊 Performans Metrikleri

### Temel Metrikler
- **totalInteractions**: Toplam kullanıcı etkileşimi sayısı
- **averageReward**: Ortalama kullanıcı memnuniyet skoru
- **uniqueUsers**: Benzersiz kullanıcı sayısı
- **contextKeys**: Farklı context kombinasyonu sayısı

### Gelişmiş Metrikler (Gelecekte)
- **Click-through Rate (CTR)**: Öneri tıklama oranı
- **Conversion Rate**: Öneri takip etme oranı
- **User Retention**: RL önerileriyle kullanıcı geri dönüş oranı

## 🧪 Test Etme

### Otomatik Test
```bash
# Test scriptini çalıştır
node test_rl_integration.js
```

### Manuel Test Senaryoları
1. **Konum Bazlı Öneriler**: "Kadıköy'de güvenli alanlar nerede?"
2. **Şebeke Önerileri**: "Şebeke durumu nasıl?"
3. **Acil Durum Önerileri**: "Deprem oldu, ne yapmalıyım?"
4. **Bildirim Önerileri**: "Bildirim ayarlarını nasıl yapabilirim?"

## 🔮 Gelecek Geliştirmeler

### 1. Gelişmiş RL Algoritmaları
- **Deep Q-Networks (DQN)**: Daha karmaşık pattern'leri öğrenme
- **Actor-Critic Methods**: Daha stabil öğrenme
- **Multi-Armed Bandit with Neural Networks**: Derin öğrenme entegrasyonu

### 2. Zenginleştirilmiş Context
- **Temporal Context**: Geçmiş etkileşim geçmişi
- **Social Context**: Benzer kullanıcı davranışları
- **Environmental Context**: Hava durumu, trafik, afet durumu

### 3. Çoklu Hedef Optimizasyonu
- **Multi-Objective RL**: Birden fazla hedefi aynı anda optimize etme
- **Hierarchical RL**: Farklı seviyelerde öneri hiyerarşisi

### 4. Gerçek Zamanlı Adaptasyon
- **Online Learning**: Model sürekli güncellenir
- **A/B Testing**: Farklı algoritmaları karşılaştırma
- **Dynamic Exploration**: Context'e göre exploration stratejisi

## 📈 Başarı Kriterleri

### Kısa Vadeli (1-3 ay)
- [x] RL motoru entegrasyonu tamamlandı
- [x] Temel feedback sistemi çalışıyor
- [x] Frontend bileşeni hazır
- [ ] 100+ kullanıcı etkileşimi toplandı

### Orta Vadeli (3-6 ay)
- [ ] %70+ kullanıcı memnuniyet oranı
- [ ] 5+ farklı context türü
- [ ] A/B testing sistemi
- [ ] Gelişmiş performans metrikleri

### Uzun Vadeli (6+ ay)
- [ ] Deep RL algoritmaları
- [ ] Çoklu hedef optimizasyonu
- [ ] Gerçek zamanlı model güncelleme
- [ ] Production-ready scaling

## 🛠️ Geliştirici Notları

### Dosya Yapısı
```
server/agents/tools/
├── recommendationTool.ts          # Ana RL motoru
└── baseTool.ts                    # Base tool interface

client/src/components/
├── RecommendationEngine.tsx       # Frontend bileşeni
└── ChatInterface.tsx              # Entegrasyon noktası

server/
├── agents/coreAgent.ts            # RL entegrasyonu
└── routes.ts                      # API endpoints
```

### API Endpoints
- `POST /api/chat` - RL önerileriyle chat
- `POST /api/recommendation/feedback` - Feedback gönderme
- `GET /api/recommendation/performance` - Performans metrikleri

### Environment Variables
```bash
# RL motoru için gerekli değişkenler (opsiyonel)
RL_EXPLORATION_FACTOR=2.0          # Exploration vs exploitation dengesi
RL_MIN_INTERACTIONS=10             # Minimum etkileşim sayısı
RL_CONFIDENCE_THRESHOLD=0.7        # Güven eşiği
```

## 🎉 Sonuç

REACH+ projesine başarıyla entegre edilen RL tabanlı öneri motoru, afet yönetimi bağlamında kişiselleştirilmiş ve öğrenen bir sistem sunmaktadır. Sistem, kullanıcı etkileşimlerinden öğrenerek sürekli kendini geliştirir ve her kullanıcıya özel öneriler sunar.

Bu entegrasyon, projenin dokümanında belirtilen "reinforcement tabanlı öneri motoru" gereksinimini karşılamakta ve gelecekte daha da geliştirilebilir bir temel oluşturmaktadır.

---

**Doküman Versiyonu**: 1.0  
**Son Güncelleme**: Bugün  
**Hazırlayan**: AI Assistant  
**Durum**: ✅ Tamamlandı
