# REACH+ Yerel Kurulum Kılavuzu

## 📥 Adım 1: Projeyi İndirin

1. Replit'ten projeyi ZIP olarak indirin 
2. ZIP dosyasını bilgisayarınızda istediğiniz klasöre çıkarın
3. Terminal/Command Prompt açın ve proje klasörüne gidin:
   ```bash
   cd reach-plus
   ```

## 🔧 Adım 2: Node.js Kurulumunu Kontrol Edin

Node.js versiyonunuzu kontrol edin:
```bash
node --version
npm --version
```

**Node.js v18+ gereklidir.** Eğer yüklü değilse:
- https://nodejs.org adresinden indirin ve kurun

## 📦 Adım 3: Bağımlılıkları Yükleyin

```bash
npm install
```

Bu komut `package.json` dosyasındaki tüm bağımlılıkları yükleyecektir (~2-3 dakika sürebilir).

## 🔑 Adım 4: API Anahtarlarını Ayarlayın

### OpenAI API Key (Zorunlu)

1. `.env.example` dosyasını `.env` olarak kopyalayın:
   ```bash
   cp .env.example .env
   ```

2. OpenAI API anahtarı alın:
   - https://platform.openai.com adresine gidin
   - Hesap oluşturun veya giriş yapın  
   - Sol menüden "API Keys" seçin
   - "Create new secret key" tıklayın
   - Anahtarı kopyalayın

3. `.env` dosyasını açın ve anahtarınızı yapıştırın:
   ```
   OPENAI_API_KEY=sk-your-real-api-key-here
   ```

### Twitter API Keys (Opsiyonel)

Gerçek sosyal medya verisi için:

1. https://developer.twitter.com adresine gidin
2. Developer hesabı oluşturun
3. Yeni bir app oluşturun
4. API anahtarlarını alın ve `.env` dosyasına ekleyin

> **Önemli**: Twitter API olmadan da sistem çalışır, mock veriler kullanır.

## 🚀 Adım 5: Projeyi Başlatın

```bash
npm run dev
```

Bu komut hem backend hem frontend'i başlatacaktır.

## ✅ Adım 6: Testi Yapın

1. Tarayıcınızda http://localhost:5000 adresine gidin
2. Anasayfada sohbet kutusuna şu soruyu yazın: "Kadıköy'de Türk Telekom çekiyor mu?"
3. AI'dan direkt yanıt almalısınız: "Kadıköy'de Türk Telekom: %95 kapsama..."

## 🛠️ Sorun Giderme

### "Port already in use" Hatası
```bash
# Farklı port kullanın
PORT=3001 npm run dev
```

### OpenAI API Hatası
- `.env` dosyasında API anahtarınızı kontrol edin
- Anahtarın `sk-` ile başladığından emin olun
- API anahtarınızda kredi olduğunu kontrol edin

### "Module not found" Hatası
```bash
# Node modules'ı temizleyip yeniden yükleyin
rm -rf node_modules package-lock.json
npm install
```

### Tarayıcıda Bağlantı Hatası
- Terminal'de "serving on port 5000" mesajını görmeli
- http://localhost:5000 tam adresi kullanın
- Firewall/antivirus yazılımı 5000 portunu engelliyor olabilir

## 📱 Mobil Test

Yerel ağdaki diğer cihazlardan test etmek için:
```bash
# Bilgisayarınızın IP adresini öğrenin
ipconfig  # Windows
ifconfig  # Mac/Linux

# Mobil cihazda şu adresi açın:
http://192.168.1.100:5000  # IP adresinizi kullanın
```

## 🔄 Güncellemeler

Proje güncellendiğinde:
```bash
git pull origin main  # Eğer git kullanıyorsanız
npm install          # Yeni bağımlılıkları yükle
npm run dev          # Yeniden başlat
```

## 💾 Veritabanı (Opsiyonel)

Development için hafıza depolama kullanılır. PostgreSQL kullanmak isterseniz:

1. PostgreSQL kurun
2. `.env` dosyasına `DATABASE_URL` ekleyin
3. `npm run db:push` ile şemayı oluşturun

## 🔧 IDE Ayarları

**VS Code için önerilen eklentiler:**
- TypeScript and JavaScript Language Features
- Tailwind CSS IntelliSense
- ES7+ React/Redux/React-Native snippets

## 📊 Performans İpuçları

- Development modunda sistem biraz yavaş olabilir
- Production build için: `npm run build && npm start`
- Chrome DevTools ile performance analizi yapabilirsiniz

## ❓ Sıkça Sorulan Sorular

**Q: Twitter API olmadan çalışır mı?**
A: Evet, mock verilerle çalışır.

**Q: Hangi tarayıcılar destekleniyor?**
A: Chrome, Firefox, Safari, Edge modern sürümleri.

**Q: Production'a nasıl deploy ederim?**
A: `npm run build` sonrası `dist/` klasörünü sunucunuza yükleyin.

**Q: API limitleri neler?**
A: OpenAI API kullanımınıza göre ücretlendirilir, Twitter API günlük limitleri vardır.

---

**Kurulum tamamlandı! 🎉**

Sorularınız için GitHub Issues kullanabilir veya README.md dosyasına bakabilirsiniz.