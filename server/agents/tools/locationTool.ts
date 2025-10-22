import { BaseTool } from './baseTool.js';
import { ToolInput, ToolResult } from '../types.js';
import { locationService } from '../../services/locationService.js';
import { spawn } from 'child_process';
import path from 'path';

export class LocationTool extends BaseTool {
  name = 'location';
  description = 'Konum bilgileri, güvenli alanlar ve yol tarifi sağlar';

  private keywords = [
    'konum', 'nerede', 'güvenli alan', 'toplanma', 'toplanma alanı',
    'hastane', 'hastaneler', 'en yakın hastane', 'yakın hastane', 'hastane nerede',
    'yol tarifi', 'nasıl giderim', 'yakın', 'mesafe', 'en yakın',
    'koordinat', 'park', 'meydan', 'esenler', 'menderes', 'bağcılar',
    'kadıköy', 'beşiktaş', 'şişli', 'fatih', 'beyoğlu', 'üsküdar',
    'sarıyer', 'ataşehir', 'mahalle', 'ilçe', 'bölge', 'sağlık',
    'doktor', 'acil servis', 'ambulans', 'tıbbi', 'medikal'
  ];

  async execute(input: ToolInput): Promise<ToolResult | null> {
    const { query, userContext } = input;

    if (!this.shouldExecute(query, this.keywords)) {
      return null;
    }

    try {
      // Mevcut konum bilgisi
      const currentLocation = await locationService.getCurrentLocation();
      
      // Kullanıcının konum bilgisini al
      const userLocation = userContext.location;
      const userDistrict = userLocation?.district || 'Esenler';
      const userNeighborhood = (userLocation as any)?.neighborhood || 'Menderes';
      
      console.log(`📍 LocationTool: User location - ${userDistrict}, ${userNeighborhood}`);
      
      // FAISS'den konum bazlı toplanma alanları ara
      const safeAreas = await this.searchToplanmaAlanlariByLocation(userDistrict, userNeighborhood, query, userContext);
      
      // En yakın alanı hesapla
      const nearestSafeArea = safeAreas.length > 0 ? safeAreas[0] : null;

      return this.createResult('location', {
        currentLocation,
        nearestSafeArea,
        safeAreas,
        userLocation: userContext.location,
        searchQuery: query
      }, 0.9);
    } catch (error) {
      console.error('LocationTool error:', error);
      return this.createResult('location', {
        error: 'Konum bilgisi alınamadı',
        currentLocation: null,
        nearestSafeArea: null,
        safeAreas: []
      }, 0.1);
    }
  }

  private async searchToplanmaAlanlariByLocation(district: string, neighborhood: string, query: string, userContext?: any): Promise<any[]> {
    try {
      // Önce Python FAISS aramasını dene
      try {
        const { spawn } = await import('child_process');
        const path = await import('path');
        
        const pythonScript = path.join(process.cwd(), 'faiss_search.py');
        const pythonCmd = process.env.PYTHON || (process.platform === 'win32' ? 'python' : 'python3');
        
        // İlçe adını öncelikle ekle
        const searchQuery = query.toLowerCase().includes(district.toLowerCase()) ? query : `${district} ${query}`;
        const pythonProcess = spawn(pythonCmd, [pythonScript, searchQuery], {
          cwd: process.cwd(),
          env: { 
            ...process.env, 
            PATH: process.env.PATH,
            VIRTUAL_ENV: path.join(process.cwd(), 'venv'),
            PYTHONPATH: path.join(process.cwd(), 'venv', 'lib', 'python3.11', 'site-packages')
          }
        });

        const result = await new Promise<any[]>((resolve, reject) => {
          let output = '';
          let errorOutput = '';

          pythonProcess.stdout.on('data', (data) => {
            output += data.toString();
          });

          pythonProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
          });

          pythonProcess.on('close', (code) => {
            if (code === 0) {
              try {
                const results = JSON.parse(output);
                const safeAreas = results.map((result: any) => ({
                  name: result.metadata.alan_adi,
                  district: result.metadata.ilce,
                  neighborhood: result.metadata.mahalle,
                  coordinates: {
                    lat: result.metadata.koordinat.lat,
                    lng: result.metadata.koordinat.lng
                  },
                  area: result.metadata.alan_bilgileri.toplam_alan,
                  facilities: this.extractFacilities(result.metadata.altyapi),
                  distance: this.calculateDistance(userContext.location, result.metadata.koordinat),
                  similarity: result.similarity,
                  fullData: result.metadata
                }));
                resolve(safeAreas);
              } catch (parseError) {
                reject(new Error(`JSON parse hatası: ${parseError}`));
              }
            } else {
              reject(new Error(`Python script hatası: ${errorOutput}`));
            }
          });

          pythonProcess.on('error', (error) => {
            reject(new Error(`Python process hatası: ${error}`));
          });
        });

        if (result && result.length > 0) {
          return result;
        }
      } catch (pythonError) {
        console.log('Python FAISS araması başarısız, fallback kullanılıyor:', (pythonError as Error).message);
      }

