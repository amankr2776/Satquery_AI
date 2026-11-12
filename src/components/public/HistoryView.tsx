import React from 'react';
import { History, MessageSquare, Trash2, ArrowRight, Sparkles } from 'lucide-react';
import { ChatSession } from '../../types/chat';

interface HistoryViewProps {
  chatHistory: ChatSession[];
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  chatHistory,
  onSelectChat,
  onDeleteChat,
}) => {
  return (
    <div className="flex-1 h-full overflow-y-auto p-6 md:p-10 max-w-4xl mx-auto space-y-6 font-sans">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#FFB800]/10 text-[#FFB800] rounded-xl">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1C232E]">My Analysis History</h1>
            <p className="text-xs text-slate-500">Your past satellite imagery queries and AI analysis sessions.</p>
          </div>
        </div>
      </div>

      {chatHistory.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl p-8 space-y-3">
          <MessageSquare className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-sm text-[#1C232E]">No history saved yet</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            When you ask questions about satellite imagery, your sessions will automatically be recorded here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {chatHistory.map((session) => {
            const firstUserMsg = session.messages.find(m => m.role === 'user');
            const lastMsg = session.messages[session.messages.length - 1];

            return (
              <div
                key={session.id}
                onClick={() => onSelectChat(session.id)}
                className="p-5 bg-white border border-slate-200 hover:border-[#FFB800] rounded-2xl shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group"
              >
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  {session.selectedImage ? (
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-200 shrink-0 border border-slate-300">
                      <img src={session.selectedImage} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-[#FFB800]/10 text-[#FFB800] flex items-center justify-center shrink-0">
                      <Sparkles className="w-5 h-5" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-[#1C232E] group-hover:text-[#FFB800] transition-colors truncate">
                      {session.title}
                    </h3>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      {new Date(session.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} • {session.messages.length} messages
                    </span>
                    {lastMsg && (
                      <p className="text-xs text-slate-600 line-clamp-1 mt-1 font-sans">
                        {lastMsg.content}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteChat(session.id);
                    }}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    title="Delete session"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button className="px-4 py-2 bg-[#FFB800] hover:bg-[#ffc526] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs">
                    <span>Resume</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
