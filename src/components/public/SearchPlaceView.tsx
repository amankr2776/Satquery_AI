import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Globe, ChevronRight, Sparkles, Pencil, MousePointer, Trash2, Layers, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { PRELOADED_SCENES } from './ImageSelectorModal';
import { SystemCoordinateMetadata } from '../../types/chat';
import { useMapHighlightStore } from '../../store/useMapHighlightStore';
import { motion, AnimatePresence } from 'motion/react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface SearchPlaceViewProps {
  onSelectScene: (
    imageUrl: string,
    title: string,
    prompt: string,
    systemMetadata?: SystemCoordinateMetadata
  ) => void;
  isActive?: boolean;
}

interface GeocodingResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  boundingbox?: [string, string, string, string];
  type?: string;
}

const KARNATAKA_QUICK_CHIPS = [
  { name: 'Bengaluru Urban', lat: 12.9716, lng: 77.5946, zoom: 12 },
  { name: 'Mysuru District', lat: 12.2958, lng: 76.6394, zoom: 11 },
  { name: 'Kodagu (Coorg)', lat: 12.4244, lng: 75.7382, zoom: 11 },
  { name: 'Hassan District', lat: 13.0033, lng: 76.1004, zoom: 11 },
  { name: 'Wayanad Border', lat: 11.6854, lng: 76.1320, zoom: 11 },
  { name: 'Belagavi Region', lat: 15.8497, lng: 74.4977, zoom: 11 },
  { name: 'Shivamogga Valley', lat: 13.9299, lng: 75.5681, zoom: 11 },
  { name: 'Coastal Mangaluru', lat: 12.9141, lng: 74.8560, zoom: 12 },
];

const RASTER_MAP_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    'osm-tiles': {
      type: 'raster',
      tiles: [
        'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
    'esri-satellite': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{x}/{y}',
      ],
      tileSize: 256,
      attribution: 'Tiles &copy; Esri',
    },
  },
  layers: [
    {
      id: 'osm-tiles-layer',
      type: 'raster',
      source: 'osm-tiles',
      minzoom: 0,
      maxzoom: 19,
    },
    {
      id: 'esri-satellite-layer',
      type: 'raster',
      source: 'esri-satellite',
      minzoom: 0,
      maxzoom: 19,
      layout: {
        visibility: 'none',
      },
    },
  ],
};

