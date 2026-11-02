import React, { useState, useEffect } from 'react';
import { Satellite, Leaf, ArrowRight, ShieldCheck } from 'lucide-react';

interface GatewayPageProps {
  onSelectRole: (role: 'professional' | 'public') => void;
  theme: 'dark' | 'light';
}

export const GatewayPage: React.FC<GatewayPageProps> = ({ onSelectRole, theme }) => {
  const [mounted, setMounted] = useState(false);
  const [showFooter, setShowFooter] = useState(false);

  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => {
      setShowFooter(true);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`min-h-screen ${
      theme === 'dark' ? 'bg-[#130A1D] text-[#F1F5F9]' : 'bg-[#F8FAFC] text-[#130A1D]'
    } flex flex-col items-center justify-between py-12 px-6 relative overflow-hidden select-none transition-colors duration-200`}>
      {/* Background radial overlays */}
      <div className={`absolute inset-0 pointer-events-none ${
        theme === 'dark' 
          ? 'bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.08)_0,transparent_65%)]' 
          : 'bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.04)_0,transparent_65%)]'
      }`} />

      {/* 6.1 — Header Section */}
      <div className="text-center mt-12 md:mt-18 z-10">
        <h1 className={`text-4xl sm:text-5xl md:text-6xl font-bold font-display tracking-tight mb-3 ${
          theme === 'dark' ? 'text-white' : 'text-slate-900'
        }`}>
          SatQuery AI Gateway
        </h1>
        <p className={`text-base sm:text-lg md:text-xl font-sans italic ${
          theme === 'dark' ? 'text-[#CBD5E1]' : 'text-slate-600'
        }`}>
          Select your professional perspective to enter the platform.
        </p>
      </div>

      {/* Two cards side by side */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-10 my-12 z-10 max-w-5xl w-full">
        {/* Left Card — Professional */}
        <div
          onClick={() => onSelectRole('professional')}
          style={{
            transitionDuration: '480ms',
            transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)'
          }}
          className={`w-full max-w-[380px] h-[500px] p-8 rounded-3xl glass-ice-silver glass-ice-silver-hover hover:-translate-y-1 transition-all cursor-pointer flex flex-col items-center text-center justify-between group relative overflow-hidden ${
            theme === 'dark' 
              ? 'border-slate-300/15' 
              : 'bg-white border-slate-200 shadow-md hover:shadow-xl'
          } ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          {/* Subtle hover radial glow behind icon */}
          <div className="absolute top-12 w-28 h-28 rounded-full bg-[#F59E0B]/15 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />

          {/* Circular 80px icon */}
          <div className="w-20 h-20 rounded-full bg-[#F59E0B]/20 border border-[#F59E0B]/40 flex items-center justify-center transition-all group-hover:scale-110 mb-6 relative z-10">
            <Satellite className="w-9 h-9 text-[#F59E0B]" />
          </div>

          <div className="flex-1 flex flex-col justify-between">
            <div>
              <h3 className={`text-2xl font-bold font-display mb-4 transition-colors ${
                theme === 'dark' ? 'text-white group-hover:text-[#F59E0B]' : 'text-slate-900 group-hover:text-[#D97706]'
              }`}>
                Professional Perspective
              </h3>
              <p className={`text-sm leading-relaxed font-sans max-w-[300px] mx-auto ${
                theme === 'dark' ? 'text-[#CBD5E1]' : 'text-slate-600'
              }`}>
                Full technical analysis with radiometric values, sensor metadata, coordinates, and downloadable audit trails. Designed for ISRO, DRDO, NDMA, and state disaster agencies.
              </p>
            </div>

            <div className="pt-6 flex items-center justify-center gap-2 text-xs font-mono font-bold text-[#F59E0B] group-hover:text-[#FFB000]">
              <span>Initialize technical telemetry</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

        {/* Right Card — Public */}
        <div
          onClick={() => onSelectRole('public')}
          style={{
            transitionDuration: '480ms',
            transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
            transitionDelay: '120ms'
          }}
          className={`w-full max-w-[380px] h-[500px] p-8 rounded-3xl glass-ice-silver glass-ice-silver-hover hover:-translate-y-1 transition-all cursor-pointer flex flex-col items-center text-center justify-between group relative overflow-hidden ${
            theme === 'dark' 
              ? 'border-slate-300/15' 
              : 'bg-white border-slate-200 shadow-md hover:shadow-xl'
          } ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          {/* Subtle hover radial glow behind icon */}
          <div className="absolute top-12 w-28 h-28 rounded-full bg-emerald-500/15 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />

          {/* Circular 80px icon */}
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center transition-all group-hover:scale-110 mb-6 relative z-10">
            <Leaf className="w-9 h-9 text-emerald-400" />
          </div>

          <div className="flex-1 flex flex-col justify-between">
            <div>
              <h3 className={`text-2xl font-bold font-display mb-4 transition-colors ${
                theme === 'dark' ? 'text-white group-hover:text-emerald-300' : 'text-slate-900 group-hover:text-emerald-600'
              }`}>
                Public Perspective
              </h3>
              <p className={`text-sm leading-relaxed font-sans max-w-[300px] mx-auto ${
                theme === 'dark' ? 'text-[#CBD5E1]' : 'text-slate-600'
              }`}>
                Plain-language explanations of any satellite image. No technical jargon. Understand what is happening in any region of India.
              </p>
            </div>

            <div className="pt-6 flex items-center justify-center gap-2 text-xs font-mono font-bold text-emerald-400 group-hover:text-emerald-300">
              <span>Access public workspace</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* Footer Pill */}
      <div
        style={{
          transitionDuration: '600ms'
        }}
        className={`px-5 py-2 rounded-full border text-[10px] font-mono uppercase tracking-[0.15em] z-10 flex items-center gap-2 transition-all ${
          theme === 'dark'
            ? 'glass-ice-silver border-slate-300/15 text-slate-400'
            : 'bg-slate-100 border-slate-200 text-slate-650 shadow-sm'
        } ${
          showFooter ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        <ShieldCheck className="w-3.5 h-3.5 text-[#F59E0B]" />
        <span>SATQUERY AI Secure Session</span>
      </div>
    </div>
  );
};
