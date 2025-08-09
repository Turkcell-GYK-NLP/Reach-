declare module 'node-geocoder' {
  interface GeocoderOptions {
    provider: string;
    formatter?: any;
  }

  interface GeocoderResult {
    city?: string;
    country?: string;
    administrativeLevels?: {
      level2long?: string;
    };
    formattedAddress?: string;
  }

  interface Geocoder {
    reverse(options: { lat: number; lon: number }): Promise<GeocoderResult[]>;
  }

  function NodeGeocoder(options: GeocoderOptions): Geocoder;
  export = NodeGeocoder;
}
