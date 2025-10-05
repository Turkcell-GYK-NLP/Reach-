#!/bin/bash
# REACH+ Ngrok Setup - Dış Dünyaya Açma

echo "=================================================="
echo "🌐 REACH+ - Ngrok ile Dış Dünyaya Açma"
echo "=================================================="
echo ""

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "📦 Ngrok kurulu değil. Kurulum yapılıyor..."
    echo ""
    
    # macOS için Homebrew ile kurulum
    if [[ "$OSTYPE" == "darwin"* ]]; then
        if command -v brew &> /dev/null; then
            echo "   Homebrew ile kurulumu başlatılıyor..."
            brew install ngrok/ngrok/ngrok
        else
            echo "⚠️  Homebrew kurulu değil!"
            echo "   Manuel kurulum için: https://ngrok.com/download"
            echo ""
            echo "   veya Homebrew kurun:"
            echo "   /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
            exit 1
        fi
    else
        echo "⚠️  Otomatik kurulum sadece macOS için destekleniyor"
        echo "   Manuel kurulum için: https://ngrok.com/download"
        exit 1
    fi
else
    echo "✅ Ngrok zaten kurulu"
fi

echo ""
echo "🔑 Ngrok Authentication"
echo ""
echo "Ngrok kullanmak için ücretsiz hesap oluşturmalısınız:"
echo "1. https://dashboard.ngrok.com/signup adresine gidin"
echo "2. Ücretsiz hesap oluşturun"
echo "3. Dashboard'dan authtoken'ınızı kopyalayın"
echo "4. Aşağıdaki komutu çalıştırın:"
echo ""
echo "   ngrok config add-authtoken <YOUR_AUTHTOKEN>"
echo ""

read -p "Ngrok authtoken'ı ayarladınız mı? (y/n): " response

if [[ "$response" != "y" ]]; then
    echo ""
    echo "❌ Önce ngrok authtoken'ı ayarlayın, sonra bu script'i tekrar çalıştırın"
    exit 1
fi

echo ""
echo "🚀 Docker container'ınızın çalıştığından emin olun..."
docker compose ps | grep -q "reachplus-app.*Up" || {
    echo "⚠️  Container çalışmıyor, başlatılıyor..."
    docker compose up -d
    sleep 10
}

echo ""
echo "🌐 Ngrok tunnel açılıyor..."
echo ""
echo "=================================================="
echo "✅ Ngrok başlatıldı!"
echo "=================================================="
echo ""
echo "📋 Ngrok sizin için bir public URL oluşturacak:"
echo "   Örnek: https://abc123.ngrok.io"
echo ""
echo "🔗 Bu URL'i istediğiniz kişiyle paylaşabilirsiniz!"
echo ""
echo "⚠️  NOT:"
echo "   - Ücretsiz hesapta URL her başlatmada değişir"
echo "   - Terminal penceresi açık kaldığı sürece erişilebilir"
echo "   - Durdurmak için: Ctrl+C"
echo ""
echo "=================================================="
echo ""

# Start ngrok
ngrok http 5001

