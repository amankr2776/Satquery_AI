import { getGeospatialImageryUrl } from '../components/SatelliteImageProvider';

/**
 * Service Configuration for Geospatial Imagery APIs
 */
export interface SatelliteApiConfig {
  mapboxToken?: string;
  sentinelClientId?: string;
  sentinelClientSecret?: string;
}

// Safe configuration for Geospatial Imagery APIs
const DEFAULT_CONFIG: SatelliteApiConfig = {
  // Only use Mapbox if user provides a valid personal token
  mapboxToken: (import.meta.env.VITE_MAPBOX_TOKEN && !import.meta.env.VITE_MAPBOX_TOKEN.includes('pk.eyJ1IjoiYWlzdHVkaW8i')) 
    ? import.meta.env.VITE_MAPBOX_TOKEN 
    : undefined,
  sentinelClientId: import.meta.env.VITE_SENTINEL_CLIENT_ID || '',
  sentinelClientSecret: import.meta.env.VITE_SENTINEL_CLIENT_SECRET || '',
};

class SatelliteApiService {
  private config: SatelliteApiConfig = { ...DEFAULT_CONFIG };
  private sentinelAccessToken: string | null = null;
  private sentinelTokenExpiresAt: number = 0;

  /**
   * Configure the service dynamically with live credentials
   */
  public updateConfig(newConfig: Partial<SatelliteApiConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Retrieves a satellite image URL for a given bounding box from Mapbox Static API
   */
  public getMapboxSatelliteUrl(
    bbox: number[],
    width: number = 1200,
    height: number = 800
  ): string {
    const token = this.config.mapboxToken || DEFAULT_CONFIG.mapboxToken;
    const [minLon, minLat, maxLon, maxLat] = bbox;
    
    // Calculate geographic center
    const centerLon = (minLon + maxLon) / 2;
    const centerLat = (minLat + maxLat) / 2;
    
    // Fit coordinates to zoom level approximation
    const latDiff = Math.abs(maxLat - minLat);
    const lonDiff = Math.abs(maxLon - minLon);
    const maxDiff = Math.max(latDiff, lonDiff);
    let zoom = 11;
    if (maxDiff > 2.0) zoom = 6;
    else if (maxDiff > 0.8) zoom = 8;
    else if (maxDiff > 0.3) zoom = 10;
    else if (maxDiff > 0.1) zoom = 12;
    else if (maxDiff > 0.02) zoom = 13;
    else zoom = 14;

    return `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${centerLon},${centerLat},${zoom},0,0/${width}x${height}?access_token=${token}`;
  }

  /**
   * Performs authentic OAuth2 client credential authentication with Sentinel Hub
   */
  public async authenticateSentinel(): Promise<string | null> {
    const { sentinelClientId, sentinelClientSecret } = this.config;
    if (!sentinelClientId || !sentinelClientSecret) {
      console.warn('Sentinel Hub credentials not fully configured. Using fallback layer generation.');
      return null;
    }

    // Check if cached token is still valid
    if (this.sentinelAccessToken && Date.now() < this.sentinelTokenExpiresAt) {
      return this.sentinelAccessToken;
    }

    try {
      const response = await fetch('https://services.sentinel-hub.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: sentinelClientId,
          client_secret: sentinelClientSecret,
        }),
      });

      if (!response.ok) {
        throw new Error(`Sentinel Hub Auth HTTP Error: ${response.status}`);
      }

