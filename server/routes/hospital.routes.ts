import type { Express } from "express";
import { GeocodingService } from "../services/location/GeocodingService.js";
import fs from 'fs';
import path from 'path';

export function registerHospitalRoutes(app: Express): void {
  const geocodingService = new GeocodingService();

  // İstanbul ilçeleri ve koordinat sınırları
  const istanbulDistricts = {
    'Adalar': { minLat: 40.8, maxLat: 41.0, minLng: 29.0, maxLng: 29.2 },
    'Arnavutköy': { minLat: 41.1, maxLat: 41.3, minLng: 28.6, maxLng: 28.8 },
    'Ataşehir': { minLat: 40.9, maxLat: 41.0, minLng: 29.1, maxLng: 29.3 },
    'Avcılar': { minLat: 40.9, maxLat: 41.0, minLng: 28.6, maxLng: 28.8 },
    'Bağcılar': { minLat: 41.0, maxLat: 41.1, minLng: 28.8, maxLng: 29.0 },
    'Bahçelievler': { minLat: 40.9, maxLat: 41.0, minLng: 28.8, maxLng: 29.0 },
    'Bakırköy': { minLat: 40.9, maxLat: 41.0, minLng: 28.8, maxLng: 29.0 },
    'Başakşehir': { minLat: 41.0, maxLat: 41.2, minLng: 28.6, maxLng: 28.8 },
    'Bayrampaşa': { minLat: 41.0, maxLat: 41.1, minLng: 28.8, maxLng: 29.0 },
    'Beşiktaş': { minLat: 41.0, maxLat: 41.1, minLng: 29.0, maxLng: 29.2 },
    'Beykoz': { minLat: 41.1, maxLat: 41.2, minLng: 29.1, maxLng: 29.3 },
    'Beylikdüzü': { minLat: 40.9, maxLat: 41.0, minLng: 28.6, maxLng: 28.8 },
    'Beyoğlu': { minLat: 41.0, maxLat: 41.1, minLng: 28.9, maxLng: 29.1 },
    'Büyükçekmece': { minLat: 40.9, maxLat: 41.0, minLng: 28.5, maxLng: 28.7 },
    'Çatalca': { minLat: 41.1, maxLat: 41.3, minLng: 28.4, maxLng: 28.6 },
    'Çekmeköy': { minLat: 41.0, maxLat: 41.2, minLng: 29.1, maxLng: 29.3 },
    'Esenler': { minLat: 41.0, maxLat: 41.1, minLng: 28.8, maxLng: 29.0 },
    'Esenyurt': { minLat: 40.9, maxLat: 41.0, minLng: 28.6, maxLng: 28.8 },
    'Eyüpsultan': { minLat: 41.0, maxLat: 41.2, minLng: 28.9, maxLng: 29.1 },
    'Fatih': { minLat: 41.0, maxLat: 41.1, minLng: 28.9, maxLng: 29.1 },
    'Gaziosmanpaşa': { minLat: 41.0, maxLat: 41.1, minLng: 28.8, maxLng: 29.0 },
    'Güngören': { minLat: 40.9, maxLat: 41.0, minLng: 28.8, maxLng: 29.0 },
    'Kadıköy': { minLat: 40.9, maxLat: 41.0, minLng: 29.0, maxLng: 29.2 },
    'Kağıthane': { minLat: 41.0, maxLat: 41.1, minLng: 28.9, maxLng: 29.1 },
    'Kartal': { minLat: 40.9, maxLat: 41.0, minLng: 29.1, maxLng: 29.3 },
    'Küçükçekmece': { minLat: 40.9, maxLat: 41.0, minLng: 28.7, maxLng: 28.9 },
    'Maltepe': { minLat: 40.9, maxLat: 41.0, minLng: 29.1, maxLng: 29.3 },
    'Pendik': { minLat: 40.9, maxLat: 41.0, minLng: 29.2, maxLng: 29.4 },
    'Sancaktepe': { minLat: 40.9, maxLat: 41.0, minLng: 29.1, maxLng: 29.3 },
    'Sarıyer': { minLat: 41.1, maxLat: 41.2, minLng: 29.0, maxLng: 29.2 },
    'Silivri': { minLat: 40.9, maxLat: 41.1, minLng: 28.2, maxLng: 28.4 },
    'Sultanbeyli': { minLat: 40.9, maxLat: 41.0, minLng: 29.2, maxLng: 29.4 },
    'Sultangazi': { minLat: 41.0, maxLat: 41.1, minLng: 28.8, maxLng: 29.0 },
    'Şile': { minLat: 41.1, maxLat: 41.2, minLng: 29.3, maxLng: 29.5 },
    'Şişli': { minLat: 41.0, maxLat: 41.1, minLng: 28.9, maxLng: 29.1 },
    'Tuzla': { minLat: 40.9, maxLat: 41.0, minLng: 29.2, maxLng: 29.4 },
    'Ümraniye': { minLat: 40.9, maxLat: 41.0, minLng: 29.1, maxLng: 29.3 },
    'Üsküdar': { minLat: 41.0, maxLat: 41.1, minLng: 29.0, maxLng: 29.2 },
    'Zeytinburnu': { minLat: 40.9, maxLat: 41.0, minLng: 28.8, maxLng: 29.0 }
  };

  // Koordinatlardan ilçe bulma fonksiyonu - En yakın ilçeyi bul
  function findDistrictByCoordinates(lat: number, lng: number): string {
    let nearestDistrict = 'Bilinmeyen';
    let minDistance = Infinity;
    
    // Her ilçenin merkez noktasına olan mesafeyi hesapla
    for (const [district, bounds] of Object.entries(istanbulDistricts)) {
      const centerLat = (bounds.minLat + bounds.maxLat) / 2;
      const centerLng = (bounds.minLng + bounds.maxLng) / 2;
      
      // Basit Öklid mesafesi
      const distance = Math.sqrt(
        Math.pow(lat - centerLat, 2) + Math.pow(lng - centerLng, 2)
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        nearestDistrict = district;
      }
    }
    
    return nearestDistrict;
  }

  // Get hospitals
  app.get("/api/hospitals", async (req, res) => {
    try {
      
      // Gerçek hastane verilerini oku
      const hospitalDataPath = process.env.NODE_ENV === 'production' 
        ? '/app/hospital_api/istanbul_hospitals_detailed.json'
        : path.join(process.cwd(), 'hospital_api/istanbul_hospitals_detailed.json');
      let hospitalData = [];
      
      try {
        const rawData = fs.readFileSync(hospitalDataPath, 'utf8');
        const allHospitals = JSON.parse(rawData);
        
        // Verileri frontend formatına dönüştür
        hospitalData = allHospitals
          .filter((h: any) => h.name && h.name !== 'İsimsiz Hospital' && h.coordinates)
          .map((h: any, index: number) => {
            // İlçe bilgisini al - önce address.district'e bak, yoksa koordinatlardan hesapla
            let district = h.address?.district;
            
            // Eğer ilçe bilgisi yoksa veya sadece "Mahallesi" içeriyorsa, koordinatlardan bul
            if (!district || district === 'null' || district === 'undefined') {
              district = findDistrictByCoordinates(h.coordinates.latitude, h.coordinates.longitude);
            }
            
            // İlçe adını temizle (gereksiz eklerden)
            district = district?.replace(' Mahallesi', '').trim() || 'Bilinmeyen';
            
            return {
              id: h.osm_metadata?.id || `hospital_${index}`,
              name: h.name,
              type: h.medical_info?.healthcare === 'hospital' ? 'Hastane' : 'Sağlık Tesisi',
              phone: h.contact?.phone || null,
              address: h.address?.full_address || 
                      `${h.address?.neighbourhood || ''} ${district}`.trim() || 'İstanbul',
              coordinates: {
                latitude: h.coordinates.latitude,
                longitude: h.coordinates.longitude
              },
              emergency: h.medical_info?.emergency || null,
              website: h.contact?.website || null,
              operator: h.medical_info?.operator || null,
              beds: h.medical_info?.beds || null,
              district: district
            };
          })
          
      } catch (fileError) {
        console.error('Hastane dosyası okunamadı, mock data kullanılıyor:', fileError);
        console.error('Dosya yolu:', hospitalDataPath);
        console.error('Process cwd:', process.cwd());
        // Fallback to mock data
        hospitalData = [
          {
            id: '1',
            name: 'Acıbadem Maslak Hastanesi',
            type: 'Özel Hastane',
            phone: '+90 212 304 44 44',
            address: 'Büyükdere Caddesi No:40, Maslak, İstanbul',
            coordinates: { latitude: 41.108889, longitude: 29.018333 },
            emergency: 'yes',
            website: 'https://www.acibadem.com.tr',
            operator: 'Acıbadem Sağlık Grubu',
            beds: '200',
            district: 'Sarıyer'
          },
          {
            id: '2',
            name: 'Florence Nightingale Hastanesi',
            type: 'Özel Hastane',
            phone: '+90 212 224 49 50',
            address: 'Abide-i Hürriyet Caddesi, Şişli, İstanbul',
            coordinates: { latitude: 41.039444, longitude: 29.027778 },
            emergency: 'yes',
            website: 'https://www.florence.com.tr',
            operator: 'Florence Nightingale',
            beds: '150',
            district: 'Şişli'
          }
        ];
      }

      // District filter
      const district = req.query.district as string;
      let filteredHospitals = hospitalData;
      
      if (district && district !== 'all') {
        filteredHospitals = hospitalData.filter((h: any) => 
          h.district && h.district.toLowerCase() === district.toLowerCase()
        );
      }

      res.json({
        success: true,
        count: filteredHospitals.length,
        data: filteredHospitals
      });
    } catch (error) {
      console.error('Hastane API hatası:', error);
      res.status(500).json({ error: "Failed to get hospitals", details: String(error) });
    }
  });

  // Get districts
  app.get("/api/hospitals/districts", async (req, res) => {
    try {
      const districts = Object.keys(istanbulDistricts).sort();

      res.json({
        success: true,
        data: districts
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get districts", details: error });
    }
  });
}

