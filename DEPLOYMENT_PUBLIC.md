# 🌍 REACH+ - Dış Dünyaya Açma Kılavuzu

Bu dokümantasyon, Docker'da çalışan REACH+ uygulamanızı internetten erişilebilir hale getirmek için tüm yöntemleri açıklar.

---

## 🎯 Hangi Yöntemi Seçmeliyim?

| Yöntem | Süre | Maliyet | Kullanım Senaryosu | Önerilen |
|--------|------|---------|---------------------|----------|
| **Ngrok** | 5 dk | Ücretsiz* | Test, demo, geçici paylaşım | ⭐⭐⭐⭐⭐ |
| **Cloudflare Tunnel** | 10 dk | Ücretsiz | Uzun süreli, güvenli | ⭐⭐⭐⭐ |
| **Railway** | 15 dk | Ücretsiz* | Hızlı production | ⭐⭐⭐⭐ |
| **DigitalOcean** | 30 dk | $5/ay | Production | ⭐⭐⭐ |
| **AWS/GCP** | 60 dk | Değişken | Enterprise | ⭐⭐ |

\* Sınırlı ücretsiz plan

---

## 1️⃣ NGROK (ÖNERİLEN - EN HIZLI) ⚡

### Avantajlar
✅ En hızlı kurulum (5 dakika)  
✅ Ücretsiz plan mevcut  
✅ HTTPS otomatik  
✅ Kolay kullanım  
✅ Test ve demo için mükemmel  

### Dezavantajlar
⚠️ URL her başlatmada değişir (ücretsiz plan)  
⚠️ Terminal açık kalmalı  
⚠️ Aylık trafik limiti var  

### Kurulum ve Kullanım

#### A. Ngrok Kurulumu (macOS)

```bash
# Homebrew ile kurulum
brew install ngrok/ngrok/ngrok
```

#### B. Ngrok Hesabı Oluşturma

1. https://dashboard.ngrok.com/signup adresine gidin
2. **Ücretsiz** hesap oluşturun (Google/GitHub ile giriş yapabilirsiniz)
3. Dashboard'dan **authtoken**'ınızı kopyalayın
4. Terminal'de ayarlayın:

```bash
ngrok config add-authtoken <YOUR_AUTHTOKEN>
```

#### C. Uygulamayı Dış Dünyaya Açma

```bash
# Docker container'ınızın çalıştığından emin olun
docker compose ps

# Ngrok tunnel'ı başlatın
ngrok http 5001
```

veya hazır script'i kullanın:

```bash
./ngrok-setup.sh
```

#### D. Public URL'i Paylaşma

Ngrok başladığında şöyle bir çıktı göreceksiniz:

```
Session Status                online
Account                       YourName (Plan: Free)
Version                       3.x.x
Region                        United States (us)
Latency                       45ms
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123xyz.ngrok.io -> http://localhost:5001

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

🔗 **Paylaşım URL'i**: `https://abc123xyz.ngrok.io`

Bu URL'i istediğiniz kişiyle paylaşabilirsiniz!

#### E. Ngrok Web Interface

Ngrok çalışırken http://127.0.0.1:4040 adresinden:
- Gelen istekleri görebilirsiniz
- Request/response detaylarını inceleyebilirsiniz
- Debug yapabilirsiniz

#### F. Sabit URL (Opsiyonel - Ücretli)

Ücretsiz planda URL her başlatmada değişir. Sabit URL için:

```bash
# Ngrok Pro hesap gerektirir ($8/ay)
ngrok http 5001 --domain=reachplus.ngrok.io
```

---

## 2️⃣ CLOUDFLARE TUNNEL (ÜCRETSİZ + KALICI)

### Avantajlar
✅ Tamamen ücretsiz  
✅ Sabit domain alabilirsiniz  
✅ DDoS koruması  
✅ HTTPS otomatik  
✅ Trafik limiti yok  
✅ Production için uygun  

### Dezavantajlar
⚠️ Kurulum biraz daha karmaşık  
⚠️ Cloudflare hesabı gerekli  

### Kurulum

#### A. Cloudflare CLI Kurulumu

```bash
# macOS
brew install cloudflare/cloudflare/cloudflared

# Linux
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb
```

#### B. Login

```bash
cloudflared tunnel login
```

Tarayıcıda Cloudflare'e giriş yapın ve domain seçin.

#### C. Tunnel Oluşturma

```bash
# Tunnel oluştur
cloudflared tunnel create reachplus

# Tunnel bilgilerini göster
cloudflared tunnel list
```

#### D. Konfigürasyon

`~/.cloudflared/config.yml` dosyası oluşturun:

```yaml
url: http://localhost:5001
tunnel: <TUNNEL_ID>
credentials-file: /Users/yourname/.cloudflared/<TUNNEL_ID>.json
```

#### E. DNS Kayıt Oluşturma

```bash
cloudflared tunnel route dns reachplus reachplus.yourdomain.com
```

#### F. Tunnel'ı Başlatma

```bash
cloudflared tunnel run reachplus
```

veya servis olarak çalıştırma:

```bash
cloudflared service install
sudo systemctl start cloudflared
```

