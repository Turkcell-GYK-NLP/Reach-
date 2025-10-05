# 🚀 REACH+ Render.com Deployment - Adım Adım Kılavuz

## ✅ Hazırlık Tamamlandı!

GitHub'a başarıyla push edildi:
- Repository: https://github.com/Turkcell-GYK-NLP/Reach-.git
- Branch: main
- Docker dosyaları hazır ✅

---

## 📋 Render.com'da Deploy Adımları

### 1️⃣ Render.com'a Giriş

1. **Tarayıcınızda açın**: https://render.com/

2. **Sign Up / Sign In** tıklayın

3. **GitHub ile giriş yapın** (önerilir)
   - "Sign in with GitHub" seçin
   - GitHub'da yetkilendirin
   - Render'ın repository'lerinize erişmesine izin verin

---

### 2️⃣ Web Service Oluşturma

1. **Dashboard'a gidin**: https://dashboard.render.com/

2. **"New +"** butonuna tıklayın (sağ üstte)

3. **"Web Service"** seçin

4. **Repository'nizi seçin**:
   - GitHub hesabınızı bağlayın (ilk seferinde)
   - "Reach-" repository'sini bulun
   - **"Connect"** tıklayın

---

### 3️⃣ Service Ayarları

**Genel Ayarlar:**

```
┌────────────────────────────────────────────────────┐
│ Name: reachplus                                    │
│ (veya istediğiniz benzersiz bir isim)             │
├────────────────────────────────────────────────────┤
│ Region: Frankfurt                                  │
│ (Türkiye'ye en yakın, hızlı erişim için)         │
├────────────────────────────────────────────────────┤
│ Branch: main                                       │
│ (varsayılan zaten main)                           │
├────────────────────────────────────────────────────┤
│ Root Directory: (boş bırakın)                     │
├────────────────────────────────────────────────────┤
│ Environment: Docker                                │
│ ⚠️ ÖNEMLİ: Mutlaka "Docker" seçin!              │
├────────────────────────────────────────────────────┤
│ Docker Build Context Directory: .                 │
│ (varsayılan)                                       │
├────────────────────────────────────────────────────┤
│ Dockerfile Path: ./Dockerfile                     │
│ (varsayılan)                                       │
└────────────────────────────────────────────────────┘
```

---

### 4️⃣ Instance Type Seçimi

```
┌────────────────────────────────────────────────────┐
│ Instance Type: Free                                │
│                                                    │
│ Özellikleri:                                       │
│ • 512 MB RAM                                       │
│ • 0.1 CPU                                          │
│ • 750 saat/ay (süresiz)                           │
│ • 15 dakika inaktivite sonrası sleep              │
│ • Otomatik HTTPS                                   │
│ • Ücretsiz domain                                  │
└────────────────────────────────────────────────────┘
```

**"Free"** seçin (varsayılan)

---

### 5️⃣ Environment Variables (ÇOK ÖNEMLİ!) 🔑

**"Advanced"** butonuna tıklayın ve şu değişkenleri ekleyin:

#### Zorunlu Variables:

```
┌────────────────────────────────────────────────────┐
│ Key:   OPENAI_API_KEY                              │
│ Value: sk-proj-s5k3bJR9D7vewl5Jl90Ld9nH5PS7...     │
│                                                    │
│ ⚠️  Kendi OpenAI API key'inizi buraya girin!     │
└────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────┐
│ Key:   NODE_ENV                                    │
│ Value: production                                  │
└────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────┐
│ Key:   PORT                                        │
│ Value: 5000                                        │
│                                                    │
│ ⚠️  Render PORT=10000 atar ama container'da      │
│     5000 dinleniyor, bu override eder             │
└────────────────────────────────────────────────────┘
```

#### Opsiyonel Variables (Twitter API için):

```
┌────────────────────────────────────────────────────┐
│ Key:   TWITTER_BEARER_TOKEN                        │
│ Value: (varsa ekleyin)                            │
├────────────────────────────────────────────────────┤
│ Key:   TWITTER_API_KEY                             │
│ Value: (varsa ekleyin)                            │
├────────────────────────────────────────────────────┤
│ Key:   TWITTER_API_SECRET                          │
│ Value: (varsa ekleyin)                            │
├────────────────────────────────────────────────────┤
│ Key:   TWITTER_ACCESS_TOKEN                        │
│ Value: (varsa ekleyin)                            │
├────────────────────────────────────────────────────┤
│ Key:   TWITTER_ACCESS_TOKEN_SECRET                 │
│ Value: (varsa ekleyin)                            │
└────────────────────────────────────────────────────┘
```

#### Session Secret:

```
┌────────────────────────────────────────────────────┐
│ Key:   SESSION_SECRET                              │
│ Value: (rastgele güçlü bir string)                │
│                                                    │
│ Örnek: Kh8sJ9dL2mN5pQ7rT3vW6xZ0aB4cE9fG         │
└────────────────────────────────────────────────────┘
```

