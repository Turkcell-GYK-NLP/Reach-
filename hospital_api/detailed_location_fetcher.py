"""
Detaylı Konum ve Adres Bilgileri Çekici
OpenStreetMap'den hastaneler için kapsamlı lokasyon verileri alır
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
class DetailedLocation:
    """Detaylı konum ve adres bilgileri"""
    # Temel hastane bilgileri
    name: str
    facility_type: str
    osm_id: str
    osm_type: str
    
    # Koordinat bilgileri
    latitude: float
    longitude: float
    
    # Açık adres formatı
    full_address: Optional[str] = None
    formatted_address: Optional[str] = None
    
    # Detaylı adres bileşenleri
    house_number: Optional[str] = None
    street: Optional[str] = None
    neighbourhood: Optional[str] = None
    quarter: Optional[str] = None  # mahalle
    suburb: Optional[str] = None   # semt
    district: Optional[str] = None  # ilçe
    city: Optional[str] = None
    province: Optional[str] = None  # il
    postcode: Optional[str] = None
    country: Optional[str] = None
    
    # İletişim bilgileri
    phone: Optional[str] = None
    mobile: Optional[str] = None
    fax: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    
    # Sosyal medya
    facebook: Optional[str] = None
    twitter: Optional[str] = None
    instagram: Optional[str] = None
    
    # Çalışma saatleri detayı
    opening_hours: Optional[str] = None
    opening_hours_covid19: Optional[str] = None
    
    # Hastane detayları
    emergency: Optional[str] = None
    emergency_phone: Optional[str] = None
    beds: Optional[str] = None
    operator: Optional[str] = None
    operator_type: Optional[str] = None
    
    # Erişilebilirlik
    wheelchair: Optional[str] = None
    wheelchair_description: Optional[str] = None
    
    # Ulaşım bilgileri
    public_transport: Optional[str] = None
    parking: Optional[str] = None
    
    # Ek bilgiler
    description: Optional[str] = None
    speciality: Optional[str] = None
    medical_system: Optional[str] = None
    
    # Dil desteği
    languages: Optional[str] = None
    
    # Reverse geocoding ile elde edilen adres
    reverse_geocoded_address: Optional[str] = None

class DetailedLocationFetcher:
    """Detaylı konum ve adres bilgileri çekici"""
    
    def __init__(self):
        self.overpass_url = "http://overpass-api.de/api/interpreter"
        self.nominatim_url = "https://nominatim.openstreetmap.org"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Detailed-Hospital-Location-Fetcher/1.0 (Educational Purpose)'
        })
    
    def get_hospitals_with_detailed_location(self, 
                                           min_lat: float, 
                                           min_lon: float, 
                                           max_lat: float, 
                                           max_lon: float) -> List[DetailedLocation]:
        """
        Belirtilen alan için hastaneleri detaylı konum bilgileri ile getirir
        
        Args:
            min_lat, min_lon, max_lat, max_lon: Alanın sınırları
            
        Returns:
            List[DetailedLocation]: Detaylı konum bilgili hastane listesi
        """
        # Kapsamlı Overpass sorgusu - TÜM adres etiketleri
        overpass_query = f"""
        [out:json][timeout:60];
        (
          node["amenity"="hospital"]({min_lat},{min_lon},{max_lat},{max_lon});
          way["amenity"="hospital"]({min_lat},{min_lon},{max_lat},{max_lon});
          relation["amenity"="hospital"]({min_lat},{min_lon},{max_lat},{max_lon});
        );
        out center meta tags;
        """
        
        try:
            logger.info("Detaylı hastane lokasyon sorgusu gönderiliyor...")
            response = self.session.get(
                self.overpass_url, 
                params={'data': overpass_query},
                timeout=120
            )
            response.raise_for_status()
            
            data = response.json()
            hospitals = self._parse_detailed_locations(data)
            
            logger.info(f"{len(hospitals)} hastane bulundu, reverse geocoding başlıyor...")
            
            # Reverse geocoding ile adresleri zenginleştir
            enhanced_hospitals = []
            for i, hospital in enumerate(hospitals, 1):
                try:
                    logger.info(f"Reverse geocoding {i}/{len(hospitals)}: {hospital.name}")
                    enhanced = self._add_reverse_geocoding(hospital)
                    enhanced_hospitals.append(enhanced)
                    
                    # Rate limiting - Nominatim için
                    if i % 10 == 0:  # Her 10 istekte bir bekle
                        time.sleep(2)
                    else:
                        time.sleep(0.5)
                        
                except Exception as e:
                    logger.warning(f"Reverse geocoding hatası {hospital.name}: {e}")
                    enhanced_hospitals.append(hospital)
            
            return enhanced_hospitals
            
        except Exception as e:
            logger.error(f"Detaylı konum çekme hatası: {e}")
            return []
    
    def _parse_detailed_locations(self, data: Dict) -> List[DetailedLocation]:
        """
        Overpass verilerini DetailedLocation nesnelerine dönüştürür
        """
        locations = []
        
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
                
                # Detaylı location nesnesi oluştur
                location = DetailedLocation(
                    name=tags.get('name', 'İsimsiz Hastane'),
                    facility_type='hospital',
                    osm_id=str(element.get('id')),
                    osm_type=element.get('type'),
                    latitude=lat,
                    longitude=lon,
                    
                    # Açık adres formatı
                    full_address=self._build_full_address(tags),
                    formatted_address=self._build_formatted_address(tags),
                    
                    # Detaylı adres bileşenleri
                    house_number=tags.get('addr:housenumber'),
                    street=tags.get('addr:street'),
                    neighbourhood=tags.get('addr:neighbourhood'),
                    quarter=tags.get('addr:quarter'),
                    suburb=tags.get('addr:suburb'),
                    district=tags.get('addr:district', tags.get('addr:city_district')),
                    city=tags.get('addr:city'),
                    province=tags.get('addr:province', tags.get('addr:state')),
                    postcode=tags.get('addr:postcode'),
                    country=tags.get('addr:country'),
                    
                    # İletişim bilgileri
                    phone=tags.get('phone', tags.get('contact:phone')),
                    mobile=tags.get('mobile', tags.get('contact:mobile')),
                    fax=tags.get('fax', tags.get('contact:fax')),
                    email=tags.get('email', tags.get('contact:email')),
                    website=tags.get('website', tags.get('contact:website')),
                    
                    # Sosyal medya
                    facebook=tags.get('contact:facebook'),
                    twitter=tags.get('contact:twitter'),
                    instagram=tags.get('contact:instagram'),
                    
                    # Çalışma saatleri
                    opening_hours=tags.get('opening_hours'),
                    opening_hours_covid19=tags.get('opening_hours:covid19'),
                    
                    # Hastane detayları
                    emergency=tags.get('emergency'),
                    emergency_phone=tags.get('emergency:phone'),
                    beds=tags.get('beds'),
                    operator=tags.get('operator'),
                    operator_type=tags.get('operator:type'),
                    
                    # Erişilebilirlik
                    wheelchair=tags.get('wheelchair'),
                    wheelchair_description=tags.get('wheelchair:description'),
                    
                    # Ulaşım
                    public_transport=tags.get('public_transport'),
                    parking=tags.get('parking'),
                    
                    # Ek bilgiler
                    description=tags.get('description'),
                    speciality=tags.get('speciality'),
                    medical_system=tags.get('medical_system'),
                    
                    # Dil desteği
                    languages=tags.get('languages')
                )
                
                locations.append(location)
                
            except Exception as e:
                logger.warning(f"Lokasyon verisi işlenirken hata: {e}")
                continue
        
        return locations
    
    def _build_full_address(self, tags: Dict) -> Optional[str]:
        """Tam açık adres oluşturur"""
        parts = []
        
        # Sokak ve numara
        street = tags.get('addr:street')
        house_number = tags.get('addr:housenumber')
        
        if street:
            if house_number:
                parts.append(f"{street} No: {house_number}")
            else:
                parts.append(street)
        
        # Mahalle/Semt
        neighbourhood = tags.get('addr:neighbourhood')
        quarter = tags.get('addr:quarter')
        suburb = tags.get('addr:suburb')
        
        if neighbourhood:
            parts.append(f"{neighbourhood} Mahallesi")
        elif quarter:
            parts.append(f"{quarter} Mahallesi")
        elif suburb:
            parts.append(f"{suburb}")
        
        # İlçe
        district = tags.get('addr:district', tags.get('addr:city_district'))
        if district:
            parts.append(district)
        
        # Şehir
        city = tags.get('addr:city')
        if city:
            parts.append(city)
        
        # Posta kodu
        postcode = tags.get('addr:postcode')
        if postcode:
            parts.append(postcode)
        
        # Ülke
        country = tags.get('addr:country')
        if country:
            parts.append(country)
        
        return ', '.join(parts) if parts else None
    
    def _build_formatted_address(self, tags: Dict) -> Optional[str]:
        """Türkiye formatına uygun adres oluşturur"""
        parts = []
        
        # Sokak ve numara
        street = tags.get('addr:street')
        house_number = tags.get('addr:housenumber')
        
        if street and house_number:
            parts.append(f"{street} No:{house_number}")
        elif street:
            parts.append(street)
        
        # Mahalle
        neighbourhood = tags.get('addr:neighbourhood')
        if neighbourhood:
            parts.append(f"{neighbourhood} Mah.")
        
        # İlçe/İl
        district = tags.get('addr:district')
        city = tags.get('addr:city')
        
        if district and city:
            parts.append(f"{district}/{city}")
        elif district:
            parts.append(district)
        elif city:
            parts.append(city)
        
        return ', '.join(parts) if parts else None
    
    def _add_reverse_geocoding(self, location: DetailedLocation) -> DetailedLocation:
        """
        Koordinatları kullanarak Nominatim ile reverse geocoding yapar
        """
        try:
            # Nominatim reverse geocoding
            params = {
                'lat': location.latitude,
                'lon': location.longitude,
                'format': 'json',
                'addressdetails': 1,
                'zoom': 18,
                'accept-language': 'tr,en'
            }
            
            response = self.session.get(
                f"{self.nominatim_url}/reverse",
                params=params,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                
                if 'address' in data:
                    addr = data['address']
                    
                    # Eksik adres bilgilerini doldur
                    if not location.house_number and 'house_number' in addr:
                        location.house_number = addr['house_number']
                    
                    if not location.street and 'road' in addr:
                        location.street = addr['road']
                    
                    if not location.neighbourhood and 'neighbourhood' in addr:
                        location.neighbourhood = addr['neighbourhood']
                    
                    if not location.district and 'city_district' in addr:
                        location.district = addr['city_district']
                    elif not location.district and 'county' in addr:
                        location.district = addr['county']
                    
                    if not location.city and 'city' in addr:
                        location.city = addr['city']
                    elif not location.city and 'town' in addr:
                        location.city = addr['town']
                    
                    if not location.province and 'state' in addr:
                        location.province = addr['state']
                    
                    if not location.postcode and 'postcode' in addr:
                        location.postcode = addr['postcode']
                    
                    if not location.country and 'country' in addr:
                        location.country = addr['country']
                    
                    # Reverse geocoded tam adres
                    if 'display_name' in data:
                        location.reverse_geocoded_address = data['display_name']
                    
                    # Güncellenmiş adresleri yeniden oluştur
                    location.full_address = self._rebuild_full_address(location)
                    location.formatted_address = self._rebuild_formatted_address(location)
        
        except Exception as e:
            logger.warning(f"Reverse geocoding hatası: {e}")
        
        return location
    
    def _rebuild_full_address(self, location: DetailedLocation) -> Optional[str]:
        """Güncellenmiş bilgilerle tam adres yeniden oluşturur"""
        parts = []
        
        if location.street:
            if location.house_number:
                parts.append(f"{location.street} No: {location.house_number}")
            else:
                parts.append(location.street)
        
        if location.neighbourhood:
            parts.append(f"{location.neighbourhood} Mahallesi")
        
        if location.district:
            parts.append(location.district)
        
        if location.city:
            parts.append(location.city)
        
        if location.postcode:
            parts.append(location.postcode)
        
        if location.country:
            parts.append(location.country)
        
        return ', '.join(parts) if parts else None
    
    def _rebuild_formatted_address(self, location: DetailedLocation) -> Optional[str]:
        """Türkiye formatında adres yeniden oluşturur"""
        parts = []
        
        if location.street and location.house_number:
            parts.append(f"{location.street} No:{location.house_number}")
        elif location.street:
            parts.append(location.street)
        
        if location.neighbourhood:
            parts.append(f"{location.neighbourhood} Mah.")
        
        if location.district and location.city:
            parts.append(f"{location.district}/{location.city}")
        elif location.district:
            parts.append(location.district)
        elif location.city:
            parts.append(location.city)
        
        return ', '.join(parts) if parts else None

def get_istanbul_hospitals_with_detailed_locations() -> List[DetailedLocation]:
    """
    İstanbul'daki hastaneleri detaylı konum bilgileri ile getirir
    
    Returns:
        List[DetailedLocation]: Detaylı konum bilgili hastane listesi
    """
    fetcher = DetailedLocationFetcher()
    
    # İstanbul koordinatları
    return fetcher.get_hospitals_with_detailed_location(
        min_lat=40.8021,
        min_lon=28.6474,
        max_lat=41.3201,
        max_lon=29.4370
    )

def print_detailed_location_info(location: DetailedLocation):
    """Detaylı konum bilgilerini yazdırır"""
    print(f"\n{'='*90}")
    print(f"🏥 {location.name}")
    print(f"{'='*90}")
    
    # Koordinatlar
    print(f"📍 Koordinatlar: {location.latitude:.6f}, {location.longitude:.6f}")
    
    # Adres bilgileri
    if location.full_address:
        print(f"🏠 Tam Adres: {location.full_address}")
    
    if location.formatted_address:
        print(f"📮 Formatlanmış Adres: {location.formatted_address}")
    
    if location.reverse_geocoded_address:
        print(f"🗺️  Reverse Geocoded: {location.reverse_geocoded_address}")
    
    # Adres bileşenleri
    print(f"\n📋 Adres Bileşenleri:")
    if location.street:
        print(f"   🛣️  Sokak: {location.street}")
    if location.house_number:
        print(f"   🏘️  Kapı No: {location.house_number}")
    if location.neighbourhood:
        print(f"   🏘️  Mahalle: {location.neighbourhood}")
    if location.district:
        print(f"   🌆 İlçe: {location.district}")
    if location.city:
        print(f"   🏙️  Şehir: {location.city}")
    if location.postcode:
        print(f"   📮 Posta Kodu: {location.postcode}")
    
    # İletişim bilgileri
    print(f"\n📞 İletişim Bilgileri:")
    if location.phone:
        print(f"   📞 Telefon: {location.phone}")
    if location.mobile:
        print(f"   📱 Mobil: {location.mobile}")
    if location.fax:
        print(f"   📠 Fax: {location.fax}")
    if location.email:
        print(f"   📧 E-posta: {location.email}")
    if location.website:
        print(f"   🌐 Website: {location.website}")
    
    # Sosyal medya
    if location.facebook or location.twitter or location.instagram:
        print(f"\n📱 Sosyal Medya:")
        if location.facebook:
            print(f"   📘 Facebook: {location.facebook}")
        if location.twitter:
            print(f"   🐦 Twitter: {location.twitter}")
        if location.instagram:
            print(f"   📷 Instagram: {location.instagram}")
    
    # Çalışma saatleri
    if location.opening_hours:
        print(f"\n🕐 Çalışma Saatleri: {location.opening_hours}")
    
    # Hastane detayları
    if location.emergency:
        print(f"🚨 Acil Servis: {location.emergency}")
    if location.emergency_phone:
        print(f"🚨 Acil Telefon: {location.emergency_phone}")
    if location.beds:
        print(f"🛏️  Yatak Sayısı: {location.beds}")
    if location.operator:
        print(f"🏢 İşletmeci: {location.operator}")
    
    # Erişilebilirlik
    if location.wheelchair:
        print(f"♿ Tekerlekli Sandalye: {location.wheelchair}")
    if location.parking:
        print(f"🅿️  Otopark: {location.parking}")
    
    # OSM bilgileri
    print(f"\n🗺️  OSM Bilgileri: ID {location.osm_id} ({location.osm_type})")
