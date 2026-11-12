import React, { useState } from 'react';
import { z } from 'zod';
import {
  LogIn,
  Mail,
  Lock,
  ArrowLeft,
  ShieldAlert,
  Loader2,
  UserPlus,
  Briefcase,
  User,
  CheckCircle,
} from 'lucide-react';
import { 
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, signInWithGoogle } from '../services/firebase';
import { ThreeEarthHero } from './ThreeEarthHero';

interface LoginPageProps {
  onSuccess: () => void;
  onBackToGateway: () => void;
  selectedRole: 'professional' | 'public';
  theme: 'dark' | 'light';
}

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' })
});

const signupSchema = z.object({
  firstName: z.string().min(2, { message: 'First name is required' }),
  lastName: z.string().min(2, { message: 'Last name is required' }),
  designation: z.string().min(2, { message: 'Designation is required' }),
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

export const LoginPage: React.FC<LoginPageProps> = ({ 
  onSuccess, 
  onBackToGateway, 
  selectedRole, 
  theme 
}) => {
  const [isSignUp, setIsSignUp] = useState(false);

  // Form Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [designation, setDesignation] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [isCinematicTransition, setIsCinematicTransition] = useState(false);
  const [isOperationNotAllowed, setIsOperationNotAllowed] = useState(false);
  const [isUnauthorizedDomain, setIsUnauthorizedDomain] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors(null);
    setSuccessMessage(null);
    setIsOperationNotAllowed(false);

    const lowercaseEmail = email.toLowerCase().trim();

    // Secondary local storage simulation fallback
    const rawRegistry = localStorage.getItem('custom_user_registry');
    let registry = rawRegistry ? JSON.parse(rawRegistry) : [];
    if (registry.length === 0) {
      registry.push({
        firstName: 'Aman',
        lastName: 'Kumar',
        designation: 'Lead Command Operator',
        email: 'aman@satquery.ai',
        password: 'password123',
        selectedRole: 'professional',
        createdAt: new Date().toISOString()
      });
      localStorage.setItem('custom_user_registry', JSON.stringify(registry));
    }

    if (isSignUp) {
      // Validate Sign Up Fields
      const validation = signupSchema.safeParse({
        firstName,
        lastName,
        designation,
        email,
        password,
        confirmPassword
      });

      if (!validation.success) {
        setErrors(validation.error.issues[0].message);
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
        return;
      }

      setIsSubmitting(true);
      try {
        // Attempt real Firebase auth registration
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);

        // Store user details in Firestore
        try {
          await setDoc(doc(db, 'users', userCredential.user.uid), {
            firstName,
            lastName,
            designation,
            email: lowercaseEmail,
            selectedRole,
            createdAt: new Date().toISOString()
          });
        } catch (fsErr) {
          console.warn('Could not write user profile to Firestore:', fsErr);
        }

        // Force immediate sign out post sign-up
        await signOut(auth);

        // Clear forms
        setPassword('');
        setConfirmPassword('');
        setFirstName('');
        setLastName('');
        setDesignation('');

        setIsSignUp(false); // switch back to Login form
        setSuccessMessage('Satellite authorization profile created successfully! Please sign in with your credentials to access your console.');
      } catch (err: any) {
        console.error('Sign-Up Error:', err);
        
        if (err.code === 'auth/operation-not-allowed') {
          setIsOperationNotAllowed(true);
          setErrors('The "Email/Password" provider is currently disabled in your Firebase console.');
        } else {
          let msg = err.message || 'Failed to create your account.';
          if (err.code === 'auth/email-already-in-use') {
            msg = 'This email is already registered. Please sign in instead.';
          } else if (err.code === 'auth/weak-password') {
            msg = 'Password must be at least 6 characters.';
          } else if (err.code === 'auth/invalid-email') {
            msg = 'Please enter a valid email address.';
          }
          setErrors(msg);
        }

        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Validate Sign In Fields
      const validation = loginSchema.safeParse({ email, password });
      if (!validation.success) {
        setErrors(validation.error.issues[0].message);
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
        return;
      }

      setIsSubmitting(true);
      try {
        // Attempt real Firebase Auth login
        await signInWithEmailAndPassword(auth, email, password);
        
        setIsCinematicTransition(true);
        setTimeout(() => {
          onSuccess();
        }, 700);
      } catch (err: any) {
        console.error('Sign-In Error:', err);
        
        if (err.code === 'auth/operation-not-allowed') {
          setIsOperationNotAllowed(true);
          setErrors('The "Email/Password" provider is currently disabled in your Firebase console.');
        } else {
          let msg = err.message || 'Sign-In failed.';
          if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
            msg = 'Incorrect email or password. Please verify your credentials.';
          } else if (err.code === 'auth/invalid-email') {
            msg = 'Please enter a valid email address.';
          }
          setErrors(msg);
        }

        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    setErrors(null);
    setSuccessMessage(null);
    setIsUnauthorizedDomain(false);
    try {
      await signInWithGoogle();
      setIsCinematicTransition(true);
      setTimeout(() => {
        onSuccess();
      }, 700);
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      
      const errorStr = String(err.message || err.code || '');
      if (err.code === 'auth/unauthorized-domain' || errorStr.includes('unauthorized-domain')) {
        setIsUnauthorizedDomain(true);
        setErrors('The current preview domain is not authorized in your Firebase console.');
      } else {
        setErrors(err.message || 'Google Sign-In failed. Please try again.');
      }
      
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col md:flex-row ${theme === 'dark' ? 'bg-[#1C232E] text-[#F1F5F9]' : 'bg-[#FAFAF7] text-[#0F172A]'} relative overflow-hidden`}>
      {/* Left Panel (WebGL Earth + Dynamic Satellite Paths) */}
      <div className="w-full md:w-1/2 relative h-64 md:h-screen bg-gradient-to-br from-[#0c1424] via-[#090f1d] to-[#040710] flex flex-col justify-between p-8 md:p-12 border-r border-[#374151]/40 select-none">
        <div className="absolute inset-0 z-0">
          <ThreeEarthHero />
        </div>

        {/* Branding Overlay */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="inline-flex items-center gap-2.5 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/30 backdrop-blur-md text-cyan-300 text-xs font-mono">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
            Active Geospatial Link
          </div>
          
          <button 
            onClick={onBackToGateway}
            className="inline-flex items-center gap-1.5 text-xs font-semibold font-mono text-slate-400 hover:text-white transition-colors cursor-pointer bg-[#1C232E]/40 border border-[#374151]/40 px-3 py-1.5 rounded-xl backdrop-blur-md"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Switch Mode</span>
          </button>
        </div>

        <div className="relative z-10 mt-auto max-w-md">
          <h1 className="text-4xl md:text-5xl font-bold font-display text-white tracking-tight mb-2">
            SatQuery AI
          </h1>
          <p className="text-base md:text-lg text-slate-400 font-sans">
            Mission Control for Satellite Intelligence
          </p>
        </div>
      </div>

      {/* Right Panel (Registration & Login forms) */}
      <div className={`w-full md:w-1/2 flex items-center justify-center p-6 ${theme === 'dark' ? 'bg-[#1C232E]' : 'bg-[#F8FAFC]'} md:h-screen relative z-10 overflow-y-auto`}>
        <div
          className={`w-full max-w-[440px] my-8 p-8 rounded-2xl glass-ice-silver ${
            theme === 'dark'
              ? 'text-[#F1F5F9]'
              : 'bg-white border-[#CBD5E1] text-[#1C232E]'
          } border backdrop-blur-xl shadow-2xl transition-all duration-700 ${
            isCinematicTransition ? 'scale-[1.5] opacity-0 blur-lg pointer-events-none' : ''
          } ${isShaking ? 'animate-[shake_0.4s_ease-in-out_infinite]' : ''}`}
        >
          {/* Top Logo & Mode Indicator */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-xl gold-gradient-btn flex items-center justify-center text-[#1C232E] font-bold text-xl mx-auto shadow-md shadow-[#FFB800]/25 mb-4">
              SQ
            </div>
            
            {/* Displaying selected perspective badge */}
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider mb-2.5 ${
              selectedRole === 'professional' 
                ? 'bg-[#FFB800]/20 border border-[#FFB800]/40 text-[#FFB800]' 
                : 'bg-emerald-950/60 border border-[#FFB800]/30 text-[#FFB800]'
            }`}>
              <span>{selectedRole} perspective terminal</span>
            </div>

            <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'} tracking-tight`}>
              {isSignUp ? 'Request Orbital Account' : 'Authenticate Credentials'}
            </h2>
            <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} font-sans mt-1`}>
              {isSignUp 
                ? 'Fill out the form below to configure your user telemetry profile.' 
                : 'Sign in to access your authorized monitoring instruments.'}
            </p>
          </div>

          <div className="space-y-4">
            {/* Google Authentication (available on both forms) */}
            {!isSignUp && (
              <>
                <button
                  onClick={handleGoogleSignIn}
                  disabled={isSubmitting}
                  className={`w-full py-3 px-4 rounded-xl border ${
                    theme === 'dark' ? 'border-[#374151] bg-white hover:bg-slate-50 text-slate-950' : 'border-slate-300 bg-white hover:bg-slate-50 text-slate-950'
                  } font-bold text-sm transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50`}
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.866-3.577-7.866-8s3.536-8 7.866-8c2.46 0 4.105 1.025 5.047 1.926l3.245-3.125C18.465 1.83 15.62 1 12.24 1 6.033 1 12.24s5.033 11.24 11.24 11.24c6.478 0 10.793-4.537 10.793-10.985 0-.74-.08-1.305-.18-1.78l-10.613-.01Z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>

                <div className="relative flex py-1 items-center">
                  <div className={`flex-grow border-t ${theme === 'dark' ? 'border-[#374151]/80' : 'border-slate-200'}`}></div>
                  <span className={`flex-shrink mx-4 text-[9px] font-mono ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'} uppercase tracking-wider`}>
                    or enter email credentials
                  </span>
                  <div className={`flex-grow border-t ${theme === 'dark' ? 'border-[#374151]/40' : 'border-slate-200'}`}></div>
                </div>
              </>
            )}

            {/* Custom Unified Auth Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              {isSignUp && (
                <div className="space-y-3">
                  {/* First Name & Last Name Input Group */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <User className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        placeholder="First Name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        disabled={isSubmitting}
                        required
                        className={`w-full pl-9 pr-3 py-3 rounded-xl border ${
                          theme === 'dark'
                            ? 'border-[#374151] bg-[#1C232E]/60 text-white placeholder-slate-500'
                            : 'border-slate-300 bg-white text-slate-900 placeholder-slate-400'
                        } text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all`}
                      />
                    </div>
                    <div className="relative">
                      <User className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Last Name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        disabled={isSubmitting}
                        required
                        className={`w-full pl-9 pr-3 py-3 rounded-xl border ${
                          theme === 'dark'
                            ? 'border-[#374151] bg-[#1C232E]/60 text-white placeholder-slate-500'
                            : 'border-slate-300 bg-white text-slate-900 placeholder-slate-400'
                        } text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all`}
                      />
                    </div>
                  </div>

                  {/* Designation Input */}
                  <div className="relative">
                    <Briefcase className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Designation (e.g., Lead Intelligence Analyst)"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      disabled={isSubmitting}
                      required
                      className={`w-full pl-10 pr-4 py-3 rounded-xl border ${
                        theme === 'dark'
                          ? 'border-[#374151] bg-[#1C232E]/60 text-white placeholder-slate-500'
                          : 'border-slate-300 bg-white text-slate-900 placeholder-slate-400'
                      } text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all`}
                    />
                  </div>
                </div>
              )}

              {/* Email Address Input */}
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-500" />
                <input
                  type="email"
                  placeholder="Professional Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  required
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border ${
                    theme === 'dark'
                      ? 'border-[#374151] bg-[#1C232E]/60 text-white placeholder-slate-500 focus:ring-cyan-500'
                      : 'border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:ring-cyan-600'
                  } text-sm focus:outline-none focus:ring-2 transition-all`}
                />
              </div>

              {/* Password Input */}
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-500" />
                <input
                  type="password"
                  placeholder={isSignUp ? "New Password (min. 6 chars)" : "Enter Password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  required
                  minLength={6}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border ${
                    theme === 'dark'
                      ? 'border-[#374151] bg-[#1C232E]/60 text-white placeholder-slate-500 focus:ring-cyan-500'
                      : 'border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:ring-cyan-600'
                  } text-sm focus:outline-none focus:ring-2 transition-all`}
                />
              </div>

              {/* Confirm Password Input (Only on Sign Up mode) */}
              {isSignUp && (
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-500" />
                  <input
                    type="password"
                    placeholder="Confirm New Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isSubmitting}
                    required
                    minLength={6}
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border ${
                      theme === 'dark'
                        ? 'border-[#374151] bg-[#1C232E]/60 text-white placeholder-slate-500 focus:ring-cyan-500'
                        : 'border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:ring-cyan-600'
                    } text-sm focus:outline-none focus:ring-2 transition-all`}
                  />
                </div>
              )}

              {/* Action Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !email.trim() || !password.trim() || (isSignUp && (!confirmPassword.trim() || !firstName.trim() || !lastName.trim() || !designation.trim()))}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-cyan-500/15 disabled:opacity-50 mt-2"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isSignUp ? (
                  <>
                    <span>Submit & Create Account</span>
                    <UserPlus className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <span>Verify and Access Console</span>
                    <LogIn className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Account State Toggles */}
              <div className="text-center pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setErrors(null);
                    setSuccessMessage(null);
                  }}
                  className={`text-xs ${
                    theme === 'dark' ? 'text-[#1F4BFF] hover:text-cyan-300' : 'text-[#1F4BFF] hover:text-cyan-700'
                  } font-semibold transition-all hover:underline`}
                >
                  {isSignUp 
                    ? 'Already have an orbital account? Return to Sign In' 
                    : "Don't have credentials? Register Profile"}
                </button>
              </div>
            </form>

            {/* Success Message Banner */}
            {successMessage && (
              <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-[#FFB800]/40 text-[#FFB800] text-xs flex items-start gap-2.5 mt-4">
                <CheckCircle className="w-4.5 h-4.5 text-[#FFB800] shrink-0 mt-0.5" />
                <span className="leading-relaxed">{successMessage}</span>
              </div>
            )}

            {/* Validation Errors Overlay */}
            {errors && !isOperationNotAllowed && !isUnauthorizedDomain && (
              <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2.5 mt-4 animate-pulse">
                <ShieldAlert className="w-4.5 h-4.5 text-rose-400 shrink-0" />
                <span>{errors}</span>
              </div>
            )}

            {/* Custom friendly display for auth/operation-not-allowed */}
            {isOperationNotAllowed && (
              <div className="p-4 rounded-xl bg-amber-950/50 border border-[#FFB800]/40 text-amber-200 text-xs mt-4 flex flex-col gap-3">
                <div className="flex items-start gap-2.5">
                  <ShieldAlert className="w-5 h-5 text-[#FFB800] shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold text-amber-300">Firebase Auth Provider Disabled</p>
                    <p className="leading-relaxed text-slate-300">
                      Email/Password accounts are currently disabled on your cloud project. To activate this permanently:
                    </p>
                    <ol className="list-decimal pl-4 space-y-1 text-[11px] text-slate-400 font-mono">
                      <li>Go to the <span className="text-[#FFB800] font-semibold">Firebase Console</span></li>
                      <li>Click <span className="text-[#FFB800] font-semibold">Authentication</span> &rarr; <span className="text-[#FFB800] font-semibold">Sign-in method</span></li>
                      <li>Enable <span className="text-[#FFB800] font-semibold">Email/Password</span> and click Save.</li>
                    </ol>
                  </div>
                </div>
                
                <div className="pt-2.5 border-t border-[#FFB800]/20 flex flex-col gap-2">
                  <p className="text-[10px] text-slate-400">
                    Alternatively, bypass the cloud configuration block entirely to test the app right now:
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      // Login using local simulated fallback session details so they are never blocked!
                      localStorage.setItem('simulatedUser', JSON.stringify({
                        firstName: firstName || 'Aman',
                        lastName: lastName || 'Kumar',
                        designation: designation || 'Lead Operator',
                        email: email || 'aman@satquery.ai',
                        selectedRole: selectedRole
                      }));
                      setSuccessMessage('Bypassing credentials check. Initializing telemetry console...');
                      setIsCinematicTransition(true);
                      setTimeout(() => {
                        onSuccess();
                      }, 700);
                    }}
                    className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 text-xs font-bold font-mono transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/10"
                  >
                    <span>Activate Sandboxed Simulation Mode</span>
                    <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
                  </button>
                </div>
              </div>
            )}

            {/* Custom friendly display for auth/unauthorized-domain */}
            {isUnauthorizedDomain && (
              <div className="p-4 rounded-xl bg-orange-950/50 border border-orange-500/40 text-orange-200 text-xs mt-4 flex flex-col gap-3">
                <div className="flex items-start gap-2.5">
                  <ShieldAlert className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold text-orange-300">Firebase Unauthorized Domain</p>
                    <p className="leading-relaxed text-slate-300 text-[11px]">
                      Your preview domain is not listed in your Firebase project's authorized domains list. To resolve this:
                    </p>
                    <ol className="list-decimal pl-4 space-y-1 text-[11px] text-slate-400 font-mono">
                      <li>Go to <span className="text-orange-400 font-semibold">Firebase Console</span></li>
                      <li>Go to <span className="text-orange-400 font-semibold">Authentication</span> &rarr; <span className="text-orange-400 font-semibold">Settings</span></li>
                      <li>In <span className="text-orange-400 font-semibold">Authorized domains</span>, add these two entries:
                        <div className="mt-1 bg-black/40 p-1.5 rounded select-all text-orange-300 text-[10px] space-y-1">
                          <div>ais-dev-zj4l3lj7ebfzvwxgtvl2xo-344911589567.asia-east1.run.app</div>
                          <div>ais-pre-zj4l3lj7ebfzvwxgtvl2xo-344911589567.asia-east1.run.app</div>
                        </div>
                      </li>
                    </ol>
                  </div>
                </div>
                
                <div className="pt-2.5 border-t border-orange-500/20 flex flex-col gap-2">
                  <p className="text-[10px] text-slate-400">
                    Alternatively, bypass this Google domain restriction immediately to log in with a simulated account:
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.setItem('simulatedUser', JSON.stringify({
                        firstName: 'Aman',
                        lastName: 'Kumar',
                        designation: 'Lead Satellite Specialist',
                        email: 'amankr87000@gmail.com',
                        selectedRole: selectedRole
                      }));
                      setSuccessMessage('Bypassing domain authorization. Initializing telemetry console...');
                      setIsCinematicTransition(true);
                      setTimeout(() => {
                        onSuccess();
                      }, 700);
                    }}
                    className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 text-xs font-bold font-mono transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-orange-500/10"
                  >
                    <span>Log in as Simulated user (amankr87000@gmail.com)</span>
                    <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
                  </button>
                </div>
              </div>
            )}

            {/* Developer Sandbox Mode Bypass */}
            <div className="text-center pt-3 border-t border-[#374151]/40 mt-6">
              <button
                type="button"
                onClick={() => {
                  setSuccessMessage('Initializing Sandboxed Simulation Terminal...');
                  setIsCinematicTransition(true);
                  setTimeout(() => {
                    onSuccess();
                  }, 800);
                }}
                className={`text-[10px] font-mono tracking-wider ${
                  theme === 'dark' ? 'text-[#FFB800] hover:text-[#FFB800]' : 'text-[#FFB800] hover:text-[#FFB800]'
                } font-bold transition-all hover:underline cursor-pointer`}
              >
                ⚡ Sandbox Mode (Bypass Auth Guard for Testing)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Styled shake animation for failure */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
};
