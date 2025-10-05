interface NetworkData {
  operator: string;
  location: string;
  baseCoverage: number;
  baseSignal: number;
}

export class NetworkDataGenerator {
  private readonly baseData: NetworkData[] = [
    { operator: "Turkcell", location: "Kadıköy", baseCoverage: 94, baseSignal: 85 },
    { operator: "Vodafone", location: "Kadıköy", baseCoverage: 87, baseSignal: 78 },
    { operator: "Türk Telekom", location: "Kadıköy", baseCoverage: 72, baseSignal: 65 },
    { operator: "Turkcell", location: "Beşiktaş", baseCoverage: 91, baseSignal: 82 },
    { operator: "Vodafone", location: "Beşiktaş", baseCoverage: 89, baseSignal: 80 },
    { operator: "Türk Telekom", location: "Beşiktaş", baseCoverage: 75, baseSignal: 68 },
    { operator: "Turkcell", location: "Şişli", baseCoverage: 93, baseSignal: 84 },
    { operator: "Vodafone", location: "Şişli", baseCoverage: 88, baseSignal: 79 },
    { operator: "Türk Telekom", location: "Şişli", baseCoverage: 74, baseSignal: 66 },
  ];

  /**
   * Generate realistic network data with variations
   */
  generateNetworkData(): Array<{ operator: string; location: string; coverage: number; signalStrength: number }> {
    return this.baseData.map(data => {
      // Add realistic variation to base data
      const coverageVariation = (Math.random() - 0.5) * 6; // ±3%
      const signalVariation = (Math.random() - 0.5) * 10; // ±5
      
      const newCoverage = Math.max(0, Math.min(100, 
        Math.round(data.baseCoverage + coverageVariation)
      ));
      const newSignal = Math.max(0, Math.min(100, 
        Math.round(data.baseSignal + signalVariation)
      ));

      return {
        operator: data.operator,
        location: data.location,
        coverage: newCoverage,
        signalStrength: newSignal
      };
    });
  }

  /**
   * Generate network data for specific location
   */
  generateForLocation(location: string): Array<{ operator: string; location: string; coverage: number; signalStrength: number }> {
    const locationData = this.baseData.filter(data => 
      data.location.toLowerCase() === location.toLowerCase()
    );

    if (locationData.length === 0) {
      // Generate default data for unknown location
      return [
        { operator: "Turkcell", location, coverage: 85, signalStrength: 75 },
        { operator: "Vodafone", location, coverage: 80, signalStrength: 70 },
        { operator: "Türk Telekom", location, coverage: 70, signalStrength: 60 },
      ];
    }

    return locationData.map(data => {
      const coverageVariation = (Math.random() - 0.5) * 6;
      const signalVariation = (Math.random() - 0.5) * 10;
      
      return {
        operator: data.operator,
        location: data.location,
        coverage: Math.max(0, Math.min(100, Math.round(data.baseCoverage + coverageVariation))),
        signalStrength: Math.max(0, Math.min(100, Math.round(data.baseSignal + signalVariation)))
      };
    });
  }

  /**
   * Simulate network outage for location
   */
  simulateOutage(operator: string, location: string): { operator: string; location: string; coverage: number; signalStrength: number } {
    return {
      operator,
      location,
      coverage: Math.floor(Math.random() * 30), // 0-30% during outage
      signalStrength: Math.floor(Math.random() * 20) // 0-20 signal
    };
  }

  /**
   * Get all available locations
   */
  getAvailableLocations(): string[] {
    return Array.from(new Set(this.baseData.map(data => data.location)));
  }

  /**
   * Get all operators
   */
  getOperators(): string[] {
    return Array.from(new Set(this.baseData.map(data => data.operator)));
  }
}

