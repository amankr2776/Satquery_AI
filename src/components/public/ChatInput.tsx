import React, { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, Plus, X, Loader2 } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  selectedImage: string | null;
  selectedImageName?: string | null;
  onRemoveImage: () => void;
  onOpenImageModal: () => void;
  isLoading: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  selectedImage,
  selectedImageName,
  onRemoveImage,
  onOpenImageModal,
  isLoading,
}) => {
  const [inputText, setInputText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-expand textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [inputText]);

  const handleSend = () => {
    if (!inputText.trim() || isLoading) return;
    onSendMessage(inputText.trim());
    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="sticky bottom-0 left-0 right-0 w-full bg-[#F3F4F1] pt-2 pb-6 px-4 md:px-8 z-20 border-t border-slate-200/80">
      <div className="w-full max-w-6xl flex flex-col bg-white border border-slate-300 rounded-2xl shadow-lg overflow-hidden transition-all duration-200 focus-within:border-[#FF8C00] focus-within:ring-2 focus-within:ring-[#FF8C00]/20">
        
        {/* Selected Image Thumbnail Preview above input */}
        {selectedImage && (
          <div className="p-3 bg-[#F3F4F1] border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-300 bg-slate-200 shrink-0 relative">
                <img src={selectedImage} alt="Selected" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-[#2A1B2E]">
                  {selectedImageName || 'Attached Satellite Scene'}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">Ready to query</span>
              </div>
            </div>
            <button
              onClick={onRemoveImage}
              className="p-1 text-slate-400 hover:text-red-500 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              title="Remove image"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Input area row */}
        <div className="flex items-end gap-2 p-3">
          <button
            onClick={onOpenImageModal}
            className="p-2.5 text-slate-500 hover:text-[#FF8C00] hover:bg-[#F3F4F1] rounded-xl transition-colors cursor-pointer shrink-0 mb-0.5"
            title="Attach or select satellite image"
          >
            <Plus className="w-5 h-5" />
          </button>

          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything (e.g. 'hii', 'check flood damage', or ask any geospatial question)..."
            rows={1}
            disabled={isLoading}
            className="flex-1 bg-transparent text-[#2A1B2E] placeholder:text-slate-400 text-sm focus:outline-none resize-none py-2 px-1 max-h-[160px] overflow-y-auto leading-relaxed"
            style={{ fontFamily: 'Calibri, system-ui, sans-serif' }}
          />

          <button
            onClick={handleSend}
            disabled={!inputText.trim() || isLoading}
            className="p-2.5 bg-[#FF8C00] hover:bg-[#e07b00] disabled:opacity-40 disabled:hover:bg-[#FF8C00] text-white rounded-xl transition-colors cursor-pointer shrink-0 shadow-sm mb-0.5 flex items-center justify-center"
            title="Send Message"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
      
      <div className="w-full max-w-6xl text-center mt-2">
        <span className="text-[11px] text-slate-500">
          SatQuery AI public model evaluates text and image pixels to produce evidence-backed answers.
        </span>
      </div>
    </div>
  );
};
