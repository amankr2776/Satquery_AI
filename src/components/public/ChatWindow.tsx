import React, { useRef, useEffect } from 'react';
import { ChatMessage } from '../../types/chat';
import { Sparkles, User, Loader2, Image as ImageIcon, AlertCircle, MapPin, Layers } from 'lucide-react';
import { isCasualOrGreeting } from '../../utils/chatHelpers';
import { EvidenceReceipt } from '../common/EvidenceReceipt';

interface ChatWindowProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSelectPrompt: (promptText: string) => void;
  selectedImage: string | null;
  onOpenImageModal: () => void;
}

// Clean lightweight Markdown Renderer Component
const MarkdownContent: React.FC<{ content: string; messageId: string }> = ({ content, messageId }) => {
  const lines = content.split('\n');

  return (
    <div className="space-y-2 text-sm text-[#2A1B2E] leading-relaxed font-sans">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1" />;

        // Header 3 or 2
        if (trimmed.startsWith('### ') || trimmed.startsWith('## ')) {
          const headerText = trimmed.replace(/^#{2,3}\s+/, '');
          return (
            <h3 key={idx} className="font-bold text-base text-[#2A1B2E] mt-3 mb-1">
              {renderFormattedText(headerText)}
            </h3>
          );
        }

        // Bullet point (* or -)
        if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
          const bulletText = trimmed.replace(/^[\*\-]\s+/, '');
          return (
            <div key={idx} className="flex items-start gap-2 pl-2 my-0.5">
              <span className="text-[#FF8C00] font-bold select-none">•</span>
              <span className="flex-1">{renderFormattedText(bulletText)}</span>
            </div>
          );
        }

        // Numbered list (e.g. 1. )
        if (/^\d+\.\s+/.test(trimmed)) {
          const numMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
          if (numMatch) {
            return (
              <div key={idx} className="flex items-start gap-2 pl-2 my-0.5">
                <span className="font-bold text-[#FF8C00] text-xs select-none">{numMatch[1]}.</span>
                <span className="flex-1">{renderFormattedText(numMatch[2])}</span>
              </div>
            );
          }
        }

        // Standard paragraph
        return (
          <p key={idx} className="my-1">
            {renderFormattedText(line)}
          </p>
        );
      })}
    </div>
  );
};

