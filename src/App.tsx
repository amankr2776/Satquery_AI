import React, { useState, useEffect, useRef } from 'react';
import { LandingPage } from './components/LandingPage';
import { LoginPage } from './components/LoginPage';
import { GatewayPage } from './components/GatewayPage';
import { Dashboard } from './components/Dashboard';
import { PrivacyPage } from './components/PrivacyPage';
import { TermsPage } from './components/TermsPage';
import { ThemeMode, PersonaMode } from './types/satellite';
import { Sun, Moon, ArrowRight, Loader2 } from 'lucide-react';
import { auth } from './services/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

type ViewState = 'landing' | 'login' | 'gateway' | 'dashboard' | 'privacy' | 'terms';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('landing');
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('satquery_theme') as ThemeMode | null : null;
    return saved === 'light' ? 'light' : 'dark';
  });
  const [selectedRole, setSelectedRole] = useState<PersonaMode>('professional');
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Subscribe to Firebase Auth state changes once on mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Handle view state transitions on auth changes safely
  useEffect(() => {
    const simulatedUser = localStorage.getItem('simulatedUser');
    const isAuthenticated = !!(user || simulatedUser);

    if (isAuthenticated && currentView === 'login') {
      setCurrentView('dashboard');
    } else if (!isAuthenticated && currentView === 'dashboard') {
      setCurrentView('gateway');
    }
  }, [user, currentView]);

  // Sync theme with document root
  useEffect(() => {
    localStorage.setItem('satquery_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'light') {
      document.body.classList.remove('bg-[#130A1D]', 'text-[#F1F5F9]');
      document.body.classList.add('bg-[#F8FAFC]', 'text-[#130A1D]');
    } else {
      document.body.classList.remove('bg-[#F8FAFC]', 'text-[#130A1D]');
      document.body.classList.add('bg-[#130A1D]', 'text-[#F1F5F9]');
    }
  }, [theme]);

  // Routing listener hook for OAuth consent verification compliance
  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/privacy') {
      setCurrentView('privacy');
    } else if (path === '/terms') {
      setCurrentView('terms');
    }
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('satquery_theme', next);
      return next;
    });
  };

  const handleLaunchDashboard = () => {
    // Gateway page selection comes before login page to establish role context
    setCurrentView('gateway');
  };

  const handleLoginSuccess = () => {
    setCurrentView('dashboard');
  };

  const handleRoleSelection = (role: PersonaMode) => {
    setSelectedRole(role);
    const simulatedUser = localStorage.getItem('simulatedUser');
    if (user || simulatedUser) {
      setCurrentView('dashboard');
    } else {
      setCurrentView('login');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0A0F1C] flex items-center justify-center text-cyan-400 font-mono gap-3">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span>Synchronizing Geospatial Node Session...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans transition-colors duration-200">
      {/* Top Navbar only on Landing Page — Conforms strictly to Top Bar Contract */}
      {currentView === 'landing' && (
        <header className={`fixed top-0 left-0 right-0 h-18 px-6 sm:px-12 flex items-center justify-between border-b backdrop-blur-xl z-40 ${
          theme === 'dark'
            ? 'border-slate-800/20 bg-[#0A0F1C]/65 text-white'
            : 'border-slate-200/50 bg-[#FAFAF7]/65 text-[#0F172A]'
        }`}>
          {/* Zone 1: Brand title wordmark (single text element) */}
          <button
            onClick={() => setCurrentView('landing')}
            className={`font-display text-2xl tracking-tight transition-colors cursor-pointer ${
              theme === 'dark' ? 'text-white hover:text-cyan-400' : 'text-slate-900 hover:text-cyan-600'
            }`}
          >
            SatQuery AI
          </button>

          {/* Zone 2: 4-6 nav links, 1-2 word labels, single-line */}
          <nav className={`hidden md:flex items-center gap-8 text-xs font-semibold uppercase tracking-widest ${
            theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
          }`}>
            <button onClick={handleLaunchDashboard} className={`transition-colors cursor-pointer whitespace-nowrap ${
              theme === 'dark' ? 'hover:text-cyan-400' : 'hover:text-cyan-600'
            }`}>
              Platform
            </button>
            <button onClick={() => {
              const arch = document.getElementById('architecture-pipeline');
              if (arch) arch.scrollIntoView({ behavior: 'smooth' });
            }} className={`transition-colors cursor-pointer whitespace-nowrap ${
              theme === 'dark' ? 'hover:text-cyan-400' : 'hover:text-cyan-600'
            }`}>
              Technology
            </button>
            <span className={theme === 'dark' ? 'text-slate-800' : 'text-slate-300'} aria-hidden="true">&middot;</span>
            <span className={`font-mono normal-case tracking-normal ${
              theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
            }`}>ISRO &middot; Copernicus Node</span>
          </nav>

          {/* Zone 3: 1-2 primary actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                theme === 'dark'
                  ? 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-white'
                  : 'border-slate-200 bg-white text-slate-500 hover:text-slate-800'
              }`}
              title="Toggle Theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4.5 h-4.5 text-amber-400" />
              ) : (
                <Moon className="w-4.5 h-4.5 text-slate-700" />
              )}
            </button>

            <button
              onClick={handleLaunchDashboard}
              className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-xl marigold-gradient-btn text-[#130A1D] font-bold text-xs transition-all cursor-pointer whitespace-nowrap"
            >
              <span>Initialize Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </header>
      )}

      {/* Main View Router */}
      <main className="flex-1">
        {currentView === 'landing' && (
          <LandingPage
            onLaunchDashboard={handleLaunchDashboard}
            onExploreArchitecture={() => {
              const arch = document.getElementById('architecture-pipeline');
              if (arch) arch.scrollIntoView({ behavior: 'smooth' });
            }}
            theme={theme}
          />
        )}

        {currentView === 'login' && (
          <LoginPage
            onSuccess={handleLoginSuccess}
            onBackToGateway={() => setCurrentView('gateway')}
            selectedRole={selectedRole}
            theme={theme}
          />
        )}

        {currentView === 'gateway' && (
          <GatewayPage
            onSelectRole={handleRoleSelection}
            theme={theme}
          />
        )}

        {currentView === 'dashboard' && (
          <Dashboard
            onBackToHome={() => {
              localStorage.removeItem('simulatedUser');
              setCurrentView('landing');
            }}
            initialPersona={selectedRole}
            theme={theme}
            onToggleTheme={toggleTheme}
          />
        )}

        {currentView === 'privacy' && (
          <PrivacyPage
            onBackToHome={() => {
              window.history.pushState({}, '', '/');
              setCurrentView('landing');
            }}
            theme={theme}
          />
        )}

        {currentView === 'terms' && (
          <TermsPage
            onBackToHome={() => {
              window.history.pushState({}, '', '/');
              setCurrentView('landing');
            }}
            theme={theme}
          />
        )}
      </main>
    </div>
  );
}
