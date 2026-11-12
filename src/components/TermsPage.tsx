import React from 'react';
import { FileText, ArrowLeft, ShieldAlert, Award } from 'lucide-react';

interface LegalPageProps {
  onBackToHome: () => void;
  theme: 'dark' | 'light';
}

export const TermsPage: React.FC<LegalPageProps> = ({ onBackToHome, theme }) => {
  return (
    <div className={`min-h-screen py-16 px-4 sm:px-8 max-w-4xl mx-auto flex flex-col justify-between ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
      <div className="space-y-8">
        {/* Navigation back */}
        <button
          onClick={onBackToHome}
          className="inline-flex items-center gap-2 text-xs font-semibold font-mono text-cyan-500 hover:underline cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to SatQuery AI Gateway</span>
        </button>

        {/* Page Header */}
        <div className="border-b border-[#374151]/20 pb-6">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-8 h-8 text-[#1F4BFF]" />
            <h1 className={`text-3xl font-bold font-display ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Terms of Service</h1>
          </div>
          <p className="text-xs font-mono text-slate-500">Last Modified: September 27, 2026 &middot; Version 1.0.0</p>
        </div>

        {/* Document Content */}
        <div className="space-y-6 text-sm leading-relaxed">
          <section className="space-y-2">
            <h2 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'} flex items-center gap-2`}>
              <Award className="w-4 h-4 text-[#1F4BFF]" />
              1. Agreement to Terms & Conditions
            </h2>
            <p>
              By accessing the <strong>SatQuery AI</strong> geospatial analytics platform and terminal interface, you agree to comply with and be bound by the following Terms of Service. If you do not agree with any of these terms, you are prohibited from utilizing our imagery processing, telemetry querying, and SAR analysis engines.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'} flex items-center gap-2`}>
              <ShieldAlert className="w-4 h-4 text-[#1F4BFF]" />
              2. Acceptable Platform & Token Usage
            </h2>
            <p>
              Professional users registering custom accounts are granted a revocable, non-exclusive license to execute queries on active Copernicus, ISRO, and Sentinel multispectral arrays. Users must not:
            </p>
            <ul className="list-disc pl-6 space-y-1 font-mono text-xs text-slate-400">
              <li>Deploy high-volume automated scrapers on analysis endpoints.</li>
              <li>Inject malicious payloads into natural language query systems.</li>
              <li>Attempt access token elevation of privilege attacks.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>3. Platform Availability & Disclaimers</h2>
            <p>
              All telemetry, change analyses, visual bands, and SAR fusions returned by the platform are generated using automated models and external Copernicus mock frameworks. They are provided "as-is" for strategic planning, academic, and mock verification purposes. SatQuery AI does not guarantee absolute sub-meter precision during environmental emergencies.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>4. Modifications to Systems & Subscriptions</h2>
            <p>
              We reserve the right to modify, pause, or restrict platform queries and analytics access to preserve standard cloud API allotments. Terms may be updated periodically, with active notifications displayed directly inside user consoles.
            </p>
          </section>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[#374151]/20 pt-8 mt-16 text-center text-xs text-slate-500 font-mono">
        <p>&copy; 2026 SatQuery AI Group. All rights reserved. Secure Geospatial Authorization Node.</p>
      </footer>
    </div>
  );
};
