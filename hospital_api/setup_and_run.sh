#!/bin/bash

# Hospital API Kurulum ve Çalıştırma Scripti
echo "🏥 Hospital API - Kurulum ve Test"
echo "================================="

# Mevcut dizinde mi kontrol et
if [ ! -f "hospital_fetcher.py" ]; then
    echo "❌ Lütfen hospital_api klasörü içinde çalıştırın!"
    exit 1
fi

# Virtual environment var mı kontrol et
if [ ! -d "venv" ]; then
    echo "📦 Virtual environment oluşturuluyor..."
    python3 -m venv venv
fi

# Virtual environment'ı aktif et
echo "🔧 Virtual environment aktifleştiriliyor..."
source venv/bin/activate

# Paketleri yükle
echo "📥 Gerekli paketler yükleniyor..."
pip install -r requirements.txt

# Test çalıştır
echo "🧪 API test ediliyor..."
python quick_test.py

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Kurulum başarılı! Şimdi ana programı çalıştırabilirsiniz:"
    echo "   source venv/bin/activate"
    echo "   python main.py"
    echo ""
    echo "🚀 Ana programı şimdi çalıştırmak ister misiniz? (y/n)"
    read -r response
    if [ "$response" = "y" ] || [ "$response" = "Y" ]; then
        echo "🏥 Ana program başlatılıyor..."
        python main.py
    fi
else
    echo "❌ Test başarısız! Lütfen bağlantınızı kontrol edin."
    exit 1
fi
