import { storage } from "../storage";
import { type InsertNetworkStatus } from "@shared/schema";
import { TelecomApiService } from "./telecomApiService";

interface NetworkData {
  operator: string;
  location: string;
  baseeCoverage: number;
  baseSignal: number;
}

export class NetworkMonitor {
  private isRunning = false;
  private intervalId?: NodeJS.Timeout;
  private telecomService: TelecomApiService;
  
  private readonly baseData: NetworkData[] = [
    { operator: "Turkcell", location: "Kadıköy", baseeCoverage: 94, baseSignal: 85 },
    { operator: "Vodafone", location: "Kadıköy", baseeCoverage: 87, baseSignal: 78 },
    { operator: "Türk Telekom", location: "Kadıköy", baseeCoverage: 72, baseSignal: 65 },
    { operator: "Turkcell", location: "Beşiktaş", baseeCoverage: 91, baseSignal: 82 },
    { operator: "Vodafone", location: "Beşiktaş", baseeCoverage: 89, baseSignal: 80 },
    { operator: "Türk Telekom", location: "Beşiktaş", baseeCoverage: 75, baseSignal: 68 },
    { operator: "Turkcell", location: "Şişli", baseeCoverage: 93, baseSignal: 84 },
    { operator: "Vodafone", location: "Şişli", baseeCoverage: 88, baseSignal: 79 },
    { operator: "Türk Telekom", location: "Şişli", baseeCoverage: 74, baseSignal: 66 },
  ];

  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log("Starting network monitoring...");
    
    // Update network status every 30 seconds
    this.intervalId = setInterval(() => {
      this.updateNetworkStatus();
    }, 30 * 1000);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    this.isRunning = false;
    console.log("Stopped network monitoring");
  }

  private async updateNetworkStatus() {
    for (const data of this.baseData) {
      try {
        // Add some realistic variation to the base data
        const coverageVariation = (Math.random() - 0.5) * 6; // ±3%
        const signalVariation = (Math.random() - 0.5) * 10; // ±5
        
        const newCoverage = Math.max(0, Math.min(100, 
          Math.round(data.baseeCoverage + coverageVariation)
        ));
        const newSignal = Math.max(0, Math.min(100, 
          Math.round(data.baseSignal + signalVariation)
        ));

        await storage.updateNetworkStatus(data.operator, data.location, {
          coverage: newCoverage,
          signalStrength: newSignal,
        });
      } catch (error) {
        console.error(`Error updating network status for ${data.operator} in ${data.location}:`, error);
      }
    }
    
    console.log("Updated network status for all operators");
  }

  async getNetworkRecommendation(location: string): Promise<{
    bestOperator: string;
    coverage: number;
    reason: string;
  }> {
    try {
      const networkStatuses = await storage.getNetworkStatus(location);
      
      if (networkStatuses.length === 0) {
        return {
          bestOperator: "Turkcell",
          coverage: 90,
          reason: "Genel olarak en iyi kapsama alanına sahip"
        };
      }

      // Find the operator with best coverage
      const bestStatus = networkStatuses.reduce((best, current) => 
        current.coverage > best.coverage ? current : best
      );

      let reason = "";
      if (bestStatus.coverage >= 90) {
        reason = "Mükemmel kapsama alanı ve sinyal kalitesi";
      } else if (bestStatus.coverage >= 80) {
        reason = "İyi kapsama alanı, stabil bağlantı";
      } else {
        reason = "Mevcut şartlarda en iyi seçenek";
      }

      return {
        bestOperator: bestStatus.operator,
        coverage: bestStatus.coverage,
        reason: reason
      };
    } catch (error) {
      console.error("Error getting network recommendation:", error);
      return {
        bestOperator: "Turkcell",
        coverage: 90,
        reason: "Sistem hatası, genel öneri"
      };
    }
  }
}

export const networkMonitor = new NetworkMonitor();
