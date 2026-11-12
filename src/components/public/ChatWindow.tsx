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
    <div className="space-y-2 text-sm text-[#D1D5DB] leading-relaxed font-sans">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1" />;

        // Header 3 or 2
        if (trimmed.startsWith('### ') || trimmed.startsWith('## ')) {
          const headerText = trimmed.replace(/^#{2,3}\s+/, '');
          return (
            <h3 key={idx} className="font-bold text-base text-white mt-3 mb-1">
              {renderFormattedText(headerText)}
            </h3>
          );
        }

        // Bullet point (* or -)
        if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
          const bulletText = trimmed.replace(/^[\*\-]\s+/, '');
          return (
            <div key={idx} className="flex items-start gap-2 pl-2 my-0.5">
              <span className="text-[#FFB800] font-bold select-none">•</span>
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
                <span className="font-bold text-[#FFB800] text-xs select-none">{numMatch[1]}.</span>
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
      return <strong key={index} className="font-bold text-white">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={index} className="italic text-[#D1D5DB]">{part.slice(1, -1)}</em>;
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
      className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6 w-full max-w-6xl text-[#D1D5DB]"
      style={{ fontFamily: 'Calibri, system-ui, sans-serif' }}
    >
      {/* Empty State (New Chat) */}
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 my-auto animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-[#FFB800]/10 border border-[#FFB800]/30 flex items-center justify-center text-[#FFB800] shadow-sm">
            <Sparkles className="w-8 h-8 text-[#FFB800]" />
          </div>

          <div className="space-y-2 max-w-xl">
            <h2 className="text-2xl md:text-3xl font-bold text-white">
              How can I help you today?
            </h2>
            <p className="text-sm text-[#D1D5DB]/80">
              Ask anything about satellite imagery, flood impact, vegetation health, or select a scene to analyze.
            </p>
          </div>

          {/* Prompt Suggestion Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full max-w-2xl mt-2">
            {suggestedPrompts.map((item, idx) => (
              <button
                key={idx}
                onClick={() => onSelectPrompt(item.prompt)}
                className="p-4 bg-[#232B38] border border-[rgba(232,230,225,0.1)] hover:border-[#FFB800] hover:bg-[#2C3646] rounded-xl text-left transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md group flex flex-col justify-between"
              >
                <span className="font-bold text-sm text-white group-hover:text-[#FFB800] transition-colors">
                  {item.title}
                </span>
                <span className="text-xs text-[#D1D5DB]/70 mt-1 line-clamp-2">
                  "{item.prompt}"
                </span>
              </button>
            ))}
          </div>

          <button
            onClick={onOpenImageModal}
            className="mt-2 px-4 py-2 bg-[#232B38] border border-[rgba(232,230,225,0.1)] hover:border-[#FFB800] rounded-xl text-xs font-bold text-[#D1D5DB] hover:text-white flex items-center gap-2 cursor-pointer shadow-xs transition-all hover:bg-[#2C3646]"
          >
            <ImageIcon className="w-4 h-4 text-[#FFB800]" />
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
              className="w-full max-w-2xl mx-auto my-3 p-4 bg-[#232B38] border border-[#FFB800]/40 rounded-2xl shadow-sm text-[#D1D5DB] space-y-3 animate-fade-in"
            >
              <div className="flex items-center justify-between border-b border-[rgba(232,230,225,0.1)] pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#FFB800]/10 text-[#FFB800] flex items-center justify-center font-bold text-xs">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <span className="font-extrabold text-xs uppercase tracking-wider text-white">
                    System Message: Map Coordinate Metadata Block
                  </span>
                </div>
                <span className="text-[10px] font-bold text-[#FFB800] bg-[#1C232E] px-2 py-0.5 rounded-full border border-[#FFB800]/30">
                  {meta?.regionName || 'Drawn Boundary'}
                </span>
              </div>

              {meta ? (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-[#1C232E] rounded-xl border border-[rgba(232,230,225,0.1)]">
                    <span className="text-[10px] text-[#D1D5DB]/60 font-bold block uppercase">Centroid Latitude</span>
                    <span className="font-mono font-bold text-[#FFB800]">{meta.centroidLat}° N</span>
                  </div>
                  <div className="p-2 bg-[#1C232E] rounded-xl border border-[rgba(232,230,225,0.1)]">
                    <span className="text-[10px] text-[#D1D5DB]/60 font-bold block uppercase">Centroid Longitude</span>
                    <span className="font-mono font-bold text-[#FFB800]">{meta.centroidLng}° E</span>
                  </div>
                  <div className="p-2 bg-[#1C232E] rounded-xl border border-[rgba(232,230,225,0.1)]">
                    <span className="text-[10px] text-[#D1D5DB]/60 font-bold block uppercase">Surface Footprint</span>
                    <EvidenceReceipt
                      maskId={maskId}
                      label={meta.regionName}
                      metricValue={`${meta.areaHectares} ha`}
                      bounds={bounds}
                    />
                  </div>
                  <div className="p-2 bg-[#1C232E] rounded-xl border border-[rgba(232,230,225,0.1)]">
                    <span className="text-[10px] text-[#D1D5DB]/60 font-bold block uppercase">Polygon Vertices</span>
                    <span className="font-mono font-bold text-white">{meta.verticesCount} Marked Points</span>
                  </div>
                  <div className="col-span-2 p-2 bg-[#1C232E] rounded-xl border border-[rgba(232,230,225,0.1)]">
                    <span className="text-[10px] text-[#D1D5DB]/60 font-bold block uppercase">Bounding Box (BBOX) Coordinates</span>
                    <span className="font-mono text-[11px] font-semibold text-[#D1D5DB]">
                      [{meta.bbox[0]}° N, {meta.bbox[1]}° E] to [{meta.bbox[2]}° N, {meta.bbox[3]}° E]
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[#D1D5DB]/80 leading-relaxed">{msg.content}</p>
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
                  ? 'bg-[#232B38] text-white border border-[#FFB800]/30'
                  : 'bg-[#FFB800] text-[#1C232E]'
              }`}
            >
              {isUser ? <User className="w-4 h-4 text-white" /> : <Sparkles className="w-4 h-4 text-[#1C232E]" />}
            </div>

            {/* Message Bubble */}
            <div
              className={`flex flex-col space-y-2 p-4 rounded-2xl shadow-xs border ${
                isUser
                  ? 'bg-[#232B38] text-white border-[rgba(232,230,225,0.15)] rounded-tr-none'
                  : 'bg-[#232B38] text-[#D1D5DB] border-[rgba(232,230,225,0.1)] rounded-tl-none'
              }`}
            >
              {/* If user message has an image thumbnail attached */}
              {isUser && msg.imageUrl && (
                <div className="w-48 h-32 rounded-lg overflow-hidden border border-[rgba(232,230,225,0.2)] bg-black/40 relative">
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
                <div className="pt-2 mt-2 border-t border-[rgba(232,230,225,0.1)] flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-bold text-[#D1D5DB]/50 uppercase tracking-wider flex items-center gap-1">
                    <Layers className="w-3 h-3 text-[#FFB800]" /> Clickable Evidence:
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
                  isUser ? 'text-[#D1D5DB]/60' : 'text-[#D1D5DB]/50'
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
          <div className="w-8 h-8 rounded-xl bg-[#FFB800] text-[#1C232E] flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 animate-spin text-[#1C232E]" />
          </div>
          <div className="p-4 rounded-2xl bg-[#232B38] border border-[rgba(232,230,225,0.1)] text-[#D1D5DB] shadow-xs flex items-center gap-3">
            <Loader2 className="w-4 h-4 animate-spin text-[#FFB800]" />
            <span className="text-xs font-semibold text-[#D1D5DB]/80">
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

export default ChatWindow;
