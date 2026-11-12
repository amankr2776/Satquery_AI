import React from 'react';
import { useMapHighlightStore } from '../../store/useMapHighlightStore';
import { Layers, MapPin } from 'lucide-react';

interface EvidenceReceiptProps {
  maskId: string;
  label: string;
  metricValue?: string;
  bounds?: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
  children?: React.ReactNode;
}

export const EvidenceReceipt: React.FC<EvidenceReceiptProps> = ({
  maskId,
  label,
  metricValue,
  bounds = [75.6, 11.5, 76.5, 12.8],
  children,
}) => {
  const { activeMaskId, setActiveMaskId } = useMapHighlightStore();
  const isActive = activeMaskId === maskId;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMaskId(maskId, bounds, { maskId, label, bounds });
  };

  return (
    <button
      onClick={handleClick}
      type="button"
      title={isActive ? 'Click to deselect SAM 2 mask evidence' : 'Click to highlight SAM 2 mask on MapLibre map'}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 my-0.5 rounded-md font-semibold transition-all cursor-pointer text-xs ${
        isActive
          ? 'bg-[#FFB800] text-white shadow-sm ring-2 ring-[#FFB800]/40 font-bold'
          : 'bg-amber-50 text-[#1C232E] border border-amber-200/80 hover:border-[#FFB800] hover:text-[#FFB800] hover:underline decoration-[#FFB800] decoration-2 underline-offset-2'
      }`}
    >
      <Layers className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-[#FFB800]'}`} />
      <span>{children || `${label}${metricValue ? `: ${metricValue}` : ''}`}</span>
      <span className={`text-[9px] px-1 rounded font-mono ${isActive ? 'bg-black/20 text-white' : 'bg-amber-100/80 text-amber-900'}`}>
        SAM 2
      </span>
    </button>
  );
};

export default EvidenceReceipt;
