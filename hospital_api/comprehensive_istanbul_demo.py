"""
İstanbul Kapsamlı Hastane Listesi Demo
İstanbul'daki TÜM hastaneleri ve sağlık kuruluşlarını listeler
"""

from enhanced_hospital_fetcher import (
    EnhancedHospitalFetcher, 
    get_all_istanbul_hospitals_detailed,
    get_all_istanbul_health_facilities,
    HealthFacility
)
import json
from typing import List

def print_detailed_facility(facility: HealthFacility, index: int):
    """Sağlık kuruluşunu detaylı olarak yazdırır"""
    print(f"\n{'='*80}")
    print(f"{index}. {facility.name}")
    print(f"{'='*80}")
    
    # Temel bilgiler
    print(f"🏥 Tür: {facility.facility_type.upper()}")
    print(f"📍 Konum: {facility.latitude:.6f}, {facility.longitude:.6f}")
    
    # Adres bilgileri
    if facility.address:
        print(f"🏠 Tam Adres: {facility.address}")
    
    if facility.street:
        print(f"   📍 Sokak: {facility.street}")
    if facility.house_number:
        print(f"   🏘️  Kapı No: {facility.house_number}")
    if facility.neighbourhood:
        print(f"   🏘️  Mahalle: {facility.neighbourhood}")
    if facility.district:
        print(f"   🌆 İlçe: {facility.district}")
    if facility.postcode:
        print(f"   📮 Posta Kodu: {facility.postcode}")
    
    # İletişim bilgileri
    if facility.phone:
        print(f"📞 Telefon: {facility.phone}")
    if facility.fax:
        print(f"📠 Fax: {facility.fax}")
    if facility.email:
        print(f"📧 E-posta: {facility.email}")
    if facility.website:
        print(f"🌐 Website: {facility.website}")
    
    # Hastane özellikleri
    if facility.emergency:
        print(f"🚨 Acil Servis: {facility.emergency}")
    if facility.beds:
        print(f"🛏️  Yatak Sayısı: {facility.beds}")
    if facility.operator:
        print(f"🏢 İşletmeci: {facility.operator}")
    if facility.operator_type:
        print(f"🏛️  İşletme Türü: {facility.operator_type}")
    
    # Uzmanlık alanları
    if facility.speciality:
        print(f"👨‍⚕️ Uzmanlık: {facility.speciality}")
    if facility.healthcare:
        print(f"💊 Sağlık Hizmeti: {facility.healthcare}")
    if facility.medical_system:
        print(f"⚕️  Tıp Sistemi: {facility.medical_system}")
    
    # Erişilebilirlik
    if facility.wheelchair:
        print(f"♿ Tekerlekli Sandalye: {facility.wheelchair}")
    if facility.opening_hours:
        print(f"🕐 Açılış Saatleri: {facility.opening_hours}")
    
    # Ek bilgiler
    if facility.description:
        print(f"📝 Açıklama: {facility.description}")
    if facility.wikipedia:
        print(f"📚 Wikipedia: {facility.wikipedia}")
    
    # OSM meta bilgileri
    print(f"🗺️  OSM ID: {facility.osm_id} ({facility.osm_type})")
    if facility.osm_timestamp:
        print(f"🕒 Son Güncelleme: {facility.osm_timestamp}")

def save_facilities_to_detailed_json(facilities: List[HealthFacility], filename: str):
    """Sağlık kuruluşlarını detaylı JSON dosyasına kaydeder"""
    facilities_data = []
    for facility in facilities:
        facilities_data.append({
            'name': facility.name,
            'facility_type': facility.facility_type,
            'coordinates': {
                'latitude': facility.latitude,
                'longitude': facility.longitude
            },
            'address': {
                'full_address': facility.address,
                'street': facility.street,
                'house_number': facility.house_number,
                'neighbourhood': facility.neighbourhood,
                'district': facility.district,
                'city': facility.city,
                'postcode': facility.postcode
            },
            'contact': {
                'phone': facility.phone,
                'fax': facility.fax,
                'email': facility.email,
                'website': facility.website
            },
            'medical_info': {
                'emergency': facility.emergency,
                'beds': facility.beds,
                'operator': facility.operator,
                'operator_type': facility.operator_type,
                'speciality': facility.speciality,
                'healthcare': facility.healthcare,
                'medical_system': facility.medical_system
            },
            'accessibility': {
                'wheelchair': facility.wheelchair,
                'opening_hours': facility.opening_hours
            },
            'additional_info': {
                'description': facility.description,
                'wikipedia': facility.wikipedia,
                'wikidata': facility.wikidata
            },
            'osm_metadata': {
                'id': facility.osm_id,
                'type': facility.osm_type,
                'version': facility.osm_version,
                'timestamp': facility.osm_timestamp
            }
        })
    
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(facilities_data, f, ensure_ascii=False, indent=2)
    
    print(f"\n💾 Detaylı veriler {filename} dosyasına kaydedildi.")

