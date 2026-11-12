import React, { useState, useEffect } from 'react';
import { Eye, Layers, ShieldAlert, Sparkles, Sliders, ChevronDown, ChevronUp } from 'lucide-react';

export interface CloudSliderProps {
  map?: any; // MapLibre GL Map instance
  opticalUrl?: string;
  sarUrl?: string;
  fusedUrl?: string;
  bbox?: [number, number, number, number] | null; // [minLon, minLat, maxLon, maxLat]
  className?: string;
  theme?: 'light' | 'dark';
}

export const CloudSlider: React.FC<CloudSliderProps> = ({
  map,
  opticalUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=76.0,10.0,76.5,11.5&bboxSR=4326&size=1200,800&format=jpg&f=image',
  sarUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=76.0,10.0,76.5,11.5&bboxSR=4326&size=1200,800&format=jpg&f=image',
  fusedUrl,
  bbox = [76.0, 10.0, 76.5, 11.5],
  className = '',
  theme = 'dark'
}) => {
  const [mode, setMode] = useState<'Optical' | 'SAR' | 'Fused'>('Fused');
  const [sarOpacity, setSarOpacity] = useState<number>(75);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  // MapLibre Integration: Additive raster sources and layers
  useEffect(() => {
    if (!map) return;

    const setupLayers = () => {
      // Bounding box coordinates for MapLibre image source [top-left, top-right, bottom-right, bottom-left]
      const coordinates: [number, number][] = bbox && bbox.length === 4 ? [
        [bbox[0], bbox[3]], // top-left (minLon, maxLat)
        [bbox[2], bbox[3]], // top-right (maxLon, maxLat)
        [bbox[2], bbox[1]], // bottom-right (maxLon, minLat)
        [bbox[0], bbox[1]]  // bottom-left (minLon, minLat)
      ] : [
        [76.0, 11.5],
        [76.5, 11.5],
        [76.5, 10.0],
        [76.0, 10.0]
      ];

      try {
        // Add or Update Optical Source & Layer
        const optSource = map.getSource('cloudslider-optical-src') as any;
        if (optSource && typeof optSource.updateImage === 'function') {
          optSource.updateImage({ url: opticalUrl, coordinates });
        } else if (!optSource) {
          map.addSource('cloudslider-optical-src', {
            type: 'image',
            url: opticalUrl,
            coordinates
          });
        }

        if (!map.getLayer('cloudslider-optical-layer')) {
          map.addLayer({
            id: 'cloudslider-optical-layer',
            type: 'raster',
            source: 'cloudslider-optical-src',
            paint: { 'raster-opacity': 1 },
            layout: { visibility: 'visible' }
          });
        }

        // Add or Update SAR Source & Layer
        const sarSource = map.getSource('cloudslider-sar-src') as any;
        if (sarSource && typeof sarSource.updateImage === 'function') {
          sarSource.updateImage({ url: sarUrl, coordinates });
        } else if (!sarSource) {
          map.addSource('cloudslider-sar-src', {
            type: 'image',
            url: sarUrl,
            coordinates
          });
        }

        if (!map.getLayer('cloudslider-sar-layer')) {
          map.addLayer({
            id: 'cloudslider-sar-layer',
            type: 'raster',
            source: 'cloudslider-sar-src',
            paint: { 'raster-opacity': sarOpacity / 100 },
            layout: { visibility: 'visible' }
          });
        }

        // Optional Fused Source & Layer if provided
        if (fusedUrl) {
          const fusedSource = map.getSource('cloudslider-fused-src') as any;
          if (fusedSource && typeof fusedSource.updateImage === 'function') {
            fusedSource.updateImage({ url: fusedUrl, coordinates });
          } else if (!fusedSource) {
            map.addSource('cloudslider-fused-src', {
              type: 'image',
              url: fusedUrl,
              coordinates
            });
          }

          if (!map.getLayer('cloudslider-fused-layer')) {
            map.addLayer({
              id: 'cloudslider-fused-layer',
              type: 'raster',
              source: 'cloudslider-fused-src',
              paint: { 'raster-opacity': 1 },
              layout: { visibility: 'none' }
            });
          }
        }

        // Re-center map view onto the current scene's bounding box
        if (bbox && bbox.length === 4) {
          map.fitBounds(
            [
              [bbox[0], bbox[1]],
              [bbox[2], bbox[3]]
            ],
            { padding: 40, duration: 800 }
          );
        }
      } catch (err) {
        console.warn('MapLibre setupLayers notice:', err);
      }
    };

    if (map.isStyleLoaded()) {
      setupLayers();
    } else {
      map.once('load', setupLayers);
    }
  }, [map, opticalUrl, sarUrl, fusedUrl, bbox]);

  // Handle Layer Visibilities and Opacity Logic
  useEffect(() => {
    if (!map) return;

    try {
      const optLayer = map.getLayer('cloudslider-optical-layer');
      const sarLayer = map.getLayer('cloudslider-sar-layer');
      const fusedLayer = map.getLayer('cloudslider-fused-layer');

      if (mode === 'Optical') {
        if (optLayer) {
          map.setLayoutProperty('cloudslider-optical-layer', 'visibility', 'visible');
          map.setPaintProperty('cloudslider-optical-layer', 'raster-opacity', 1);
        }
        if (sarLayer) {
          map.setLayoutProperty('cloudslider-sar-layer', 'visibility', 'none');
        }
        if (fusedLayer) {
          map.setLayoutProperty('cloudslider-fused-layer', 'visibility', 'none');
        }
      } else if (mode === 'SAR') {
        if (optLayer) {
          map.setLayoutProperty('cloudslider-optical-layer', 'visibility', 'none');
        }
        if (sarLayer) {
          map.setLayoutProperty('cloudslider-sar-layer', 'visibility', 'visible');
          map.setPaintProperty('cloudslider-sar-layer', 'raster-opacity', 1);
        }
        if (fusedLayer) {
          map.setLayoutProperty('cloudslider-fused-layer', 'visibility', 'none');
        }
      } else if (mode === 'Fused') {
        if (optLayer) {
          map.setLayoutProperty('cloudslider-optical-layer', 'visibility', 'visible');
          map.setPaintProperty('cloudslider-optical-layer', 'raster-opacity', 1);
        }
        if (sarLayer) {
          map.setLayoutProperty('cloudslider-sar-layer', 'visibility', 'visible');
          map.setPaintProperty('cloudslider-sar-layer', 'raster-opacity', sarOpacity / 100);
        }
        if (fusedLayer) {
          map.setLayoutProperty('cloudslider-fused-layer', 'visibility', 'none');
        }
      }
    } catch (err) {
      console.warn('MapLibre CloudSlider layer update notice:', err);
    }
  }, [map, mode, sarOpacity]);

  return (
    <div
      className={`absolute bottom-6 left-6 z-30 w-80 p-4 rounded-2xl shadow-2xl backdrop-blur-xl transition-all duration-300 font-sans border ${
        theme === 'dark'
          ? 'bg-[#1C232E]/90 border-slate-300/20 text-[#F1F5F9]'
          : 'bg-[#F8FAFC]/95 border-slate-300 text-[#1C232E]'
      } ${className}`}
      style={{ fontFamily: 'var(--font-primary, sans-serif)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#FFB800]/20 pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#FFB800]/20 border border-[#FFB800]/40 flex items-center justify-center text-[#FFB800]">
            <Sparkles className="w-4 h-4 animate-pulse text-[#FFB800]" />
          </div>
          <div>
            <h4 className={`font-bold text-xs tracking-tight uppercase font-mono ${
              theme === 'dark' ? 'text-white' : 'text-[#1C232E]'
            }`}>
              See-Through-Cloud
            </h4>
            <p className="text-[10px] text-slate-400 font-sans">
              Optical-SAR Fusion Model
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#FFB800]/15 text-[#FFB800] border border-[#FFB800]/30 uppercase">
            CROSS-ATTN
          </span>
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand Floating Controls' : 'Collapse Controls'}
          >
            {isCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <>
          {/* 3-Way Segmented Control */}
          <div className="space-y-1.5 mb-3">
            <label className="text-[9px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
              MODALITY SELECTOR:
            </label>
            <div className="grid grid-cols-3 gap-1 bg-black/30 p-1 rounded-xl border border-[#374151]/50">
              {(['Optical', 'SAR', 'Fused'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-mono font-bold transition-all duration-200 cursor-pointer text-center ${
                    mode === m
                      ? 'gold-gradient-btn text-[#1C232E] shadow-md shadow-[#FFB800]/30 scale-[1.02]'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Range Slider for SAR Penetration */}
          <div className="space-y-2 pt-2 border-t border-[#374151]/40">
            <div className="flex justify-between items-center text-[10px] font-mono">
              <span className="text-slate-300 font-bold uppercase flex items-center gap-1">
                <Sliders className="w-3 h-3 text-[#FFB800]" />
                <span>Cloud Masking / Radar Fusion:</span>
              </span>
              <span className="font-bold text-[#FFB800] bg-[#FFB800]/15 px-2 py-0.5 rounded border border-[#FFB800]/30">
                {sarOpacity}%
              </span>
            </div>

            <div className="relative flex items-center">
              <input
                type="range"
                min="0"
                max="100"
                value={sarOpacity}
                onChange={(e) => setSarOpacity(parseInt(e.target.value))}
                disabled={mode !== 'Fused'}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#FFB800] disabled:opacity-40 disabled:cursor-not-allowed"
              />
            </div>

            <div className="flex justify-between text-[8px] font-mono text-slate-400 pt-0.5">
              <span>0% (Cloud Cover)</span>
              <span className="text-[#FFB800] font-bold">Melt Cloud Layers</span>
              <span>100% (Radar Ground)</span>
            </div>
          </div>

          {/* Status indicator badge */}
          <div className="mt-3 p-2 rounded-xl bg-[#232B38] border border-[#374151]/60 text-white text-[9px] font-mono flex items-center gap-2 shadow-inner">
            <div className="w-2 h-2 rounded-full bg-[#FFB800] animate-ping shrink-0" />
            <span className="truncate text-slate-300">
              {mode === 'Fused'
                ? `Cloud melting active at ${sarOpacity}% fusion depth`
                : mode === 'Optical'
                ? 'Displaying standard optical cloud cover'
                : 'Displaying microwave SAR ground backscatter'}
            </span>
          </div>
        </>
      )}
    </div>
  );
};

export default CloudSlider;

