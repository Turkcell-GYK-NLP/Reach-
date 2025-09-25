"""
Hızlı Test Scripti
OpenStreetMap Hospital API'sinin çalışıp çalışmadığını test eder
"""

from hospital_fetcher import HospitalFetcher, get_hospitals_in_turkish_city
import sys

def quick_test():
    """Hızlı API testi"""
    print("🧪 Hospital API Hızlı Test")
    print("-" * 40)
    
    try:
        # Test 1: İstanbul'dan 3 hastane getir (limited test)
        print("📍 Test 1: İstanbul hastaneleri (sınırlı alan)...")
        fetcher = HospitalFetcher()
        
        # Küçük bir alan testi (Beşiktaş çevresi)
        hospitals = fetcher.get_hospitals_by_bbox(
            min_lat=41.0300,
            min_lon=29.0000,
            max_lat=41.0600,
            max_lon=29.0500
        )
        
        if hospitals:
            print(f"✅ {len(hospitals)} hastane bulundu!")
            print(f"   Örnek: {hospitals[0].name}")
            print(f"   Konum: {hospitals[0].latitude:.4f}, {hospitals[0].longitude:.4f}")
        else:
            print("❌ Hastane bulunamadı")
        
        # Test 2: Nokta çevresi arama (küçük yarıçap)
        print("\n📍 Test 2: Taksim çevresi (2km)...")
        taksim_hospitals = fetcher.get_hospitals_around_point(
            latitude=41.0369,
            longitude=28.9850,
            radius_km=2
        )
        
        if taksim_hospitals:
            print(f"✅ {len(taksim_hospitals)} hastane bulundu!")
            if taksim_hospitals:
                print(f"   Örnek: {taksim_hospitals[0].name}")
        else:
            print("❌ Taksim çevresinde hastane bulunamadı")
        
        print("\n🎉 Test başarıyla tamamlandı!")
        return True
        
    except Exception as e:
        print(f"\n❌ Test sırasında hata: {e}")
        return False

def connection_test():
    """Bağlantı testi"""
    print("\n🌐 Overpass API Bağlantı Testi")
    print("-" * 40)
    
    import requests
    
    urls = [
        "http://overpass-api.de/api/interpreter",
        "https://overpass.kumi.systems/api/interpreter"
    ]
    
    for url in urls:
        try:
            print(f"Deneniyor: {url}")
            response = requests.get(url, timeout=10, params={'data': '[out:json];out;'})
            if response.status_code == 200:
                print(f"✅ {url} - Erişilebilir")
            else:
                print(f"❌ {url} - Status: {response.status_code}")
        except Exception as e:
            print(f"❌ {url} - Hata: {e}")

if __name__ == "__main__":
    print("🏥 Hospital API Test Suite")
    print("=" * 50)
    
    # Bağlantı testi
    connection_test()
    
    # API testi
    success = quick_test()
    
    if success:
        print("\n✅ Tüm testler başarılı! API kullanıma hazır.")
        print("\nKullanım için:")
        print("  python main.py")
    else:
        print("\n❌ Testler başarısız! Lütfen bağlantınızı kontrol edin.")
        sys.exit(1)
