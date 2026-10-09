import React, { useState, useEffect } from 'react';
import { WatchPartyProvider, useWatchParty } from './context/WatchPartyContext';
import { Navbar } from './components/layout/Navbar';
import { HomePage } from './pages/Home/HomePage';
import { RoomPage } from './pages/Room/RoomPage';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

const WatchPartyApp: React.FC = () => {
  const { roomId, toastMessage, clearToast } = useWatchParty();
  const [isRequestsModalOpen, setIsRequestsModalOpen] = useState<boolean>(false);
  const [initialRoomCode, setInitialRoomCode] = useState<string>('');

  // Parse invite link from query param (?room=SYNC-XXXX) or path (/room/SYNC-XXXX)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setInitialRoomCode(roomParam.toUpperCase());
      return;
    }

    const pathParts = window.location.pathname.split('/').filter(Boolean);
    if (pathParts.length >= 2 && pathParts[0] === 'room') {
      setInitialRoomCode(pathParts[1].toUpperCase());
    }
  }, []);

  return (
    <div className="min-h-screen bg-brand-dark text-brand-text flex flex-col font-sans selection:bg-brand-primary selection:text-white">
      {/* Top Global Navbar */}
      <Navbar onOpenRequests={() => setIsRequestsModalOpen(true)} />

      {/* Floating Global Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl glass-panel-elevated shadow-2xl border text-xs font-semibold animate-fade-in max-w-sm">
          {toastMessage.type === 'error' && (
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          )}
          {toastMessage.type === 'success' && (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          )}
          {toastMessage.type === 'info' && (
            <Info className="w-4 h-4 text-brand-highlight flex-shrink-0" />
          )}
          <span className="flex-1 text-white">{toastMessage.text}</span>
          <button
            onClick={clearToast}
            className="p-1 rounded-md text-brand-muted hover:text-white hover:bg-brand-surface transition-all"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main View Router */}
      <div className="flex-1">
        {roomId ? (
          <RoomPage
            isRequestsModalOpen={isRequestsModalOpen}
            setIsRequestsModalOpen={setIsRequestsModalOpen}
          />
        ) : (
          <HomePage initialRoomCode={initialRoomCode} />
        )}
      </div>
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
