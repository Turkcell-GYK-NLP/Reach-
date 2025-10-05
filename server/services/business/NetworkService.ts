import { storage } from "../../storage";
import { networkMonitor } from "../networkMonitor";
import { type NetworkStatus } from "@shared/schema";

export class NetworkService {
  /**
   * Get network status by location
   */
  async getNetworkStatus(location?: string): Promise<NetworkStatus[]> {
    return storage.getNetworkStatus(location);
  }

  /**
   * Get network recommendation for location
   */
  async getNetworkRecommendation(location: string): Promise<{
    bestOperator: string;
    coverage: number;
    reason: string;
  }> {
    return networkMonitor.getNetworkRecommendation(location);
  }

  /**
   * Analyze network quality
   */
  analyzeNetworkQuality(networkStatuses: NetworkStatus[]): {
    overallQuality: 'excellent' | 'good' | 'fair' | 'poor';
    averageCoverage: number;
    averageSignal: number;
    bestOperator: string;
  } {
    if (networkStatuses.length === 0) {
      return {
        overallQuality: 'poor',
        averageCoverage: 0,
        averageSignal: 0,
        bestOperator: 'Unknown'
      };
    }

    // Calculate averages
    const avgCoverage = networkStatuses.reduce((sum, status) => sum + status.coverage, 0) / networkStatuses.length;
    const avgSignal = networkStatuses.reduce((sum, status) => sum + (status.signalStrength || 0), 0) / networkStatuses.length;

    // Find best operator
    const bestStatus = networkStatuses.reduce((best, current) => 
      current.coverage > best.coverage ? current : best
    );

    // Determine quality
    let quality: 'excellent' | 'good' | 'fair' | 'poor' = 'poor';
    if (avgCoverage >= 90) quality = 'excellent';
    else if (avgCoverage >= 75) quality = 'good';
    else if (avgCoverage >= 60) quality = 'fair';

    return {
      overallQuality: quality,
      averageCoverage: Math.round(avgCoverage),
      averageSignal: Math.round(avgSignal),
      bestOperator: bestStatus.operator
    };
  }
}

// Export singleton instance
export const networkService = new NetworkService();

