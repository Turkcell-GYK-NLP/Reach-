import type { Express } from "express";

export function registerHospitalRoutes(app: Express): void {
  // Get hospitals
  app.get("/api/hospitals", async (req, res) => {
    try {
      const fs = require('fs');
      const path = require('path');
      
      // Gerçek hastane verilerini oku
      const hospitalDataPath = path.join(__dirname, '../../hospital_api/istanbul_hospitals_detailed.json');
      let hospitalData = [];
      
      try {
        const rawData = fs.readFileSync(hospitalDataPath, 'utf8');
        const allHospitals = JSON.parse(rawData);
        
        // Verileri frontend formatına dönüştür
        hospitalData = allHospitals
          .filter((h: any) => h.name && h.name !== 'İsimsiz Hospital' && h.coordinates)
          .map((h: any, index: number) => ({
            id: h.osm_metadata?.id || `hospital_${index}`,
            name: h.name,
            type: h.medical_info?.healthcare === 'hospital' ? 'Hastane' : 'Sağlık Tesisi',
            phone: h.contact?.phone || null,
            address: h.address?.full_address || 
                    `${h.address?.neighbourhood || ''} ${h.address?.district || 'İstanbul'}`.trim(),
            coordinates: {
              latitude: h.coordinates.latitude,
              longitude: h.coordinates.longitude
            },
            emergency: h.medical_info?.emergency || null,
            website: h.contact?.website || null,
            operator: h.medical_info?.operator || null,
            beds: h.medical_info?.beds || null,
            district: h.address?.district || 'Bilinmeyen'
          }))
          .slice(0, 100); // İlk 100 hastaneyi al (performans için)
          
      } catch (fileError) {
        console.error('Hastane dosyası okunamadı, mock data kullanılıyor:', fileError);
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
      res.status(500).json({ error: "Failed to get hospitals", details: error });
    }
  });

  // Get districts
  app.get("/api/hospitals/districts", async (req, res) => {
    try {
      const districts = [
        'Adalar', 'Arnavutköy', 'Ataşehir', 'Avcılar', 'Bağcılar', 'Bahçelievler',
        'Bakırköy', 'Başakşehir', 'Bayrampaşa', 'Beşiktaş', 'Beykoz', 'Beylikdüzü',
        'Beyoğlu', 'Büyükçekmece', 'Çatalca', 'Çekmeköy', 'Esenler', 'Esenyurt',
        'Eyüpsultan', 'Fatih', 'Gaziosmanpaşa', 'Güngören', 'Kadıköy', 'Kağıthane',
        'Kartal', 'Küçükçekmece', 'Maltepe', 'Pendik', 'Sancaktepe', 'Sarıyer',
        'Silivri', 'Sultanbeyli', 'Sultangazi', 'Şile', 'Şişli', 'Tuzla',
        'Ümraniye', 'Üsküdar', 'Zeytinburnu'
      ];

      res.json({
        success: true,
        data: districts
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get districts", details: error });
    }
  });
}

