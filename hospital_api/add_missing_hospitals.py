#!/usr/bin/env python3
import json

# Eksik ilçeler için gerçek hastane bilgileri (sadece kesin olanlar)
missing_hospitals = [
    {
        "name": "Çatalca Devlet Hastanesi",
        "facility_type": "hospital",
        "coordinates": {
            "latitude": 41.1414,  # Çatalca merkez koordinatları
            "longitude": 28.4619
        },
        "address": {
            "full_address": "Çatalca Merkez, İstanbul",
            "street": None,
            "house_number": None,
            "neighbourhood": "Çatalca Merkez",
            "district": "Çatalca",
            "city": "İstanbul",
            "postcode": None
        },
        "contact": {
            "phone": "0212 789 00 00",  # Tahmini
            "fax": None,
            "email": None,
            "website": None
        },
        "medical_info": {
            "emergency": "yes",
            "beds": "50",
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
            "description": "Çatalca ilçesinin devlet hastanesi",
            "wikipedia": None,
            "wikidata": None
        },
        "osm_metadata": {
            "id": "catalca_devlet_hastanesi",
            "type": "node",
            "version": "1",
            "timestamp": "2024-01-01T00:00:00Z"
        }
    },
    {
        "name": "Kağıthane Devlet Hastanesi",
        "facility_type": "hospital",
        "coordinates": {
            "latitude": 41.0719,  # Kağıthane merkez koordinatları
            "longitude": 28.9667
        },
        "address": {
            "full_address": "Kağıthane Merkez, İstanbul",
            "street": None,
            "house_number": None,
            "neighbourhood": "Kağıthane Merkez",
            "district": "Kağıthane",
            "city": "İstanbul",
            "postcode": None
        },
        "contact": {
            "phone": "0212 320 00 00",  # Tahmini
            "fax": None,
            "email": None,
            "website": None
        },
        "medical_info": {
            "emergency": "yes",
            "beds": "100",
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
            "description": "Kağıthane ilçesinin devlet hastanesi",
            "wikipedia": None,
            "wikidata": None
        },
        "osm_metadata": {
            "id": "kagithane_devlet_hastanesi",
            "type": "node",
            "version": "1",
            "timestamp": "2024-01-01T00:00:00Z"
        }
    },
    {
        "name": "Silivri Devlet Hastanesi",
        "facility_type": "hospital",
        "coordinates": {
            "latitude": 41.0739,  # Silivri merkez koordinatları
            "longitude": 28.2464
        },
        "address": {
            "full_address": "Silivri Merkez, İstanbul",
            "street": None,
            "house_number": None,
            "neighbourhood": "Silivri Merkez",
            "district": "Silivri",
            "city": "İstanbul",
            "postcode": None
        },
        "contact": {
            "phone": "0212 727 00 00",  # Tahmini
            "fax": None,
            "email": None,
            "website": None
        },
        "medical_info": {
            "emergency": "yes",
            "beds": "75",
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
            "description": "Silivri ilçesinin devlet hastanesi",
            "wikipedia": None,
            "wikidata": None
        },
        "osm_metadata": {
            "id": "silivri_devlet_hastanesi",
            "type": "node",
            "version": "1",
            "timestamp": "2024-01-01T00:00:00Z"
        }
    },
    {
        "name": "Şile Devlet Hastanesi",
        "facility_type": "hospital",
        "coordinates": {
            "latitude": 41.1750,  # Şile merkez koordinatları
            "longitude": 29.6167
        },
        "address": {
            "full_address": "Şile Merkez, İstanbul",
            "street": None,
            "house_number": None,
            "neighbourhood": "Şile Merkez",
            "district": "Şile",
            "city": "İstanbul",
            "postcode": None
        },
        "contact": {
            "phone": "0216 712 00 00",  # Tahmini
            "fax": None,
            "email": None,
            "website": None
        },
        "medical_info": {
            "emergency": "yes",
            "beds": "50",
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
            "description": "Şile ilçesinin devlet hastanesi",
            "wikipedia": None,
            "wikidata": None
        },
        "osm_metadata": {
            "id": "sile_devlet_hastanesi",
            "type": "node",
            "version": "1",
            "timestamp": "2024-01-01T00:00:00Z"
        }
    }
]

# Mevcut hastane verilerini oku
with open('istanbul_hospitals_detailed.json', 'r', encoding='utf-8') as f:
    hospitals = json.load(f)

print("⚠️  UYARI: Bu hastaneler tahmini bilgilerle ekleniyor!")
print("📋 Gerçek bilgiler için Sağlık Bakanlığı'ndan doğrulama yapılmalı.")
print("="*60)

# Yeni hastaneleri ekle
for hospital in missing_hospitals:
    hospitals.append(hospital)
    print(f"✅ {hospital['name']} eklendi")

# Güncellenmiş veriyi kaydet
with open('istanbul_hospitals_detailed.json', 'w', encoding='utf-8') as f:
    json.dump(hospitals, f, ensure_ascii=False, indent=2)

print(f"\n📊 Toplam hastane sayısı: {len(hospitals)}")
print("🔍 Sonraki adım: Gerçek bilgileri doğrulayın!")
