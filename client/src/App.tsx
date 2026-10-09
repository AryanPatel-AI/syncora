import React, { useState, useEffect } from 'react';
import { WatchPartyProvider, useWatchParty } from './context/WatchPartyContext';
import { RoomHeader } from './components/layout/RoomHeader';
import { AppNavbar } from './components/layout/AppNavbar';
import { Sidebar } from './components/layout/Sidebar';
import { DiscoveryPage } from './pages/Discovery/DiscoveryPage';
import { StreamWatchPage } from './pages/Watch/StreamWatchPage';
import { WatchRoomPage } from './pages/Room/WatchRoomPage';
import { SavedVideosPage } from './pages/Library/SavedVideosPage';
import { HistoryPage } from './pages/Library/HistoryPage';
import { FollowingPage } from './pages/Library/FollowingPage';
import { CreatorStudioPage } from './pages/Studio/CreatorStudioPage';
import { AuthModal } from './components/auth/AuthModal';
import { CreateRoomModal } from './components/room/CreateRoomModal';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

const WatchPartyApp: React.FC = () => {
  const {
    roomId,
    currentRoute,
    activeVideoId,
    toastMessage,
    clearToast,
    isConnected,
    joinRoom,
    currentUserAccount,
  } = useWatchParty();

  // Parse invite link on initial load (?room=SYNC-XXXX or /room/SYNC-XXXX)
  useEffect(() => {
    const parseRoute = () => {
      const params = new URLSearchParams(window.location.search);
      const roomParam = params.get('room');
      const pathParts = window.location.pathname.split('/').filter(Boolean);

      const detectedCode = roomParam
        ? roomParam.toUpperCase()
        : pathParts.length >= 2 && pathParts[0] === 'room'
        ? pathParts[1].toUpperCase()
        : null;

      if (detectedCode && !roomId) {
        const username =
          currentUserAccount?.displayName ||
          currentUserAccount?.username ||
          localStorage.getItem('syncora_username') ||
          'Viewer';
        joinRoom(detectedCode, username);
      }
    };

    parseRoute();
  }, [roomId, joinRoom, currentUserAccount]);

  return (
    <div className="min-h-screen bg-[#101114] text-[#F2F0E9] flex flex-col font-sans selection:bg-[#D6F279] selection:text-[#101114]">
      {/* Top Header: RoomHeader when in room, AppNavbar when browsing platform */}
      {roomId ? (
        <RoomHeader />
      ) : (
        <AppNavbar />
      )}

      {/* Backend Disconnection Banner */}
      {!isConnected && (
        <div
          role="status"
          className="bg-[#E5A84B]/10 border-b border-[#E5A84B]/20 px-4 py-1.5 text-center text-xs font-mono text-[#E5A84B] flex items-center justify-center gap-2"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#E5A84B] animate-pulse" />
          <span>Real-time server connecting...</span>
        </div>
      )}

      {/* Floating Notification */}
      {toastMessage && (
        <div
          role="status"
          className="fixed top-18 right-4 z-50 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-[#1C1E24] shadow-2xl border border-[#282A33] text-xs font-medium max-w-sm animate-fade-in"
        >
          {toastMessage.type === 'error' && (
            <AlertCircle className="w-4 h-4 text-[#F87171] shrink-0" />
          )}
          {toastMessage.type === 'success' && (
            <CheckCircle2 className="w-4 h-4 text-[#D6F279] shrink-0" />
          )}
          {toastMessage.type === 'info' && (
            <Info className="w-4 h-4 text-[#8E919C] shrink-0" />
          )}
          <span className="flex-1 text-[#F2F0E9] leading-tight">{toastMessage.text}</span>
          <button
            onClick={clearToast}
            aria-label="Dismiss notification"
            className="p-1 rounded text-[#8E919C] hover:text-[#F2F0E9] hover:bg-[#24262E] transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Layout Area */}
      {roomId ? (
        <main className="flex-1">
          <WatchRoomPage />
        </main>
      ) : (
        <div className="flex-1 flex">
          {/* Responsive Sidebar */}
          <Sidebar />

          {/* Platform Page Content Router */}
          <main className="flex-1 min-w-0 flex flex-col overflow-y-auto">
            {activeVideoId ? (
              <StreamWatchPage videoId={activeVideoId} />
            ) : currentRoute === '/live' ? (
              <DiscoveryPage filterType="live" />
            ) : currentRoute === '/explore' || currentRoute.startsWith('/categories') ? (
              <DiscoveryPage filterType="explore" />
            ) : currentRoute === '/saved' ? (
              <SavedVideosPage />
            ) : currentRoute === '/history' ? (
              <HistoryPage />
            ) : currentRoute === '/following' ? (
              <FollowingPage />
            ) : currentRoute === '/studio' ? (
              <CreatorStudioPage />
            ) : (
              <DiscoveryPage filterType="all" />
            )}
          </main>
        </div>
      )}

      {/* Global Modals */}
      <AuthModal />
      <CreateRoomModal />
    </div>
  );
};

export default function App() {
  return (
    <WatchPartyProvider>
      <WatchPartyApp />
    </WatchPartyProvider>
  );
}