def generate_statistics(facilities: List[HealthFacility]):
    """Sağlık kuruluşları istatistikleri"""
    print(f"\n📊 İSTANBUL SAĞLIK KURULUŞLARI İSTATİSTİKLERİ")
    print(f"{'='*60}")
    
    # Tür bazında sayım
    type_counts = {}
    district_counts = {}
    operator_counts = {}
    emergency_count = 0
    
    for facility in facilities:
        # Tür sayımı
        facility_type = facility.facility_type
        type_counts[facility_type] = type_counts.get(facility_type, 0) + 1
        
        # İlçe sayımı
        if facility.district:
            district_counts[facility.district] = district_counts.get(facility.district, 0) + 1
        
        # İşletmeci sayımı
        if facility.operator:
            operator_counts[facility.operator] = operator_counts.get(facility.operator, 0) + 1
        
        # Acil servis sayımı
        if facility.emergency and facility.emergency.lower() in ['yes', 'true', '24/7']:
            emergency_count += 1
    
    print(f"📈 Toplam Kuruluş Sayısı: {len(facilities)}")
    print(f"🚨 Acil Servisi Olan: {emergency_count}")
    
    print(f"\n🏥 Kuruluş Türleri:")
    for facility_type, count in sorted(type_counts.items(), key=lambda x: x[1], reverse=True):
        print(f"   {facility_type}: {count}")
    
    print(f"\n🌆 En Çok Sağlık Kuruluşu Olan İlçeler (İlk 10):")
    for district, count in sorted(district_counts.items(), key=lambda x: x[1], reverse=True)[:10]:
        print(f"   {district}: {count}")
    
    print(f"\n🏢 En Büyük İşletmeciler (İlk 5):")
    for operator, count in sorted(operator_counts.items(), key=lambda x: x[1], reverse=True)[:5]:
        print(f"   {operator}: {count}")

def main():
    """Ana demo fonksiyonu"""
    print("🏥 İSTANBUL KAPSAMLI SAĞLIK KURULUŞLARI")
    print("=" * 80)
    print("Bu program İstanbul'daki TÜM hastane ve sağlık kuruluşlarını listeler")
    print("OpenStreetMap verilerinden gerçek zamanlı bilgi çeker")
    print("=" * 80)
    
    print("\n📍 SADECE HASTANELER (Hospital) - Detaylı Bilgilerle")
    print("-" * 50)
    
    try:
        # Sadece hastaneleri getir
        print("⏳ İstanbul'daki tüm hastaneler getiriliyor...")
        hospitals = get_all_istanbul_hospitals_detailed()
        
        print(f"\n🎉 {len(hospitals)} hastane bulundu!")
        
        # İlk 5 hastaneyi detaylı göster
        print(f"\n📋 İLK 5 HASTANE (Detaylı Bilgiler):")
        for i, hospital in enumerate(hospitals[:5], 1):
            print_detailed_facility(hospital, i)
        
        # Hastaneleri JSON'a kaydet
        save_facilities_to_detailed_json(hospitals, 'istanbul_hospitals_detailed.json')
        
        # İstatistikler
        generate_statistics(hospitals)
        
        # Kullanıcı seçimi
        print(f"\n❓ Tüm {len(hospitals)} hastaneyi görmek ister misiniz? (e/h): ", end="")
        choice = input().lower()
        
        if choice == 'e':
            print(f"\n📋 TÜM HASTANELER:")
            for i, hospital in enumerate(hospitals, 1):
                print_detailed_facility(hospital, i)
        
    except Exception as e:
        print(f"❌ Hastaneler alınırken hata: {e}")
    
    print("\n" + "=" * 80)
    print("📍 TÜM SAĞLIK KURULUŞLARI (Hospital + Clinic + Doctors + vs.)")
    print("-" * 50)
    
    try:
        # Tüm sağlık kuruluşlarını getir
        print("⏳ İstanbul'daki tüm sağlık kuruluşları getiriliyor...")
        all_facilities = get_all_istanbul_health_facilities()
        
        print(f"\n🎉 {len(all_facilities)} sağlık kuruluşu bulundu!")
        
        # Kapsamlı istatistikler
        generate_statistics(all_facilities)
        
        # Tüm sağlık kuruluşlarını JSON'a kaydet
        save_facilities_to_detailed_json(all_facilities, 'istanbul_all_health_facilities.json')
        
        # Kullanıcı seçimi
        print(f"\n❓ Tüm {len(all_facilities)} sağlık kuruluşunu görmek ister misiniz? (e/h): ", end="")
        choice = input().lower()
        
        if choice == 'e':
            print(f"\n📋 TÜM SAĞLIK KURULUŞLARI:")
            for i, facility in enumerate(all_facilities, 1):
                print_detailed_facility(facility, i)
        
    except Exception as e:
        print(f"❌ Sağlık kuruluşları alınırken hata: {e}")

def quick_hospital_search():
    """Hızlı hastane arama"""
    print("\n🔍 HIZLI HASTANE ARAMA")
    print("-" * 30)
    
    search_term = input("Aranacak hastane adını girin: ").lower()
    
    try:
        hospitals = get_all_istanbul_hospitals_detailed()
        
        matching_hospitals = [h for h in hospitals if search_term in h.name.lower()]
        
        if matching_hospitals:
            print(f"\n🎯 '{search_term}' için {len(matching_hospitals)} sonuç bulundu:")
            for i, hospital in enumerate(matching_hospitals, 1):
                print_detailed_facility(hospital, i)
        else:
            print(f"\n❌ '{search_term}' için sonuç bulunamadı.")
            
    except Exception as e:
        print(f"❌ Arama sırasında hata: {e}")

if __name__ == "__main__":
    # Ana demo
    main()
    
    # Arama seçeneği
    print(f"\n❓ Hastane arama yapmak ister misiniz? (e/h): ", end="")
    choice = input().lower()
    if choice == 'e':
        quick_hospital_search()
    
    print("\n✅ Program tamamlandı!")
    print("📁 Oluşturulan dosyalar:")
    print("   - istanbul_hospitals_detailed.json")
    print("   - istanbul_all_health_facilities.json")
