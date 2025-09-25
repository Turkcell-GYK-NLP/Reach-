"""
Hospital API - Ana Kullanım Örneği
OpenStreetMap verilerinden hastane bilgilerini çeken API'nin kullanım örnekleri
"""

from hospital_fetcher import HospitalFetcher, get_hospitals_in_turkish_city, Hospital
import json
from typing import List

def print_hospitals(hospitals: List[Hospital], title: str):
    """Hastane listesini güzel bir formatta yazdırır"""
    print(f"\n{'='*60}")
    print(f"{title}")
    print(f"{'='*60}")
    
    if not hospitals:
        print("Hastane bulunamadı.")
        return
    
    for i, hospital in enumerate(hospitals, 1):
        print(f"\n{i}. {hospital.name}")
        print(f"   📍 Konum: {hospital.latitude:.6f}, {hospital.longitude:.6f}")
        
        if hospital.address:
            print(f"   🏠 Adres: {hospital.address}")
        
        if hospital.phone:
            print(f"   📞 Telefon: {hospital.phone}")
        
        if hospital.website:
            print(f"   🌐 Website: {hospital.website}")
        
        if hospital.operator:
            print(f"   🏥 İşletmeci: {hospital.operator}")
        
        if hospital.beds:
            print(f"   🛏️  Yatak Sayısı: {hospital.beds}")
        
        if hospital.emergency:
            print(f"   🚨 Acil Servis: {hospital.emergency}")

def save_hospitals_to_json(hospitals: List[Hospital], filename: str):
    """Hastane verilerini JSON dosyasına kaydeder"""
    hospitals_data = []
    for hospital in hospitals:
        hospitals_data.append({
            'name': hospital.name,
            'latitude': hospital.latitude,
            'longitude': hospital.longitude,
            'address': hospital.address,
            'phone': hospital.phone,
            'website': hospital.website,
            'emergency': hospital.emergency,
            'beds': hospital.beds,
            'operator': hospital.operator,
            'osm_id': hospital.osm_id,
            'osm_type': hospital.osm_type
        })
    
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(hospitals_data, f, ensure_ascii=False, indent=2)
    
    print(f"\nVeriler {filename} dosyasına kaydedildi.")

def main():
    """Ana fonksiyon - Farklı kullanım örneklerini gösterir"""
    
    # HospitalFetcher örneği oluştur
    fetcher = HospitalFetcher()
    
    print("🏥 OpenStreetMap Hastane Verisi Çekici")
    print("🗺️  Açık kaynaklı harita verilerinden hastane bilgilerini çeker")
    
    # Örnek 1: İstanbul'daki hastaneler (önceden tanımlı koordinatlarla)
    print("\n📍 İstanbul'daki hastaneler getiriliyor...")
    try:
        istanbul_hospitals = get_hospitals_in_turkish_city('istanbul')
        print_hospitals(istanbul_hospitals[:5], "İSTANBUL HASTANELERİ (İlk 5)")
        
        # JSON'a kaydet
        if istanbul_hospitals:
            save_hospitals_to_json(istanbul_hospitals, 'istanbul_hospitals.json')
    
    except Exception as e:
        print(f"İstanbul hastaneleri alınırken hata: {e}")
    
    # Örnek 2: Ankara'daki hastaneler
    print("\n📍 Ankara'daki hastaneler getiriliyor...")
    try:
        ankara_hospitals = get_hospitals_in_turkish_city('ankara')
        print_hospitals(ankara_hospitals[:3], "ANKARA HASTANELERİ (İlk 3)")
    
    except Exception as e:
        print(f"Ankara hastaneleri alınırken hata: {e}")
    
    # Örnek 3: Belirli bir nokta etrafındaki hastaneler (Taksim Meydanı çevresi)
    print("\n📍 Taksim Meydanı çevresindeki hastaneler (5km yarıçap)...")
    try:
        taksim_hospitals = fetcher.get_hospitals_around_point(
            latitude=41.0369,  # Taksim Meydanı
            longitude=28.9850,
            radius_km=5
        )
        print_hospitals(taksim_hospitals, "TAKSİM ÇEVRESİ HASTANELERİ")
    
    except Exception as e:
        print(f"Taksim çevresi hastaneleri alınırken hata: {e}")
    
    # Örnek 4: Manuel koordinat kutusu ile (Kadıköy bölgesi)
    print("\n📍 Kadıköy bölgesindeki hastaneler...")
    try:
        kadikoy_hospitals = fetcher.get_hospitals_by_bbox(
            min_lat=40.9500,
            min_lon=29.0000,
            max_lat=41.0200,
            max_lon=29.1000
        )
        print_hospitals(kadikoy_hospitals, "KADIKÖY BÖLGESİ HASTANELERİ")
    
    except Exception as e:
        print(f"Kadıköy bölgesi hastaneleri alınırken hata: {e}")

def interactive_search():
    """Interaktif hastane arama"""
    fetcher = HospitalFetcher()
    
    print("\n🔍 İnteraktif Hastane Arama")
    print("1. Şehir adına göre ara")
    print("2. Koordinat noktası çevresinde ara")
    print("3. Koordinat kutusu içinde ara")
    
    choice = input("\nSeçiminizi yapın (1-3): ")
    
    if choice == '1':
        city = input("Şehir adını girin (istanbul, ankara, izmir, vb.): ").lower()
        try:
            hospitals = get_hospitals_in_turkish_city(city)
            print_hospitals(hospitals, f"{city.upper()} HASTANELERİ")
        except Exception as e:
            print(f"Hata: {e}")
    
    elif choice == '2':
        try:
            lat = float(input("Enlem (latitude) girin: "))
            lon = float(input("Boylam (longitude) girin: "))
            radius = float(input("Arama yarıçapı (km) girin: "))
            
            hospitals = fetcher.get_hospitals_around_point(lat, lon, radius)
            print_hospitals(hospitals, f"NOKTA ÇEVRESİ HASTANELERİ ({radius}km)")
        except ValueError:
            print("Geçersiz sayı formatı!")
        except Exception as e:
            print(f"Hata: {e}")
    
    elif choice == '3':
        try:
            min_lat = float(input("Minimum enlem girin: "))
            min_lon = float(input("Minimum boylam girin: "))
            max_lat = float(input("Maksimum enlem girin: "))
            max_lon = float(input("Maksimum boylam girin: "))
            
            hospitals = fetcher.get_hospitals_by_bbox(min_lat, min_lon, max_lat, max_lon)
            print_hospitals(hospitals, "KUTU İÇİ HASTANELERİ")
        except ValueError:
            print("Geçersiz sayı formatı!")
        except Exception as e:
            print(f"Hata: {e}")
    
    else:
        print("Geçersiz seçim!")

if __name__ == "__main__":
    # Ana örnekleri çalıştır
    main()
    
    # İnteraktif arama seçeneği
    run_interactive = input("\nİnteraktif arama yapmak ister misiniz? (e/h): ").lower()
    if run_interactive == 'e':
        interactive_search()
    
    print("\n✅ Program tamamlandı!")
