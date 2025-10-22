#!/usr/bin/env python3
import json

# İstanbul'un tüm ilçeleri
istanbul_districts = [
    'Adalar', 'Arnavutköy', 'Ataşehir', 'Avcılar', 'Bağcılar', 'Bahçelievler',
    'Bakırköy', 'Başakşehir', 'Bayrampaşa', 'Beşiktaş', 'Beykoz', 'Beylikdüzü',
    'Beyoğlu', 'Büyükçekmece', 'Çatalca', 'Çekmeköy', 'Esenler', 'Esenyurt',
    'Eyüpsultan', 'Fatih', 'Gaziosmanpaşa', 'Güngören', 'Kadıköy', 'Kağıthane',
    'Kartal', 'Küçükçekmece', 'Maltepe', 'Pendik', 'Sancaktepe', 'Sarıyer',
    'Silivri', 'Sultanbeyli', 'Sultangazi', 'Şile', 'Şişli', 'Tuzla',
    'Ümraniye', 'Üsküdar', 'Zeytinburnu'
]

# Mevcut hastane verilerini oku
with open('istanbul_hospitals_detailed.json', 'r', encoding='utf-8') as f:
    hospitals = json.load(f)

# İlçelere göre hastane sayılarını hesapla
district_counts = {}
for hospital in hospitals:
    if hospital.get('name') != 'İsimsiz Hospital' and hospital.get('coordinates'):
        district = hospital.get('address', {}).get('district')
        if district:
            district_counts[district] = district_counts.get(district, 0) + 1

print("🏥 İSTANBUL İLÇELERİ HASTANE DURUMU")
print("="*60)

missing_districts = []
low_count_districts = []

for district in istanbul_districts:
    count = district_counts.get(district, 0)
    if count == 0:
        missing_districts.append(district)
        print(f"❌ {district}: 0 hastane")
    elif count < 3:
        low_count_districts.append((district, count))
        print(f"⚠️  {district}: {count} hastane")
    else:
        print(f"✅ {district}: {count} hastane")

print("\n" + "="*60)
print("📊 ÖZET")
print("="*60)
print(f"❌ Hastanesi olmayan ilçeler ({len(missing_districts)}): {', '.join(missing_districts)}")
print(f"⚠️  Az hastanesi olan ilçeler ({len(low_count_districts)}): {', '.join([f'{d}({c})' for d, c in low_count_districts])}")

# Eksik ilçeler için öneriler
print("\n🔍 EKSİK İLÇELER İÇİN ARAŞTIRMA ÖNERİLERİ:")
for district in missing_districts:
    print(f"- {district} Devlet Hastanesi")
    print(f"- {district} Aile Sağlığı Merkezi")
    print(f"- {district} Özel Hastane/Klinik")
    print()