🔗 **Erişim URL'i**: `https://reachplus.yourdomain.com`

---

## 3️⃣ RAILWAY (HIZLI PRODUCTION) 🚂

### Avantajlar
✅ En kolay production deployment  
✅ Git push ile otomatik deploy  
✅ Ücretsiz $5 kredi/ay  
✅ PostgreSQL dahil  
✅ HTTPS ve domain ücretsiz  

### Kurulum

#### A. Railway Hesabı

1. https://railway.app/ adresine gidin
2. GitHub ile giriş yapın

#### B. Proje Oluşturma

```bash
# Railway CLI kurulumu
npm i -g @railway/cli

# Login
railway login

# Proje oluştur
railway init

# Deploy
railway up
```

#### C. Environment Variables

Railway Dashboard'dan:
- `OPENAI_API_KEY` ekleyin
- `NODE_ENV=production` ayarlayın
- PostgreSQL otomatik bağlanır

#### D. Domain

Railway otomatik bir domain verir:
- `reachplus-production.up.railway.app`

Kendi domain'inizi de ekleyebilirsiniz.

---

## 4️⃣ DIGITALOCEAN APP PLATFORM

### Avantajlar
✅ Basit kullanım  
✅ PostgreSQL dahil  
✅ Auto-scaling  
✅ $5/ay'dan başlayan fiyat  

### Kurulum

#### A. DigitalOcean Hesabı

1. https://www.digitalocean.com/ adresine gidin
2. Hesap oluşturun ($200 ücretsiz kredi alabilirsiniz)

#### B. App Platform'u Kullanma

1. **Apps** → **Create App** tıklayın
2. **GitHub** repository'nizi seçin veya Docker Hub'dan deploy edin
3. Environment variables ekleyin:
   - `OPENAI_API_KEY`
   - `NODE_ENV=production`
4. PostgreSQL database ekleyin (App Platform içinden)
5. **Deploy** tıklayın

#### C. Domain

DigitalOcean otomatik domain verir:
- `reachplus-xxxxx.ondigitalocean.app`

Kendi domain'inizi de ekleyebilirsiniz.

---

## 5️⃣ VPS + NGINX (MANUALx DEPLOYMENT)

### Avantajlar
✅ Tam kontrol  
✅ Dilediğiniz gibi özelleştirebilirsiniz  
✅ Kendi domain'iniz  

### Dezavantajlar
⚠️ Manuel konfigürasyon gerekli  
⚠️ Sunucu yönetimi bilgisi gerekli  
⚠️ SSL sertifikası kendiniz kurmalısınız  

### Kurulum (Özet)

#### A. VPS Satın Alma

- DigitalOcean Droplet: $5/ay
- Linode: $5/ay
- Vultr: $5/ay
- AWS Lightsail: $3.5/ay

#### B. Docker Kurulumu

```bash
# Ubuntu 22.04 için
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo apt install docker-compose-plugin
```

#### C. Projenizi Upload Etme

```bash
# Local'den VPS'e kopyalama
scp -r GYKProje root@your-vps-ip:/root/

# VPS'e SSH ile bağlanma
ssh root@your-vps-ip

# Başlatma
cd /root/GYKProje
docker compose up -d
```

#### D. Nginx Reverse Proxy

```bash
# Nginx kurulumu
sudo apt install nginx

# Konfigürasyon
sudo nano /etc/nginx/sites-available/reachplus
```

Nginx config:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5001;
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

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/reachplus /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### E. SSL (Let's Encrypt)

```bash
# Certbot kurulumu
sudo apt install certbot python3-certbot-nginx

# SSL sertifikası alma
sudo certbot --nginx -d your-domain.com

# Auto-renewal test
sudo certbot renew --dry-run
```

---

## 📋 Hızlı Karşılaştırma

### Ngrok vs Cloudflare Tunnel vs Railway

| Özellik | Ngrok | Cloudflare | Railway |
|---------|-------|------------|---------|
| **Kurulum Süresi** | 5 dk | 15 dk | 10 dk |
| **Maliyet** | Ücretsiz* | Ücretsiz | Ücretsiz* |
| **Sabit URL** | ❌ (ücretli) | ✅ | ✅ |
| **HTTPS** | ✅ | ✅ | ✅ |
| **Kendi Domain** | ✅ (ücretli) | ✅ | ✅ |
| **Trafik Limiti** | 40GB/ay | ∞ | Ücretsiz $5 |
| **Production** | ❌ | ✅ | ✅ |
| **Database** | ❌ | ❌ | ✅ |
| **Auto-restart** | ❌ | ✅ | ✅ |

---

## 🚀 Önerilen Akış

### Test/Demo İçin (Bugün)
```
1. Ngrok kurulum ve kullanım → 5 dakika
2. Link'i paylaş → Anında erişim
```

### Kısa Süreli Proje (Bu Hafta)
```
1. Cloudflare Tunnel kurulum → 15 dakika
2. Sabit URL al → Kalıcı erişim
```

### Production (Bu Ay)
```
1. Railway'e deploy → 30 dakika
2. Kendi domain bağla → Profesyonel görünüm
```

