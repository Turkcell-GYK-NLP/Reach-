"""
OpenStreetMap Hastane Verisi Çekici
Bu modül OpenStreetMap'in Overpass API'sini kullanarak hastane verilerini çeker.
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
class Hospital:
    """Hastane veri sınıfı"""
    name: str
    latitude: float
    longitude: float
    address: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    emergency: Optional[str] = None
    beds: Optional[str] = None
    operator: Optional[str] = None
    osm_id: Optional[str] = None
    osm_type: Optional[str] = None

class HospitalFetcher:
    """OpenStreetMap'den hastane verilerini çeken sınıf"""
    
    def __init__(self):
        self.overpass_url = "http://overpass-api.de/api/interpreter"
        self.backup_urls = [
            "https://overpass.kumi.systems/api/interpreter",
            "https://overpass-api.de/api/interpreter"
        ]
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Hospital-API-Fetcher/1.0 (Educational Purpose)'
        })
    
    def get_hospitals_by_bbox(self, 
                             min_lat: float, 
                             min_lon: float, 
                             max_lat: float, 
                             max_lon: float) -> List[Hospital]:
        """
        Verilen sınır kutusu içindeki hastaneleri getirir
        
        Args:
            min_lat: Minimum enlem
            min_lon: Minimum boylam  
            max_lat: Maksimum enlem
            max_lon: Maksimum boylam
            
        Returns:
            List[Hospital]: Hastane listesi
        """
        overpass_query = f"""
        [out:json][timeout:30];
        (
          node["amenity"="hospital"]({min_lat},{min_lon},{max_lat},{max_lon});
          way["amenity"="hospital"]({min_lat},{min_lon},{max_lat},{max_lon});
          relation["amenity"="hospital"]({min_lat},{min_lon},{max_lat},{max_lon});
        );
        out center meta;
        """
        
        return self._execute_query(overpass_query)
    
    def get_hospitals_by_city(self, city_name: str, country: str = "Turkey") -> List[Hospital]:
        """
        Şehir adına göre hastaneleri getirir
        
        Args:
            city_name: Şehir adı
            country: Ülke adı (varsayılan: Turkey)
            
        Returns:
            List[Hospital]: Hastane listesi
        """
        overpass_query = f"""
        [out:json][timeout:30];
        area["name"="{city_name}"]["place"~"city|town"]["country"="{country}"]->.searchArea;
        (
          node["amenity"="hospital"](area.searchArea);
          way["amenity"="hospital"](area.searchArea);
          relation["amenity"="hospital"](area.searchArea);
        );
        out center meta;
        """
        
        return self._execute_query(overpass_query)
    
    def get_hospitals_around_point(self, 
                                  latitude: float, 
                                  longitude: float, 
                                  radius_km: float = 10) -> List[Hospital]:
        """
        Belirli bir nokta etrafındaki hastaneleri getirir
        
        Args:
            latitude: Merkez nokta enlemi
            longitude: Merkez nokta boylamı
            radius_km: Arama yarıçapı (km)
            
        Returns:
            List[Hospital]: Hastane listesi
        """
        radius_meters = radius_km * 1000
        
        overpass_query = f"""
        [out:json][timeout:30];
        (
          node["amenity"="hospital"](around:{radius_meters},{latitude},{longitude});
          way["amenity"="hospital"](around:{radius_meters},{latitude},{longitude});
          relation["amenity"="hospital"](around:{radius_meters},{latitude},{longitude});
        );
        out center meta;
        """
        
        return self._execute_query(overpass_query)
    
    def _execute_query(self, query: str) -> List[Hospital]:
        """
        Overpass sorgusu çalıştırır ve sonuçları işler
        
        Args:
            query: Overpass API sorgusu
            
        Returns:
            List[Hospital]: Hastane listesi
        """
        urls_to_try = [self.overpass_url] + self.backup_urls
        
        for url in urls_to_try:
            try:
                logger.info(f"Sorgu gönderiliyor: {url}")
                response = self.session.get(
                    url, 
                    params={'data': query},
                    timeout=60
                )
                response.raise_for_status()
                
                data = response.json()
                hospitals = self._parse_hospitals(data)
                
                logger.info(f"{len(hospitals)} hastane bulundu")
                return hospitals
                
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
    
    def _parse_hospitals(self, data: Dict) -> List[Hospital]:
        """
        Overpass API yanıtını Hospital nesnelerine dönüştürür
        
        Args:
            data: Overpass API yanıt verisi
            
        Returns:
            List[Hospital]: Hastane listesi
        """
        hospitals = []
        
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
                
                # Hastane nesnesini oluştur
                hospital = Hospital(
                    name=tags.get('name', 'İsimsiz Hastane'),
                    latitude=lat,
                    longitude=lon,
                    address=self._build_address(tags),
                    phone=tags.get('phone', tags.get('contact:phone')),
                    website=tags.get('website', tags.get('contact:website')),
                    emergency=tags.get('emergency'),
                    beds=tags.get('beds'),
                    operator=tags.get('operator'),
                    osm_id=str(element.get('id')),
                    osm_type=element.get('type')
                )
                
                hospitals.append(hospital)
                
            except Exception as e:
                logger.warning(f"Hastane verisi işlenirken hata: {e}")
                continue
        
        return hospitals
    
    def _build_address(self, tags: Dict) -> Optional[str]:
        """
        OSM etiketlerinden adres oluşturur
        
        Args:
            tags: OSM etiketleri
            
        Returns:
            Optional[str]: Oluşturulan adres
        """
        address_parts = []
        
        # Adres bileşenlerini topla
        street = tags.get('addr:street')
        housenumber = tags.get('addr:housenumber')
        postcode = tags.get('addr:postcode')
        city = tags.get('addr:city')
        district = tags.get('addr:district')
        
        if street:
            if housenumber:
                address_parts.append(f"{street} No:{housenumber}")
            else:
                address_parts.append(street)
        
        if district:
            address_parts.append(district)
            
        if city:
            address_parts.append(city)
            
        if postcode:
            address_parts.append(postcode)
        
        return ', '.join(address_parts) if address_parts else None

