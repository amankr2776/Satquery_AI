import React, { useState, useEffect } from 'react';
import { ChatSidebar, PublicNavTab } from './ChatSidebar';
import { ChatWindow } from './ChatWindow';
import { ChatInput } from './ChatInput';
import { ImageSelectorModal } from './ImageSelectorModal';
import { SearchPlaceView } from './SearchPlaceView';
import { HistoryView } from './HistoryView';
import { HelpGuideView } from './HelpGuideView';
import { usePublicChatStore } from '../../store/usePublicChatStore';
import { SystemCoordinateMetadata } from '../../types/chat';

interface PublicHomePageProps {
  onSwitchToPro?: () => void;
}

export const PublicHomePage: React.FC<PublicHomePageProps> = ({ onSwitchToPro }) => {
  const [activeTab, setActiveTab] = useState<PublicNavTab>('chat');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const {
    messages,
    chatHistory,
    currentChatId,
    selectedImage,
    selectedImageName,
    isLoading,
    sendMessage,
    selectChatSession,
    startNewChat,
    deleteChatSession,
    setSelectedImage,
    removeSelectedImage,
    loadHistoryFromStorage,
  } = usePublicChatStore();

  useEffect(() => {
    loadHistoryFromStorage();
  }, []);

  // Select scene or drawn boundary from Search Place view
  const handleSelectScene = (
    imageUrl: string,
    title: string,
    promptText: string,
    systemMetadata?: SystemCoordinateMetadata
  ) => {
    setSelectedImage(imageUrl, title);
    setActiveTab('chat');
    sendMessage(promptText, imageUrl, systemMetadata);
  };

  return (
    <div
      className="flex h-[#100vh] h-screen w-full bg-[#F3F4F1] text-[#2A1B2E] overflow-hidden relative border-0 p-0 m-0"
      style={{ fontFamily: 'Calibri, system-ui, sans-serif' }}
    >
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#2A1B2E] text-white px-4 py-2.5 rounded-xl shadow-xl border border-amber-500/40 text-xs font-bold flex items-center gap-2 animate-slide-down">
          <span className="w-2 h-2 rounded-full bg-[#FF8C00]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Left Collapsible Sidebar */}
      <ChatSidebar
        chatHistory={chatHistory}
        currentChatId={currentChatId}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onSelectChat={(id) => {
          selectChatSession(id);
          setActiveTab('chat');
        }}
        onNewChat={() => {
          startNewChat();
          setActiveTab('chat');
        }}
        onDeleteChat={deleteChatSession}
        isOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onSwitchToPro={onSwitchToPro}
      />

      {/* Main Column View */}
      <main className="flex-1 min-w-0 flex flex-col h-full overflow-hidden relative bg-[#F3F4F1]">
        <div className={activeTab === 'chat' ? 'flex-1 flex flex-col h-full' : 'hidden'}>
          <ChatWindow
            messages={messages}
            isLoading={isLoading}
            onSelectPrompt={(prompt) => sendMessage(prompt)}
            selectedImage={selectedImage}
            onOpenImageModal={() => setImageModalOpen(true)}
          />

          <ChatInput
            onSendMessage={(text) => sendMessage(text)}
            selectedImage={selectedImage}
            selectedImageName={selectedImageName}
            onRemoveImage={removeSelectedImage}
            onOpenImageModal={() => setImageModalOpen(true)}
            isLoading={isLoading}
          />
        </div>

        <div className={activeTab === 'search-place' ? 'flex-1 h-full' : 'hidden'}>
          <SearchPlaceView 
            onSelectScene={handleSelectScene} 
            isActive={activeTab === 'search-place'}
          />
        </div>

        {activeTab === 'history' && (
          <HistoryView
            chatHistory={chatHistory}
            onSelectChat={(id) => {
              selectChatSession(id);
              setActiveTab('chat');
            }}
            onDeleteChat={deleteChatSession}
          />
        )}

        {activeTab === 'help-guide' && <HelpGuideView />}
      </main>

      {/* Modal for selecting or uploading images */}
      <ImageSelectorModal
        isOpen={imageModalOpen}
        onClose={() => setImageModalOpen(false)}
        onSelectImage={(imageUrl, title, prompt) => {
          setSelectedImage(imageUrl, title || 'Selected Scene');
          if (prompt && messages.length === 0) {
            sendMessage(prompt, imageUrl);
          }
        }}
      />
    </div>
  );
};

export default PublicHomePage;
