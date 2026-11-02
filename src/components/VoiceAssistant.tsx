import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Loader2, Sparkles, X, AlertCircle } from 'lucide-react';

interface VoiceAssistantProps {
  theme: 'light' | 'dark';
}

export function VoiceAssistant({ theme }: VoiceAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'ready' | 'listening' | 'speaking' | 'error'>('disconnected');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const nextPlayTimeRef = useRef<number>(0);

  // Sound wave bar heights for visual feedback
  const [soundBars, setSoundBars] = useState<number[]>([15, 15, 15, 15, 15, 15, 15, 15, 15, 15]);

  // Handle visual wave animations based on status
  useEffect(() => {
    let interval: any;
    if (status === 'listening' || status === 'speaking') {
      interval = setInterval(() => {
        setSoundBars(Array.from({ length: 10 }, () => Math.floor(Math.random() * 45) + 10));
      }, 100);
    } else {
      setSoundBars([15, 15, 15, 15, 15, 15, 15, 15, 15, 15]);
    }
    return () => clearInterval(interval);
  }, [status]);

  // Convert Float32Array PCM to 16-bit Signed Integer Base64
  function pcmToBase64(float32Array: Float32Array): string {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      const val = s < 0 ? s * 0x8000 : s * 0x7FFF;
      view.setInt16(i * 2, val, true); // Little-endian
    }
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  // Play PCM 24kHz chunk received from model
  function playAudioChunk(audioCtx: AudioContext, base64PCM: string) {
    if (isMuted) return;

    try {
      const binaryString = atob(base64PCM);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const int16Array = new Int16Array(bytes.buffer);
      const float32Array = new Float32Array(int16Array.length);
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768;
      }

      const buffer = audioCtx.createBuffer(1, float32Array.length, 24000);
      buffer.copyToChannel(float32Array, 0);

      const sourceNode = audioCtx.createBufferSource();
      sourceNode.buffer = buffer;
      sourceNode.connect(audioCtx.destination);

      const currentTime = audioCtx.currentTime;
      if (nextPlayTimeRef.current < currentTime) {
        nextPlayTimeRef.current = currentTime;
      }

      sourceNode.start(nextPlayTimeRef.current);
      nextPlayTimeRef.current += buffer.duration;

      // Keep track of active source nodes to interrupt them if needed
      activeSourcesRef.current.push(sourceNode);
      sourceNode.onended = () => {
        activeSourcesRef.current = activeSourcesRef.current.filter(node => node !== sourceNode);
        if (activeSourcesRef.current.length === 0 && status === 'speaking') {
          setStatus('ready');
        }
      };

      setStatus('speaking');
    } catch (e) {
      console.error("Failed to play audio chunk:", e);
    }
  }

  // Clear all pending and playing audio chunks
  function stopAndClearPlayback() {
    activeSourcesRef.current.forEach(source => {
      try {
        source.stop();
      } catch (e) {}
    });
    activeSourcesRef.current = [];
    nextPlayTimeRef.current = 0;
    if (status === 'speaking') {
      setStatus('ready');
    }
  }

  const startVoiceSession = async () => {
    setStatus('connecting');
    setErrorMessage(null);

    try {
      // 1. Get Microphone Media Stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      // 2. Initialize Audio Contexts
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      inputAudioCtxRef.current = inputCtx;
      outputAudioCtxRef.current = outputCtx;

      // 3. Setup WebSocket connection
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/live`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus('ready');

        // Setup microphone processor once WebSocket is connected
        const source = inputCtx.createMediaStreamSource(stream);
        const processor = inputCtx.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        source.connect(processor);
        processor.connect(inputCtx.destination);

        processor.onaudioprocess = (e) => {
          if (ws.readyState === WebSocket.OPEN && status !== 'speaking') {
            const channelData = e.inputBuffer.getChannelData(0);
            const base64PCM = pcmToBase64(channelData);
            ws.send(JSON.stringify({ audio: base64PCM }));
            setStatus('listening');
          }
        };
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.error) {
            setErrorMessage(msg.error);
            setStatus('error');
            disconnectVoiceSession();
          } else if (msg.audio) {
            playAudioChunk(outputCtx, msg.audio);
          } else if (msg.interrupted) {
            stopAndClearPlayback();
          }
        } catch (e) {
          console.error("Error reading WebSocket payload:", e);
        }
      };

      ws.onerror = (e) => {
        console.error("Live WebSocket error:", e);
        setErrorMessage("WebSocket connection encountered an error.");
        setStatus('error');
      };

      ws.onclose = () => {
        if (status !== 'error') {
          setStatus('disconnected');
        }
      };

    } catch (err: any) {
      console.error("Failed to start voice assistant:", err);
      setErrorMessage(err.message || "Microphone access denied or connection failed.");
      setStatus('error');
    }
  };

  const disconnectVoiceSession = () => {
    // 1. Close WebSocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    // 2. Stop mic capture processor and track streams
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }

    // 3. Stop playbacks
    stopAndClearPlayback();

    // 4. Close contexts
    if (inputAudioCtxRef.current) {
      inputAudioCtxRef.current.close();
      inputAudioCtxRef.current = null;
    }
    if (outputAudioCtxRef.current) {
      outputAudioCtxRef.current.close();
      outputAudioCtxRef.current = null;
    }

    setStatus('disconnected');
  };

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return (
    <div className="relative">
      {/* Floating Sparkle Activate Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-emerald-500 to-teal-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 hover:shadow-cyan-400/40 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
        aria-label="Toggle Voice Assistant Panel"
      >
        <Sparkles className="w-4 h-4 animate-pulse text-slate-950" />
        <span className="hidden sm:inline">SatQuery Live Voice</span>
      </button>

      {/* Floating Card UI */}
      {isOpen && (
        <div className={`absolute right-0 mt-3 w-80 rounded-2xl border p-5 shadow-2xl z-50 ${
          theme === 'dark' 
            ? 'bg-[#131A2A] border-[#263045] text-white shadow-cyan-950/20' 
            : 'bg-white border-slate-200 text-slate-800 shadow-slate-300/40'
        } transition-all animate-in fade-in slide-in-from-top-3 duration-240`}>
          <div className="flex items-center justify-between border-b pb-3 mb-4 border-slate-800/40">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="font-bold text-sm tracking-tight flex items-center gap-1.5">
                <span>Mission Voice Agent</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400">Live 3.8</span>
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Assistant Status Indicator */}
          <div className="flex flex-col items-center justify-center py-6">
            <div className="relative flex items-center justify-center w-20 h-20 mb-4 rounded-full bg-slate-800/40 border border-slate-700/60">
              {status === 'connecting' ? (
                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
              ) : status === 'ready' || status === 'listening' || status === 'speaking' ? (
                <div className="flex items-end gap-[3px] h-10">
                  {soundBars.map((height, i) => (
                    <div
                      key={i}
                      className="w-1.5 rounded-full bg-gradient-to-t from-cyan-400 to-emerald-400 transition-all duration-100"
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
              ) : (
                <MicOff className="w-8 h-8 text-slate-500" />
              )}
            </div>

            {/* Helper Text */}
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-1">
              {status === 'disconnected' && 'Disconnected'}
              {status === 'connecting' && 'Connecting...'}
              {status === 'ready' && 'Ready — Listening...'}
              {status === 'listening' && 'Listening to Mic'}
              {status === 'speaking' && 'Speaking...'}
              {status === 'error' && 'Connection Error'}
            </span>

            <span className="text-[11px] text-slate-400 text-center px-4 max-h-12 overflow-hidden">
              {status === 'disconnected' && 'Ask satellite questions, or discuss Kerala landslides verbally.'}
              {status === 'ready' && 'Start speaking or ask a question.'}
              {status === 'listening' && 'Streaming sound waveforms.'}
              {status === 'speaking' && 'Streaming high-fidelity synthesized response.'}
              {status === 'error' && (errorMessage || 'Connection failed.')}
            </span>
          </div>

          {/* Action Control Panel */}
          <div className="flex items-center gap-3 mt-2 border-t pt-4 border-slate-800/40">
            {status === 'disconnected' || status === 'error' ? (
              <button
                onClick={startVoiceSession}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-bold text-xs hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Connect Microphone</span>
              </button>
            ) : (
              <>
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isMuted 
                      ? 'bg-rose-500/15 border-rose-500/40 text-rose-400' 
                      : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:text-white'
                  }`}
                  title={isMuted ? 'Unmute Playback' : 'Mute Playback'}
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={disconnectVoiceSession}
                  className="flex-1 py-2.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 font-semibold text-xs hover:bg-rose-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Stop Assistant</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
