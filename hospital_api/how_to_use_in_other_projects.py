"""
Diğer Projelerde Kullanım Kılavuzu
Bu dosya hastane API'sini başka projelerde nasıl kullanacağınızı gösterir
"""

# ============================================================================
# 1. BASİT KULLANIM - Mevcut projenize doğrudan import
# ============================================================================

def example_1_simple_usage():
    """En basit kullanım şekli"""
    
    # hospital_api klasörünü Python path'ine ekle
    import sys
    import os
    
    # API klasörünün yolunu ekle
    api_path = '/Users/esrakaya/Desktop/TURKCELL/hospital_api'
    if api_path not in sys.path:
        sys.path.append(api_path)
    
    # Modülleri import et
    from enhanced_hospital_fetcher import get_all_istanbul_hospitals_detailed
    
    # Hastaneleri çek
    hospitals = get_all_istanbul_hospitals_detailed()
    
    # Telefon numarası olanları filtrele
    with_phone = [h for h in hospitals if h.phone]
    
    print(f"Telefon numarası olan hastane sayısı: {len(with_phone)}")
    
    # İlk 3'ünü göster
    for hospital in with_phone[:3]:
        print(f"📞 {hospital.name}: {hospital.phone}")
        print(f"📍 {hospital.address}")
        print(f"🌐 {hospital.website or 'Website yok'}")
        print("-" * 50)

# ============================================================================
# 2. WRAPPER CLASS - Kendi ihtiyaçlarınıza göre sarmalama
# ============================================================================

class HospitalService:
    """Hastane API'si için wrapper sınıf"""
    
    def __init__(self):
        import sys
        sys.path.append('/Users/esrakaya/Desktop/TURKCELL/hospital_api')
        
        from enhanced_hospital_fetcher import (
            EnhancedHospitalFetcher, 
            get_all_istanbul_hospitals_detailed
        )
        
        self.fetcher = EnhancedHospitalFetcher()
        self.get_istanbul_hospitals = get_all_istanbul_hospitals_detailed
        self._cache = {}
    
    def get_hospitals_with_contact(self, city='istanbul'):
        """İletişim bilgisi olan hastaneleri getirir"""
        if city not in self._cache:
            if city == 'istanbul':
                hospitals = self.get_istanbul_hospitals()
            else:
                # Başka şehirler için genişletilebilir
                raise ValueError(f"Şehir desteklenmiyor: {city}")
            
            self._cache[city] = hospitals
        
        # İletişim bilgisi olanları filtrele
        return [
            h for h in self._cache[city] 
            if h.phone or h.email or h.website
        ]
    
    def search_hospitals(self, query, city='istanbul'):
        """Hastane arama"""
        hospitals = self.get_hospitals_with_contact(city)
        query_lower = query.lower()
        
        return [
            h for h in hospitals 
            if query_lower in h.name.lower()
        ]
    
    def get_emergency_hospitals(self, city='istanbul'):
        """Acil servisi olan hastaneler"""
        hospitals = self.get_hospitals_with_contact(city)
        
        return [
            h for h in hospitals 
            if h.emergency and h.emergency.lower() in ['yes', 'true', '24/7']
        ]
    
    def get_hospitals_near_point(self, lat, lon, radius_km=5):
        """Belirli nokta çevresindeki hastaneler"""
        return self.fetcher.get_hospitals_around_point(lat, lon, radius_km)
    
    def to_dict(self, hospital):
        """Hastane nesnesini dictionary'e çevir"""
        return {
            'id': hospital.osm_id,
            'name': hospital.name,
            'phone': hospital.phone,
            'email': hospital.email,
            'website': hospital.website,
            'address': hospital.address,
            'coordinates': {
                'lat': hospital.latitude,
                'lng': hospital.longitude
            },
            'emergency': hospital.emergency,
            'operator': hospital.operator,
            'beds': hospital.beds
        }
    
    def to_json_format(self, hospitals):
        """Hastane listesini JSON formatına çevir"""
        return [self.to_dict(h) for h in hospitals]

# ============================================================================
# 3. VERİTABANI ENTEGRASYONU
# ============================================================================

