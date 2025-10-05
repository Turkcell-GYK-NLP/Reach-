import { storage } from "../storage";
import { NetworkDataGenerator } from "./network/NetworkDataGenerator.js";
import { NetworkRecommendationEngine } from "./network/NetworkRecommendationEngine.js";

export class NetworkMonitor {
  private isRunning = false;
  private intervalId?: NodeJS.Timeout;
  private dataGenerator: NetworkDataGenerator;
  private recommendationEngine: NetworkRecommendationEngine;

  constructor() {
    this.dataGenerator = new NetworkDataGenerator();
    this.recommendationEngine = new NetworkRecommendationEngine();
  }

  /**
   * Start network monitoring
   */
  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log("Starting network monitoring...");
    
    // Update network status every 30 seconds
    this.intervalId = setInterval(() => {
      this.updateNetworkStatus();
    }, 30 * 1000);
  }

  /**
   * Stop network monitoring
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    this.isRunning = false;
    console.log("Stopped network monitoring");
  }

  /**
   * Update network status for all locations
   */
  private async updateNetworkStatus(): Promise<void> {
    const networkData = this.dataGenerator.generateNetworkData();

    for (const data of networkData) {
      try {
        await storage.updateNetworkStatus(data.operator, data.location, {
          coverage: data.coverage,
          signalStrength: data.signalStrength,
        });
      } catch (error) {
        console.error(`Error updating network status for ${data.operator} in ${data.location}:`, error);
      }
    }
    
    console.log("Updated network status for all operators");
  }

  /**
   * Get network recommendation for location
   */
  async getNetworkRecommendation(location: string): Promise<{
    bestOperator: string;
    coverage: number;
    reason: string;
  }> {
    try {
      const networkStatuses = await storage.getNetworkStatus(location);
      return this.recommendationEngine.getRecommendation(networkStatuses);
    } catch (error) {
      console.error("Error getting network recommendation:", error);
      return {
        bestOperator: "Turkcell",
        coverage: 90,
        reason: "Sistem hatası, genel öneri"
      };
    }
  }

  /**
   * Compare operators for location
   */
  async compareOperators(location: string): Promise<any> {
    try {
      const networkStatuses = await storage.getNetworkStatus(location);
      return this.recommendationEngine.compareOperators(networkStatuses);
    } catch (error) {
      console.error("Error comparing operators:", error);
      return null;
    }
  }

  /**
   * Check if network is emergency ready
   */
  async checkEmergencyReadiness(location: string): Promise<any> {
    try {
      const networkStatuses = await storage.getNetworkStatus(location);
      return this.recommendationEngine.isEmergencyReady(networkStatuses);
    } catch (error) {
      console.error("Error checking emergency readiness:", error);
      return {
        ready: false,
        bestOperator: "Unknown",
        minCoverage: 0,
        recommendation: "Sinyal durumu kontrol edilemiyor"
      };
    }
  }

  /**
   * Get available locations
   */
  getAvailableLocations(): string[] {
    return this.dataGenerator.getAvailableLocations();
  }

  /**
   * Get available operators
   */
  getOperators(): string[] {
    return this.dataGenerator.getOperators();
  }

  /**
   * Check if monitoring is running
   */
  isMonitoring(): boolean {
    return this.isRunning;
  }
}

export const networkMonitor = new NetworkMonitor();
