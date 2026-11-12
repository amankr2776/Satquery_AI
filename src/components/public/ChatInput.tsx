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
    <div className="sticky bottom-0 left-0 right-0 w-full bg-[#1C232E] pt-2 pb-6 px-4 md:px-8 z-20 border-t border-[rgba(232,230,225,0.1)]">
      <div className="w-full max-w-6xl flex flex-col bg-[#232B38] border border-[rgba(232,230,225,0.1)] rounded-2xl shadow-lg overflow-hidden transition-all duration-200 focus-within:border-[#FFB800] focus-within:ring-2 focus-within:ring-[#FFB800]/20">
        
        {/* Selected Image Thumbnail Preview above input */}
        {selectedImage && (
          <div className="p-3 bg-[#1C232E] border-b border-[rgba(232,230,225,0.1)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg overflow-hidden border border-[rgba(232,230,225,0.1)] bg-[#232B38] shrink-0 relative">
                <img src={selectedImage} alt="Selected" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white">
                  {selectedImageName || 'Attached Satellite Scene'}
                </span>
                <span className="text-[10px] text-[#D1D5DB]/60 font-medium">Ready to query</span>
              </div>
            </div>
            <button
              onClick={onRemoveImage}
              className="p-1 text-[#D1D5DB]/60 hover:text-[#FF4F1F] hover:bg-[#232B38] rounded-lg transition-colors cursor-pointer"
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
            className="p-2.5 text-[#D1D5DB]/70 hover:text-[#FFB800] hover:bg-[#1C232E] rounded-xl transition-colors cursor-pointer shrink-0 mb-0.5"
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
            className="flex-1 bg-transparent text-[#D1D5DB] placeholder:text-[#D1D5DB]/40 text-sm focus:outline-none resize-none py-2 px-1 max-h-[160px] overflow-y-auto leading-relaxed"
            style={{ fontFamily: 'Calibri, system-ui, sans-serif' }}
          />

          <button
            onClick={handleSend}
            disabled={!inputText.trim() || isLoading}
            className="p-2.5 bg-[#FFB800] hover:bg-[#FFC526] disabled:opacity-40 disabled:hover:bg-[#FFB800] text-[#1C232E] font-bold rounded-xl transition-colors cursor-pointer shrink-0 shadow-sm mb-0.5 flex items-center justify-center"
            title="Send Message"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-[#1C232E]" />
            ) : (
              <Send className="w-5 h-5 text-[#1C232E]" />
            )}
          </button>
        </div>
      </div>
      
      <div className="w-full max-w-6xl text-center mt-2">
        <span className="text-[11px] text-[#D1D5DB]/50">
          SatQuery AI public model evaluates text and image pixels to produce evidence-backed answers.
        </span>
      </div>
    </div>
  );
};

export default ChatInput;
