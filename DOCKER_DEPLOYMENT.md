# 🐳 REACH+ Docker Deployment Kılavuzu

Bu dokümantasyon, REACH+ projesini Docker kullanarak canlıya almak için gereken tüm adımları içerir.

---

## 📋 İçindekiler

1. [Ön Gereksinimler](#ön-gereksinimler)
2. [Hızlı Başlangıç](#hızlı-başlangıç)
3. [Detaylı Kurulum Adımları](#detaylı-kurulum-adımları)
4. [Environment Variables](#environment-variables)
5. [Veritabanı Yönetimi](#veritabanı-yönetimi)
6. [FAISS İndeksleri](#faiss-indeksleri)
7. [Docker Komutları](#docker-komutları)
8. [Sorun Giderme](#sorun-giderme)
9. [Production Deployment](#production-deployment)
10. [Monitoring ve Logs](#monitoring-ve-logs)

---

## 🔧 Ön Gereksinimler

### Gerekli Yazılımlar

1. **Docker Desktop** ✅ (Yüklü)
   - Versiyon: 20.10+ önerilir
   - Kurulum: https://www.docker.com/products/docker-desktop

2. **Docker Compose** ✅ (Docker Desktop ile birlikte gelir)
   - Versiyon: 2.0+ önerilir

3. **OpenAI API Key** (Zorunlu)
   - Platform: https://platform.openai.com/api-keys
   - Kredi yüklü olmalıdır

### Sistem Gereksinimleri

- **RAM**: Minimum 4GB, Önerilen 8GB+
- **Disk**: Minimum 10GB boş alan
- **İşletim Sistemi**: Windows 10/11, macOS 10.15+, Linux (Ubuntu 20.04+)
- **Port Kullanımı**: 5000 (uygulama), 5432 (PostgreSQL)

---

## 🚀 Hızlı Başlangıç

### 1. Projeyi Hazırlayın

```bash
# Proje klasörüne gidin
cd /Users/esrakaya/Downloads/GYKProje

# Dosyaları kontrol edin
ls -la
```

### 2. Environment Dosyasını Oluşturun

```bash
# env.example dosyasını .env olarak kopyalayın
cp env.example .env

# .env dosyasını düzenleyin
nano .env  # veya herhangi bir text editör
```

**Minimum gerekli değişiklik:**
```env
OPENAI_API_KEY=sk-your-actual-openai-api-key-here
```

### 3. Docker Container'ları Başlatın

```bash
# Container'ları build edin ve başlatın
docker-compose up -d

# Logları takip edin (opsiyonel)
docker-compose logs -f
```

### 4. Uygulamaya Erişin

- **Web Arayüzü**: http://localhost:5000
- **API Health Check**: http://localhost:5000/api/health
- **Database**: localhost:5432

---

## 📝 Detaylı Kurulum Adımları

### Adım 1: Environment Variables Ayarlama

`.env` dosyasını oluşturun ve aşağıdaki değerleri doldurun:

```env
# Node.js Configuration
NODE_ENV=production
PORT=5000

# PostgreSQL Database
PGUSER=reachplus
PGPASSWORD=güçlü-şifre-buraya  # ÖNEMLİ: Değiştirin!
PGDATABASE=reachplus
DATABASE_URL=postgresql://reachplus:güçlü-şifre-buraya@postgres:5432/reachplus

# OpenAI API (ZORUNLU)
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxx  # Kendi anahtarınızı girin

# Session Secret (ÖNEMLİ: Değiştirin!)
SESSION_SECRET=$(openssl rand -base64 32)

# Twitter API (Opsiyonel)
TWITTER_BEARER_TOKEN=
TWITTER_API_KEY=
# ... diğer Twitter anahtarları
```

### Adım 2: Docker Build

```bash
# Build işlemini başlatın (ilk seferinde 5-10 dakika sürebilir)
docker-compose build

# Build loglarını görmek için:
docker-compose build --progress=plain
```

**Build sırasında neler olur:**
1. ✅ Node.js dependencies yüklenir
2. ✅ Frontend build alınır (React/Vite)
3. ✅ Backend build alınır (TypeScript → JavaScript)
4. ✅ Python dependencies yüklenir
5. ✅ Multi-stage optimization yapılır

### Adım 3: Container'ları Başlatma

```bash
# Arka planda başlat
docker-compose up -d

# Foreground'da başlat (logları görmek için)
docker-compose up
```

**İlk başlatmada yapılanlar:**
1. ⏳ PostgreSQL container başlar (5-10 saniye)
2. ⏳ Database hazır olana kadar beklenir
3. 🗄️ Database schema oluşturulur (`database.py`)
4. 📊 FAISS indeksleri oluşturulur (2-5 dakika)
5. 🚀 Node.js uygulama başlar

### Adım 4: Başarıyı Doğrulama

```bash
# Container'ların durumunu kontrol edin
docker-compose ps

# Çıktı şöyle olmalı:
# NAME              STATUS           PORTS
# reachplus-app     Up 2 minutes     0.0.0.0:5000->5000/tcp
# reachplus-db      Up 2 minutes     0.0.0.0:5432->5432/tcp

# Health check
curl http://localhost:5000/api/health

# Beklenen yanıt:
# {"status":"ok","coreAgent":"initialized"}

# Logs kontrol
docker-compose logs app | tail -50
```

---

## 🔐 Environment Variables

### Zorunlu Variables

| Variable | Açıklama | Örnek |
|----------|----------|-------|
| `OPENAI_API_KEY` | OpenAI API anahtarı | `sk-proj-...` |
| `PGPASSWORD` | PostgreSQL şifresi | `güçlü-şifre` |
| `SESSION_SECRET` | Session encryption key | `random-32-char-string` |

### Önerilen Variables

| Variable | Açıklama | Default | Notlar |
|----------|----------|---------|--------|
| `PGUSER` | PostgreSQL kullanıcı adı | `reachplus` | Değiştirilebilir |
| `PGDATABASE` | Database adı | `reachplus` | Değiştirilebilir |
| `PORT` | Uygulama portu | `5000` | Değiştirilebilir |
| `NODE_ENV` | Node.js environment | `production` | `development` kullanmayın |

### Opsiyonel Variables

| Variable | Açıklama | Ne zaman gerekli? |
|----------|----------|-------------------|
| `TWITTER_BEARER_TOKEN` | Twitter API token | Gerçek Twitter verisi için |
| `TWITTER_API_KEY` | Twitter API key | Gerçek Twitter verisi için |
| `TWITTER_API_SECRET` | Twitter API secret | Gerçek Twitter verisi için |

---

## 🗄️ Veritabanı Yönetimi

### Database İçine Bağlanma

```bash
# PostgreSQL CLI'a bağlan
docker-compose exec postgres psql -U reachplus -d reachplus

# Tabloları listele
\dt

# Users tablosunu görüntüle
SELECT * FROM users LIMIT 5;

# Çıkış
\q
```

### Database Backup

```bash
# Backup oluştur
docker-compose exec postgres pg_dump -U reachplus reachplus > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup'ı geri yükle
docker-compose exec -T postgres psql -U reachplus -d reachplus < backup_20250105_120000.sql
```

### Database Sıfırlama

```bash
# Container'ları durdur
docker-compose down

# Volume'u sil (DİKKAT: Tüm veriler silinir!)
docker volume rm gykproje_postgres_data

# Yeniden başlat
docker-compose up -d
```

### Manuel Schema Update

```bash
# Python script ile manuel schema update
docker-compose exec app python3 /python-app/database.py

# Drizzle migrations uygula
docker-compose exec app sh -c "cd /app && npm run db:push"
```

---

## 🔍 FAISS İndeksleri

### İndeks Oluşturma

FAISS indeksleri container ilk başlatıldığında otomatik oluşturulur. Manuel oluşturma:

```bash
# Toplanma alanları indeksi
docker-compose exec app python3 /python-app/faiss_indexer.py

# İlkyardım indeksi
docker-compose exec app python3 /python-app/ilkyardim_indexer.py
```

### İndeks Konumları

Container içinde:
- `/app/faiss_index/toplanma_alanlari.index`
- `/app/faiss_index/ilkyardim.index`
- `/app/faiss_index/documents.pkl`
- `/app/faiss_index/metadata.pkl`

Host'ta:
- `./faiss_index/` klasörü

### İndeks Testi

```bash
# FAISS arama testi
docker-compose exec app python3 /app/faiss_search.py "Kadıköy toplanma alanları"

# İlkyardım arama testi
docker-compose exec app python3 /app/ilkyardim_search.py "deprem anında ne yapmalıyım"
```

---

## 🛠️ Docker Komutları

### Temel Komutlar

```bash
# Container'ları başlat
docker-compose up -d

# Container'ları durdur
docker-compose down

# Container'ları durdur ve volume'ları sil
docker-compose down -v

# Logları görüntüle
docker-compose logs

# Logları canlı takip et
docker-compose logs -f

# Belirli bir servisin loglarını izle
docker-compose logs -f app

# Container'ların durumunu kontrol et
docker-compose ps

# Container istatistikleri
docker stats
```

### Build ve Yeniden Başlatma

```bash
# Yeniden build et
docker-compose build

# Cache'siz build et (temiz build)
docker-compose build --no-cache

# Build et ve başlat
docker-compose up -d --build

# Sadece app servisini yeniden başlat
docker-compose restart app
```

### Container İçine Girme

```bash
# App container'ına bash ile gir
docker-compose exec app sh

# PostgreSQL container'ına gir
docker-compose exec postgres sh

# Root olarak gir
docker-compose exec -u root app sh
```

### Debugging

```bash
# Container loglarını dosyaya kaydet
docker-compose logs > docker-logs.txt

# Son 100 satırı göster
docker-compose logs --tail=100

# Belirli bir zamandan sonraki logları göster
docker-compose logs --since 30m

# Container kaynak kullanımı
docker-compose exec app top

# Network bağlantılarını kontrol et
docker-compose exec app netstat -tulpn
```

---

## 🐛 Sorun Giderme

### Problem 1: Container Başlamıyor

**Semptom:**
```
reachplus-app | ERROR: Database connection failed
```

**Çözüm:**
```bash
# PostgreSQL'in çalıştığını kontrol edin
docker-compose ps postgres

# PostgreSQL loglarını kontrol edin
docker-compose logs postgres

# PostgreSQL'i yeniden başlatın
docker-compose restart postgres

# Database bağlantısını test edin
docker-compose exec postgres pg_isready -U reachplus
```

### Problem 2: Port Çakışması

**Semptom:**
```
ERROR: port is already allocated
```

**Çözüm:**
```bash
# Hangi process 5000 portunu kullanıyor?
lsof -i :5000  # macOS/Linux
netstat -ano | findstr :5000  # Windows

# .env dosyasında farklı port kullanın
echo "APP_PORT=5001" >> .env
docker-compose down && docker-compose up -d
```

### Problem 3: OpenAI API Hatası

**Semptom:**
```
Error: 401 Unauthorized
```

**Çözüm:**
```bash
# API key'i kontrol edin
docker-compose exec app sh -c 'echo $OPENAI_API_KEY'

# .env dosyasını güncelleyin
nano .env

# Container'ı yeniden başlatın
docker-compose restart app
```

### Problem 4: FAISS İndeksleri Oluşturulamıyor

**Semptom:**
```
Warning: FAISS index creation failed
```

**Çözüm:**
```bash
# Manuel olarak oluşturun
docker-compose exec app sh -c "cd /python-app && python3 faiss_indexer.py"

# Python dependencies kontrol
docker-compose exec app pip3 list | grep faiss

# Veri dosyalarını kontrol edin
docker-compose exec app ls -la /app/Datas/
docker-compose exec app ls -la /app/new_datas/
```

### Problem 5: Yavaş Performance

**Çözüm:**
```bash
# Docker'a daha fazla kaynak ayırın
# Docker Desktop → Settings → Resources
# CPU: 4+ cores
# Memory: 6+ GB

# Container istatistiklerini kontrol edin
docker stats

# Logları temizleyin
docker-compose logs --tail=0 > /dev/null
```

### Problem 6: Database Şema Hatası

**Semptom:**
```
relation "users" does not exist
```

**Çözüm:**
```bash
# Database'i sıfırlayın
docker-compose down -v
docker-compose up -d

# Veya manuel schema oluşturun
docker-compose exec app python3 /python-app/database.py
```

---

## 🌐 Production Deployment

### 1. Cloud Platform Seçimi

#### A. AWS (Amazon Web Services)

**Önerilen Servisler:**
- **ECS (Elastic Container Service)** + **Fargate**: Container orkestrasyon
- **RDS for PostgreSQL**: Yönetilen veritabanı
- **ECR (Elastic Container Registry)**: Docker image registry
- **Application Load Balancer**: Yük dengeleme

**Deployment:**
```bash
# 1. AWS CLI kurulumu
brew install awscli  # macOS
# veya: https://aws.amazon.com/cli/

# 2. AWS credentials ayarlama
aws configure

# 3. ECR repository oluşturma
aws ecr create-repository --repository-name reachplus-app

# 4. Docker image'ı ECR'a push etme
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
docker tag reachplus-app:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/reachplus-app:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/reachplus-app:latest

# 5. ECS Task Definition ve Service oluşturma
# AWS Console veya Terraform kullanarak
```

#### B. Google Cloud Platform (GCP)

**Önerilen Servisler:**
- **Cloud Run**: Serverless container
- **Cloud SQL for PostgreSQL**: Yönetilen veritabanı
- **Container Registry**: Docker image registry

**Deployment:**
```bash
# 1. gcloud CLI kurulumu
brew install google-cloud-sdk  # macOS

# 2. gcloud init
gcloud init

# 3. Container Registry'ye push
gcloud builds submit --tag gcr.io/<project-id>/reachplus-app

# 4. Cloud Run'a deploy
gcloud run deploy reachplus-app \
  --image gcr.io/<project-id>/reachplus-app \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "OPENAI_API_KEY=sk-..."
```

#### C. DigitalOcean (En Basit)

**Önerilen Servisler:**
- **App Platform**: Otomatik deployment
- **Managed PostgreSQL**: Veritabanı
- **Container Registry**: Image storage

**Deployment:**
```bash
# 1. doctl CLI kurulumu
brew install doctl

# 2. Auth
doctl auth init

# 3. Container Registry
doctl registry create reachplus

# 4. Push image
docker tag reachplus-app:latest registry.digitalocean.com/reachplus/app:latest
docker push registry.digitalocean.com/reachplus/app:latest

# 5. App Platform üzerinden GUI ile deploy
# https://cloud.digitalocean.com/apps
```

#### D. Heroku (En Hızlı)

```bash
# 1. Heroku CLI kurulumu
brew tap heroku/brew && brew install heroku

# 2. Login
heroku login

# 3. App oluştur
heroku create reachplus-app

# 4. PostgreSQL addon ekle
heroku addons:create heroku-postgresql:standard-0

# 5. Environment variables
heroku config:set OPENAI_API_KEY=sk-...
heroku config:set NODE_ENV=production

# 6. Deploy
heroku container:push web
heroku container:release web

# 7. Açın
heroku open
```

### 2. Production Environment Variables

```bash
# Production .env
NODE_ENV=production
PORT=5000

# Güçlü şifreler kullanın!
PGPASSWORD=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 32)

# Production database URL
DATABASE_URL=postgresql://user:pass@prod-db.example.com:5432/reachplus

# API Keys
OPENAI_API_KEY=sk-proj-...
TWITTER_BEARER_TOKEN=...

# Monitoring (opsiyonel)
SENTRY_DSN=https://...
NEW_RELIC_LICENSE_KEY=...
```

### 3. SSL/HTTPS Kurulumu

#### Nginx Reverse Proxy (Recommended)

```nginx
# /etc/nginx/sites-available/reachplus

server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### Let's Encrypt SSL

```bash
# Certbot kurulumu
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# SSL sertifikası alma
sudo certbot --nginx -d your-domain.com

# Auto-renewal test
sudo certbot renew --dry-run
```

### 4. Docker Compose Production Override

`docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  app:
    restart: always
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
        reservations:
          cpus: '1'
          memory: 2G

  postgres:
    restart: always
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    command: postgres -c shared_buffers=256MB -c max_connections=200
```

**Kullanım:**
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

---

## 📊 Monitoring ve Logs

### Log Yönetimi

```bash
# Canlı logları takip et
docker-compose logs -f

# Log dosyalarını dışarı aktar
docker-compose logs > logs/docker-logs-$(date +%Y%m%d).txt

# Log rotation (otomatik)
# docker-compose.yml içinde zaten ayarlı:
# max-size: "10m", max-file: "3"
```

### Health Monitoring

```bash
# Health check endpoint
curl http://localhost:5000/api/health

# Detailed status
curl http://localhost:5000/api/health | jq

# Container health
docker inspect --format='{{.State.Health.Status}}' reachplus-app
```

### Performance Monitoring

```bash
# Resource usage
docker stats reachplus-app

# Process list
docker-compose exec app top

# Disk usage
docker system df

# Network connections
docker-compose exec app netstat -an | grep :5000
```

### Prometheus + Grafana (İleri Seviye)

`docker-compose.monitoring.yml`:

```yaml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    volumes:
      - grafana_data:/var/lib/grafana
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin

volumes:
  prometheus_data:
  grafana_data:
```

---

## 🔒 Güvenlik Önerileri

### 1. API Keys

```bash
# API key'leri asla kod içine yazmayın
# .env dosyasını git'e commit etmeyin

# .gitignore kontrol
cat .gitignore | grep .env

# Hassas bilgileri şifreleyin
echo "OPENAI_API_KEY=sk-..." | gpg -c > secrets.gpg
```

### 2. Database Security

```bash
# Güçlü şifre kullanın
PGPASSWORD=$(openssl rand -base64 32)

# PostgreSQL external erişimi kapatın (production)
# docker-compose.yml içinde ports kısmını yoruma alın:
# ports:
#   - "5432:5432"  # Yorum satırı yap
```

### 3. Network Security

```bash
# Firewall kuralları
sudo ufw allow 22/tcp  # SSH
sudo ufw allow 80/tcp  # HTTP
sudo ufw allow 443/tcp # HTTPS
sudo ufw deny 5432/tcp # PostgreSQL (external)
sudo ufw enable

# Docker network isolation
# docker-compose.yml zaten internal network kullanıyor
```

### 4. Container Security

```bash
# Image'leri düzenli güncelleyin
docker-compose pull
docker-compose up -d

# Security scan
docker scan reachplus-app:latest

# Vulnerability check
docker scout cves reachplus-app:latest
```

---

## 📚 Ek Kaynaklar

### Dokümantasyon

- 📖 **README.md**: Genel proje dokümantasyonu
- 📖 **KURULUM.md**: Yerel development kurulumu
- 📖 **GEREKSINIM_ANALIZI.md**: Proje gereksinimleri
- 📖 **RL_INTEGRATION.md**: AI/RL entegrasyonu

### Docker Resources

- 🐳 **Docker Docs**: https://docs.docker.com
- 🐳 **Docker Compose**: https://docs.docker.com/compose
- 🐳 **Best Practices**: https://docs.docker.com/develop/dev-best-practices

### Cloud Platforms

- ☁️ **AWS ECS**: https://aws.amazon.com/ecs
- ☁️ **Google Cloud Run**: https://cloud.google.com/run
- ☁️ **DigitalOcean Apps**: https://www.digitalocean.com/products/app-platform
- ☁️ **Heroku**: https://www.heroku.com

---

## 🆘 Destek

### Sorun Bildirimi

1. `docker-compose logs > error-logs.txt` ile logları kaydedin
2. `.env` dosyasındaki hassas bilgileri çıkarın
3. GitHub Issues'da yeni issue oluşturun

### Topluluk

- **GitHub**: Issues ve Discussions
- **Email**: Proje sahibiyle iletişim

---

## ✅ Checklist: Canlıya Alma

Deployment öncesi kontrol listesi:

- [ ] Docker Desktop kurulu ve çalışıyor
- [ ] `.env` dosyası oluşturuldu
- [ ] OpenAI API key girildi
- [ ] Database şifresi değiştirildi
- [ ] Session secret oluşturuldu
- [ ] `docker-compose build` başarılı
- [ ] `docker-compose up -d` başarılı
- [ ] http://localhost:5000/api/health çalışıyor
- [ ] Web arayüzü açılıyor
- [ ] Chat fonksiyonu çalışıyor
- [ ] Database bağlantısı var
- [ ] FAISS indeksleri oluştu
- [ ] Logs temiz (kritik hata yok)
- [ ] SSL sertifikası kuruldu (production)
- [ ] Domain ayarlandı (production)
- [ ] Backup stratejisi belirlendi
- [ ] Monitoring kuruldu (production)

---

**🎉 Tebrikler! REACH+ projenizi Docker ile canlıya aldınız!**

*Son güncelleme: 2025-01-05*

