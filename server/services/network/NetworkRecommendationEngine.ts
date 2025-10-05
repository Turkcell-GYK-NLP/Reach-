interface NetworkStatus {
  operator: string;
  coverage: number;
  signalStrength?: number | null;
}

export class NetworkRecommendationEngine {
  /**
   * Get best network operator recommendation for location
   */
  getRecommendation(networkStatuses: NetworkStatus[]): {
    bestOperator: string;
    coverage: number;
    reason: string;
  } {
    if (networkStatuses.length === 0) {
      return this.getDefaultRecommendation();
    }

    // Find the operator with best coverage
    const bestStatus = networkStatuses.reduce((best, current) => 
      current.coverage > best.coverage ? current : best
    );

    const reason = this.generateReason(bestStatus.coverage);

    return {
      bestOperator: bestStatus.operator,
      coverage: bestStatus.coverage,
      reason
    };
  }

  /**
   * Get default recommendation when no data available
   */
  private getDefaultRecommendation(): {
    bestOperator: string;
    coverage: number;
    reason: string;
  } {
    return {
      bestOperator: "Turkcell",
      coverage: 90,
      reason: "Genel olarak en iyi kapsama alanına sahip"
    };
  }

  /**
   * Generate human-readable reason based on coverage
   */
  private generateReason(coverage: number): string {
    if (coverage >= 90) {
      return "Mükemmel kapsama alanı ve sinyal kalitesi";
    } else if (coverage >= 80) {
      return "İyi kapsama alanı, stabil bağlantı";
    } else if (coverage >= 70) {
      return "Kabul edilebilir kapsama, zaman zaman kesinti olabilir";
    } else if (coverage >= 60) {
      return "Düşük kapsama, sık kesinti beklenebilir";
    } else {
      return "Çok düşük kapsama, alternatif operatör önerilir";
    }
  }

  /**
   * Compare operators and provide detailed analysis
   */
  compareOperators(networkStatuses: NetworkStatus[]): {
    best: string;
    worst: string;
    averageCoverage: number;
    recommendations: string[];
  } {
    if (networkStatuses.length === 0) {
      return {
        best: "Turkcell",
        worst: "Unknown",
        averageCoverage: 0,
        recommendations: ["Lütfen konum bilgisi sağlayın"]
      };
    }

    const best = networkStatuses.reduce((b, c) => c.coverage > b.coverage ? c : b);
    const worst = networkStatuses.reduce((w, c) => c.coverage < w.coverage ? c : w);
    const avgCoverage = networkStatuses.reduce((sum, s) => sum + s.coverage, 0) / networkStatuses.length;

    const recommendations: string[] = [];

    // Generate recommendations based on data
    if (avgCoverage < 70) {
      recommendations.push("Bölgede genel olarak düşük sinyal var");
      recommendations.push("WiFi kullanmayı tercih edin");
    }

    if (best.coverage - worst.coverage > 20) {
      recommendations.push(`${best.operator} diğer operatörlerden belirgin şekilde iyi`);
    }

    if (best.coverage >= 90) {
      recommendations.push(`${best.operator} ile kesintisiz iletişim mümkün`);
    }

    return {
      best: best.operator,
      worst: worst.operator,
      averageCoverage: Math.round(avgCoverage),
      recommendations
    };
  }

  /**
   * Check if network is emergency-ready
   */
  isEmergencyReady(networkStatuses: NetworkStatus[]): {
    ready: boolean;
    bestOperator: string;
    minCoverage: number;
    recommendation: string;
  } {
    if (networkStatuses.length === 0) {
      return {
        ready: false,
        bestOperator: "Unknown",
        minCoverage: 0,
        recommendation: "Sinyal bilgisi alınamıyor, acil durumda WiFi kullanın"
      };
    }

    const best = networkStatuses.reduce((b, c) => c.coverage > b.coverage ? c : b);
    const minCoverage = networkStatuses.reduce((min, s) => Math.min(min, s.coverage), 100);

    const ready = best.coverage >= 70;

    let recommendation: string;
    if (ready) {
      recommendation = `${best.operator} ile acil arama yapabilirsiniz`;
    } else {
      recommendation = "Tüm operatörlerde zayıf sinyal, WiFi calling kullanın veya farklı bir konuma gidin";
    }

    return {
      ready,
      bestOperator: best.operator,
      minCoverage,
      recommendation
    };
  }

  /**
   * Get network quality rating
   */
  getQualityRating(coverage: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (coverage >= 90) return 'excellent';
    if (coverage >= 75) return 'good';
    if (coverage >= 60) return 'fair';
    return 'poor';
  }
}