---

### 6️⃣ Deploy Başlatma

1. **"Create Web Service"** butonuna tıklayın

2. **Build başlayacak** (5-10 dakika sürer)
   - Logs sekmesinde ilerlemeyi takip edebilirsiniz
   - Docker image build edilecek
   - Dependencies yüklenecek
   - Container başlatılacak

3. **Build tamamlandığında**:
   ```
   ✅ Build successful!
   ✅ Deploy successful!
   🌐 Your service is live at: https://reachplus-xxxx.onrender.com
   ```

---

### 7️⃣ PostgreSQL Ekleme (Önerilir)

#### A. PostgreSQL Service Oluşturma

1. **Dashboard'a dönün**: https://dashboard.render.com/

2. **"New +"** → **"PostgreSQL"** seçin

3. **Ayarları yapın**:
   ```
   ┌────────────────────────────────────────────────────┐
   │ Name: reachplus-db                                 │
   ├────────────────────────────────────────────────────┤
   │ Database: reachplus                                │
   ├────────────────────────────────────────────────────┤
   │ User: reachplus                                    │
   ├────────────────────────────────────────────────────┤
   │ Region: Frankfurt                                  │
   │ (Web Service ile aynı bölge)                      │
   ├────────────────────────────────────────────────────┤
   │ PostgreSQL Version: 16                             │
   ├────────────────────────────────────────────────────┤
   │ Instance Type: Free                                │
   │ • 90 gün sonra sıfırlanır                         │
   │ • 1 GB storage                                     │
   └────────────────────────────────────────────────────┘
   ```

4. **"Create Database"** tıklayın

#### B. Database URL'ini Web Service'e Bağlama

1. **PostgreSQL dashboard'ına gidin**

2. **"Internal Database URL"** kopyalayın:
   ```
   postgresql://user:pass@dpg-xxxxx-a/reachplus
   ```

3. **Web Service'e dönün** (reachplus)

4. **Environment** sekmesine gidin

5. **"Add Environment Variable"** tıklayın:
   ```
   ┌────────────────────────────────────────────────────┐
   │ Key:   DATABASE_URL                                │
   │ Value: (kopyaladığınız URL)                       │
   └────────────────────────────────────────────────────┘
   ```

6. **PostgreSQL connection için ekstra variables**:
   ```
   ┌────────────────────────────────────────────────────┐
   │ Key:   PGHOST                                      │
   │ Value: dpg-xxxxx-a.frankfurt-postgres.render.com  │
   ├────────────────────────────────────────────────────┤
   │ Key:   PGPORT                                      │
   │ Value: 5432                                        │
   ├────────────────────────────────────────────────────┤
   │ Key:   PGUSER                                      │
   │ Value: reachplus                                   │
   ├────────────────────────────────────────────────────┤
   │ Key:   PGPASSWORD                                  │
   │ Value: (PostgreSQL'den kopyalayın)                │
   ├────────────────────────────────────────────────────┤
   │ Key:   PGDATABASE                                  │
   │ Value: reachplus                                   │
   └────────────────────────────────────────────────────┘
   ```

7. **"Save Changes"** tıklayın

8. Service **otomatik restart** olacak

---

### 8️⃣ Deployment Tamamlandı! ✅

#### Public URL'iniz:

```
🌐 https://reachplus-xxxx.onrender.com
```

#### Test edin:

```bash
# Health check
curl https://reachplus-xxxx.onrender.com/api/health

# Tarayıcıda açın
open https://reachplus-xxxx.onrender.com
```

---

## 🔧 Render Dashboard Özellikleri

### Logs Görüntüleme

1. **Web Service'e gidin**
2. **"Logs"** sekmesine tıklayın
3. Real-time logları görebilirsiniz

```
Example logs:
🚀 REACH+ Docker Startup Script
✅ PostgreSQL is ready!
✅ Database already initialized
🎉 Initialization completed successfully!
🚀 Starting REACH+ application...
8:24:34 PM [express] serving on port 5000
```

### Metrics

1. **"Metrics"** sekmesi
2. CPU, Memory, Network kullanımını görebilirsiniz
3. Request count ve response times

### Events

1. **"Events"** sekmesi
2. Deploy history
3. Restart events
4. Configuration changes

---

## 🎨 Custom Domain Ekleme (Opsiyonel)

### Kendi Domain'inizi Bağlayın

1. **Settings** → **Custom Domains**

2. **"Add Custom Domain"** tıklayın

3. Domain adınızı girin:
   ```
   reachplus.com
   ```

4. **DNS ayarları yapın** (domain sağlayıcınızda):
   ```
   Type: CNAME
   Name: www (veya @)
   Value: reachplus-xxxx.onrender.com
   ```

5. **Verify** tıklayın

