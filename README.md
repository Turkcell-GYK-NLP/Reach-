# REACH+ - Afet Sonrası AI Destekli Rehberlik Platformu

REACH+, deprem ve afet sonrası gençlere **Agentic AI** destekli rehberlik sağlayan, sosyal medya verilerini analiz eden Türkçe platformdur.

## 🚀 Özellikler

- **🤖 Agentic AI Sistemi**: Multi-agent koordinasyonu ile akıllı yanıtlar
- **📍 Konum Tool**: GPS, manuel konum ve güvenli alan bilgileri
- **📡 Şebeke Tool**: Türk Telekom, Vodafone, Turkcell kapsama analizi
- **🐦 Sosyal Medya Tool**: X (Twitter) API ile afet tweetleri ve sentiment analizi
- **🚨 Acil Durum Tool**: Anlık uyarı ve güvenlik protokolleri
- **📱 Bildirim Tool**: SMS, push notification ve e-posta servisleri
- **🔍 Web Search Tool**: Gerçek zamanlı web araması ve veri toplama
- **🧠 Memory Store**: Kullanıcı context'i ve konuşma geçmişi
- **🎯 Supervisor Agent**: Multi-agent koordinasyonu ve karar verme

## 🛠️ Teknoloji Stack

- **Backend**: Node.js, Express.js, TypeScript
- **Frontend**: React, Vite, TailwindCSS, shadcn/ui
- **AI**: OpenAI GPT-4o + Agentic Architecture
- **Agent Framework**: LangChain, CrewAI
- **Sosyal Medya**: Twitter API v2
- **Veritabanı**: PostgreSQL + Drizzle ORM
- **Memory**: In-memory store + Database persistence

## 📋 Kurulum Gereksinimleri

- **Node.js** v18+ 
- **npm** veya **yarn**
- **Git**

## 🔧 Yerel Kurulum

### 1. Projeyi İndirin
```bash
# ZIP dosyasını indirin ve çıkarın, sonra:
cd reach-plus
```
### Sanal ortam oluşturup aktif et
```
python -m venv venv
source venv/bin/activate
```
### 2. Bağımlılıkları Yükleyin
```bash
npm install
```

### 3. Ortam Değişkenlerini Ayarlayın
`.env` dosyası oluşturun:
```bash
# OpenAI API Key (zorunlu)
OPENAI_API_KEY=sk-your-openai-api-key-here

# Twitter API Keys (opsiyonel - gerçek sosyal medya verisi için)
TWITTER_BEARER_TOKEN=your-bearer-token
TWITTER_API_KEY=your-api-key
TWITTER_API_SECRET=your-api-secret
TWITTER_ACCESS_TOKEN=your-access-token
TWITTER_ACCESS_TOKEN_SECRET=your-access-secret

# Geliştirme Ayarları
NODE_ENV=development
PORT=5000
```

### 4. Projeyi Başlatın
```bash
npm run dev
```

Uygulama http://localhost:5000 adresinde çalışacaktır.

## 🤖 Agentic AI Sistemi

### Core Agent
Ana koordinatör agent, kullanıcı sorgularını analiz eder ve uygun tool'ları ve agent'ları seçer.

### Tool'lar
- **LocationTool**: Konum bilgileri ve güvenli alanlar
- **NetworkTool**: Şebeke durumu ve operatör analizi
- **SocialMediaTool**: Sosyal medya analizi ve sentiment
- **EmergencyTool**: Acil durum yönetimi
- **NotificationTool**: Bildirim gönderme
- **WebSearchTool**: Web araması ve gerçek zamanlı veri toplama

### Supervisor Agent'lar
- **InfoAgent**: Bilgi toplama ve analiz
- **ActionAgent**: Aksiyon alma ve işlem yapma
- **ReportAgent**: Rapor oluşturma ve özetleme
- **EmergencyAgent**: Acil durum yönetimi

### Memory Store
Kullanıcı context'i, konuşma geçmişi ve tercihleri saklar.

