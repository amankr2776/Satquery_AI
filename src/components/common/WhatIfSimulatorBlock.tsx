import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Clock, ShieldAlert, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface WhatIfSimulatorBlockProps {
  baseArea: number;
  currentYear: number;
  theme: 'light' | 'dark';
  onSimulationChange?: (data: { targetYear: number; projectedArea: number; annualRate: number }) => void;
}

/**
 * WhatIfSimulatorBlock: A sidebar/content block that simulates future area changes.
 * Includes a temporal slider and dynamic area projections.
 */
export const WhatIfSimulatorBlock: React.FC<WhatIfSimulatorBlockProps> = ({ baseArea, currentYear, theme, onSimulationChange }) => {
  const [targetYear, setTargetYear] = useState(currentYear + 5);
  const [projectedArea, setProjectedArea] = useState(baseArea);
  const [annualRate, setAnnualRate] = useState(-2.4); // Default -2.4% annual change

  const minYear = currentYear + 1;
  const maxYear = currentYear + 20;

  useEffect(() => {
    const yearsDiff = targetYear - currentYear;
    // Calculate projected area: A = P(1 + r)^t
    const newArea = baseArea * Math.pow(1 + (annualRate / 100), yearsDiff);
    const roundedArea = Number(newArea.toFixed(2));
    setProjectedArea(roundedArea);
    
    if (onSimulationChange) {
      onSimulationChange({ targetYear, projectedArea: roundedArea, annualRate });
    }
  }, [targetYear, baseArea, annualRate, currentYear, onSimulationChange]);

  const areaDiff = projectedArea - baseArea;
  const isDecreasing = areaDiff < 0;

  return (
    <div className={`space-y-4 animate-fade-in`}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
          <Clock className="w-5 h-5" />
        </div>
        <div>
          <h4 className={`text-sm font-sans font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>"What-If" Temporal Simulator</h4>
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mt-0.5">Predictive Land-Cover Extrapolation</span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">Projection Target Year</span>
            <div className={`text-2xl font-sans font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{targetYear}</div>
          </div>
          <div className="text-right space-y-1">
            <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">Projected Total Area</span>
            <div className={`text-2xl font-sans font-black ${isDecreasing ? 'text-rose-400' : 'text-emerald-400'}`}>
              {projectedArea.toLocaleString()} ha
            </div>
          </div>
        </div>

        <div className="relative pt-6 pb-2">
          <input
            type="range"
            min={minYear}
            max={maxYear}
            value={targetYear}
            onChange={(e) => setTargetYear(parseInt(e.target.value))}
            className={`w-full h-1.5 rounded-full appearance-none cursor-pointer accent-rose-500 ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-200'}`}
          />
          <div className="flex justify-between mt-2">
            <span className="text-[9px] font-mono text-slate-600">{minYear}</span>
            <span className="text-[9px] font-mono text-slate-600">{maxYear}</span>
          </div>
        </div>

        <div className={`p-4 rounded-2xl border ${
          isDecreasing ? 'bg-rose-500/5 border-rose-500/20' : 'bg-emerald-500/5 border-emerald-500/20'
        } space-y-3`}>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isDecreasing ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
              <span className={`text-xs font-mono font-bold uppercase ${isDecreasing ? 'text-rose-400' : 'text-emerald-400'}`}>
                {isDecreasing ? 'Net Loss Projected' : 'Net Gain Projected'}
              </span>
            </div>
            <span className={`text-sm font-sans font-black ${isDecreasing ? 'text-rose-400' : 'text-emerald-400'}`}>
              {isDecreasing ? '' : '+'}{areaDiff.toLocaleString()} ha
            </span>
          </div>
          
          <p className={`text-[11px] font-sans leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
            If the current annual change rate of <span className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{annualRate}%</span> continues, this region will reach a state of 
            <span className={`font-bold ${isDecreasing ? 'text-rose-400' : 'text-emerald-400'}`}> {isDecreasing ? 'critical fragmentation' : 'stable recovery'} </span> 
            by the year {targetYear}.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-[9px] text-slate-500 uppercase block">Annual Rate</span>
            <input 
              type="number" 
              step="0.1" 
              value={annualRate}
              onChange={(e) => setAnnualRate(parseFloat(e.target.value))}
              className="bg-transparent text-xs font-mono font-bold text-white border-none outline-none w-full"
            />
          </div>
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-[9px] text-slate-500 uppercase block">Confidence Level</span>
            <span className="text-xs font-mono font-bold text-slate-300">
              {Math.max(40, 94 - (targetYear - currentYear) * 2)}%
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 px-1">
          <ShieldAlert className="w-3 h-3 text-amber-500 shrink-0" />
          <p className="text-[9px] text-slate-500 italic">
            Disclaimer: Linear extrapolation does not account for localized policy interventions or sudden climatic shifts.
          </p>
        </div>
      </div>
    </div>
  );
};