6. Render otomatik **SSL sertifikası** oluşturacak

---

## 🔄 Auto-Deploy Ayarları

### Git Push ile Otomatik Deploy

**Varsayılan olarak aktif:**
- Her `git push origin main` → Otomatik deploy

**Devre dışı bırakmak için:**
1. **Settings** → **Build & Deploy**
2. **"Auto-Deploy"** toggle'ı kapatın

### Manuel Deploy

1. **Web Service dashboard**
2. **"Manual Deploy"** → **"Deploy latest commit"**

---

## 📊 Performans İpuçları

### Cold Start Problemi

Free plan'da 15 dakika inaktiviteden sonra service uyur:

**Çözümler:**

1. **Cron Job ile Keep-Alive**:
   - UptimeRobot kullanın (ücretsiz)
   - https://uptimerobot.com/
   - 5 dakikada bir health check isteği gönderin

2. **Render Cron Jobs**:
   ```bash
   # Dashboard → New + → Cron Job
   # Schedule: */5 * * * * (her 5 dakika)
   # Command: curl https://reachplus-xxxx.onrender.com/api/health
   ```

### Database Connection Pooling

Database connection'ları optimize edin:

```typescript
// Already configured in your project!
// drizzle.config.ts uses connection pooling
```

---

## 🔒 Güvenlik

### Environment Variables Güvenliği

✅ **Doğru:**
- Environment variables Render dashboard'da
- .env dosyası Git'e commit edilmemiş

❌ **Yanlış:**
- API keys kod içinde
- .env dosyası Git'te

### HTTPS

✅ Render otomatik HTTPS sağlar
✅ SSL sertifikaları otomatik yenilenir

---

## 🐛 Sorun Giderme

### Build Başarısız Oluyor

**Problem**: Docker build hatası

**Çözüm**:
1. Logs'u kontrol edin
2. Dockerfile syntax'ını kontrol edin
3. Dependencies'leri kontrol edin

```bash
# Local'de test edin:
docker compose build
docker compose up -d
```

### Service Çalışmıyor

**Problem**: Deploy başarılı ama service çalışmıyor

**Çözüm**:
1. Logs'u kontrol edin
2. Environment variables'ları kontrol edin
3. PORT=5000 ayarlandığından emin olun
4. Health check endpoint'ini test edin

### Database Bağlantı Hatası

**Problem**: "connection refused"

**Çözüm**:
1. DATABASE_URL doğru mu kontrol edin
2. PostgreSQL service'in çalıştığından emin olun
3. PGHOST, PGUSER, PGPASSWORD doğru mu?

### Out of Memory

**Problem**: 512 MB RAM yetersiz

**Çözüm**:
1. Paid plan'e geçin (7$/ay - 2GB RAM)
2. Memory kullanımını optimize edin
3. Monitoring ekleyin

---

## 💰 Upgrade Seçenekleri

### Free Plan Sınırları

- ✅ 750 saat/ay (yeterli)
- ✅ 512 MB RAM
- ⚠️ 15 dakika cold start
- ⚠️ 1 web service

### Starter Plan ($7/ay)

- ✅ 2 GB RAM
- ✅ No cold start
- ✅ Unlimited services
- ✅ Priority support

### Pro Plan ($25/ay)

- ✅ 8 GB RAM
- ✅ High priority
- ✅ Advanced metrics
- ✅ 24/7 support

---

## 📚 Faydalı Linkler

- **Render Dashboard**: https://dashboard.render.com/
- **Render Docs**: https://render.com/docs
- **Web Service**: https://reachplus-xxxx.onrender.com
- **PostgreSQL**: Dashboard → Databases
- **GitHub Repo**: https://github.com/Turkcell-GYK-NLP/Reach-.git

---

## ✅ Deployment Checklist

Deployment sonrası kontrol edin:

- [ ] Web service çalışıyor (yeşil ✓)
- [ ] Health check başarılı: `/api/health`
- [ ] PostgreSQL bağlantısı çalışıyor
- [ ] Environment variables doğru
- [ ] Public URL açılıyor
- [ ] AI Agent sistemi çalışıyor
- [ ] Twitter API bağlı (opsiyonel)
- [ ] Logs temiz, hata yok
- [ ] Domain bağlandı (opsiyonel)
- [ ] Monitoring kuruldu (opsiyonel)

---

## 🎉 Tebrikler!

REACH+ uygulamanız artık dünya çapında erişilebilir! 🌍

**Next Steps:**
1. Link'i arkadaşlarınızla paylaşın
2. Custom domain ekleyin
3. Monitoring kurun (UptimeRobot)
4. Analytics ekleyin

**Destek için:**
- Render Community: https://community.render.com/
- GitHub Issues: Repository'nizde issue açın

---

*Son güncelleme: 2025-10-05*
*Proje: REACH+ - Afet Sonrası AI Destekli Rehberlik*