## 🔧 API Endpoints

### Chat Endpoints
- `POST /api/chat` - Ana chat endpoint (agentic sistem)
- `POST /api/agent/query` - Direkt agent sorgusu
- `GET /api/agent/memory/:userId` - Kullanıcı memory'si
- `DELETE /api/agent/memory/:userId` - Memory temizleme

### Diğer Endpoints
- `GET /api/health` - Sistem durumu (coreAgent dahil)
- `GET /api/network-status` - Şebeke durumu
- `GET /api/insights` - Sosyal medya analizi
- `GET /api/emergency-alerts` - Acil durum uyarıları

## 🔑 API Anahtarları Alma

### OpenAI API Key (Zorunlu)
1. https://platform.openai.com adresine gidin
2. Hesap oluşturun veya giriş yapın
3. "API Keys" bölümünden yeni anahtar oluşturun
4. Anahtarı `.env` dosyasına ekleyin

### Twitter API Keys (Opsiyonel)
1. https://developer.twitter.com adresine gidin
2. Developer hesabınızla giriş yapın
3. Yeni bir app oluşturun
4. API anahtarlarını alın ve `.env` dosyasına ekleyin

> **Not**: Twitter API anahtarları olmadan sistem mock verilerle çalışır.

## 🏃‍♂️ Hızlı Başlangıç

### Agentic AI Testi
1. **Temel Sohbet**: "Kadıköy'de Türk Telekom çekiyor mu?" - LocationTool + NetworkTool
2. **Acil Durum**: "Deprem oldu, ne yapmalıyım?" - EmergencyAgent + EmergencyTool
3. **Sosyal Medya**: "Twitter'da ne konuşuluyor?" - SocialMediaTool + InfoAgent
4. **Bildirim**: "Aileme haber verebilir miyim?" - NotificationTool + ActionAgent
5. **Web Araştırması**: "3 büyük operatörden hangisini seçmeliyim?" - WebSearchTool + InfoAgent
6. **Nüfus Analizi**: "Bu bölgedeki genç nüfus yoğunluğu nedir?" - WebSearchTool + InfoAgent
7. **Rapor**: "Durum raporu istiyorum" - ReportAgent + tüm tool'lar

### API Testi
```bash
# Agent sorgusu
curl -X POST http://localhost:5000/api/agent/query \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user",
    "message": "Kadıköy'de güvenli alanlar nerede?",
    "userContext": {
      "location": {"district": "Kadıköy", "city": "İstanbul"},
      "operator": "türk telekom"
    }
  }'

# Memory kontrolü
curl http://localhost:5000/api/agent/memory/test-user

# Sistem durumu
curl http://localhost:5000/api/health

# Web araştırması testi
curl -X POST http://localhost:5000/api/agent/query \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user",
    "message": "3 büyük operatörden hangisini seçmeliyim?",
    "userContext": {
      "location": {"district": "Kadıköy", "city": "İstanbul"},
      "operator": "türk telekom"
    }
  }'

# Nüfus analizi testi
curl -X POST http://localhost:5000/api/agent/query \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user",
    "message": "Bu bölgedeki genç nüfus yoğunluğu nedir?",
    "userContext": {
      "location": {"district": "Beşiktaş", "city": "İstanbul"}
    }
  }'
```

## 📁 Proje Yapısı

