#!/usr/bin/env python3
import json

# Büyükçekmece Mimar Sinan Devlet Hastanesi bilgileri
new_hospital = {
    "name": "Büyükçekmece Mimar Sinan Devlet Hastanesi",
    "facility_type": "hospital",
    "coordinates": {
        "latitude": 40.9925,  # Büyükçekmece merkez koordinatları
        "longitude": 28.5833
    },
    "address": {
        "full_address": "Mimar Sinan Merkez Mahallesi, D-100 Karayolu Caddesi No:62, 34535 Büyükçekmece/İstanbul",
        "street": "D-100 Karayolu Caddesi",
        "house_number": "62",
        "neighbourhood": "Mimar Sinan Merkez Mahallesi",
        "district": "Büyükçekmece",
        "city": "İstanbul",
        "postcode": "34535"
    },
    "contact": {
        "phone": "0212 909 90 00",
        "fax": None,
        "email": None,
        "website": "https://buyukcekmecedh.saglik.gov.tr/"
    },
    "medical_info": {
        "emergency": "yes",
        "beds": "200",
        "operator": "Sağlık Bakanlığı",
        "operator_type": "public",
        "speciality": "Genel",
        "healthcare": "hospital",
        "medical_system": "public"
    },
    "accessibility": {
        "wheelchair": "yes",
        "opening_hours": "24/7"
    },
    "additional_info": {
        "description": "Büyükçekmece ilçesinin tek devlet hastanesi",
        "wikipedia": None,
        "wikidata": None
    },
    "osm_metadata": {
        "id": "buyukcekmece_mimar_sinan_dh",
        "type": "node",
        "version": "1",
        "timestamp": "2024-01-01T00:00:00Z"
    }
}

# Mevcut hastane verilerini oku
with open('istanbul_hospitals_detailed.json', 'r', encoding='utf-8') as f:
    hospitals = json.load(f)

# Yeni hastaneyi ekle
hospitals.append(new_hospital)

# Güncellenmiş veriyi kaydet
with open('istanbul_hospitals_detailed.json', 'w', encoding='utf-8') as f:
    json.dump(hospitals, f, ensure_ascii=False, indent=2)

print("✅ Büyükçekmece Mimar Sinan Devlet Hastanesi eklendi!")
print(f"📊 Toplam hastane sayısı: {len(hospitals)}")
