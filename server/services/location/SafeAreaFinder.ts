import { LocationInfo, SafeArea } from './types.js';
import { DistanceCalculator } from './DistanceCalculator.js';
import { FAISSIntegration } from './FAISSIntegration.js';

export class SafeAreaFinder {
  private distanceCalculator: DistanceCalculator;
  private faissIntegration: FAISSIntegration;

  constructor() {
    this.distanceCalculator = new DistanceCalculator();
    this.faissIntegration = new FAISSIntegration();
  }

  /**
   * Find nearest safe area to given location
   */
  async findNearest(currentLocation: LocationInfo): Promise<{
    name: string;
    distance: number;
    coordinates: { lat: number; lng: number };
    category: string;
    direction?: string;
  }> {
    try {
      // Get safe areas from FAISS
      const preferredDistrict = currentLocation.district || undefined;
      const safeAreas = await this.faissIntegration.getToplanmaAlanlari(preferredDistrict);

      if (safeAreas.length === 0) {
        return this.getFallbackSafeArea(currentLocation);
      }

      // Find nearest area
      let nearestArea = safeAreas[0];
      let minDistance = this.distanceCalculator.calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        safeAreas[0].coordinates.lat,
        safeAreas[0].coordinates.lng
      );

      for (const area of safeAreas.slice(1)) {
        const distance = this.distanceCalculator.calculateDistance(
          currentLocation.latitude,
          currentLocation.longitude,
          area.coordinates.lat,
          area.coordinates.lng
        );
        
        if (distance < minDistance) {
          minDistance = distance;
          nearestArea = area;
        }
      }

      // Calculate bearing and direction
      const bearing = this.distanceCalculator.calculateBearing(
        currentLocation.latitude,
        currentLocation.longitude,
        nearestArea.coordinates.lat,
        nearestArea.coordinates.lng
      );
      const direction = this.distanceCalculator.getDirectionLabel(bearing);

      return {
        name: nearestArea.name,
        distance: Math.round(minDistance * 1000), // Convert to meters
        coordinates: nearestArea.coordinates,
        category: nearestArea.category,
        direction
      };
    } catch (error) {
      console.error('❌ Safe area finder error:', error);
      return this.getFallbackSafeArea(currentLocation);
    }
  }

  /**
   * Find multiple safe areas within radius
   */
  async findWithinRadius(
    currentLocation: LocationInfo, 
    radiusKm: number
  ): Promise<Array<SafeArea & { distance: number; direction: string }>> {
    try {
      const preferredDistrict = currentLocation.district || undefined;
      const safeAreas = await this.faissIntegration.getToplanmaAlanlari(preferredDistrict);

      const areasWithDistance = safeAreas.map(area => {
        const distance = this.distanceCalculator.calculateDistance(
          currentLocation.latitude,
          currentLocation.longitude,
          area.coordinates.lat,
          area.coordinates.lng
        );
        const bearing = this.distanceCalculator.calculateBearing(
          currentLocation.latitude,
          currentLocation.longitude,
          area.coordinates.lat,
          area.coordinates.lng
        );
        const direction = this.distanceCalculator.getDirectionLabel(bearing);

        return {
          ...area,
          distance: Math.round(distance * 1000), // meters
          direction
        };
      });

      // Filter by radius and sort by distance
      return areasWithDistance
        .filter(area => (area.distance / 1000) <= radiusKm)
        .sort((a, b) => a.distance - b.distance);
    } catch (error) {
      console.error('❌ Safe areas within radius error:', error);
      return [];
    }
  }

  /**
   * Get fallback safe area when FAISS fails
   */
  private getFallbackSafeArea(currentLocation: LocationInfo): {
    name: string;
    distance: number;
    coordinates: { lat: number; lng: number };
    category: string;
  } {
    // Use district center as fallback
    const district = currentLocation.district || 'Kadıköy';
    const fallbackCoordinates = { 
      lat: currentLocation.latitude, 
      lng: currentLocation.longitude 
    };

    return {
      name: `${district} Merkez Toplanma Alanı`,
      distance: 500, // Estimate 500m
      coordinates: fallbackCoordinates,
      category: 'toplanma_alanı'
    };
  }

  /**
   * Get route instructions to safe area
   */
  getRouteInstructions(
    currentLocation: LocationInfo,
    safeArea: { name: string; coordinates: { lat: number; lng: number } }
  ): {
    googleMapsUrl: string;
    walkingTime: string;
    drivingTime: string;
    instructions: string;
  } {
    const distance = this.distanceCalculator.calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      safeArea.coordinates.lat,
      safeArea.coordinates.lng
    );

    // Estimate times (rough approximation)
    const walkingSpeed = 5; // km/h
    const drivingSpeed = 30; // km/h
    const walkingTimeMin = Math.round((distance / walkingSpeed) * 60);
    const drivingTimeMin = Math.round((distance / drivingSpeed) * 60);

    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${currentLocation.latitude},${currentLocation.longitude}&destination=${safeArea.coordinates.lat},${safeArea.coordinates.lng}&travelmode=walking`;

    const bearing = this.distanceCalculator.calculateBearing(
      currentLocation.latitude,
      currentLocation.longitude,
      safeArea.coordinates.lat,
      safeArea.coordinates.lng
    );
    const direction = this.distanceCalculator.getDirectionLabel(bearing);

    return {
      googleMapsUrl,
      walkingTime: `${walkingTimeMin} dakika`,
      drivingTime: `${drivingTimeMin} dakika`,
      instructions: `${safeArea.name} ${direction} yönünde, ${distance.toFixed(1)}km uzaklıkta.`
    };
  }
}

