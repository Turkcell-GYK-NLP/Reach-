# REACH+ - Afet Sonrası AI Destekli Rehberlik Platformu

REACH+, deprem ve afet sonrası gençlere yapay zeka destekli rehberlik sağlayan, sosyal medya verilerini analiz eden Türkçe platformdur.

## 🚀 Özellikler

- **Türkçe AI Sohbet**: OpenAI GPT-4o ile direkt ve net yanıtlar
- **Gerçek Sosyal Medya Analizi**: X (Twitter) API ile afet tweetleri izleme
- **Şebeke Durumu Takibi**: Türk Telekom, Vodafone, Turkcell kapsama verileri
- **Acil Durum Sistemi**: Anlık uyarı ve güvenli alan bildirimleri
- **Konum Bazlı Hizmetler**: İstanbul ilçelerine özel bilgiler
- **Çevrimdışı Destek**: Service Worker ile offline çalışma

## 🛠️ Teknoloji Stack

- **Backend**: Node.js, Express.js, TypeScript
- **Frontend**: React, Vite, TailwindCSS, shadcn/ui
- **AI**: OpenAI GPT-4o
- **Sosyal Medya**: Twitter API v2
- **Veritabanı**: PostgreSQL + Drizzle ORM (dev için hafıza depolama)

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

1. **Sohbet Testi**: Ana sayfada "Kadıköy'de Türk Telekom çekiyor mu?" sorusunu deneyin
2. **Şebeke Durumu**: Sol menüden "Şebeke Durumu" sayfasını kontrol edin
3. **Sosyal Medya**: "Sosyal Medya Analizi" sayfasında güncel tweetleri görün
4. **Acil Durum**: "Acil Durumlar" sayfasında aktif uyarıları inceleyin

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
│   ├── services/           # İş mantığı servisleri
│   │   ├── twitterService.ts
│   │   ├── telecomApiService.ts
│   │   ├── openai.ts
│   │   └── ...
│   ├── routes.ts           # API rotaları
│   └── index.ts            # Ana sunucu dosyası
├── shared/                 # Ortak tip tanımları
└── package.json
```

## 🔧 Geliştirme Komutları

```bash
# Geliştirme modunda çalıştır
npm run dev

# Production build
npm run build

# Build'i çalıştır
npm start

# Linting
npm run lint

# Type checking
npm run type-check
```

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