# Türkiye'deki büyük şehirlerin koordinat bilgileri
TURKISH_CITIES = {
    'istanbul': {'min_lat': 40.8021, 'min_lon': 28.6474, 'max_lat': 41.3201, 'max_lon': 29.4370},
    'ankara': {'min_lat': 39.7817, 'min_lon': 32.6292, 'max_lat': 40.0789, 'max_lon': 33.1309},
    'izmir': {'min_lat': 38.3027, 'min_lon': 26.8142, 'max_lat': 38.5204, 'max_lon': 27.2658},
    'bursa': {'min_lat': 40.0776, 'min_lon': 28.9784, 'max_lat': 40.2856, 'max_lon': 29.2947},
    'antalya': {'min_lat': 36.7745, 'min_lon': 30.4404, 'max_lat': 36.9898, 'max_lon': 30.8056},
    'adana': {'min_lat': 36.8485, 'min_lon': 35.1777, 'max_lat': 37.0670, 'max_lon': 35.4513}
}

def get_hospitals_in_turkish_city(city_name: str) -> List[Hospital]:
    """
    Türkiye'deki belirli bir şehirdeki hastaneleri getirir
    
    Args:
        city_name: Şehir adı (küçük harf)
        
    Returns:
        List[Hospital]: Hastane listesi
    """
    city_name = city_name.lower()
    
    if city_name not in TURKISH_CITIES:
        available_cities = ', '.join(TURKISH_CITIES.keys())
        raise ValueError(f"Desteklenen şehirler: {available_cities}")
    
    coords = TURKISH_CITIES[city_name]
    fetcher = HospitalFetcher()
    
    return fetcher.get_hospitals_by_bbox(
        coords['min_lat'], coords['min_lon'],
        coords['max_lat'], coords['max_lon']
    )