def example_3_database_integration():
    """Veritabanına kaydetme örneği"""
    import sqlite3
    import json
    
    # Hastane servisini başlat
    service = HospitalService()
    hospitals = service.get_hospitals_with_contact()
    
    # SQLite veritabanı oluştur
    conn = sqlite3.connect('my_hospitals.db')
    cursor = conn.cursor()
    
    # Tablo oluştur
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS hospitals (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            phone TEXT,
            email TEXT,
            website TEXT,
            address TEXT,
            latitude REAL,
            longitude REAL,
            emergency TEXT,
            operator TEXT,
            beds TEXT,
            data_json TEXT
        )
    ''')
    
    # Hastaneleri kaydet
    for hospital in hospitals:
        hospital_dict = service.to_dict(hospital)
        
        cursor.execute('''
            INSERT OR REPLACE INTO hospitals 
            (id, name, phone, email, website, address, latitude, longitude, 
             emergency, operator, beds, data_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            hospital_dict['id'],
            hospital_dict['name'],
            hospital_dict['phone'],
            hospital_dict['email'],
            hospital_dict['website'],
            hospital_dict['address'],
            hospital_dict['coordinates']['lat'],
            hospital_dict['coordinates']['lng'],
            hospital_dict['emergency'],
            hospital_dict['operator'],
            hospital_dict['beds'],
            json.dumps(hospital_dict, ensure_ascii=False)
        ))
    
    conn.commit()
    conn.close()
    
    print(f"{len(hospitals)} hastane veritabanına kaydedildi")

# ============================================================================
# 4. ASYNC KULLANIM (FastAPI için)
# ============================================================================

class AsyncHospitalService:
    """Async FastAPI için hastane servisi"""
    
    def __init__(self):
        import sys
        sys.path.append('/Users/esrakaya/Desktop/TURKCELL/hospital_api')
        
        from enhanced_hospital_fetcher import get_all_istanbul_hospitals_detailed
        self.get_hospitals = get_all_istanbul_hospitals_detailed
        self._cache = None
    
    async def get_all_hospitals(self):
        """Async hastane listesi"""
        if self._cache is None:
            # Bu normalde sync bir fonksiyon, ama async context'te çalışır
            self._cache = self.get_hospitals()
        
        return self._cache
    
    async def search_async(self, query: str):
        """Async arama"""
        hospitals = await self.get_all_hospitals()
        query_lower = query.lower()
        
        results = [
            {
                'id': h.osm_id,
                'name': h.name,
                'phone': h.phone,
                'address': h.address,
                'coordinates': [h.latitude, h.longitude]
            }
            for h in hospitals 
            if query_lower in h.name.lower() and h.phone
        ]
        
        return results

# ============================================================================
# 5. KULLANIM ÖRNEKLERİ
# ============================================================================

def main():
    """Ana kullanım örnekleri"""
    
    print("1. Basit Kullanım:")
    print("-" * 50)
    example_1_simple_usage()
    
    print("\n2. Wrapper Class Kullanımı:")
    print("-" * 50)
    service = HospitalService()
    
    # Arama
    results = service.search_hospitals("florence")
    print(f"Florence araması: {len(results)} sonuç")
    
    # Acil servis
    emergency = service.get_emergency_hospitals()
    print(f"Acil servisi olan: {len(emergency)} hastane")
    
    # Çevre arama
    nearby = service.get_hospitals_near_point(41.0369, 28.9850, 2)  # Taksim çevresi
    print(f"Taksim çevresi (2km): {len(nearby)} hastane")
    
    print("\n3. JSON Format:")
    print("-" * 50)
    if results:
        first_hospital_json = service.to_dict(results[0])
        import json
        print(json.dumps(first_hospital_json, ensure_ascii=False, indent=2))
    
    print("\n4. Veritabanı Entegrasyonu:")
    print("-" * 50)
    example_3_database_integration()

# ============================================================================
# 6. PROJE YAPISI ÖNERİSİ
# ============================================================================

"""
your_project/
├── main.py
├── services/
│   ├── __init__.py
│   └── hospital_service.py  # HospitalService sınıfını buraya koyun
├── hospital_api/           # Bu klasörü kopyalayın
│   ├── enhanced_hospital_fetcher.py
│   ├── hospital_fetcher.py
│   └── requirements.txt
└── requirements.txt        # Bu projede flask, requests ekleyin
"""

# ============================================================================
# 7. REQUIREMENTS.TXT İÇİN EK PAKETLER
# ============================================================================

"""
# Ana hospital API gereksinimleri
requests>=2.31.0

# Web API için (opsiyonel)
flask>=2.3.0
flask-cors>=4.0.0

# Async için (opsiyonel)
fastapi>=0.104.0
uvicorn>=0.24.0

# Veritabanı için (opsiyonel)
sqlite3  # Python'da built-in
"""

if __name__ == "__main__":
    main()
