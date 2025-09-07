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
    'hastane', 'yol tarifi', 'nasıl giderim', 'yakın', 'mesafe', 
    'koordinat', 'park', 'meydan', 'esenler', 'menderes', 'bağcılar',
    'kadıköy', 'beşiktaş', 'şişli', 'fatih', 'beyoğlu', 'üsküdar',
    'sarıyer', 'ataşehir', 'mahalle', 'ilçe', 'bölge'
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
      const userNeighborhood = userLocation?.neighborhood || 'Menderes';
      
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
      // Konum bazlı arama sorgusu oluştur
      let searchQuery = query;
      if (district && district !== 'İstanbul') {
        searchQuery = `${district} ${query}`;
      }
      if (neighborhood) {
        searchQuery = `${neighborhood} ${searchQuery}`;
      }

      const { spawn } = await import('child_process');
      const path = await import('path');
      
      const pythonScript = path.join(process.cwd(), 'faiss_search.py');
      const pythonProcess = spawn('python3', [pythonScript, searchQuery], {
        cwd: process.cwd(),
        env: { ...process.env, PATH: process.env.PATH }
      });

      return new Promise((resolve, reject) => {
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
    } catch (error) {
      console.error('FAISS arama hatası:', error);
      return [];
    }
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
