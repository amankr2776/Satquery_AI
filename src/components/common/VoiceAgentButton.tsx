import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Loader2, Languages, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface VoiceAgentButtonProps {
  theme: 'light' | 'dark';
  onResponseReceived?: (text: string) => void;
}

export const VoiceAgentButton: React.FC<VoiceAgentButtonProps> = ({ theme, onResponseReceived }) => {
  const [isListening, setIsListening] = useState(false);
  const [language, setLanguage] = useState<'en-US' | 'hi-IN' | 'ml-IN' | 'ta-IN'>('en-US');
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showPanel, setShowPanel] = useState(false);

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(window.speechSynthesis);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        handleQuery(text);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setTranscript('');
      recognitionRef.current.lang = language;
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const handleQuery = async (query: string) => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/satellite/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          persona: 'public',
          language: language.split('-')[0], // 'en', 'hi', 'ml', 'ta'
          // We might need to pass a default scene if none is selected, but the backend usually handles this.
        })
      });

      const data = await response.json();
      if (data.success && data.data?.publicAnalysis?.headline) {
        const reply = data.data.publicAnalysis.headline + ". " + data.data.publicAnalysis.what_is_happening;
        speak(reply);
        if (onResponseReceived) onResponseReceived(reply);
      }
    } catch (error) {
      console.error('Error sending voice query:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const speak = (text: string) => {
    if (!synthRef.current) return;
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    
    synthRef.current.speak(utterance);
  };

  const stopSpeaking = () => {
    synthRef.current?.cancel();
    setIsSpeaking(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowPanel(!showPanel)}
        className={`p-2.5 rounded-xl border transition-all flex items-center gap-2 ${
          theme === 'dark' 
            ? 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white' 
            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
        } ${showPanel ? 'ring-2 ring-emerald-500/50' : ''}`}
        title="Voice Assistant"
      >
        <Mic className={`w-5 h-5 ${isListening ? 'text-rose-500 animate-pulse' : ''}`} />
        <span className="text-xs font-bold font-mono hidden md:inline">Voice Agent</span>
      </button>

      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className={`absolute right-0 mt-3 w-72 p-4 rounded-2xl border shadow-2xl z-[100] ${
              theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-4 border-b border-slate-800/50 pb-2">
              <div className="flex items-center gap-2">
                <Languages className="w-4 h-4 text-emerald-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Language Select</span>
              </div>
              <button onClick={() => setShowPanel(false)} className="text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {(['en-US', 'hi-IN', 'ml-IN', 'ta-IN'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                    language === lang 
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' 
                      : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {lang === 'en-US' ? 'English' : lang === 'hi-IN' ? 'Hindi' : lang === 'ml-IN' ? 'Malayalam' : 'Tamil'}
                </button>
              ))}
            </div>

            <div className="flex flex-col items-center gap-4 py-4">
              <button
                onClick={toggleListening}
                disabled={isProcessing || isSpeaking}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                  isListening 
                    ? 'bg-rose-500 shadow-lg shadow-rose-500/20 animate-pulse' 
                    : 'bg-emerald-500 hover:bg-emerald-400'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isProcessing ? (
                  <Loader2 className="w-8 h-8 text-slate-950 animate-spin" />
                ) : (
                  <Mic className="w-8 h-8 text-slate-950" />
                )}
              </button>
              
              <div className="text-center space-y-1">
                <p className="text-[10px] font-mono text-slate-400 uppercase font-bold">
                  {isListening ? 'Listening...' : isProcessing ? 'Analyzing...' : isSpeaking ? 'Speaking...' : 'Click to Speak'}
                </p>
                {transcript && (
                  <p className="text-[11px] text-slate-300 italic px-2 line-clamp-2">
                    "{transcript}"
                  </p>
                )}
              </div>
            </div>

            {isSpeaking && (
              <button
                onClick={stopSpeaking}
                className="w-full mt-2 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] font-bold uppercase flex items-center justify-center gap-2 hover:bg-rose-500/20 transition-all"
              >
                <VolumeX className="w-3.5 h-3.5" />
                Stop Playback
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