      // Fallback: Direkt JSON dosyalarından arama
      return this.fallbackSearch(district, neighborhood, query, userContext);

    } catch (error) {
      console.error('LocationTool arama hatası:', error);
      return this.fallbackSearch(district, neighborhood, query, userContext);
    }
  }

  private async fallbackSearch(district: string, neighborhood: string, query: string, userContext?: any): Promise<any[]> {
    const fs = await import('fs');
    const path = await import('path');
    
    const results: any[] = [];
    const dataDir = path.join(process.cwd(), 'new_datas');
    
    try {
      const files = fs.readdirSync(dataDir).filter(file => file.endsWith('.json') && file !== '00_ozet.json');
      
      for (const file of files) {
        try {
          const filePath = path.join(dataDir, file);
          const fileContent = fs.readFileSync(filePath, 'utf-8');
          const data = JSON.parse(fileContent);
          
          const ilce = data.ilce?.toLowerCase() || '';
          const toplanmaAlanlari = data.toplanma_alanlari || [];
          
          // İlçe eşleşmesi kontrol et
          if (district && ilce.includes(district.toLowerCase())) {
            for (const alan of toplanmaAlanlari) {
              const alan_adi = alan.ad || '';
              const mahalle = alan.mahalle || '';
              const ozellikler = alan.ozellikler || {};
              
              // Sadece gerçek toplanma alanlarını filtrele
              const isToplanmaAlani = ozellikler.tur === 'Toplanma Alanı' || 
                                    ozellikler.durum === 'Aktif' ||
                                    alan_adi.toLowerCase().includes('toplanma') ||
                                    alan_adi.toLowerCase().includes('alan');
              
              if (isToplanmaAlani) {
                const result = {
                  name: alan_adi,
                  district: data.ilce,
                  neighborhood: mahalle,
                  coordinates: {
                    lat: alan.koordinat?.lat || 0,
                    lng: alan.koordinat?.lng || 0
                  },
                  area: alan.alan_bilgileri?.toplam_alan || 0,
                  facilities: this.extractFacilities(alan.altyapi),
                  distance: this.calculateDistance(userContext?.location, alan.koordinat),
                  similarity: 1.0,
                  fullData: alan
                };
                results.push(result);
                
                if (results.length >= 5) { // Maksimum 5 sonuç
                  break;
                }
              }
            }
          }
        } catch (fileError) {
          console.error(`Dosya okuma hatası ${file}:`, fileError);
        }
      }
    } catch (error) {
      console.error('Fallback arama hatası:', error);
    }
    
    return results;
  }

  private extractFacilities(altyapi: any): string[] {
    const facilities = [];
    if (altyapi.elektrik) facilities.push('Elektrik');
    if (altyapi.su) facilities.push('Su');
    if (altyapi.wc) facilities.push('WC');
    if (altyapi.kanalizasyon) facilities.push('Kanalizasyon');
    return facilities;
  }

  private calculateDistance(userLocation: any, targetCoordinates: any): string {
    if (!userLocation?.coordinates || !targetCoordinates.lat || !targetCoordinates.lng) {
      return 'Bilinmiyor';
    }
    
    // Basit mesafe hesaplama (Haversine formula kullanılabilir)
    const lat1 = userLocation.coordinates.lat;
    const lng1 = userLocation.coordinates.lng;
    const lat2 = targetCoordinates.lat;
    const lng2 = targetCoordinates.lng;
    
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    } else {
      return `${distance.toFixed(1)}km`;
    }
  }
}
