"""
Gelişmiş Hastane Verisi Çekici - Tüm Sağlık Kuruluşları
OpenStreetMap'den kapsamlı hastane ve sağlık kuruluşu verilerini çeker
"""

import requests
import json
import time
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
import logging

# Logging yapılandırması
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class HealthFacility:
    """Kapsamlı sağlık kuruluşu veri sınıfı"""
    name: str
    latitude: float
    longitude: float
    facility_type: str  # hospital, clinic, doctors, etc.
    
    # Adres bilgileri
    address: Optional[str] = None
    street: Optional[str] = None
    house_number: Optional[str] = None
    postcode: Optional[str] = None
    city: Optional[str] = None
    district: Optional[str] = None
    neighbourhood: Optional[str] = None
    
    # İletişim bilgileri
    phone: Optional[str] = None
    fax: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    
    # Hastane özellikleri
    emergency: Optional[str] = None
    beds: Optional[str] = None
    operator: Optional[str] = None
    operator_type: Optional[str] = None  # public, private, religious, etc.
    
    # Uzmanlık alanları
    speciality: Optional[str] = None
    healthcare: Optional[str] = None
    medical_system: Optional[str] = None
    
    # Erişilebilirlik
    wheelchair: Optional[str] = None
    opening_hours: Optional[str] = None
    
    # Ek bilgiler
    description: Optional[str] = None
    wikipedia: Optional[str] = None
    wikidata: Optional[str] = None
    
    # OSM meta bilgileri
    osm_id: Optional[str] = None
    osm_type: Optional[str] = None
    osm_version: Optional[str] = None
    osm_timestamp: Optional[str] = None

