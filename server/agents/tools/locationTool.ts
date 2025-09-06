import { BaseTool } from './baseTool.js';
import { ToolInput, ToolResult } from '../types.js';
import { locationService } from '../../services/locationService.js';

export class LocationTool extends BaseTool {
  name = 'location';
  description = 'Konum bilgileri, güvenli alanlar ve yol tarifi sağlar';

  private keywords = [
    'konum', 'nerede', 'güvenli alan', 'toplanma', 'hastane',
    'yol tarifi', 'nasıl giderim', 'yakın', 'mesafe', 'koordinat'
  ];

  async execute(input: ToolInput): Promise<ToolResult | null> {
    const { query, userContext } = input;

    if (!this.shouldExecute(query, this.keywords)) {
      return null;
    }

    try {
      // Mevcut konum bilgisi
      const currentLocation = await locationService.getCurrentLocation();
      
      // En yakın güvenli alan
      const nearestSafeArea = await locationService.getNearestSafeArea();
      
      // Konum bazlı güvenli alanlar (mock data for now)
      const safeAreas = [
        {
          name: "Fenerbahçe Parkı",
          distance: "400m",
          coordinates: { lat: 40.9839, lng: 29.0365 },
          capacity: 5000,
          facilities: ["Su", "Elektrik", "Tıbbi Yardım"]
        }
      ];

      return this.createResult('location', {
        currentLocation,
        nearestSafeArea,
        safeAreas,
        userLocation: userContext.location
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
}
