# 🏥 Hospital API - OpenStreetMap Hastane Verisi Çekici

Bu proje, OpenStreetMap'in açık kaynaklı harita verilerinden hastane bilgilerini çekmek için geliştirilmiş bir Python API'sidir. Overpass API kullanarak gerçek zamanlı hastane verilerine erişim sağlar.

## 🚀 Özellikler

- **Şehir Bazlı Arama**: Türkiye'deki büyük şehirlerdeki hastaneleri getir
- **Nokta Çevresi Arama**: Belirli bir koordinat etrafındaki hastaneleri bul
- **Koordinat Kutusu Arama**: Belirli bir alan içindeki hastaneleri listele
- **Detaylı Bilgiler**: Hastane adı, konum, adres, telefon, website vb.
- **JSON Export**: Verileri JSON formatında kaydetme
- **Hata Yönetimi**: Güvenilir veri çekme ve yedek API desteği

## 📦 Kurulum

1. **Projeyi indirin**:
```bash
cd hospital_api
```

2. **Gerekli paketleri yükleyin**:
```bash
pip install -r requirements.txt
```

## 🔧 Kullanım

### Temel Kullanım

```python
from hospital_fetcher import HospitalFetcher, get_hospitals_in_turkish_city

# 1. Şehir bazlı arama (önceden tanımlı şehirler için)
istanbul_hospitals = get_hospitals_in_turkish_city('istanbul')
print(f"{len(istanbul_hospitals)} hastane bulundu")

# 2. HospitalFetcher ile detaylı kullanım
fetcher = HospitalFetcher()

# Belirli bir nokta etrafında arama (5km yarıçap)
hospitals = fetcher.get_hospitals_around_point(
    latitude=41.0369,  # Taksim Meydanı
    longitude=28.9850,
    radius_km=5
)

# Koordinat kutusu ile arama
hospitals = fetcher.get_hospitals_by_bbox(
    min_lat=40.9500,
    min_lon=29.0000, 
    max_lat=41.0200,
    max_lon=29.1000
)

# Şehir adı ile arama
hospitals = fetcher.get_hospitals_by_city("İstanbul", "Turkey")
```

### Ana Program Çalıştırma

```bash
python main.py
```

Bu komut ile:
- İstanbul, Ankara ve diğer şehirlerdeki hastaneler
- Taksim çevresi hastaneleri
- Kadıköy bölgesi hastaneleri
- İnteraktif arama seçeneği

gösterilir.

## 📊 Veri Yapısı

Her hastane aşağıdaki bilgileri içerir:

```python
@dataclass
class Hospital:
    name: str              # Hastane adı
    latitude: float        # Enlem
    longitude: float       # Boylam
    address: Optional[str] # Adres
    phone: Optional[str]   # Telefon
    website: Optional[str] # Website
    emergency: Optional[str] # Acil servis bilgisi
    beds: Optional[str]    # Yatak sayısı
    operator: Optional[str] # İşletmeci
    osm_id: Optional[str]  # OpenStreetMap ID
    osm_type: Optional[str] # OSM nesne tipi
```

## 🇹🇷 Desteklenen Türk Şehirleri

Önceden tanımlı koordinatlara sahip şehirler:

- **İstanbul**
- **Ankara** 
- **İzmir**
- **Bursa**
- **Antalya**
- **Adana**

## 🌐 API Endpoints

Proje aşağıdaki Overpass API sunucularını kullanır:

1. `http://overpass-api.de/api/interpreter` (Ana)
2. `https://overpass.kumi.systems/api/interpreter` (Yedek)

## 📝 Örnek Çıktı

```
=============================================================
İSTANBUL HASTANELERİ (İlk 5)
=============================================================

1. Acıbadem Maslak Hastanesi
   📍 Konum: 41.108889, 29.018333
   🏠 Adres: Büyükdere Caddesi No:40, Maslak, İstanbul
   📞 Telefon: +90 212 304 44 44
   🌐 Website: https://www.acibadem.com.tr
   🏥 İşletmeci: Acıbadem Sağlık Grubu

2. Florence Nightingale Hastanesi
   📍 Konum: 41.039444, 29.027778
   🏠 Adres: Abide-i Hürriyet Caddesi, Şişli, İstanbul
   📞 Telefon: +90 212 224 49 50
```

## ⚙️ Yapılandırma

### Timeout Ayarları

```python
# hospital_fetcher.py içinde
[out:json][timeout:30];  # 30 saniye timeout
```

### User Agent

```python
'User-Agent': 'Hospital-API-Fetcher/1.0 (Educational Purpose)'
```

## 🚨 Hata Yönetimi

- **Ağ Hataları**: Otomatik yedek URL'lere geçiş
- **Timeout**: 60 saniye HTTP timeout
- **JSON Parse**: Hatalı yanıtlar için güvenli işleme
- **Logging**: Detaylı hata kayıtları

## 📊 JSON Export Örneği

```python
from main import save_hospitals_to_json

hospitals = get_hospitals_in_turkish_city('istanbul')
save_hospitals_to_json(hospitals, 'istanbul_hospitals.json')
```

Oluşturulan JSON:
```json
[
  {
    "name": "Acıbadem Maslak Hastanesi",
    "latitude": 41.108889,
    "longitude": 29.018333,
    "address": "Büyükdere Caddesi No:40, Maslak, İstanbul",
    "phone": "+90 212 304 44 44",
    "website": "https://www.acibadem.com.tr",
    "emergency": "yes",
    "beds": "200",
    "operator": "Acıbadem Sağlık Grubu",
    "osm_id": "123456789",
    "osm_type": "way"
  }
]
```

## 🤝 Katkıda Bulunma

1. Projeyi fork edin
2. Feature branch oluşturun (`git checkout -b feature/YeniOzellik`)
3. Değişikliklerinizi commit edin (`git commit -am 'Yeni özellik eklendi'`)
4. Branch'inizi push edin (`git push origin feature/YeniOzellik`)
5. Pull Request oluşturun

## 📜 Lisans

Bu proje eğitim amaçlı geliştirilmiştir. OpenStreetMap verilerini kullanırken [OSM Copyright](https://www.openstreetmap.org/copyright) kurallarına uygun olarak atıfta bulunulmalıdır.

## ⚠️ Önemli Notlar

- **Veri Güncelliği**: OSM verileri topluluk tarafından güncellenir
- **Rate Limiting**: Overpass API'sine fazla istek göndermeyin
- **Attribution**: OSM'e atıfta bulunmayı unutmayın
- **Educational Purpose**: Bu proje eğitim amaçlıdır

## 🔗 Yararlı Bağlantılar

- [OpenStreetMap](https://www.openstreetmap.org/)
- [Overpass API Documentation](https://wiki.openstreetmap.org/wiki/Overpass_API)
- [OSM Taglar](https://wiki.openstreetmap.org/wiki/Map_Features)

---

**Geliştirici**: Hospital API Team  
**Tarih**: 2025  
**Sürüm**: 1.0