class EnhancedHospitalFetcher:
    """Gelişmiş hastane ve sağlık kuruluşu çekici"""
    
    def __init__(self):
        self.overpass_url = "http://overpass-api.de/api/interpreter"
        self.backup_urls = [
            "https://overpass.kumi.systems/api/interpreter",
            "https://overpass-api.de/api/interpreter"
        ]
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Enhanced-Hospital-API-Fetcher/2.0 (Educational Purpose)'
        })
    
    def get_all_istanbul_health_facilities(self) -> List[HealthFacility]:
        """
        İstanbul'daki TÜM sağlık kuruluşlarını getirir
        
        Returns:
            List[HealthFacility]: Kapsamlı sağlık kuruluşu listesi
        """
        # İstanbul'un geniş koordinat aralığı
        istanbul_bounds = {
            'min_lat': 40.8021,
            'min_lon': 28.6474,
            'max_lat': 41.3201,
            'max_lon': 29.4370
        }
        
        overpass_query = f"""
        [out:json][timeout:60];
        (
          // Hastaneler
          node["amenity"="hospital"]({istanbul_bounds['min_lat']},{istanbul_bounds['min_lon']},{istanbul_bounds['max_lat']},{istanbul_bounds['max_lon']});
          way["amenity"="hospital"]({istanbul_bounds['min_lat']},{istanbul_bounds['min_lon']},{istanbul_bounds['max_lat']},{istanbul_bounds['max_lon']});
          relation["amenity"="hospital"]({istanbul_bounds['min_lat']},{istanbul_bounds['min_lon']},{istanbul_bounds['max_lat']},{istanbul_bounds['max_lon']});
          
          // Klinikler
          node["amenity"="clinic"]({istanbul_bounds['min_lat']},{istanbul_bounds['min_lon']},{istanbul_bounds['max_lat']},{istanbul_bounds['max_lon']});
          way["amenity"="clinic"]({istanbul_bounds['min_lat']},{istanbul_bounds['min_lon']},{istanbul_bounds['max_lat']},{istanbul_bounds['max_lon']});
          relation["amenity"="clinic"]({istanbul_bounds['min_lat']},{istanbul_bounds['min_lon']},{istanbul_bounds['max_lat']},{istanbul_bounds['max_lon']});
          
          // Doktor ofisleri
          node["amenity"="doctors"]({istanbul_bounds['min_lat']},{istanbul_bounds['min_lon']},{istanbul_bounds['max_lat']},{istanbul_bounds['max_lon']});
          way["amenity"="doctors"]({istanbul_bounds['min_lat']},{istanbul_bounds['min_lon']},{istanbul_bounds['max_lat']},{istanbul_bounds['max_lon']});
          relation["amenity"="doctors"]({istanbul_bounds['min_lat']},{istanbul_bounds['min_lon']},{istanbul_bounds['max_lat']},{istanbul_bounds['max_lon']});
          
          // Sağlık merkezleri
          node["healthcare"]({istanbul_bounds['min_lat']},{istanbul_bounds['min_lon']},{istanbul_bounds['max_lat']},{istanbul_bounds['max_lon']});
          way["healthcare"]({istanbul_bounds['min_lat']},{istanbul_bounds['min_lon']},{istanbul_bounds['max_lat']},{istanbul_bounds['max_lon']});
          relation["healthcare"]({istanbul_bounds['min_lat']},{istanbul_bounds['min_lon']},{istanbul_bounds['max_lat']},{istanbul_bounds['max_lon']});
          
          // Diş hekimi
          node["amenity"="dentist"]({istanbul_bounds['min_lat']},{istanbul_bounds['min_lon']},{istanbul_bounds['max_lat']},{istanbul_bounds['max_lon']});
          way["amenity"="dentist"]({istanbul_bounds['min_lat']},{istanbul_bounds['min_lon']},{istanbul_bounds['max_lat']},{istanbul_bounds['max_lon']});
          relation["amenity"="dentist"]({istanbul_bounds['min_lat']},{istanbul_bounds['min_lon']},{istanbul_bounds['max_lat']},{istanbul_bounds['max_lon']});
          
          // Eczaneler
          node["amenity"="pharmacy"]({istanbul_bounds['min_lat']},{istanbul_bounds['min_lon']},{istanbul_bounds['max_lat']},{istanbul_bounds['max_lon']});
          way["amenity"="pharmacy"]({istanbul_bounds['min_lat']},{istanbul_bounds['min_lon']},{istanbul_bounds['max_lat']},{istanbul_bounds['max_lon']});
          relation["amenity"="pharmacy"]({istanbul_bounds['min_lat']},{istanbul_bounds['min_lon']},{istanbul_bounds['max_lat']},{istanbul_bounds['max_lon']});
          
          // Veteriner hekimler
          node["amenity"="veterinary"]({istanbul_bounds['min_lat']},{istanbul_bounds['min_lon']},{istanbul_bounds['max_lat']},{istanbul_bounds['max_lon']});
          way["amenity"="veterinary"]({istanbul_bounds['min_lat']},{istanbul_bounds['min_lon']},{istanbul_bounds['max_lat']},{istanbul_bounds['max_lon']});
          relation["amenity"="veterinary"]({istanbul_bounds['min_lat']},{istanbul_bounds['min_lon']},{istanbul_bounds['max_lat']},{istanbul_bounds['max_lon']});
        );
        out center meta tags;
        """
        
        return self._execute_enhanced_query(overpass_query)
    
    def get_hospitals_only_istanbul(self) -> List[HealthFacility]:
        """
        İstanbul'daki sadece hastaneleri (hospital) getirir - Tüm detaylarıyla
        
        Returns:
            List[HealthFacility]: Sadece hastane listesi
        """
        istanbul_bounds = {
            'min_lat': 40.8021,
            'min_lon': 28.6474,
            'max_lat': 41.3201,
            'max_lon': 29.4370
        }
        
        overpass_query = f"""
        [out:json][timeout:60];
        (
          node["amenity"="hospital"]({istanbul_bounds['min_lat']},{istanbul_bounds['min_lon']},{istanbul_bounds['max_lat']},{istanbul_bounds['max_lon']});
          way["amenity"="hospital"]({istanbul_bounds['min_lat']},{istanbul_bounds['min_lon']},{istanbul_bounds['max_lat']},{istanbul_bounds['max_lon']});
          relation["amenity"="hospital"]({istanbul_bounds['min_lat']},{istanbul_bounds['min_lon']},{istanbul_bounds['max_lat']},{istanbul_bounds['max_lon']});
        );
        out center meta tags;
        """
        
        return self._execute_enhanced_query(overpass_query)
    
    def get_health_facilities_by_type(self, facility_type: str, city_bounds: Dict) -> List[HealthFacility]:
        """
        Belirli tip sağlık kuruluşlarını getirir
        
        Args:
            facility_type: Kuruluş tipi (hospital, clinic, doctors, pharmacy, etc.)
            city_bounds: Şehir sınırları (min_lat, min_lon, max_lat, max_lon)
            
        Returns:
            List[HealthFacility]: Belirtilen tip kuruluşlar
        """
        overpass_query = f"""
        [out:json][timeout:45];
        (
          node["amenity"="{facility_type}"]({city_bounds['min_lat']},{city_bounds['min_lon']},{city_bounds['max_lat']},{city_bounds['max_lon']});
          way["amenity"="{facility_type}"]({city_bounds['min_lat']},{city_bounds['min_lon']},{city_bounds['max_lat']},{city_bounds['max_lon']});
          relation["amenity"="{facility_type}"]({city_bounds['min_lat']},{city_bounds['min_lon']},{city_bounds['max_lat']},{city_bounds['max_lon']});
        );
        out center meta tags;
        """
        
        return self._execute_enhanced_query(overpass_query)
    
    def _execute_enhanced_query(self, query: str) -> List[HealthFacility]:
        """
        Gelişmiş sorgu çalıştırır ve sonuçları işler
        
        Args:
            query: Overpass API sorgusu
            
        Returns:
            List[HealthFacility]: Sağlık kuruluşu listesi
        """
        urls_to_try = [self.overpass_url] + self.backup_urls
        
        for url in urls_to_try:
            try:
                logger.info(f"Kapsamlı sorgu gönderiliyor: {url}")
                response = self.session.get(
                    url, 
                    params={'data': query},
                    timeout=120
                )
                response.raise_for_status()
                
                data = response.json()
                facilities = self._parse_enhanced_facilities(data)
                
                logger.info(f"{len(facilities)} sağlık kuruluşu bulundu")
                return facilities
                
            except requests.exceptions.RequestException as e:
                logger.warning(f"URL {url} ile hata: {e}")
                continue
            except json.JSONDecodeError as e:
                logger.error(f"JSON parse hatası: {e}")
                continue
            except Exception as e:
                logger.error(f"Beklenmeyen hata: {e}")
                continue
        
        logger.error("Tüm URL'ler denendi, veri alınamadı")
        return []
    
    def _parse_enhanced_facilities(self, data: Dict) -> List[HealthFacility]:
        """
        Gelişmiş facility parsing - Tüm detayları çıkarır
        
        Args:
            data: Overpass API yanıt verisi
            
        Returns:
            List[HealthFacility]: Sağlık kuruluşu listesi
        """
        facilities = []
        
        for element in data.get('elements', []):
            try:
                tags = element.get('tags', {})
                
                # Koordinatları al
                if 'lat' in element and 'lon' in element:
                    lat, lon = element['lat'], element['lon']
                elif 'center' in element:
                    lat, lon = element['center']['lat'], element['center']['lon']
                else:
                    continue
                
                # Kuruluş tipini belirle
                facility_type = self._determine_facility_type(tags)
                
                # Kapsamlı facility nesnesi oluştur
                facility = HealthFacility(
                    name=tags.get('name', f'İsimsiz {facility_type.title()}'),
                    latitude=lat,
                    longitude=lon,
                    facility_type=facility_type,
                    
                    # Adres bilgileri
                    address=self._build_comprehensive_address(tags),
                    street=tags.get('addr:street'),
                    house_number=tags.get('addr:housenumber'),
                    postcode=tags.get('addr:postcode'),
                    city=tags.get('addr:city'),
                    district=tags.get('addr:district'),
                    neighbourhood=tags.get('addr:neighbourhood'),
                    
                    # İletişim bilgileri
                    phone=tags.get('phone', tags.get('contact:phone')),
                    fax=tags.get('fax', tags.get('contact:fax')),
                    email=tags.get('email', tags.get('contact:email')),
                    website=tags.get('website', tags.get('contact:website')),
                    
                    # Hastane özellikleri
                    emergency=tags.get('emergency'),
                    beds=tags.get('beds'),
                    operator=tags.get('operator'),
                    operator_type=tags.get('operator:type'),
                    
                    # Uzmanlık alanları
                    speciality=tags.get('speciality'),
                    healthcare=tags.get('healthcare'),
                    medical_system=tags.get('medical_system'),
                    
                    # Erişilebilirlik
                    wheelchair=tags.get('wheelchair'),
                    opening_hours=tags.get('opening_hours'),
                    
                    # Ek bilgiler
                    description=tags.get('description'),
                    wikipedia=tags.get('wikipedia'),
                    wikidata=tags.get('wikidata'),
                    
                    # OSM meta bilgileri
                    osm_id=str(element.get('id')),
                    osm_type=element.get('type'),
                    osm_version=str(element.get('version')),
                    osm_timestamp=element.get('timestamp')
                )
                
                facilities.append(facility)
                
            except Exception as e:
                logger.warning(f"Sağlık kuruluşu verisi işlenirken hata: {e}")
                continue
        
        return facilities
    
    def _determine_facility_type(self, tags: Dict) -> str:
        """Etiketlerden kuruluş tipini belirler"""
        if tags.get('amenity') == 'hospital':
            return 'hospital'
        elif tags.get('amenity') == 'clinic':
            return 'clinic'
        elif tags.get('amenity') == 'doctors':
            return 'doctors'
        elif tags.get('amenity') == 'dentist':
            return 'dentist'
        elif tags.get('amenity') == 'pharmacy':
            return 'pharmacy'
        elif tags.get('amenity') == 'veterinary':
            return 'veterinary'
        elif tags.get('healthcare'):
            return f"healthcare_{tags.get('healthcare')}"
        else:
            return 'unknown'
    
    def _build_comprehensive_address(self, tags: Dict) -> Optional[str]:
        """
        OSM etiketlerinden kapsamlı adres oluşturur
        
        Args:
            tags: OSM etiketleri
            
        Returns:
            Optional[str]: Oluşturulan adres
        """
        address_parts = []
        
        # Adres bileşenlerini topla
        street = tags.get('addr:street')
        housenumber = tags.get('addr:housenumber')
        neighbourhood = tags.get('addr:neighbourhood')
        district = tags.get('addr:district')
        postcode = tags.get('addr:postcode')
        city = tags.get('addr:city')
        
        if street:
            if housenumber:
                address_parts.append(f"{street} No:{housenumber}")
            else:
                address_parts.append(street)
        
        if neighbourhood:
            address_parts.append(f"{neighbourhood} Mah.")
            
        if district:
            address_parts.append(f"{district}")
            
        if city:
            address_parts.append(city)
            
        if postcode:
            address_parts.append(postcode)
        
        return ', '.join(address_parts) if address_parts else None

