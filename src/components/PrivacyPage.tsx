import React from 'react';
import { Shield, ArrowLeft, Globe, FileText } from 'lucide-react';

interface LegalPageProps {
  onBackToHome: () => void;
  theme: 'dark' | 'light';
}

export const PrivacyPage: React.FC<LegalPageProps> = ({ onBackToHome, theme }) => {
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
        <div className="border-b border-slate-800/20 pb-6">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-cyan-400" />
            <h1 className={`text-3xl font-bold font-display ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Privacy Policy</h1>
          </div>
          <p className="text-xs font-mono text-slate-500">Last Modified: September 27, 2026 &middot; Version 1.0.0</p>
        </div>

        {/* Document Content */}
        <div className="space-y-6 text-sm leading-relaxed">
          <section className="space-y-2">
            <h2 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'} flex items-center gap-2`}>
              <Globe className="w-4 h-4 text-cyan-400" />
              1. Geospatial & Telemetry Data Processing
            </h2>
            <p>
              At <strong>SatQuery AI</strong>, accessible from our application portal, protecting the privacy of our global coordinators, mission operators, and citizens is our priority. This document outlines the types of data collected, processed, and archived by our multi-sensor satellite imagery and analysis platform.
            </p>
            <p>
              When utilizing our orbital telemetry query modules, coordinate bounding boxes, active AOIs (Areas of Interest), SAR fusions, and disaster markers are rendered on-screen. No imagery data is written or stored beyond active analysis workflows.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'} flex items-center gap-2`}>
              <FileText className="w-4 h-4 text-cyan-400" />
              2. User Identification & Authentication
            </h2>
            <p>
              We integrate Google OAuth Sign-In and secure custom credentials structures to ensure authentication security. To access our professional dashboard, we require permission to access:
            </p>
            <ul className="list-disc pl-6 space-y-1 font-mono text-xs text-slate-400">
              <li>Your primary email address (to uniquely map your workspace state)</li>
              <li>Your basic profile information (profile name and picture link)</li>
            </ul>
            <p>
              This information is solely utilized to identify user roles (Professional Operators vs Public Viewers) and populate your secure command logs. We never sell, transfer, or disclose this telemetry metadata to third-party entities.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>3. Information Protection & Compliance</h2>
            <p>
              Your orbital data transmission pathways are encrypted using Secure Sockets Layer (SSL) protocols. We maintain robust administrative, technical, and physical security measures designed to prevent accidental access, alteration, or disclosure of geospatial configurations.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>4. GDPR & CCPA Rights</h2>
            <p>
              Users retain absolute rights to request information regarding stored sessions, request data deletion, or retract authentication access tokens. For any GDPR or security inquiry, reach out directly to the SatQuery AI administrative team.
            </p>
          </section>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800/20 pt-8 mt-16 text-center text-xs text-slate-500 font-mono">
        <p>&copy; 2026 SatQuery AI Group. All rights reserved. Secure Geospatial Authorization Node.</p>
      </footer>
    </div>
  );
};
