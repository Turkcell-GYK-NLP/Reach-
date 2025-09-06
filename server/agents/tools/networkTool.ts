import { BaseTool } from './baseTool.js';
import { ToolInput, ToolResult } from '../types.js';
import { networkMonitor } from '../../services/networkMonitor.js';

export class NetworkTool extends BaseTool {
  name = 'network';
  description = 'Şebeke durumu, operatör bilgileri ve bağlantı önerileri sağlar';

  private keywords = [
    'şebeke', 'internet', 'çekmiyor', 'sinyal', 'bağlantı',
    'türk telekom', 'vodafone', 'turkcell', 'operatör',
    'kapsama', 'hız', 'veri', 'wifi', '5g', '4g'
  ];

  async execute(input: ToolInput): Promise<ToolResult | null> {
    const { query, userContext } = input;

    if (!this.shouldExecute(query, this.keywords)) {
      return null;
    }

    try {
      const location = userContext.location?.district || 'İstanbul';
      
      // Şebeke durumu (mock data for now)
      const networkStatus = {
        location,
        status: 'active',
        coverage: 85,
        lastUpdated: new Date()
      };
      
      // Operatör önerisi
      const recommendation = await networkMonitor.getNetworkRecommendation(location);
      
      // Tüm operatörlerin durumu (mock data for now)
      const allOperators = [
        { status: 'up', coverage: 90, signalStrength: 85 },
        { status: 'up', coverage: 88, signalStrength: 80 },
        { status: 'up', coverage: 92, signalStrength: 88 }
      ];

      return this.createResult('network', {
        location,
        networkStatus,
        recommendation,
        operators: {
          'türk telekom': allOperators[0],
          'vodafone': allOperators[1],
          'turkcell': allOperators[2]
        },
        userOperator: userContext.operator
      }, 0.85);
    } catch (error) {
      console.error('NetworkTool error:', error);
      return this.createResult('network', {
        error: 'Şebeke bilgisi alınamadı',
        location: userContext.location?.district || 'Bilinmiyor',
        networkStatus: null,
        recommendation: null,
        operators: {}
      }, 0.1);
    }
  }
}