def get_all_istanbul_hospitals_detailed() -> List[HealthFacility]:
    """
    İstanbul'daki TÜM hastaneleri detaylı bilgileriyle getirir
    
    Returns:
        List[HealthFacility]: Kapsamlı hastane listesi
    """
    fetcher = EnhancedHospitalFetcher()
    return fetcher.get_hospitals_only_istanbul()

def get_all_istanbul_health_facilities() -> List[HealthFacility]:
    """
    İstanbul'daki TÜM sağlık kuruluşlarını getirir
    
    Returns:
        List[HealthFacility]: Tüm sağlık kuruluşları
    """
    fetcher = EnhancedHospitalFetcher()
    return fetcher.get_all_istanbul_health_facilities()

# Türkiye'deki şehirlerin genişletilmiş koordinat bilgileri
EXTENDED_TURKISH_CITIES = {
    'istanbul': {'min_lat': 40.8021, 'min_lon': 28.6474, 'max_lat': 41.3201, 'max_lon': 29.4370},
    'ankara': {'min_lat': 39.7817, 'min_lon': 32.6292, 'max_lat': 40.0789, 'max_lon': 33.1309},
    'izmir': {'min_lat': 38.3027, 'min_lon': 26.8142, 'max_lat': 38.5204, 'max_lon': 27.2658},
    'bursa': {'min_lat': 40.0776, 'min_lon': 28.9784, 'max_lat': 40.2856, 'max_lon': 29.2947},
    'antalya': {'min_lat': 36.7745, 'min_lon': 30.4404, 'max_lat': 36.9898, 'max_lon': 30.8056},
    'adana': {'min_lat': 36.8485, 'min_lon': 35.1777, 'max_lat': 37.0670, 'max_lon': 35.4513}
}
