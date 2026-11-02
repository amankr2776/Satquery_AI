import React, { useState } from 'react';
import { BookOpen, Sparkles, ChevronDown, CheckCircle2, HelpCircle } from 'lucide-react';

const GLOSSARY_ITEMS = [
  {
    term: 'NDVI (Normalized Difference Vegetation Index)',
    short: 'Measures plant greenness, crop health, and canopy density.',
    formula: '(NIR - Red) / (NIR + Red)',
    science: 'Healthy plant leaves absorb red light for photosynthesis and reflect near-infrared (NIR). Low values indicate bare soil, water logging, or urban building structures.'
  },
  {
    term: 'NDWI (Normalized Difference Water Index)',
    short: 'Isolates surface water bodies and measures soil moisture saturation.',
    formula: '(Green - NIR) / (Green + NIR)',
    science: 'Liquid water reflects visible green light but absorbs near-infrared (NIR). Essential for flood boundary mapping and reservoir level tracking.'
  },
  {
    term: 'SAR (Synthetic Aperture Radar)',
    short: 'Cloud-penetrating radar sensing that works day or night.',
    formula: 'Active Microwave Backscatter (VV/VH)',
    science: 'Transmits microwave pulses and measures ground backscatter. Smooth water surfaces bounce radar away (appearing dark), while rough structures bounce radar back (appearing bright).'
  },
  {
    term: 'dNBR (delta Normalized Burn Ratio)',
    short: 'Calculates fire severity and crop stubble burn scars.',
    formula: 'PreFire NBR - PostFire NBR',
    science: 'Compares near-infrared (healthy leaf structure reflection) with shortwave-infrared (highly reflected by scorched dry soils and ash) to outline active burn perimeters.'
  },
  {
    term: 'SWIR (Shortwave Infrared)',
    short: 'Spectral bands sensitive to crop moisture content and active heat centers.',
    formula: '1.4 µm to 3.0 µm Wavelengths',
    science: 'Absorbed strongly by moisture in plant leaves and soil; reflects highly off dry clay, bare ground, and active fire embers.'
  },
  {
    term: 'Level-2A (L2A) Processing',
    short: 'Bottom-of-atmosphere calibrated satellite imagery.',
    formula: 'Atmospheric Aerosol & Cloud Scatter Correction',
    science: 'Removes atmospheric haze and cloud scatter from raw satellite readings to measure true surface ground reflectance.'
  }
];

export const HelpGuideView: React.FC = () => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  return (
    <div className="flex-1 h-full overflow-y-auto p-6 md:p-10 max-w-4xl mx-auto space-y-8 font-sans">
      <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
        <div className="p-2.5 bg-[#FF8C00]/10 text-[#FF8C00] rounded-xl">
          <BookOpen className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#2A1B2E]">Public Help Guide & Geospatial Glossary</h1>
          <p className="text-xs text-slate-500">Learn how satellite intelligence works and understand scientific remote sensing terms in plain language.</p>
        </div>
      </div>

      {/* Guide Overview */}
      <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-[#FF8C00] font-bold text-sm">
          <Sparkles className="w-4 h-4" />
          <span>How SatQuery AI Public Works</span>
        </div>
        <p className="text-xs text-slate-700 leading-relaxed">
          SatQuery AI uses multi-modal satellite vision models (fusing Sentinel-2 optical and Sentinel-1 radar bands) to answer questions about satellite photos in plain, clear language. You can query flood damage, crop fires, forest loss, or urban expansion directly.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          <div className="p-3 bg-[#F3F4F1] rounded-xl border border-slate-200 text-xs">
            <span className="font-bold text-[#2A1B2E] block mb-1">1. Choose Scene</span>
            <span className="text-slate-600">Select a preloaded satellite scene or upload your own raster photo.</span>
          </div>
          <div className="p-3 bg-[#F3F4F1] rounded-xl border border-slate-200 text-xs">
            <span className="font-bold text-[#2A1B2E] block mb-1">2. Ask Anything</span>
            <span className="text-slate-600">Type natural questions about flood extent, plant health, or fire scars.</span>
          </div>
          <div className="p-3 bg-[#F3F4F1] rounded-xl border border-slate-200 text-xs">
            <span className="font-bold text-[#2A1B2E] block mb-1">3. Get Evidence</span>
            <span className="text-slate-600">Receive evidence-backed answers with everyday comparisons and clear steps.</span>
          </div>
        </div>
      </div>

      {/* Glossary Items */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-[#2A1B2E] flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-[#FF8C00]" />
          <span>Remote Sensing Terms Explained</span>
        </h2>

        <div className="space-y-3">
          {GLOSSARY_ITEMS.map((item, idx) => {
            const isExpanded = expandedIndex === idx;

            return (
              <div
                key={idx}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs transition-all"
              >
                <button
                  onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                  className="w-full p-4 text-left flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <div>
                    <h3 className="font-bold text-sm text-[#2A1B2E]">{item.term}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{item.short}</p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180 text-[#FF8C00]' : ''}`} />
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 bg-[#F3F4F1]/50 border-t border-slate-100 text-xs text-slate-700 space-y-2">
                    {item.formula && (
                      <div className="p-2 bg-white rounded-lg border border-slate-200 font-mono text-[11px] text-[#FF8C00] font-bold">
                        Formula: {item.formula}
                      </div>
                    )}
                    <p className="leading-relaxed">{item.science}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
