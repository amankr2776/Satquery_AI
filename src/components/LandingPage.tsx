import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Layers,
  ShieldCheck,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { ThreeEarthHero } from './ThreeEarthHero';

interface LandingPageProps {
  onLaunchDashboard: () => void;
  onExploreArchitecture?: () => void;
  theme: 'dark' | 'light';
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onLaunchDashboard,
  onExploreArchitecture,
  theme
}) => {
  const headline = "Precision Earth Intelligence.";
  const [displayedChars, setDisplayedChars] = useState(0);

  // Stats Counters
  const [metricCounts, setMetricCounts] = useState({
    qaPairs: 0,
    latency: 0,
    coverage: 0
  });

  // Typewriter animation
  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      index++;
      setDisplayedChars(index);
      if (index >= headline.length) {
        clearInterval(interval);
      }
    }, 40);
    return () => clearInterval(interval);
  }, []);

  // Quick metrics animation
  useEffect(() => {
    const startTime = performance.now();
    const duration = 1200;

    const animateMetrics = (now: number) => {
      const elapsed = Math.min(now - startTime, duration);
      const progress = 1 - Math.pow(1 - elapsed / duration, 3); // ease-out cubic

      setMetricCounts({
        qaPairs: Math.floor(progress * 14.7 * 10) / 10,
        latency: Math.floor(480 - progress * (480 - 340)),
        coverage: Math.floor(progress * 95)
      });

      if (elapsed < duration) {
        requestAnimationFrame(animateMetrics);
      }
    };

    const frameId = requestAnimationFrame(animateMetrics);
    return () => cancelAnimationFrame(frameId);
  }, []);

  const coreCapabilities = [
    {
      title: 'Mixture-of-Experts Router',
      category: 'Model Orchestration',
      description: 'Dynamically routes queries between high-resolution optical vision models, Synthetic Aperture Radar (SAR) phase estimators, and change networks.',
      icon: <Cpu className="w-5 h-5 text-[#1F4BFF]" />
    },
    {
      title: 'Optical-SAR Cross-Attention',
      category: 'Sensor Fusion',
      description: 'Fuses cloud-penetrating Sentinel-1/NISAR radar backscatter with Sentinel-2 optical bands to solve monsoon cloud blindness with 99.4% precision.',
      icon: <Layers className="w-5 h-5 text-[#FFB800]" />
    },
    {
      title: 'Conformal Prediction Engine',
      category: 'Statistical Assurance',
      description: 'Produces rigorous, finite-sample statistical coverage guarantees rather than brittle, overconfident raw model probabilities.',
      icon: <ShieldCheck className="w-5 h-5 text-[#FFB800]" />
    }
  ];

  return (
    <div className={`relative w-full overflow-hidden min-h-screen font-sans transition-colors duration-200 ${
      theme === 'dark' ? 'bg-[#1C232E] text-[#F1F5F9]' : 'bg-[#F8FAFC] text-[#1C232E]'
    }`}>
      
      {/* Small floating Earth Globe in background */}
      <div className={`absolute top-[15%] right-[5%] sm:right-[10%] w-[280px] h-[280px] sm:w-[400px] sm:h-[400px] rounded-full overflow-hidden pointer-events-auto opacity-80 border animate-float z-0 transition-all ${
        theme === 'dark' 
          ? 'border-[#FFB800]/20 shadow-[0_0_60px_rgba(245,158,11,0.15)] bg-[#1D0E2E]/30' 
          : 'border-[#FFB800]/30 shadow-[0_0_60px_rgba(245,158,11,0.08)] bg-white/20'
      }`}>
        <ThreeEarthHero />
      </div>

      {/* ================= HERO SECTION (FULL IMMERSIVE) ================= */}
      <section className="relative min-h-screen flex flex-col justify-between pt-32 pb-20 px-6 sm:px-12 max-w-7xl mx-auto z-10">
        
        {/* Dynamic Mission Announcement - ZERO PILLS, clean unboxed metadata with bullet separators */}
        <div className="pt-4">
          <div className="flex items-center gap-2.5 text-[10px] font-mono tracking-[0.2em] text-[#FFB800] uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-[#FFB000] animate-pulse shrink-0" />
            <span>Active Constellation Link</span>
            <span className="text-slate-500" aria-hidden="true">&middot;</span>
            <span>ISRO</span>
            <span className="text-slate-500" aria-hidden="true">&middot;</span>
            <span>Copernicus Joint Node</span>
          </div>
        </div>

        {/* Minimal Editorial Headline, Subheadline & Primary CTA */}
        <div className="my-auto max-w-3xl py-12 text-left">
          <h1 className={`font-display text-5xl sm:text-7xl md:text-8xl italic leading-[1.05] tracking-tight mb-8 ${
            theme === 'dark' ? 'text-white' : 'text-slate-900'
          }`}>
            {headline.slice(0, displayedChars)}
            {displayedChars < headline.length && (
              <span className="inline-block w-1.5 h-12 ml-1 bg-[#FFB800] animate-pulse align-middle" />
            )}
          </h1>

          <p className={`text-sm sm:text-base md:text-lg font-normal max-w-xl leading-relaxed mb-10 ${
            theme === 'dark' ? 'text-[#CBD5E1]' : 'text-slate-650'
          }`}>
            Ask in plain language. Get certified radiometric answers, co-registered sensor telemetry, and statistical guarantees with zero friction.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={onLaunchDashboard}
              className="group relative inline-flex items-center gap-2.5 px-7 py-4 rounded-xl gold-gradient-btn text-[#1C232E] font-bold text-xs uppercase tracking-widest transition-all duration-300 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 shrink-0 text-[#1C232E]" />
              <span>Launch Mission Control</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* Live System Metrics ribbon - Clean layout, zero clutter */}
        <div className={`pt-8 border-t flex flex-wrap gap-12 sm:gap-20 ${
          theme === 'dark' ? 'border-slate-300/15' : 'border-slate-200'
        }`}>
          <div>
            <div className={`text-3xl sm:text-4xl font-light tabular-nums tracking-tight font-mono ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}>
              {metricCounts.qaPairs}M
            </div>
            <div className={`text-[9px] font-mono uppercase tracking-[0.25em] mt-1.5 ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
            }`}>
              Trained Queries
            </div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-light text-[#FFB800] tabular-nums tracking-tight font-mono">
              &lt; {metricCounts.latency}ms
            </div>
            <div className={`text-[9px] font-mono uppercase tracking-[0.25em] mt-1.5 ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
            }`}>
              Response Time
            </div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-light text-[#FFB800] tabular-nums tracking-tight font-mono">
              {metricCounts.coverage}%
            </div>
            <div className={`text-[9px] font-mono uppercase tracking-[0.25em] mt-1.5 ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
            }`}>
              Conformal Cover
            </div>
          </div>
        </div>
      </section>

      {/* ================= CORE CAPABILITIES SECTION ================= */}
      {/* Editorial layout with subtle thin line divisions to avoid boxed cards within cards */}
      <section id="architecture-pipeline" className={`relative py-28 px-6 sm:px-12 max-w-7xl mx-auto z-10 border-t backdrop-blur-3xl transition-all ${
        theme === 'dark' 
          ? 'border-slate-300/15 bg-[#1C232E]/60' 
          : 'border-slate-200 bg-[#F8FAFC]/50 shadow-inner'
      }`}>
        <div className="mb-16">
          <span className="text-[10px] font-mono text-[#FFB800] uppercase tracking-[0.3em] block mb-2">Technical Foundations</span>
          <h2 className={`font-display text-4xl sm:text-5xl md:text-6xl italic ${
            theme === 'dark' ? 'text-white' : 'text-slate-900'
          }`}>Under the hood.</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pt-4">
          {coreCapabilities.map((cap) => (
            <div
              key={cap.title}
              className={`flex flex-col justify-between p-6 rounded-2xl glass-ice-silver glass-ice-silver-hover text-left space-y-6 ${
                theme === 'dark' ? 'border-slate-300/15' : 'border-slate-200'
              }`}
            >
              <div>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-6 ${
                  theme === 'dark' ? 'bg-[#1D0E2E] border border-slate-300/20' : 'bg-white border border-slate-200 shadow-sm'
                }`}>
                  {cap.icon}
                </div>
                <div className={`text-[9px] font-mono uppercase tracking-widest mb-2 ${
                  theme === 'dark' ? 'text-[#FFB800]' : 'text-[#D97706]'
                }`}>
                  {cap.category}
                </div>
                <h3 className={`text-lg font-semibold mb-3 ${
                  theme === 'dark' ? 'text-white' : 'text-slate-900'
                }`}>
                  {cap.title}
                </h3>
                <p className={`text-xs leading-relaxed max-w-sm ${
                  theme === 'dark' ? 'text-[#CBD5E1]' : 'text-slate-650'
                }`}>
                  {cap.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className={`relative py-12 px-6 sm:px-12 max-w-7xl mx-auto border-t z-10 text-xs flex flex-col sm:flex-row items-center justify-between gap-6 font-mono transition-colors ${
        theme === 'dark' 
          ? 'border-slate-300/15 text-slate-400' 
          : 'border-slate-200 text-slate-600'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-md gold-gradient-btn flex items-center justify-center text-[#1C232E] font-bold text-[9px] shadow-sm shadow-[#FFB800]/20">
            SQ
          </div>
          <span className={`font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>SatQuery AI</span>
          <span className="text-slate-500" aria-hidden="true">&middot;</span>
          <span>v2.5.0-ISRO</span>
        </div>
        <div className="text-slate-400 text-center sm:text-left max-w-sm sm:max-w-none">
          Dual-Perspective Earth Observation Intelligence. Built with scientific rigor.
        </div>
        <div className="flex items-center gap-4">
          <a href="/privacy" className={`transition-colors ${theme === 'dark' ? 'text-slate-400 hover:text-[#FFB800]' : 'text-slate-600 hover:text-[#D97706]'}`}>
            Privacy Policy
          </a>
          <span className="text-slate-500" aria-hidden="true">&middot;</span>
          <a href="/terms" className={`transition-colors ${theme === 'dark' ? 'text-slate-400 hover:text-[#FFB800]' : 'text-slate-600 hover:text-[#D97706]'}`}>
            Terms of Service
          </a>
          <span className="text-slate-500" aria-hidden="true">&middot;</span>
          <button onClick={onLaunchDashboard} className="text-[#FFB800] hover:underline font-semibold cursor-pointer">
            Launch Engine
          </button>
          <span className="text-slate-500" aria-hidden="true">&middot;</span>
          <span>Apache 2.0</span>
        </div>
      </footer>
    </div>
  );
};
