import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Play, Pause, RotateCcw, Sliders, Layers, Sparkles } from 'lucide-react';

export interface MapLibreCompareProps {
  preEventUrl: string;
  postEventUrl: string;
  preEventTitle?: string;
  postEventTitle?: string;
  bbox?: [number, number, number, number];
  center?: [number, number]; // [lat, lon]
  zoom?: number;
  theme?: 'dark' | 'light';
  className?: string;
  onSliderChange?: (pos: number) => void;
}

export const MapLibreCompare: React.FC<MapLibreCompareProps> = ({
  preEventUrl,
  postEventUrl,
  preEventTitle = 'Pre-Event Baseline',
  postEventTitle = 'Post-Event Impact',
  bbox = [76.0, 10.0, 76.5, 11.5],
  center = [10.8505, 76.2711],
  zoom = 11.5,
  theme = 'dark',
  className = '',
  onSliderChange
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const beforeContainerRef = useRef<HTMLDivElement>(null);
  const afterContainerRef = useRef<HTMLDivElement>(null);

  const beforeMapRef = useRef<maplibregl.Map | null>(null);
  const afterMapRef = useRef<maplibregl.Map | null>(null);

  const [sliderPos, setSliderPos] = useState<number>(50);

  const onSliderChangeRef = useRef(onSliderChange);
  useEffect(() => {
    onSliderChangeRef.current = onSliderChange;
  }, [onSliderChange]);

  useEffect(() => {
    if (onSliderChangeRef.current) {
      onSliderChangeRef.current(sliderPos);
    }
  }, [sliderPos]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1); // 0.5, 1, 2
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const animationFrameRef = useRef<number | null>(null);
  const directionRef = useRef<'forward' | 'backward'>('forward');
  const isSyncingRef = useRef<boolean>(false);

  // Initialize Dual Synchronized MapLibre Instances
  useEffect(() => {
    if (!beforeContainerRef.current || !afterContainerRef.current) return;

    const baseStyle = {
      version: 8,
      sources: {
        'osm-tiles': {
          type: 'raster',
          tiles: ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution: 'Map data © OpenStreetMap contributors'
        },
        'esri-satellite': {
          type: 'raster',
          tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{x}/{y}'],
          tileSize: 256,
          attribution: 'Tiles &copy; Esri'
        }
      },
      layers: [
        {
          id: 'osm-layer',
          type: 'raster',
          source: 'osm-tiles',
          minzoom: 0,
          maxzoom: 8,
          paint: {
            'raster-opacity': theme === 'dark' ? 0.25 : 0.65
          }
        },
        {
          id: 'satellite-base',
          type: 'raster',
          source: 'esri-satellite',
          minzoom: 0,
          maxzoom: 20
        }
      ]
    };

    const initialCenter: [number, number] = [center[1], center[0]]; // [lon, lat]

    // Create Before Map (Pre-Event)
    const beforeMap = new maplibregl.Map({
      container: beforeContainerRef.current,
      style: baseStyle as any,
      center: initialCenter,
      zoom: zoom,
      attributionControl: false
    });

    // Create After Map (Post-Event)
    const afterMap = new maplibregl.Map({
      container: afterContainerRef.current,
      style: baseStyle as any,
      center: initialCenter,
      zoom: zoom,
      attributionControl: false
    });

    beforeMapRef.current = beforeMap;
    afterMapRef.current = afterMap;

    // Synchronize Camera Movement between maps
    const syncMaps = (sourceMap: maplibregl.Map, targetMap: maplibregl.Map) => {
      if (isSyncingRef.current) return;
      isSyncingRef.current = true;
      targetMap.jumpTo({
        center: sourceMap.getCenter(),
        zoom: sourceMap.getZoom(),
        bearing: sourceMap.getBearing(),
        pitch: sourceMap.getPitch()
      });
      isSyncingRef.current = false;
    };

    beforeMap.on('move', () => syncMaps(beforeMap, afterMap));
    afterMap.on('move', () => syncMaps(afterMap, beforeMap));

    // Load High-Res Image Overlay on Before Map
    beforeMap.on('load', () => {
      if (preEventUrl) {
        const coordinates: [[number, number], [number, number], [number, number], [number, number]] = [
          [bbox[0], bbox[3]], // top-left (minLon, maxLat)
          [bbox[2], bbox[3]], // top-right (maxLon, maxLat)
          [bbox[2], bbox[1]], // bottom-right (maxLon, minLat)
          [bbox[0], bbox[1]]  // bottom-left (minLon, minLat)
        ];

        beforeMap.addSource('pre-event-src', {
          type: 'image',
          url: preEventUrl,
          coordinates
        });

        beforeMap.addLayer({
          id: 'pre-event-layer',
          type: 'raster',
          source: 'pre-event-src',
          paint: { 'raster-opacity': 0.9 }
        });
      }
    });

    // Load High-Res Image Overlay on After Map
    afterMap.on('load', () => {
      if (postEventUrl) {
        const coordinates: [[number, number], [number, number], [number, number], [number, number]] = [
          [bbox[0], bbox[3]], // top-left
          [bbox[2], bbox[3]], // top-right
          [bbox[2], bbox[1]], // bottom-right
          [bbox[0], bbox[1]]  // bottom-left
        ];

        afterMap.addSource('post-event-src', {
          type: 'image',
          url: postEventUrl,
          coordinates
        });

        afterMap.addLayer({
          id: 'post-event-layer',
          type: 'raster',
          source: 'post-event-src',
          paint: { 'raster-opacity': 0.9 }
        });
      }
    });

    return () => {
      beforeMap.remove();
      afterMap.remove();
      beforeMapRef.current = null;
      afterMapRef.current = null;
    };
  }, [preEventUrl, postEventUrl, theme]);

  // Handle Dragging Slider
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setIsPlaying(false); // Pause auto-scrubber on manual interaction
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setSliderPos(percentage);
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Timeline Scrubber Animation Loop using requestAnimationFrame
  useEffect(() => {
    if (!isPlaying) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    let lastTime = performance.now();

    const animate = (now: number) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      const step = 20 * speed * delta; // 20% per second at 1x speed

      setSliderPos((prev) => {
        let next = prev;
        if (directionRef.current === 'forward') {
          next = prev + step;
          if (next >= 100) {
            next = 100;
            directionRef.current = 'backward';
          }
        } else {
          next = prev - step;
          if (next <= 0) {
            next = 0;
            directionRef.current = 'forward';
          }
        }
        return next;
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isPlaying, speed]);

  return (
    <div className={`space-y-3 font-sans ${className}`}>
      {/* Compare Map View Container */}
      <div
        ref={containerRef}
        className="relative h-[480px] w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl select-none"
      >
        {/* Map 1: Before Map (Pre-Event) */}
        <div
          ref={beforeContainerRef}
          className="absolute inset-0 w-full h-full"
        />

        {/* Map 2: After Map (Post-Event - Clipped by Slider) */}
        <div
          ref={afterContainerRef}
          className="absolute inset-0 w-full h-full"
          style={{
            clipPath: `polygon(${sliderPos}% 0, 100% 0, 100% 100%, ${sliderPos}% 100%)`
          }}
        />

        {/* Floating Badges */}
        <div className="absolute top-4 left-4 bg-[#130A1D]/90 border border-emerald-500/40 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold text-emerald-400 z-20 shadow-lg">
          PRE-EVENT: {preEventTitle}
        </div>

        <div className="absolute top-4 right-4 bg-[#130A1D]/90 border border-cyan-500/40 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold text-cyan-400 z-20 shadow-lg">
          POST-EVENT: {postEventTitle}
        </div>

        {/* Divider Slider Handle Line */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-teal-400 z-30 cursor-ew-resize shadow-[0_0_12px_rgba(45,212,191,0.8)]"
          style={{ left: `${sliderPos}%` }}
          onMouseDown={handleMouseDown}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[#130A1D] border-2 border-teal-400 flex items-center justify-center text-teal-400 shadow-2xl hover:scale-110 transition-transform cursor-ew-resize">
            <Sliders className="w-4 h-4 rotate-90" />
          </div>
        </div>

        {/* Swipe Instruction Badge */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 px-5 py-2.5 rounded-2xl shadow-2xl flex items-center gap-3">
           <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
           <span className="text-[10px] font-mono font-bold text-white uppercase tracking-widest whitespace-nowrap">
             SWIPE TO COMPARE: PRE-EVENT (LEFT) vs POST-EVENT (RIGHT)
           </span>
        </div>
      </div>

      {/* Timeline Scrubber & Animation Controls Bar */}
      <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs ${
        theme === 'dark' ? 'bg-[#1C0F2B] border-slate-300/15 text-slate-200' : 'bg-white border-slate-200 shadow-md text-slate-800'
      }`}>
        {/* Play/Pause Scrubber Controls */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-4 py-2 rounded-xl marigold-gradient-btn text-[#130A1D] font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md transition-all hover:brightness-110 shrink-0"
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>Pause Scrubber</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Auto-Swipe Play</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setIsPlaying(false);
              setSliderPos(50);
            }}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              theme === 'dark'
                ? 'border-slate-700 bg-slate-900 text-slate-300 hover:text-white'
                : 'border-slate-300 bg-slate-100 text-slate-700'
            }`}
            title="Reset Slider to Center (50%)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Speed Selector */}
          <div className="flex items-center gap-1 bg-black/30 p-1 rounded-xl border border-slate-800 shrink-0">
            {[0.5, 1, 2].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSpeed(s)}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  speed === s
                    ? 'bg-[#F59E0B] text-[#130A1D]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Scrubber Progress Slider */}
        <div className="flex items-center gap-3 w-full flex-1 max-w-md">
          <span className="text-[10px] text-slate-400 font-bold uppercase shrink-0">Scrubber Position:</span>
          <input
            type="range"
            min="0"
            max="100"
            value={sliderPos}
            onChange={(e) => {
              setIsPlaying(false);
              setSliderPos(parseFloat(e.target.value));
            }}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#F59E0B]"
          />
          <span className="text-[#F59E0B] font-bold w-10 text-right shrink-0">{Math.round(sliderPos)}%</span>
        </div>
      </div>
    </div>
  );
};

export default MapLibreCompare;
