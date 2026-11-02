import React from 'react';
import { 
  Plus, 
  MessageSquare, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  SlidersHorizontal,
  MapPin,
  History,
  BookOpen
} from 'lucide-react';
import { ChatSession } from '../../types/chat';

export type PublicNavTab = 'chat' | 'search-place' | 'history' | 'help-guide';

interface ChatSidebarProps {
  chatHistory: ChatSession[];
  currentChatId: string | null;
  activeTab: PublicNavTab;
  onSelectTab: (tab: PublicNavTab) => void;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  isOpen: boolean;
  onToggleSidebar: () => void;
  onSwitchToPro?: () => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  chatHistory,
  currentChatId,
  activeTab,
  onSelectTab,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  isOpen,
  onToggleSidebar,
  onSwitchToPro,
}) => {
  return (
    <>
      {/* Sidebar Container */}
      <aside
        className={`fixed md:relative z-30 h-full bg-[#EBECE8] border-r border-slate-300/80 transition-all duration-300 flex flex-col shrink-0 ${
          isOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full md:w-16 md:translate-x-0'
        }`}
        style={{ fontFamily: 'Calibri, system-ui, sans-serif' }}
      >
        {/* Toggle Button */}
        <button
          onClick={onToggleSidebar}
          className="absolute -right-3 top-6 p-1 bg-white border border-slate-300 rounded-full text-slate-600 hover:text-[#2A1B2E] shadow-sm z-40 cursor-pointer hidden md:flex"
          title={isOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
        >
          {isOpen ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>

        {/* Top Branding & New Chat Button */}
        <div className="p-3 border-b border-slate-300/60 flex flex-col gap-2 shrink-0">
          {isOpen ? (
            <>
              <div className="flex items-center justify-between px-2 py-1">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-[#FF8C00] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-sm text-[#2A1B2E] tracking-tight">SatQuery AI</span>
                    <span className="text-[10px] uppercase font-bold text-[#FF8C00] tracking-wider -mt-1">Public Citizen</span>
                  </div>
                </div>
              </div>
              <button
                onClick={onNewChat}
                className="w-full py-2.5 px-3 bg-[#FF8C00] hover:bg-[#e07b00] text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>New Chat</span>
              </button>
            </>
          ) : (
            <button
              onClick={onNewChat}
              className="w-10 h-10 mx-auto bg-[#FF8C00] hover:bg-[#e07b00] text-white rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center"
              title="New Chat"
            >
              <Plus className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Section */}
        <div className="p-2 border-b border-slate-300/60 space-y-1 shrink-0">
          <button
            onClick={() => {
              onSelectTab('chat');
              if (chatHistory.length > 0 && !currentChatId) {
                onSelectChat(chatHistory[0].id);
              }
            }}
            className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'chat'
                ? 'bg-white text-[#2A1B2E] shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:bg-slate-200/60 hover:text-[#2A1B2E]'
            } ${!isOpen ? 'justify-center p-2.5' : ''}`}
            title="Chat Assistant"
          >
            <MessageSquare className={`w-4 h-4 shrink-0 ${activeTab === 'chat' ? 'text-[#FF8C00]' : 'text-slate-500'}`} />
            {isOpen && <span>Chat</span>}
          </button>

          <button
            onClick={() => onSelectTab('search-place')}
            className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'search-place'
                ? 'bg-white text-[#2A1B2E] shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:bg-slate-200/60 hover:text-[#2A1B2E]'
            } ${!isOpen ? 'justify-center p-2.5' : ''}`}
            title="Search Place"
          >
            <MapPin className={`w-4 h-4 shrink-0 ${activeTab === 'search-place' ? 'text-[#FF8C00]' : 'text-slate-500'}`} />
            {isOpen && <span>Search Place</span>}
          </button>

          <button
            onClick={() => onSelectTab('history')}
            className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-white text-[#2A1B2E] shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:bg-slate-200/60 hover:text-[#2A1B2E]'
            } ${!isOpen ? 'justify-center p-2.5' : ''}`}
            title="My History"
          >
            <History className={`w-4 h-4 shrink-0 ${activeTab === 'history' ? 'text-[#FF8C00]' : 'text-slate-500'}`} />
            {isOpen && <span>My History</span>}
          </button>

          <button
            onClick={() => onSelectTab('help-guide')}
            className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'help-guide'
                ? 'bg-white text-[#2A1B2E] shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:bg-slate-200/60 hover:text-[#2A1B2E]'
            } ${!isOpen ? 'justify-center p-2.5' : ''}`}
            title="Help Guide"
          >
            <BookOpen className={`w-4 h-4 shrink-0 ${activeTab === 'help-guide' ? 'text-[#FF8C00]' : 'text-slate-500'}`} />
            {isOpen && <span>Help Guide</span>}
          </button>
        </div>

        {/* Chat Sessions History List */}
        <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1">
          {isOpen && (
            <div className="px-2 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Recent Chats
            </div>
          )}

          {chatHistory.length === 0 ? (
            isOpen && (
              <div className="px-2 py-3 text-xs text-slate-500 italic text-center">
                No recent chats
              </div>
            )
          ) : (
            chatHistory.map((session) => {
              const isActive = session.id === currentChatId && activeTab === 'chat';

              return (
                <div
                  key={session.id}
                  onClick={() => {
                    onSelectChat(session.id);
                    onSelectTab('chat');
                  }}
                  className={`group relative flex items-center gap-2 p-2 rounded-xl cursor-pointer transition-colors text-xs font-semibold ${
                    isActive
                      ? 'bg-white text-[#2A1B2E] shadow-xs border border-slate-200'
                      : 'text-slate-700 hover:bg-slate-200/70 hover:text-[#2A1B2E]'
                  }`}
                  title={session.title}
                >
                  <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[#FF8C00]' : 'text-slate-400'}`} />
                  
                  {isOpen && (
                    <>
                      <span className="flex-1 truncate text-xs">{session.title}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteChat(session.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded transition-all cursor-pointer"
                        title="Delete Session"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Option: Switch to Professional View */}
        {onSwitchToPro && (
          <div className="p-3 border-t border-slate-300/60 shrink-0">
            <button
              onClick={onSwitchToPro}
              className={`w-full py-2.5 px-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-[#2A1B2E] text-xs font-bold transition-all flex items-center justify-between cursor-pointer shadow-xs ${
                !isOpen ? 'justify-center p-2.5' : ''
              }`}
              title="Switch to Professional View"
            >
              <span className="flex items-center gap-2 truncate">
                <SlidersHorizontal className="w-4 h-4 text-[#FF8C00] shrink-0" />
                {isOpen && <span className="truncate">Professional View</span>}
              </span>
              {isOpen && <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
            </button>
          </div>
        )}
      </aside>

      {/* Backdrop overlay for mobile when sidebar is open */}
      {isOpen && (
        <div
          onClick={onToggleSidebar}
          className="fixed inset-0 bg-black/30 z-20 md:hidden"
        />
      )}
    </>
  );
};