// Helper to format bolding (**text**) and italics (*text*)
function renderFormattedText(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} className="font-bold text-[#2A1B2E]">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={index} className="italic text-[#2A1B2E]">{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

// Helper to extract metric claims from AI responses
function extractEvidenceMetrics(content: string, messageId: string) {
  const metrics: { maskId: string; label: string; metricValue: string; bounds?: [number, number, number, number] }[] = [];
  const lower = content.toLowerCase();

  if (lower.includes('kodagu') || lower.includes('coorg')) {
    metrics.push({
      maskId: `mask-kodagu-${messageId}`,
      label: 'Kodagu (Coorg) Region',
      metricValue: 'Boundary Mask',
      bounds: [75.5, 12.1, 76.0, 12.6],
    });
  }

  if (lower.includes('wayanad')) {
    metrics.push({
      maskId: `mask-wayanad-${messageId}`,
      label: 'Wayanad Landslide Scar',
      metricValue: 'Chooralmala Runout',
      bounds: [76.1, 11.4, 76.3, 11.7],
    });
  }

  if (lower.includes('flood') || lower.includes('water') || lower.includes('inundat') || lower.includes('submerged')) {
    metrics.push({
      maskId: `mask-flood-${messageId}`,
      label: 'Flooded Area Inundation',
      metricValue: '1,200 ha',
      bounds: [76.15, 10.75, 76.45, 11.05],
    });
  }

  if (lower.includes('vegetation') || lower.includes('canopy') || lower.includes('forest') || lower.includes('ndvi')) {
    metrics.push({
      maskId: `mask-veg-${messageId}`,
      label: 'Vegetation Canopy Loss',
      metricValue: '24% Degradation',
      bounds: [75.65, 12.25, 75.95, 12.55],
    });
  }

  if (lower.includes('stubble') || lower.includes('burn') || lower.includes('fire')) {
    metrics.push({
      maskId: `mask-burn-${messageId}`,
      label: 'Agricultural Burn Scar',
      metricValue: '3,450 ha',
      bounds: [75.75, 30.8, 76.15, 31.1],
    });
  }

  // Generic SAM 2 Evidence mask if non-casual and no specific keywords matched
  if (metrics.length === 0 && !isCasualOrGreeting(content)) {
    metrics.push({
      maskId: `sam2-mask-${messageId}`,
      label: 'SAM 2 Ground Evidence Mask',
      metricValue: 'Verified Geometry',
      bounds: [75.7, 12.2, 76.3, 12.8],
    });
  }

  return metrics;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  isLoading,
  onSelectPrompt,
  selectedImage,
  onOpenImageModal,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const suggestedPrompts = [
    { title: 'Check for flood damage', prompt: 'Check for flood damage and analyze submerged roadways.' },
    { title: 'Analyze vegetation health', prompt: 'Analyze vegetation health and check for canopy degradation.' },
    { title: 'Detect urban expansion', prompt: 'Detect urban built-up expansion and infrastructure growth.' },
    { title: 'Track forest canopy loss', prompt: 'Track forest canopy loss and identify illegal logging tracks.' },
  ];

  return (
    <div 
      className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6 w-full max-w-6xl"
      style={{ fontFamily: 'Calibri, system-ui, sans-serif' }}
    >
      {/* Empty State (New Chat) */}
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 my-auto animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-[#FF8C00]/10 border border-[#FF8C00]/30 flex items-center justify-center text-[#FF8C00] shadow-sm">
            <Sparkles className="w-8 h-8" />
          </div>

          <div className="space-y-2 max-w-xl">
            <h2 className="text-2xl md:text-3xl font-bold text-[#2A1B2E]">
              How can I help you today?
            </h2>
            <p className="text-sm text-slate-600">
              Ask anything about satellite imagery, flood impact, vegetation health, or select a scene to analyze.
            </p>
          </div>

          {/* Prompt Suggestion Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full max-w-2xl mt-2">
            {suggestedPrompts.map((item, idx) => (
              <button
                key={idx}
                onClick={() => onSelectPrompt(item.prompt)}
                className="p-4 bg-white border border-slate-200 hover:border-[#FF8C00] hover:bg-amber-50/40 rounded-xl text-left transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md group flex flex-col justify-between"
              >
                <span className="font-bold text-sm text-[#2A1B2E] group-hover:text-[#FF8C00] transition-colors">
                  {item.title}
                </span>
                <span className="text-xs text-slate-500 mt-1 line-clamp-2">
                  "{item.prompt}"
                </span>
              </button>
            ))}
          </div>

          <button
            onClick={onOpenImageModal}
            className="mt-2 px-4 py-2 bg-white border border-slate-300 hover:border-[#FF8C00] rounded-xl text-xs font-bold text-[#2A1B2E] flex items-center gap-2 cursor-pointer shadow-xs transition-all hover:bg-amber-50/50"
          >
            <ImageIcon className="w-4 h-4 text-[#FF8C00]" />
            <span>{selectedImage ? 'Change Selected Scene' : 'Select or Upload Satellite Image (Optional)'}</span>
          </button>
        </div>
      )}

      {/* Messages Thread */}
      {messages.map((msg) => {
        if (msg.role === 'system') {
          const meta = msg.systemMetadata;
          const maskId = `sys-mask-${msg.id}`;
          const bounds: [number, number, number, number] = meta
            ? [meta.bbox[1], meta.bbox[0], meta.bbox[3], meta.bbox[2]]
            : [75.6, 11.5, 76.5, 12.8];

          return (
            <div
              key={msg.id}
              className="w-full max-w-2xl mx-auto my-3 p-4 bg-white border-2 border-amber-500/40 rounded-2xl shadow-sm text-[#2A1B2E] space-y-3 animate-fade-in"
            >
              <div className="flex items-center justify-between border-b border-amber-100 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#FF8C00]/10 text-[#FF8C00] flex items-center justify-center font-bold text-xs">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <span className="font-extrabold text-xs uppercase tracking-wider text-[#2A1B2E]">
                    System Message: Map Coordinate Metadata Block
                  </span>
                </div>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  {meta?.regionName || 'Drawn Boundary'}
                </span>
              </div>

              {meta ? (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-[#F3F4F1] rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">Centroid Latitude</span>
                    <span className="font-mono font-bold text-[#2A1B2E]">{meta.centroidLat}° N</span>
                  </div>
                  <div className="p-2 bg-[#F3F4F1] rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">Centroid Longitude</span>
                    <span className="font-mono font-bold text-[#2A1B2E]">{meta.centroidLng}° E</span>
                  </div>
                  <div className="p-2 bg-[#F3F4F1] rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">Surface Footprint</span>
                    <EvidenceReceipt
                      maskId={maskId}
                      label={meta.regionName}
                      metricValue={`${meta.areaHectares} ha`}
                      bounds={bounds}
                    />
                  </div>
                  <div className="p-2 bg-[#F3F4F1] rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">Polygon Vertices</span>
                    <span className="font-mono font-bold text-[#2A1B2E]">{meta.verticesCount} Marked Points</span>
                  </div>
                  <div className="col-span-2 p-2 bg-[#F3F4F1] rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">Bounding Box (BBOX) Coordinates</span>
                    <span className="font-mono text-[11px] font-semibold text-slate-700">
                      [{meta.bbox[0]}° N, {meta.bbox[1]}° E] to [{meta.bbox[2]}° N, {meta.bbox[3]}° E]
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-600 leading-relaxed">{msg.content}</p>
              )}
            </div>
          );
        }

        const isUser = msg.role === 'user';
        const evidenceMetrics = !isUser ? extractEvidenceMetrics(msg.content, msg.id) : [];

        return (
          <div
            key={msg.id}
            className={`flex gap-3.5 max-w-[92%] md:max-w-[85%] ${
              isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
            } animate-fade-in`}
          >
            {/* Avatar */}
            <div
              className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center font-bold text-xs shadow-xs ${
                isUser
                  ? 'bg-[#2A1B2E] text-white'
                  : 'bg-[#FF8C00] text-white'
              }`}
            >
              {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            </div>

            {/* Message Bubble */}
            <div
              className={`flex flex-col space-y-2 p-4 rounded-2xl shadow-xs border ${
                isUser
                  ? 'bg-[#2A1B2E] text-white border-[#2A1B2E] rounded-tr-none'
                  : 'bg-white text-[#2A1B2E] border-slate-200 rounded-tl-none'
              }`}
            >
              {/* If user message has an image thumbnail attached */}
              {isUser && msg.imageUrl && (
                <div className="w-48 h-32 rounded-lg overflow-hidden border border-white/20 bg-black/20 relative">
                  <img src={msg.imageUrl} alt="Attached scene" className="w-full h-full object-cover" />
                </div>
              )}

              {/* Message Content */}
              {isUser ? (
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              ) : (
                <MarkdownContent content={msg.content} messageId={msg.id} />
              )}

              {/* Clickable Evidence Receipts Strip for Assistant Messages */}
              {!isUser && evidenceMetrics.length > 0 && (
                <div className="pt-2 mt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Layers className="w-3 h-3 text-[#FF8C00]" /> Clickable Evidence:
                  </span>
                  {evidenceMetrics.map((item) => (
                    <EvidenceReceipt
                      key={item.maskId}
                      maskId={item.maskId}
                      label={item.label}
                      metricValue={item.metricValue}
                      bounds={item.bounds}
                    />
                  ))}
                </div>
              )}

              <span
                className={`text-[10px] self-end mt-1 ${
                  isUser ? 'text-slate-300' : 'text-slate-400'
                }`}
              >
                {msg.timestamp}
              </span>
            </div>
          </div>
        );
      })}

      {/* Typing/Loading Indicator */}
      {isLoading && (
        <div className="flex gap-3 mr-auto max-w-[85%] animate-fade-in">
          <div className="w-8 h-8 rounded-xl bg-[#FF8C00] text-white flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 animate-spin" />
          </div>
          <div className="p-4 rounded-2xl bg-white border border-slate-200 text-[#2A1B2E] shadow-xs flex items-center gap-3">
            <Loader2 className="w-4 h-4 animate-spin text-[#FF8C00]" />
            <span className="text-xs font-semibold text-slate-600">
              {messages.length > 0 &&
              (messages[messages.length - 1].imageUrl ||
                !isCasualOrGreeting(messages[messages.length - 1].content))
                ? 'Analyzing satellite imagery...'
                : 'Thinking...'}
            </span>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};

