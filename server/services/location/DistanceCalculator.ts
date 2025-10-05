import { DistrictBounds } from './types.js';
import { ISTANBUL_DISTRICTS } from './districtConstants.js';

export class DistanceCalculator {
  /**
   * Calculate distance between two coordinates using Haversine formula
   * Returns distance in kilometers
   */
  calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLng = this.deg2rad(lng2 - lng1);
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Convert degrees to radians
   */
  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }

  /**
   * Find nearest district by coordinates
   */
  findNearestDistrict(lat: number, lng: number): DistrictBounds {
    let nearestDistrict = ISTANBUL_DISTRICTS[0];
    let minDistance = this.calculateDistance(
      lat, lng, 
      nearestDistrict.center.lat, 
      nearestDistrict.center.lng
    );

    // First check districts within their radius
    for (const district of ISTANBUL_DISTRICTS) {
      const distance = this.calculateDistance(lat, lng, district.center.lat, district.center.lng);
      
      // If within district radius, this is more accurate
      if (distance <= district.radius) {
        console.log(`🎯 Within ${district.name} radius: ${distance.toFixed(2)}km`);
        return district;
      }
      
      if (distance < minDistance) {
        minDistance = distance;
        nearestDistrict = district;
      }
    }

    console.log(`📍 Nearest district: ${nearestDistrict.name} (${minDistance.toFixed(2)}km)`);
    return nearestDistrict;
  }

  /**
   * Find all districts within a certain radius
   */
  findDistrictsWithinRadius(lat: number, lng: number, radiusKm: number): DistrictBounds[] {
    const districtsInRange: DistrictBounds[] = [];

    for (const district of ISTANBUL_DISTRICTS) {
      const distance = this.calculateDistance(lat, lng, district.center.lat, district.center.lng);
      
      if (distance <= radiusKm) {
        districtsInRange.push(district);
      }
    }

    return districtsInRange.sort((a, b) => {
      const distA = this.calculateDistance(lat, lng, a.center.lat, a.center.lng);
      const distB = this.calculateDistance(lat, lng, b.center.lat, b.center.lng);
      return distA - distB;
    });
  }

  /**
   * Calculate bearing (direction) between two points
   */
  calculateBearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const dLng = this.deg2rad(lng2 - lng1);
    const y = Math.sin(dLng) * Math.cos(this.deg2rad(lat2));
    const x = Math.cos(this.deg2rad(lat1)) * Math.sin(this.deg2rad(lat2)) -
              Math.sin(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * Math.cos(dLng);
    
    const bearingRad = Math.atan2(y, x);
    const bearingDeg = bearingRad * 180 / Math.PI;
    
    return (bearingDeg + 360) % 360; // Normalize to 0-360
  }

  /**
   * Get direction label from bearing
   */
  getDirectionLabel(bearing: number): string {
    const directions = ['Kuzey', 'Kuzeydoğu', 'Doğu', 'Güneydoğu', 'Güney', 'Güneybatı', 'Batı', 'Kuzeybatı'];
    const index = Math.round(bearing / 45) % 8;
    return directions[index];
  }
}