export const SearchPlaceView: React.FC<SearchPlaceViewProps> = ({ onSelectScene, isActive }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPlaceName, setSelectedPlaceName] = useState('Kerala & Karnataka Region');
  const [selectedCoords, setSelectedCoords] = useState<[number, number] | null>([76.2711, 10.8505]);
  const [activeBasemap, setActiveBasemap] = useState<'street' | 'satellite'>('street');

  // Drawing state
  const [drawMode, setDrawMode] = useState<'pan' | 'mark'>('pan');
  const [polygonPoints, setPolygonPoints] = useState<[number, number][]>([]);
  const [selectedScene, setSelectedScene] = useState(PRELOADED_SCENES[0]);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const searchedMarkerRef = useRef<maplibregl.Marker | null>(null);

  // Map Highlight Zustand Store
  const { activeMaskId, activeBounds, activeMaskData, setActiveMaskId } = useMapHighlightStore();

  // Switch map basemap layers
  const toggleBasemap = (mode: 'street' | 'satellite') => {
    setActiveBasemap(mode);
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    if (mode === 'satellite') {
      if (map.getLayer('esri-satellite-layer')) map.setLayoutProperty('esri-satellite-layer', 'visibility', 'visible');
      if (map.getLayer('osm-tiles-layer')) map.setLayoutProperty('osm-tiles-layer', 'visibility', 'none');
    } else {
      if (map.getLayer('osm-tiles-layer')) map.setLayoutProperty('osm-tiles-layer', 'visibility', 'visible');
      if (map.getLayer('esri-satellite-layer')) map.setLayoutProperty('esri-satellite-layer', 'visibility', 'none');
    }
  };

  // Initialize MapLibre GL Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: RASTER_MAP_STYLE,
      center: [76.2711, 10.8505], // Default regional center
      zoom: 6,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');
    mapRef.current = map;

    // Resize observer to ensure map canvas fills container on flex layout changes
    const resizeObserver = new ResizeObserver(() => {
      map.resize();
    });
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    // Schedule incremental resizes as DOM layout settles
    const resizeTimeouts = [50, 200, 500, 1000, 2000].map((delay) =>
      setTimeout(() => {
        if (mapRef.current) mapRef.current.resize();
      }, delay)
    );

    map.on('load', () => {
      map.resize();

      // Add source for drawn polygon & markers
      map.addSource('drawn-polygon-source', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      });

      // Add fill layer
      map.addLayer({
        id: 'drawn-polygon-fill',
        type: 'fill',
        source: 'drawn-polygon-source',
        filter: ['==', '$type', 'Polygon'],
        paint: {
          'fill-color': '#FF8C00',
          'fill-opacity': 0.25,
        },
      });

      // Add outline layer
      map.addLayer({
        id: 'drawn-polygon-stroke',
        type: 'line',
        source: 'drawn-polygon-source',
        filter: ['in', '$type', 'Polygon', 'LineString'],
        paint: {
          'line-color': '#FF8C00',
          'line-width': 3,
          'line-dasharray': [2, 1],
        },
      });

      // Add preloaded scene pins
      PRELOADED_SCENES.forEach((scene) => {
        let coords: [number, number] = [76.2711, 10.8505];
        if (scene.id === 'kerala-flood') coords = [76.27, 10.85];
        if (scene.id === 'wayanad-landslide') coords = [76.25, 11.55];
        if (scene.id === 'punjab-stubble') coords = [75.8573, 30.9010];
        if (scene.id === 'valencia-mudflow') coords = [-0.3763, 39.4699];
        if (scene.id === 'amazon-logging') coords = [-52.3333, -3.4168];
        if (scene.id === 'mumbai-urban') coords = [72.8777, 19.0760];
        if (scene.id === 'sundarbans-mangrove') coords = [89.1833, 21.9497];
        if (scene.id === 'himalayan-glacial') coords = [88.2512, 27.7542];

        const el = document.createElement('div');
        el.className = 'w-7 h-7 bg-[#FF8C00] text-white rounded-full flex items-center justify-center font-bold text-xs shadow-md border-2 border-white cursor-pointer hover:scale-125 transition-transform';
        el.innerHTML = '📍';

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat(coords)
          .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML(`<strong style="font-family: Calibri;">${scene.title}</strong><p style="font-size:11px;">${scene.location}</p>`))
          .addTo(map);

        el.addEventListener('click', () => {
          setSelectedScene(scene);
        });
      });
    });

    return () => {
      resizeObserver.disconnect();
      resizeTimeouts.forEach(clearTimeout);
      map.remove();
    };
  }, []);

  // Trigger resize when visibility changes via isActive prop
  useEffect(() => {
    if (isActive && mapRef.current) {
      setTimeout(() => {
        if (mapRef.current) mapRef.current.resize();
      }, 100);
      setTimeout(() => {
        if (mapRef.current) mapRef.current.resize();
      }, 500);
    }
  }, [isActive]);

  // SAM 2 Mask Highlight Effect
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const applyMaskHighlight = () => {
      if (!map.isStyleLoaded()) return;

      if (!map.getSource('sam2-evidence-source')) {
        map.addSource('sam2-evidence-source', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
        });

        map.addLayer({
          id: 'sam2-evidence-fill',
          type: 'fill',
          source: 'sam2-evidence-source',
          paint: {
            'fill-color': '#FF8C00', // Marigold
            'fill-opacity': 0.8,     // 80% opacity
          },
        });

        map.addLayer({
          id: 'sam2-evidence-stroke',
          type: 'line',
          source: 'sam2-evidence-source',
          paint: {
            'line-color': '#2A1B2E', // Deep Aubergine
            'line-width': 3.5,
          },
        });
      }

      const source = map.getSource('sam2-evidence-source') as maplibregl.GeoJSONSource;
      if (!source) return;

      if (activeMaskId) {
        // Set paint properties to Marigold (#FF8C00 with 80% opacity) and Deep Aubergine line
        map.setPaintProperty('sam2-evidence-fill', 'fill-color', '#FF8C00');
        map.setPaintProperty('sam2-evidence-fill', 'fill-opacity', 0.8);
        map.setPaintProperty('sam2-evidence-stroke', 'line-color', '#2A1B2E');

        const bounds = activeBounds || [75.6, 11.5, 76.5, 12.8];
        const polygonFeature = {
          type: 'Feature' as const,
          properties: { maskId: activeMaskId },
          geometry: {
            type: 'Polygon' as const,
            coordinates: [[
              [bounds[0], bounds[1]],
              [bounds[2], bounds[1]],
              [bounds[2], bounds[3]],
              [bounds[0], bounds[3]],
              [bounds[0], bounds[1]],
            ]],
          },
        };

        source.setData({
          type: 'FeatureCollection',
          features: [polygonFeature],
        });

        map.fitBounds(
          [[bounds[0], bounds[1]], [bounds[2], bounds[3]]],
          { padding: 80, maxZoom: 13, duration: 1200 }
        );
      } else {
        // Deselect & reset mask features
        source.setData({
          type: 'FeatureCollection',
          features: [],
        });
      }
    };

    if (map.isStyleLoaded()) {
      applyMaskHighlight();
    } else {
      map.once('load', applyMaskHighlight);
    }
  }, [activeMaskId, activeBounds]);

  // Handle map click events when in 'mark' draw mode
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handleMapClick = (e: maplibregl.MapMouseEvent) => {
      if (drawMode !== 'mark') return;
      const newPt: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      setPolygonPoints((prev) => [...prev, newPt]);
    };

    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [drawMode]);

  // Sync polygon render & DOM markers on map whenever polygonPoints change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    // Clear existing point markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Render DOM markers for each point (1, 2, 3...)
    polygonPoints.forEach((pt, idx) => {
      const el = document.createElement('div');
      el.className = 'w-6 h-6 bg-[#2A1B2E] text-[#FF8C00] font-extrabold text-xs rounded-full flex items-center justify-center border-2 border-[#FF8C00] shadow-lg animate-bounce';
      el.innerText = `${idx + 1}`;

      const marker = new maplibregl.Marker({ element: el }).setLngLat(pt).addTo(map);
      markersRef.current.push(marker);
    });

    // Update GeoJSON source
    const source = map.getSource('drawn-polygon-source') as maplibregl.GeoJSONSource;
    if (source) {
      const features: any[] = [];
      if (polygonPoints.length >= 3) {
        features.push({
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [[...polygonPoints, polygonPoints[0]]],
          },
        });
      } else if (polygonPoints.length === 2) {
        features.push({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: polygonPoints,
          },
        });
      }

      source.setData({
        type: 'FeatureCollection',
        features,
      });
    }
  }, [polygonPoints]);

  // Real-time Geocoding Search via Server Multi-Source API
  const handlePerformSearch = async (queryText: string) => {
    if (!queryText.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const response = await fetch(`/api/geocode?q=${encodeURIComponent(queryText)}`);
      const data = await response.json();
      if (data && Array.isArray(data.results)) {
        setSearchResults(data.results);
      }
    } catch (e) {
      console.warn('Geocoding search failed:', e);
    } finally {
      setIsSearching(false);
    }
  };

  // Helper to place marker on searched location
  const placeSearchedLocationMarker = (placeName: string, lat: number, lon: number) => {
    setSelectedPlaceName(placeName);
    setSelectedCoords([lon, lat]);

    const map = mapRef.current;
    if (!map) return;

    map.flyTo({
      center: [lon, lat],
      zoom: 12,
      essential: true,
      duration: 1500,
    });

    if (searchedMarkerRef.current) {
      searchedMarkerRef.current.remove();
      searchedMarkerRef.current = null;
    }

    const el = document.createElement('div');
    el.className = 'w-9 h-9 bg-[#2A1B2E] text-[#FF8C00] rounded-full flex items-center justify-center font-extrabold text-sm shadow-2xl border-2 border-[#FF8C00] cursor-pointer animate-pulse z-30';
    el.innerHTML = '📍';

    const marker = new maplibregl.Marker({ element: el })
      .setLngLat([lon, lat])
      .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML(`<strong style="font-family: Calibri; color: #2A1B2E;">📍 ${placeName}</strong><p style="font-size:11px; margin-top:2px;">Lat ${lat.toFixed(4)}° N, Lon ${lon.toFixed(4)}° E</p>`))
      .addTo(map);

    marker.togglePopup();
    searchedMarkerRef.current = marker;
  };

  // Fly to selected place result
  const handleSelectPlaceResult = (result: GeocodingResult) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    const shortName = result.display_name.split(',')[0];
    placeSearchedLocationMarker(shortName, lat, lon);
    setSearchResults([]);
  };

  // Fly to quick Karnataka chip
  const handleSelectChip = (chip: typeof KARNATAKA_QUICK_CHIPS[0]) => {
    placeSearchedLocationMarker(chip.name, chip.lat, chip.lng);
  };

  // Trigger AI Analysis for Searched Location
  const handleAnalyzeSearchedLocation = () => {
    if (!selectedCoords) return;
    const [lon, lat] = selectedCoords;
    const prompt = `Analyze satellite imagery for searched region **${selectedPlaceName}**:\n` +
      `📍 **Region Name**: ${selectedPlaceName}\n` +
      `🌐 **Coordinates**: Latitude ${lat.toFixed(4)}° N, Longitude ${lon.toFixed(4)}° E\n` +
      `📐 **Bounding Box (BBOX)**: [${(lat - 0.05).toFixed(4)}° N, ${(lon - 0.05).toFixed(4)}° E] to [${(lat + 0.05).toFixed(4)}° N, ${(lon + 0.05).toFixed(4)}° E]\n\n` +
      `Please analyze the satellite scene for ${selectedPlaceName}. Provide land cover distribution, vegetation health, flood or water risk, and ground infrastructure insights specifically for this area.`;

    const systemMetadata: SystemCoordinateMetadata = {
      regionName: selectedPlaceName,
      centroidLat: lat.toFixed(4),
      centroidLng: lon.toFixed(4),
      bbox: [
        Number((lat - 0.05).toFixed(4)),
        Number((lon - 0.05).toFixed(4)),
        Number((lat + 0.05).toFixed(4)),
        Number((lon + 0.05).toFixed(4)),
      ],
      areaHectares: 2500,
      verticesCount: 4,
    };

    const sceneImg = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=' +
      `${(lon - 0.08).toFixed(4)},${(lat - 0.08).toFixed(4)},${(lon + 0.08).toFixed(4)},${(lat + 0.08).toFixed(4)}&bboxSR=4326&size=1200,800&format=jpg&f=image`;

    onSelectScene(sceneImg, selectedPlaceName, prompt, systemMetadata);
  };

  // Calculate polygon surface area in Hectares
  const calculateAreaHectares = (): number => {
    if (polygonPoints.length < 3) return 0;
    const avgLat = polygonPoints.reduce((sum, p) => sum + p[1], 0) / polygonPoints.length;
    const latToMeters = 111320;
    const lngToMeters = 111320 * Math.cos((avgLat * Math.PI) / 180);

    let areaMeters = 0;
    for (let i = 0; i < polygonPoints.length; i++) {
      const j = (i + 1) % polygonPoints.length;
      const x1 = polygonPoints[i][0] * lngToMeters;
      const y1 = polygonPoints[i][1] * latToMeters;
      const x2 = polygonPoints[j][0] * lngToMeters;
      const y2 = polygonPoints[j][1] * latToMeters;
      areaMeters += x1 * y2 - x2 * y1;
    }
    areaMeters = Math.abs(areaMeters) / 2;
    return Number((areaMeters / 10000).toFixed(2));
  };

  // Calculate BBOX
  const calculateBBox = (): [number, number, number, number] => {
    if (polygonPoints.length === 0) return [76.0, 10.0, 76.5, 11.5];
    const lngs = polygonPoints.map((p) => p[0]);
    const lats = polygonPoints.map((p) => p[1]);
    return [
      Math.min(...lngs),
      Math.min(...lats),
      Math.max(...lngs),
      Math.max(...lats),
    ];
  };

  // Trigger AI Analysis for Drawn Region
  const handleAnalyzeDrawnRegion = () => {
    const bbox = calculateBBox();
    const areaHa = calculateAreaHectares();
    const centerLng = ((bbox[0] + bbox[2]) / 2).toFixed(4);
    const centerLat = ((bbox[1] + bbox[3]) / 2).toFixed(4);

    // Optimized high-resolution satellite tile image URL (size=800,500 for fast download)
    const imageUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=${bbox[0]},${bbox[1]},${bbox[2]},${bbox[3]}&bboxSR=4326&size=800,500&format=jpg&f=image`;

    const title = `Drawn Boundary: ${selectedPlaceName}`;
    const prompt = `Analyze satellite imagery for drawn boundary in **${selectedPlaceName}**:\n` +
      `📍 **Region**: ${selectedPlaceName}\n` +
      `🌐 **Centroid Coordinates**: Latitude ${centerLat}° N, Longitude ${centerLng}° E\n` +
      `📐 **Bounding Box (BBOX)**: [${bbox[1].toFixed(4)}° N, ${bbox[0].toFixed(4)}° E] to [${bbox[3].toFixed(4)}° N, ${bbox[2].toFixed(4)}° E]\n` +
      `🗺️ **Total Surface Area**: ${areaHa} Hectares (${(areaHa / 100).toFixed(2)} km²)\n` +
      `📌 **Boundary Vertices**: ${polygonPoints.length} points marked on map\n\n` +
      `Please provide a complete satellite image analysis including land cover breakdown, vegetation health, flood/water risk, and key ground insights.`;

    const systemMetadata: SystemCoordinateMetadata = {
      regionName: selectedPlaceName,
      centroidLat: centerLat,
      centroidLng: centerLng,
      bbox: [
        Number(bbox[1].toFixed(4)),
        Number(bbox[0].toFixed(4)),
        Number(bbox[3].toFixed(4)),
        Number(bbox[2].toFixed(4)),
      ],
      areaHectares: areaHa,
      verticesCount: polygonPoints.length,
    };

    onSelectScene(imageUrl, title, prompt, systemMetadata);
  };

  const areaHa = calculateAreaHectares();

  return (
    <div 
      className="flex-1 h-full flex flex-col md:flex-row overflow-hidden bg-[#F3F4F1] text-[#2A1B2E]"
      style={{ fontFamily: 'Calibri, system-ui, sans-serif' }}
    >
      {/* Left Region & Tool Sidebar */}
      <div className="w-full md:w-96 bg-white border-r border-slate-200 flex flex-col h-full overflow-hidden shrink-0 shadow-xs z-10">
        {/* Search Header */}
        <div className="p-4 border-b border-slate-200 space-y-3 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#FF8C00]" />
              <h2 className="text-base font-bold text-[#2A1B2E]">Search & Draw Region</h2>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-100 text-[#FF8C00]">
              Karnataka & Global
            </span>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                handlePerformSearch(e.target.value);
              }}
              placeholder="Search district, block, or village (e.g. Mysuru, Kodagu, Hassan)..."
              className="w-full pl-9 pr-8 py-2 bg-[#F3F4F1] border border-slate-200 rounded-xl text-xs text-[#2A1B2E] placeholder:text-slate-400 focus:outline-none focus:border-[#FF8C00]"
            />
            {isSearching && (
              <div className="w-4 h-4 border-2 border-[#FF8C00] border-t-transparent rounded-full animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
            )}
          </div>

          {/* Search Suggestions Dropdown */}
          {searchResults.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto space-y-1 p-1">
              {searchResults.map((res, idx) => (
                <div
                  key={`${res.place_id}-${idx}-${res.lat}-${res.lon}`}
                  onClick={() => handleSelectPlaceResult(res)}
                  className="p-2 hover:bg-amber-50 rounded-lg cursor-pointer text-xs transition-colors flex items-center gap-2"
                >
                  <MapPin className="w-3.5 h-3.5 text-[#FF8C00] shrink-0" />
                  <span className="truncate font-medium text-[#2A1B2E]">{res.display_name}</span>
                </div>
              ))}
            </div>
          )}

          {/* Karnataka Quick Chips */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Karnataka Quick Places</span>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {KARNATAKA_QUICK_CHIPS.map((chip) => (
                <button
                  key={chip.name}
                  onClick={() => handleSelectChip(chip)}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-[#F3F4F1] hover:bg-amber-100 hover:text-[#FF8C00] text-slate-700 transition-colors border border-slate-200 cursor-pointer"
                >
                  📍 {chip.name}
                </button>
              ))}
            </div>

            {/* Analyze Searched Location Button */}
            {selectedCoords && (
              <button
                onClick={handleAnalyzeSearchedLocation}
                className="w-full mt-2 py-2 px-3 bg-[#FF8C00] hover:bg-[#e07b00] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01]"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Analyze Searched Place ({selectedPlaceName})</span>
              </button>
            )}
          </div>
        </div>

        {/* Draw Boundary Control Tools */}
        <div className="p-4 border-b border-slate-200 bg-[#F3F4F1]/60 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#2A1B2E]">Draw Boundary Tool</span>
            <span className="text-[10px] text-slate-500 font-medium">Click 3+ points on map</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setDrawMode('pan')}
              className={`py-2 px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                drawMode === 'pan'
                  ? 'bg-white text-[#2A1B2E] border-slate-300 shadow-xs'
                  : 'bg-white/50 text-slate-600 border-slate-200 hover:bg-white'
              }`}
            >
              <MousePointer className="w-3.5 h-3.5 text-slate-500" />
              <span>Pan Map</span>
            </button>

            <button
              onClick={() => setDrawMode('mark')}
              className={`py-2 px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                drawMode === 'mark'
                  ? 'bg-[#FF8C00] text-white border-[#FF8C00] shadow-xs'
                  : 'bg-white text-[#2A1B2E] border-slate-200 hover:border-[#FF8C00]'
              }`}
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Mark Points</span>
            </button>

            <button
              onClick={() => {
                setPolygonPoints([]);
                setDrawMode('pan');
              }}
              disabled={polygonPoints.length === 0}
              className="py-2 px-2 rounded-xl font-bold text-xs bg-white text-rose-600 border border-slate-200 hover:bg-rose-50 disabled:opacity-40 transition-all cursor-pointer flex items-center justify-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>

          {/* Polygon Status Card */}
          {polygonPoints.length > 0 && (
            <div className="p-3 bg-white rounded-xl border border-amber-200 shadow-xs space-y-2 animate-fade-in">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#2A1B2E]">Marked Points:</span>
                <span className="font-extrabold text-[#FF8C00] px-2 py-0.5 rounded bg-amber-50 border border-amber-200">
                  {polygonPoints.length} Vertices
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#2A1B2E]">Surface Area:</span>
                <span className="font-extrabold text-[#2A1B2E]">
                  {areaHa > 0 ? `${areaHa} ha (${(areaHa / 100).toFixed(2)} km²)` : 'Add 3+ points'}
                </span>
              </div>

              {polygonPoints.length >= 3 ? (
                <button
                  onClick={handleAnalyzeDrawnRegion}
                  className="w-full mt-2 py-2.5 px-4 bg-[#FF8C00] hover:bg-[#e07b00] text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Analyze Drawn Boundary</span>
                </button>
              ) : (
                <p className="text-[11px] text-amber-700 font-medium flex items-center gap-1 pt-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Click {3 - polygonPoints.length} more point(s) on the map to close boundary polygon.</span>
                </p>
              )}
            </div>
          )}
        </div>

        {/* Featured Preloaded Scenes */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-1">
            Global High-Res Scenes
          </span>
          {PRELOADED_SCENES.map((scene) => (
            <div
              key={scene.id}
              onClick={() => {
                setSelectedScene(scene);
                onSelectScene(scene.imageUrl, scene.title, scene.defaultPrompt);
              }}
              className="p-3 bg-[#F3F4F1]/60 hover:bg-amber-50/50 border border-slate-200 hover:border-[#FF8C00] rounded-xl cursor-pointer transition-all flex items-start gap-3 group"
            >
              <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-slate-200 border border-slate-300">
                <img src={scene.imageUrl} alt={scene.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold text-[#FF8C00] uppercase tracking-wider block">{scene.category}</span>
                <h4 className="font-bold text-xs text-[#2A1B2E] truncate group-hover:text-[#FF8C00] transition-colors">{scene.title}</h4>
                <span className="text-[11px] text-slate-500 block truncate mt-0.5">{scene.location}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#FF8C00] self-center shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* Right Map Viewport */}
      <div className={`flex-1 h-full min-h-[500px] md:min-h-full relative transition-all duration-300 ${activeMaskId ? 'ring-4 ring-[#FF8C00]/60 ring-inset' : ''}`}>
        <div ref={mapContainerRef} className="w-full h-full min-h-[500px]" style={{ minHeight: '500px', width: '100%', height: '100%' }} />

        {/* Floating Basemap Switcher */}
        <div className="absolute top-4 right-14 bg-white/90 backdrop-blur-sm p-1 rounded-xl shadow-md border border-slate-200 flex items-center gap-1 z-10">
          <button
            onClick={() => toggleBasemap('street')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              activeBasemap === 'street'
                ? 'bg-[#FF8C00] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            🗺️ Street
          </button>
          <button
            onClick={() => toggleBasemap('satellite')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              activeBasemap === 'satellite'
                ? 'bg-[#FF8C00] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            🛰️ Satellite
          </button>
        </div>

        {/* SAM 2 Evidence Receipt Pulse Animation Overlay */}
        <AnimatePresence>
          {activeMaskId && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: [1, 1.02, 1] }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{
                scale: { repeat: Infinity, duration: 2, ease: "easeInOut" },
                opacity: { duration: 0.3 }
              }}
              className="absolute top-4 left-4 bg-[#2A1B2E] text-white px-4 py-2.5 rounded-2xl shadow-2xl border-2 border-[#FF8C00] text-xs font-bold flex items-center gap-3 z-20"
            >
              <div className="relative flex items-center justify-center">
                <span className="w-3 h-3 rounded-full bg-[#FF8C00] animate-ping absolute" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF8C00] relative" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase text-amber-400 tracking-wider font-extrabold">SAM 2 Evidence Receipt Active</span>
                <span className="text-white text-xs truncate max-w-xs">{activeMaskData?.label || activeMaskId}</span>
              </div>
              <button
                onClick={() => setActiveMaskId(null)}
                title="Deselect evidence highlight"
                className="ml-2 p-1 hover:bg-white/20 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Draw Mode Instruction Floating Badge */}
        {drawMode === 'mark' && !activeMaskId && (
          <div className="absolute top-4 left-4 bg-[#2A1B2E] text-white px-4 py-2 rounded-xl shadow-lg border border-[#FF8C00] text-xs font-bold flex items-center gap-2 z-10 animate-pulse">
            <Pencil className="w-4 h-4 text-[#FF8C00]" />
            <span>Marking Mode Active: Click map to place boundary points ({polygonPoints.length} placed)</span>
          </div>
        )}

        {/* Selected Scene Float Bar */}
        {selectedScene && (
          <div className="absolute bottom-6 left-6 right-6 max-w-xl mx-auto bg-white/95 backdrop-blur-md border border-slate-300 p-4 rounded-2xl shadow-xl flex items-center justify-between gap-4 z-10">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-slate-200">
                <img src={selectedScene.imageUrl} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-sm text-[#2A1B2E] truncate">{selectedScene.title}</h3>
                <span className="text-xs text-slate-500 font-medium block truncate">{selectedScene.location}</span>
              </div>
            </div>
            <button
              onClick={() => onSelectScene(selectedScene.imageUrl, selectedScene.title, selectedScene.defaultPrompt)}
              className="px-4 py-2.5 bg-[#FF8C00] hover:bg-[#e07b00] text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Analyze Scene</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPlaceView;
