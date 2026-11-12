import { create } from 'zustand';

export interface MaskHighlightData {
  maskId: string;
  label?: string;
  bounds?: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
  geojson?: any;
}

interface MapHighlightState {
  activeMaskId: string | null;
  activeBounds: [number, number, number, number] | null;
  activeMaskData: MaskHighlightData | null;
  setActiveMaskId: (
    maskId: string | null,
    bounds?: [number, number, number, number] | null,
    maskData?: MaskHighlightData
  ) => void;
  clearHighlight: () => void;
}

export const useMapHighlightStore = create<MapHighlightState>((set, get) => ({
  activeMaskId: null,
  activeBounds: null,
  activeMaskData: null,
  setActiveMaskId: (maskId, bounds, maskData) => {
    const currentId = get().activeMaskId;
    // Fallback: If user clicks the same metric again, deselect it (reset color and zoom)
    if (currentId === maskId && maskId !== null) {
      set({ activeMaskId: null, activeBounds: null, activeMaskData: null });
    } else {
      set({
        activeMaskId: maskId,
        activeBounds: bounds || null,
        activeMaskData: maskData || (maskId ? { maskId, bounds: bounds || undefined } : null),
      });
    }
  },
  clearHighlight: () => set({ activeMaskId: null, activeBounds: null, activeMaskData: null }),
}));
