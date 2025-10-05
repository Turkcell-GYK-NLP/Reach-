import { storage } from "../../storage";
import { type EmergencyAlert, type InsertEmergencyAlert } from "@shared/schema";

export class EmergencyService {
  /**
   * Get active emergency alerts
   */
  async getActiveAlerts(location?: string): Promise<EmergencyAlert[]> {
    return storage.getActiveEmergencyAlerts(location);
  }

  /**
   * Create emergency alert
   */
  async createAlert(alertData: InsertEmergencyAlert): Promise<EmergencyAlert> {
    // Validate alert data
    if (!alertData.title || !alertData.description) {
      throw new Error("Title and description are required");
    }

    if (!alertData.severity) {
      alertData.severity = "medium";
    }

    return storage.createEmergencyAlert(alertData);
  }

  /**
   * Send emergency location
   */
  async sendEmergencyLocation(data: {
    latitude: number;
    longitude: number;
    address?: string;
    city?: string;
    district?: string;
    userId?: string;
  }): Promise<{
    message: string;
    location: any;
    timestamp: string;
  }> {
    const { latitude, longitude, address, city, district, userId } = data;

    // Validate coordinates
    if (!latitude || !longitude) {
      throw new Error("Latitude and longitude are required");
    }

    // Log the emergency location send
    console.log("Emergency location sent:", {
      coordinates: { latitude, longitude },
      address,
      city,
      district,
      userId,
      timestamp: new Date().toISOString()
    });

    // In a real implementation, you would:
    // 1. Get emergency contacts from user profile
    // 2. Send SMS/email with location to each contact
    // 3. Log the emergency event in database
    // 4. Possibly notify emergency services (112)
    // 5. Create an emergency alert

    // Create emergency alert if severity is high
    if (userId) {
      try {
        await this.createAlert({
          title: "Acil Konum Bildirimi",
          description: `Kullanıcı acil konum bildirimi yaptı: ${address || `${latitude}, ${longitude}`}`,
          severity: "high",
          location: city || district || "Bilinmeyen",
          isActive: true
        });
      } catch (error) {
        console.error("Failed to create emergency alert:", error);
      }
    }

    return {
      message: "Emergency location sent successfully",
      location: {
        latitude,
        longitude,
        address,
        city,
        district
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Assess emergency severity
   */
  assessSeverity(description: string): "low" | "medium" | "high" | "critical" {
    const lowerDesc = description.toLowerCase();
    
    // Critical keywords
    const criticalKeywords = ['ölüm', 'can kaybı', 'yangın', 'patlama', 'çökme'];
    if (criticalKeywords.some(keyword => lowerDesc.includes(keyword))) {
      return 'critical';
    }

    // High keywords
    const highKeywords = ['yaralı', 'enkaz', 'mahsur', 'acil yardım', 'kurtarma'];
    if (highKeywords.some(keyword => lowerDesc.includes(keyword))) {
      return 'high';
    }

    // Medium keywords
    const mediumKeywords = ['hasar', 'tehlike', 'risk', 'uyarı'];
    if (mediumKeywords.some(keyword => lowerDesc.includes(keyword))) {
      return 'medium';
    }

    return 'low';
  }
}

// Export singleton instance
export const emergencyService = new EmergencyService();

