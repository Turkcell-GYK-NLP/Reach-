# 🐳 REACH+ Docker - Hızlı Başlangıç

Bu dokümantasyon, REACH+ projesini Docker ile çalıştırmak için gereken minimum adımları içerir.

## 🚀 Hızlı Başlatma (3 Adım)

### 1️⃣ .env Dosyasını Oluşturun

```bash
cp env.example .env
```

`.env` dosyasını düzenleyin ve en azından OpenAI API key'inizi ekleyin:

```env
OPENAI_API_KEY=sk-your-actual-api-key-here
```

### 2️⃣ Başlatma Script'ini Çalıştırın

```bash
./docker-start.sh
```

veya manuel olarak:

```bash
docker compose up -d
```

### 3️⃣ Tarayıcınızda Açın

🌐 **Web Arayüzü**: http://localhost:5001

✅ **API Health Check**: http://localhost:5001/api/health

---

## 📦 Neler Dahil?

Docker deployment'ı şunları içerir:

- ✅ **Node.js Backend**: Express.js API server
- ✅ **React Frontend**: Vite ile build edilmiş SPA
- ✅ **PostgreSQL**: Veritabanı (Docker container)
- ✅ **Python Servisleri**: FAISS indexer ve araması
- ✅ **AI Agent Sistemi**: OpenAI GPT-4 ile çalışan multi-agent sistemi
- ✅ **Twitter API**: Sosyal medya analizi (opsiyonel)
- ✅ **Otomatik Başlatma**: Database şeması ve FAISS indeksleri otomatik oluşturulur

---

## 🛠️ Temel Komutlar

### Container'ları Başlatma

```bash
./docker-start.sh
# veya
docker compose up -d
```

### Container'ları Durdurma

```bash
./docker-stop.sh
# veya
docker compose down
```

### Logları Görüntüleme

```bash
# Tüm loglar
docker compose logs -f

# Sadece app logları
docker compose logs -f app

# Sadece database logları
docker compose logs -f postgres
```

### Container Durumunu Kontrol Etme

```bash
docker compose ps
```

### Container İçine Girme

```bash
# App container
docker compose exec app sh

# PostgreSQL
docker compose exec postgres psql -U reachplus -d reachplus
```

### Yeniden Başlatma

```bash
docker compose restart

# Sadece app
docker compose restart app
```

---

## 🗄️ Veritabanı İşlemleri

### Database'e Bağlanma

```bash
docker compose exec postgres psql -U reachplus -d reachplus
```

### Backup Alma

```bash
docker compose exec postgres pg_dump -U reachplus reachplus > backup.sql
```

### Backup'ı Geri Yükleme

```bash
cat backup.sql | docker compose exec -T postgres psql -U reachplus -d reachplus
```

### Database'i Sıfırlama

```bash
docker compose down -v  # ⚠️ DİKKAT: Tüm veriyi siler!
docker compose up -d
```

---

## 🔧 Yapılandırma

### Environment Variables

`.env` dosyasında yapılandırılabilir değişkenler:

#### Zorunlu

- `OPENAI_API_KEY`: OpenAI API anahtarı

#### Opsiyonel

- `NODE_ENV`: production (default) veya development
- `APP_PORT`: Uygulama portu (default: 5001)
- `PGUSER`: PostgreSQL kullanıcı adı (default: reachplus)
- `PGPASSWORD`: PostgreSQL şifresi (default: reachplus123)
- `PGDATABASE`: Veritabanı adı (default: reachplus)
- `TWITTER_BEARER_TOKEN`: Twitter API bearer token
- `SESSION_SECRET`: Session encryption key

### Port Yapılandırması

Default portlar:
- **5001**: Web arayüzü ve API
- PostgreSQL: Sadece internal (container'lar arası)

Port değiştirmek için `.env` dosyasında:

```env
APP_PORT=8080  # Farklı port kullan
```

---

## 🐛 Sorun Giderme

### Container başlamıyor

```bash
# Logları kontrol edin
docker compose logs

# Container'ları yeniden başlatın
docker compose down
docker compose up -d
```

### Port çakışması

Eğer 5001 portu kullanımdaysa:

```bash
# .env dosyasında farklı port ayarlayın
echo "APP_PORT=5002" >> .env

docker compose down
docker compose up -d
```

### Database bağlantı hatası

```bash
# PostgreSQL'in çalıştığını kontrol edin
docker compose ps postgres

# PostgreSQL loglarını kontrol edin
docker compose logs postgres

# PostgreSQL'i yeniden başlatın
docker compose restart postgres
```

### OpenAI API hatası

```bash
# API key'i kontrol edin
docker compose exec app sh -c 'echo $OPENAI_API_KEY'

# .env dosyasını düzenleyin ve restart edin
docker compose restart app
```

### Yavaş performans

```bash
# Container kaynak kullanımını kontrol edin
docker stats

# Docker Desktop'ta daha fazla kaynak ayırın:
# Settings → Resources → Memory/CPU
```

---

## 🔒 Güvenlik Notları

### Production Deployment İçin

1. **Güçlü şifreler kullanın**:
   ```bash
   PGPASSWORD=$(openssl rand -base64 32)
   SESSION_SECRET=$(openssl rand -base64 32)
   ```

2. **PostgreSQL external port'unu kapatın**:
   - docker-compose.yml'de postgres service'inin ports kısmı zaten yorumda
   - Eğer açıksa, yoruma alın

3. **HTTPS kullanın**:
   - Nginx reverse proxy ekleyin
   - Let's Encrypt SSL sertifikası alın

4. **API key'leri güvende tutun**:
   - .env dosyasını Git'e commit etmeyin
   - .gitignore'da olduğundan emin olun

---

## 📊 Monitoring

### Container Sağlığını Kontrol Etme

```bash
# Health status
docker inspect --format='{{.State.Health.Status}}' reachplus-app

# Health check endpoint
curl http://localhost:5001/api/health
```

### Kaynak Kullanımı

```bash
# Real-time stats
docker stats

# Disk kullanımı
docker system df
```

---

## 🚢 Production Deployment

Production ortamına deploy için detaylı bilgi:

📖 **[DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md)** - Kapsamlı deployment kılavuzu

Hızlı linkler:
- AWS ECS deployment
- Google Cloud Run deployment
- DigitalOcean deployment
- Heroku deployment

---

## 📚 Ek Kaynaklar

- **[README.md](./README.md)** - Genel proje dokümantasyonu
- **[KURULUM.md](./KURULUM.md)** - Yerel development kurulumu
- **[DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md)** - Detaylı Docker deployment
- **[GEREKSINIM_ANALIZI.md](./GEREKSINIM_ANALIZI.md)** - Proje gereksinimleri

---

## 🆘 Destek

Sorun yaşıyorsanız:

1. Logları kontrol edin: `docker compose logs`
2. Docker Desktop'ın güncel olduğundan emin olun
3. `.env` dosyasını kontrol edin
4. Container'ları yeniden başlatın: `docker compose down && docker compose up -d`

---

## ✅ Checklist

Deployment'tan önce kontrol edin:

- [ ] Docker Desktop kurulu ve çalışıyor
- [ ] `.env` dosyası oluşturuldu
- [ ] `OPENAI_API_KEY` ayarlandı
- [ ] Port 5001 boş (veya farklı port ayarlandı)
- [ ] `./docker-start.sh` çalıştırıldı
- [ ] http://localhost:5001 açılıyor
- [ ] Health check başarılı

---

**🎉 REACH+ Docker deployment başarıyla tamamlandı!**

*Son güncelleme: 2025-10-05*