      const data = await response.json();
      this.sentinelAccessToken = data.access_token;
      this.sentinelTokenExpiresAt = Date.now() + (data.expires_in - 30) * 1000;
      console.log('Sentinel Hub token successfully refreshed.');
      return this.sentinelAccessToken;
    } catch (err) {
      console.error('Sentinel Hub authentic authentication failed:', err);
      return null;
    }
  }

  /**
   * Fetches high-resolution multi-spectral bands directly from Sentinel Hub Process API
   */
  public async fetchSentinelProcessImagery(params: {
    bbox: number[];
    width: number;
    height: number;
    layerMode: 'rgb' | 'nir' | 'swir' | 'ndvi' | 'ndwi' | 'thermal';
  }): Promise<string | null> {
    const token = await this.authenticateSentinel();
    if (!token) return null;

    const [minLon, minLat, maxLon, maxLat] = params.bbox;

    // Define custom spectral band combinations (Evalscripts) for specific indicators
    const evalscripts: Record<string, string> = {
      rgb: `
        //VERSION=3
        function setup() {
          return {
            input: ["B04", "B03", "B02"],
            output: { bands: 3 }
          };
        }
        function evaluatePixel(sample) {
          return [2.5 * sample.B04, 2.5 * sample.B03, 2.5 * sample.B02];
        }
      `,
      nir: `
        //VERSION=3
        function setup() {
          return {
            input: ["B08", "B04", "B03"],
            output: { bands: 3 }
          };
        }
        function evaluatePixel(sample) {
          return [2.5 * sample.B08, 2.5 * sample.B04, 2.5 * sample.B03];
        }
      `,
      swir: `
        //VERSION=3
        function setup() {
          return {
            input: ["B12", "B8A", "B04"],
            output: { bands: 3 }
          };
        }
        function evaluatePixel(sample) {
          return [2.5 * sample.B12, 2.5 * sample.B8A, 2.5 * sample.B04];
        }
      `,
      ndvi: `
        //VERSION=3
        function setup() {
          return {
            input: ["B08", "B04"],
            output: { bands: 1 }
          };
        }
        function evaluatePixel(sample) {
          let ndvi = (sample.B08 - sample.B04) / (sample.B08 + sample.B04);
          return [ndvi];
        }
      `,
      ndwi: `
        //VERSION=3
        function setup() {
          return {
            input: ["B03", "B08"],
            output: { bands: 1 }
          };
        }
        function evaluatePixel(sample) {
          let ndwi = (sample.B03 - sample.B08) / (sample.B03 + sample.B08);
          return [ndwi];
        }
      `,
      thermal: `
        //VERSION=3
        function setup() {
          return {
            input: ["B11", "B12"],
            output: { bands: 3 }
          };
        }
        function evaluatePixel(sample) {
          return [3.0 * sample.B11, 1.5 * sample.B12, 0.5 * sample.B11];
        }
      `
    };

    const evalscript = evalscripts[params.layerMode] || evalscripts.rgb;

    try {
      const response = await fetch('https://services.sentinel-hub.com/api/v1/process', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'image/jpeg',
        },
        body: JSON.stringify({
          input: {
            bounds: {
              bbox: [minLon, minLat, maxLon, maxLat],
              properties: {
                crs: 'http://www.opengis.net/def/crs/OGC/1.3/CRS84',
              },
            },
            data: [
              {
                type: 'sentinel-2-l2a',
                dataFilter: {
                  timeRange: {
                    from: '2024-01-01T00:00:00Z',
                    to: '2024-09-01T00:00:00Z',
                  },
                },
              },
            ],
          },
          output: {
            width: params.width,
            height: params.height,
            responses: [
              {
                identifier: 'default',
                format: {
                  type: 'image/jpeg',
                },
              },
            ],
          },
          evalscript: evalscript,
        }),
      });

      if (!response.ok) {
        throw new Error(`Sentinel Hub Process API Error: ${response.status}`);
      }

      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (err) {
      console.error('Sentinel Hub Process request failed:', err);
      return null;
    }
  }

  /**
   * Retrieves real Sentinel-2 Cloudless imagery from Copernicus/EOX Sentinel WMS
   */
  public getCopernicusSentinelUrl(
    bbox: number[],
    width: number = 1200,
    height: number = 800
  ): string {
    const [minLon, minLat, maxLon, maxLat] = bbox;
    return `https://tiles.maps.eox.at/wms?service=wms&request=getmap&version=1.3.0&layers=s2cloudless-2020&styles=&format=image/jpeg&transparent=false&crs=EPSG:4326&bbox=${minLat},${minLon},${maxLat},${maxLon}&width=${width}&height=${height}`;
  }

  /**
   * Retrieves NASA GIBS Earth observation daily satellite imagery
   */
  public getNasaGibsSatelliteUrl(
    bbox: number[],
    width: number = 1200,
    height: number = 800,
    date: string = '2024-08-01'
  ): string {
    const [minLon, minLat, maxLon, maxLat] = bbox;
    return `https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&LAYERS=MODIS_Terra_CorrectedReflectance_TrueColor&STYLES=&FORMAT=image%2Fjpeg&TRANSPARENT=false&HEIGHT=${height}&WIDTH=${width}&TIME=${date}&CRS=EPSG:4326&BBOX=${minLat},${minLon},${maxLat},${maxLon}`;
  }

  /**
   * Retrieves real high-resolution orthorectified imagery from Esri ArcGIS World Imagery
   */
  public getEsriSatelliteUrl(
    bbox: number[],
    width: number = 1200,
    height: number = 800
  ): string {
    const [minLon, minLat, maxLon, maxLat] = bbox;
    return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=${minLon},${minLat},${maxLon},${maxLat}&bboxSR=4326&size=${width},${height}&format=jpg&f=image`;
  }

  /**
   * Master resolution flow providing live high-resolution satellite imagery layers.
   * Dynamically supports Sentinel-2 (Copernicus), NASA GIBS, and ArcGIS World Imagery.
   */
  public getLiveSatelliteLayer(params: {
    sceneId: string;
    bbox?: number[];
    center?: number[];
    provider?: 'esri' | 'copernicus' | 'nasa' | 'usgs' | 'sar' | string;
    layerMode?: 'rgb' | 'nir' | 'swir' | 'ndvi' | 'ndwi' | 'thermal' | 'sar';
    width?: number;
    height?: number;
  }): string {
    const bbox = params.bbox || [77.209, 28.6139, 77.229, 28.6339];
    const width = params.width || 1200;
    const height = params.height || 800;

    // 1. If Copernicus/Sentinel is selected
    if (params.provider === 'copernicus' || params.provider === 'sentinel' || params.provider === 'eox') {
      return this.getCopernicusSentinelUrl(bbox, width, height);
    }

    // 2. If NASA GIBS Earthdata is selected
    if (params.provider === 'nasa' || params.provider === 'gibs') {
      return this.getNasaGibsSatelliteUrl(bbox, width, height);
    }

    // 3. If Mapbox is explicitly configured with a verified user token
    if (this.config.mapboxToken) {
      return this.getMapboxSatelliteUrl(bbox, width, height);
    }

    // 4. Primary reliable global satellite layer: Esri ArcGIS World Imagery
    return this.getEsriSatelliteUrl(bbox, width, height);
  }
}

export const satelliteApiService = new SatelliteApiService();
