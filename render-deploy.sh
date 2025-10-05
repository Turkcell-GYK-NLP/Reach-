#!/bin/bash
# REACH+ - Render.com Deployment Helper

echo "=================================================="
echo "🚀 REACH+ - Render.com Deployment"
echo "=================================================="
echo ""

# Check if git is initialized
if [ ! -d .git ]; then
    echo "📦 Git repository oluşturuluyor..."
    git init
    git add .
    git commit -m "Initial commit for Render deployment"
    echo "✅ Git repository oluşturuldu"
else
    echo "✅ Git repository zaten mevcut"
fi

echo ""
echo "📋 GitHub Repository Gerekli!"
echo ""
echo "Adımlar:"
echo ""
echo "1️⃣  GitHub'da yeni repository oluşturun:"
echo "   https://github.com/new"
echo "   Repository adı: reachplus (veya istediğiniz ad)"
echo "   ✅ Public veya Private (ikisi de çalışır)"
echo "   ❌ README eklemeyin (zaten var)"
echo ""
echo "2️⃣  Repository'nizi bağlayın:"
echo "   (GitHub'da oluşturduktan sonra göreceğiniz komutlar)"
echo ""

read -p "GitHub repository URL'inizi girin: " REPO_URL

if [ -z "$REPO_URL" ]; then
    echo "❌ Repository URL'i gerekli!"
    exit 1
fi

echo ""
echo "🔗 GitHub'a bağlanıyor..."

# Check if remote exists
if git remote | grep -q origin; then
    echo "   Remote 'origin' zaten var, güncelleniyor..."
    git remote set-url origin "$REPO_URL"
else
    git remote add origin "$REPO_URL"
fi

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
if [ -z "$CURRENT_BRANCH" ]; then
    git checkout -b main
    CURRENT_BRANCH="main"
fi

echo ""
echo "📤 GitHub'a push ediliyor..."
git branch -M main
git push -u origin main

echo ""
echo "=================================================="
echo "✅ GitHub'a başarıyla yüklendi!"
echo "=================================================="
echo ""
echo "📋 Şimdi Render.com'da Deploy Edin:"
echo ""
echo "1️⃣  https://render.com/ adresine gidin"
echo "   → 'Get Started' veya 'Sign Up' tıklayın"
echo "   → GitHub ile giriş yapın"
echo ""
echo "2️⃣  Dashboard'da 'New +' → 'Web Service' tıklayın"
echo ""
echo "3️⃣  Repository'nizi seçin: $(basename $REPO_URL .git)"
echo ""
echo "4️⃣  Ayarları yapın:"
echo "   ┌────────────────────────────────────────┐"
echo "   │ Name: reachplus                        │"
echo "   │ Region: Frankfurt (veya en yakın)     │"
echo "   │ Branch: main                           │"
echo "   │ Environment: Docker                    │"
echo "   │ Instance Type: Free                    │"
echo "   └────────────────────────────────────────┘"
echo ""
echo "5️⃣  Environment Variables ekleyin (önemli!):"
echo "   ┌────────────────────────────────────────┐"
echo "   │ Key: OPENAI_API_KEY                    │"
echo "   │ Value: sk-your-actual-key-here         │"
echo "   ├────────────────────────────────────────┤"
echo "   │ Key: NODE_ENV                          │"
echo "   │ Value: production                      │"
echo "   ├────────────────────────────────────────┤"
echo "   │ Key: PORT                              │"
echo "   │ Value: 5000                            │"
echo "   └────────────────────────────────────────┘"
echo ""
echo "6️⃣  'Create Web Service' tıklayın"
echo ""
echo "   ⏳ Build başlayacak (5-10 dakika sürer)"
echo ""
echo "7️⃣  PostgreSQL ekleyin (opsiyonel ama önerilir):"
echo "   Dashboard → 'New +' → 'PostgreSQL'"
echo "   ┌────────────────────────────────────────┐"
echo "   │ Name: reachplus-db                     │"
echo "   │ Region: Frankfurt (aynı bölge)         │"
echo "   │ Instance Type: Free                    │"
echo "   └────────────────────────────────────────┘"
echo ""
echo "8️⃣  Database URL'ini Web Service'e bağlayın:"
echo "   PostgreSQL Dashboard → Internal Database URL'i kopyalayın"
echo "   Web Service → Environment → Add Environment Variable:"
echo "   ┌────────────────────────────────────────┐"
echo "   │ Key: DATABASE_URL                      │"
echo "   │ Value: (kopyaladığınız URL)            │"
echo "   └────────────────────────────────────────┘"
echo ""
echo "=================================================="
echo "✅ Deploy tamamlandığında URL'iniz:"
echo "   https://reachplus-xxxx.onrender.com"
echo "=================================================="
echo ""
echo "📊 Kullanışlı Bilgiler:"
echo "   • İlk deploy: 5-10 dakika"
echo "   • Sonraki deploylar: 2-3 dakika"
echo "   • Auto-deploy: Her git push'ta otomatik deploy olur"
echo "   • Logs: Render Dashboard → Logs sekmesi"
echo "   • Custom domain: Settings → Add Custom Domain"
echo ""
echo "⚠️  ÖNEMLİ:"
echo "   • Free plan'da 15 dakika inaktiviteden sonra uyur"
echo "   • İlk istek 30 saniye sürebilir (cold start)"
echo "   • 750 saat/ay limit (1 proje için yeterli)"
echo ""
echo "🎉 Başarılar!"