```
reach-plus/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI bileşenleri
│   │   ├── pages/          # Sayfa bileşenleri
│   │   ├── hooks/          # React hooks
│   │   └── lib/            # Yardımcı kütüphaneler
├── server/                 # Express backend
│   ├── agents/             # 🤖 Agentic AI Sistemi
│   │   ├── coreAgent.ts    # Ana koordinatör agent
│   │   ├── types.ts        # Agent tip tanımları
│   │   ├── memory/         # Memory store
│   │   ├── tools/          # Tool'lar
│   │   │   ├── locationTool.ts
│   │   │   ├── networkTool.ts
│   │   │   ├── socialMediaTool.ts
│   │   │   ├── emergencyTool.ts
│   │   │   ├── notificationTool.ts
│   │   │   └── webSearchTool.ts
│   │   └── supervisor/     # Supervisor agent'lar
│   │       ├── supervisorAgent.ts
│   │       ├── infoAgent.ts
│   │       ├── actionAgent.ts
│   │       ├── reportAgent.ts
│   │       └── emergencyAgent.ts
│   ├── services/           # İş mantığı servisleri
│   │   ├── twitterService.ts
│   │   ├── telecomApiService.ts
│   │   ├── openai.ts
│   │   └── ...
│   ├── routes.ts           # API rotaları (agentic entegrasyonu)
│   └── index.ts            # Ana sunucu dosyası
├── shared/                 # Ortak tip tanımları
└── package.json
```

## 🔧 Geliştirme Komutları

```bash
# Geliştirme modunda çalıştır (Agentic AI ile)
npm run dev

# Production build
npm run build

# Build'i çalıştır
npm start

# Type checking
npm run check

# Database push
npm run db:push
```

## 🤖 Agentic AI Nasıl Çalışır?

### 1. Query Processing
```
Kullanıcı Sorusu → Core Agent → Tool Selection → Supervisor Decision → Agent Execution → Response
```

### 2. Tool Selection
- **LocationTool**: "nerede", "konum", "güvenli alan" kelimeleri
- **NetworkTool**: "şebeke", "internet", "çekmiyor" kelimeleri  
- **SocialMediaTool**: "twitter", "sosyal medya", "trend" kelimeleri
- **EmergencyTool**: "acil", "deprem", "112" kelimeleri
- **NotificationTool**: "bildirim", "sms", "gönder" kelimeleri
- **WebSearchTool**: "araştır", "internet", "güncel", "nüfus", "operatör" kelimeleri

### 3. Agent Coordination
- **InfoAgent**: Bilgi toplama ve analiz
- **ActionAgent**: Aksiyon alma ve işlem
- **ReportAgent**: Rapor oluşturma
- **EmergencyAgent**: Acil durum yönetimi

### 4. Memory Management
- Kullanıcı context'i saklanır
- Konuşma geçmişi tutulur
- Tercihler hatırlanır
- Konum geçmişi izlenir

## 🌐 Üretim Deployment

### Replit Deploy (Önerilen)
1. Projeyi Replit'e import edin
2. Environment Variables'a API anahtarlarını ekleyin
3. "Deploy" butonuna tıklayın

### Manuel Deploy
1. `npm run build` ile production build alın
2. `dist/` klasörünü sunucuya yükleyin
3. PM2 veya benzeri ile çalıştırın

## 🐛 Sorun Giderme

### Sıkça Karşılaşılan Sorunlar

**OpenAI API Hatası**
```
Error: 401 Unauthorized
```
- `.env` dosyasında `OPENAI_API_KEY` değerini kontrol edin
- API anahtarının geçerli olduğundan emin olun

**Port Çakışması**
```
Error: Port 5000 already in use
```
- `.env` dosyasında `PORT=3001` gibi farklı port kullanın

**Twitter API Limit**
```
Error: Rate limit exceeded
```
- Twitter API rate limitine takıldınız, biraz bekleyin
- Mock data modu otomatik olarak devreye girecektir

### Debug Modunda Çalıştırma
```bash
DEBUG=* npm run dev
```

## 📊 Performans

- **Başlangıç**: ~3 saniye
- **API Yanıt**: ~1-2 saniye
- **Twitter Analizi**: ~5-10 saniye (gerçek veriler)
- **Bellek Kullanımı**: ~150MB

## 🤝 Katkıda Bulunma

1. Projeyi fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add amazing feature'`)
4. Branch'i push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📝 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 📞 İletişim

Sorularınız için GitHub Issues kullanabilirsiniz.

---

**REACH+ - Afet Anında Güvenli Bağlantı** 🚨