---

## 🔒 Güvenlik Notları

### Tüm Yöntemler İçin

1. **API Keys'i Güvende Tutun**
   ```bash
   # .env dosyasını asla Git'e commit etmeyin
   git status  # .env ignored olmalı
   ```

2. **Güçlü Şifreler**
   ```bash
   # Production'da güçlü şifreler kullanın
   PGPASSWORD=$(openssl rand -base64 32)
   SESSION_SECRET=$(openssl rand -base64 32)
   ```

3. **Rate Limiting**
   - Ngrok ve Cloudflare otomatik DDoS koruması sağlar
   - Railway ve DigitalOcean'da manuel ayarlayabilirsiniz

4. **HTTPS**
   - Tüm yöntemler otomatik HTTPS sağlar
   - Manuel VPS'de Let's Encrypt kullanın

5. **Firewall**
   ```bash
   # VPS'de sadece gerekli portları açın
   sudo ufw allow 22   # SSH
   sudo ufw allow 80   # HTTP
   sudo ufw allow 443  # HTTPS
   sudo ufw enable
   ```

---

## 🎯 Hızlı Başlangıç Komutları

### Ngrok ile Başlama (ÖNERİLEN)

```bash
# 1. Kurulum
brew install ngrok/ngrok/ngrok

# 2. Hesap oluştur ve token al
# https://dashboard.ngrok.com/signup

# 3. Token'ı ayarla
ngrok config add-authtoken <YOUR_TOKEN>

# 4. Docker'ı başlat
docker compose up -d

# 5. Ngrok'u başlat
ngrok http 5001

# 6. URL'i paylaş!
# https://xxxxx.ngrok.io
```

### Cloudflare Tunnel ile Başlama

```bash
# 1. Kurulum
brew install cloudflare/cloudflare/cloudflared

# 2. Login
cloudflared tunnel login

# 3. Tunnel oluştur
cloudflared tunnel create reachplus

# 4. DNS ayarla
cloudflared tunnel route dns reachplus reachplus.yourdomain.com

# 5. Başlat
cloudflared tunnel run reachplus
```

### Railway ile Başlama

```bash
# 1. Kurulum
npm i -g @railway/cli

# 2. Login
railway login

# 3. Init
railway init

# 4. Deploy
railway up
```

---

## 📞 Sorun Giderme

### Ngrok Sorunları

**Problem**: "Account not found"
```bash
# Solution: Token'ı yeniden ayarlayın
ngrok config add-authtoken <YOUR_TOKEN>
```

**Problem**: "Tunnel başlamıyor"
```bash
# Solution: Port'u kontrol edin
docker compose ps  # 5001 portunda çalışıyor mu?
curl http://localhost:5001/api/health  # Local'de çalışıyor mu?
```

### Cloudflare Sorunları

**Problem**: "DNS kayıt oluşturulamıyor"
```bash
# Solution: Domain'in Cloudflare'de olduğundan emin olun
cloudflared tunnel list
```

### Railway Sorunları

**Problem**: "Build başarısız"
```bash
# Solution: Dockerfile'ınızın root'ta olduğundan emin olun
railway logs
```

---

## 💰 Maliyet Karşılaştırması

### Ücretsiz Seçenekler

| Platform | Ücretsiz Plan | Limitler |
|----------|---------------|----------|
| **Ngrok** | ✅ | 1 tunnel, URL değişir, 40GB/ay |
| **Cloudflare** | ✅ | Limitsiz trafik |
| **Railway** | ✅ | $5 kredi/ay (~500 saat) |
| **DigitalOcean** | ❌ | $200 kredi (yeni hesap) |

### Ücretli Seçenekler

| Platform | Başlangıç Fiyatı | Özellikler |
|----------|------------------|------------|
| **Ngrok Pro** | $8/ay | Sabit URL, 3 tunnel |
| **Railway Pro** | $20/ay | Unlimited usage |
| **DigitalOcean** | $5/ay | 1GB RAM Droplet |
| **AWS Lightsail** | $3.5/ay | 512MB RAM |

---

## 🎓 İpuçları

1. **Test için önce Ngrok kullanın** - En hızlı yol
2. **Production'da Cloudflare Tunnel veya Railway kullanın** - Ücretsiz ve güvenilir
3. **Kendi domain'iniz varsa Railway'i tercih edin** - Kolay domain bağlama
4. **Yüksek trafik bekleniyorsa DigitalOcean/AWS** - Daha fazla kontrol
5. **SSL otomatik gelir** - Tüm platformlarda HTTPS otomatik

---

## 📚 Ek Kaynaklar

- **Ngrok Docs**: https://ngrok.com/docs
- **Cloudflare Tunnel**: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/
- **Railway Docs**: https://docs.railway.app/
- **DigitalOcean App Platform**: https://docs.digitalocean.com/products/app-platform/

---

**🎉 Artık uygulamanızı dünya ile paylaşabilirsiniz!**

Sorularınız için `DOCKER_DEPLOYMENT.md` dokümantasyonuna bakabilirsiniz.

*Son güncelleme: 2025-10-05*

