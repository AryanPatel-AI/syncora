import React, { useState } from 'react';
import { useWatchParty } from '../context/WatchPartyContext';
import { YouTubePlayer } from '../components/YouTubePlayer';
import { VideoControls } from '../components/VideoControls';
import { ParticipantList } from '../components/ParticipantList';
import { ChatPanel } from '../components/ChatPanel';
import { ReactionsOverlay } from '../components/ReactionsOverlay';
import { VideoSelectorModal } from '../components/VideoSelectorModal';
import { ControlRequestsModal } from '../components/ControlRequestsModal';
import { SyncBadge } from '../components/SyncBadge';
import { MessageSquare, Users, Sparkles } from 'lucide-react';

interface RoomPageProps {
  isRequestsModalOpen: boolean;
  setIsRequestsModalOpen: (open: boolean) => void;
}

export const RoomPage: React.FC<RoomPageProps> = ({
  isRequestsModalOpen,
  setIsRequestsModalOpen,
}) => {
  const {
    roomId,
    playback,
    reactions,
    syncStatus,
    isConnected,
    participants,
  } = useWatchParty();

  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [playerInstance, setPlayerInstance] = useState<any>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState<boolean>(false);
  const [mobileTab, setMobileTab] = useState<'chat' | 'participants'>('chat');

  const handleProgress = (current: number, total: number) => {
    setCurrentTime(current);
    if (total > 0) {
      setDuration(total);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 flex flex-col gap-4">
      {/* Mobile Top Status Row */}
      <div className="flex md:hidden items-center justify-between px-1">
        <SyncBadge status={syncStatus} isConnected={isConnected} />
        <span className="text-xs text-brand-muted">
          Video ID: <code className="text-brand-highlight">{playback.videoId}</code>
        </span>
      </div>

      {/* Main Grid: Player Stage (Left 8 cols) + Sidebar (Right 4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Video Stage & Controls */}
        <section className="lg:col-span-8 flex flex-col gap-4">
          {/* Video Player Box with Floating Reactions */}
          <div className="relative">
            <YouTubePlayer
              onProgress={handleProgress}
              playerRefCallback={(player) => setPlayerInstance(player)}
            />
            {/* Reactions Overlay */}
            <ReactionsOverlay reactions={reactions} />
          </div>

          {/* Synchronized Playback Controls */}
          <VideoControls
            currentTime={currentTime}
            duration={duration}
            playerRef={playerInstance}
            onOpenVideoSelector={() => setIsVideoModalOpen(true)}
          />

          {/* Video Info Card */}
          <div className="glass-panel rounded-2xl p-4 flex items-center justify-between border border-brand-border/60">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-brand-primary/20 text-brand-highlight">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Room Active Stream</span>
                  <span className="px-2 py-0.5 rounded-full bg-brand-card text-[11px] font-mono text-brand-highlight border border-brand-border">
                    {playback.videoId}
                  </span>
                </h3>
                <p className="text-xs text-brand-muted">
                  State: <span className="capitalize font-medium text-brand-highlight">{playback.playState}</span> · Updated by {playback.updatedBy.username}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsVideoModalOpen(true)}
              className="text-xs font-semibold text-brand-highlight hover:text-white px-3 py-1.5 rounded-xl bg-brand-surface hover:bg-brand-card border border-brand-border/60 transition-all hidden sm:block"
            >
              Browse Videos
            </button>
          </div>
        </section>

        {/* Right Column: Chat & Participants Sidebar */}
        <section className="lg:col-span-4 flex flex-col h-[600px] lg:h-[680px]">
          {/* Tab buttons */}
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-brand-surface border border-brand-border/60 mb-3">
            <button
              onClick={() => setMobileTab('chat')}
              className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                mobileTab === 'chat'
                  ? 'bg-brand-primary text-white shadow-glow-sm'
                  : 'text-brand-muted hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Live Chat</span>
            </button>
            <button
              onClick={() => setMobileTab('participants')}
              className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                mobileTab === 'participants'
                  ? 'bg-brand-primary text-white shadow-glow-sm'
                  : 'text-brand-muted hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Participants ({participants.length})</span>
            </button>
          </div>

          {/* Active Tab Content */}
          <div className="flex-1 min-h-0">
            {mobileTab === 'chat' ? <ChatPanel /> : <ParticipantList />}
          </div>
        </section>
      </div>

      {/* Modals */}
      <VideoSelectorModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
      />

      <ControlRequestsModal
        isOpen={isRequestsModalOpen}
        onClose={() => setIsRequestsModalOpen(false)}
      />
    </div>
  );
};
