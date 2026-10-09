import React, { useState } from 'react';
import { useWatchParty } from '../../context/WatchPartyContext';
import { YouTubePlayer } from '../../components/player/YouTubePlayer';
import { VideoControls } from '../../components/player/VideoControls';
import { PresetsBar } from '../../components/player/PresetsBar';
import { ParticipantList } from '../../components/room/ParticipantList';
import { ChatPanel } from '../../components/chat/ChatPanel';
import { ReactionsOverlay } from '../../components/chat/ReactionsOverlay';
import { VideoSelectorModal } from '../../components/player/VideoSelectorModal';
import { ControlRequestsModal } from '../../components/room/ControlRequestsModal';
import { SyncStatusBadge } from '../../components/ui/SyncStatusBadge';
import { AmbientGlow } from '../../components/layout/AmbientGlow';
import { MessageSquare, Users, Sparkles, Film } from 'lucide-react';

interface RoomPageProps {
  isRequestsModalOpen: boolean;
  setIsRequestsModalOpen: (open: boolean) => void;
}

export const RoomPage: React.FC<RoomPageProps> = ({
  isRequestsModalOpen,
  setIsRequestsModalOpen,
}) => {
  const {
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
  const [activeSidebarTab, setActiveSidebarTab] = useState<'chat' | 'participants'>('chat');

  const handleProgress = (current: number, total: number) => {
    setCurrentTime(current);
    if (total > 0) {
      setDuration(total);
    }
  };

  const isPlaying = playback.playState === 'playing';

  return (
    <div className="relative max-w-7xl mx-auto px-3 sm:px-6 py-4 flex flex-col gap-4 overflow-hidden">
      {/* Cinematic Ambient Glow Behind Video */}
      <AmbientGlow isPlaying={isPlaying} />

      {/* Mobile Top Status Row */}
      <div className="flex md:hidden items-center justify-between px-1">
        <SyncStatusBadge status={syncStatus} isConnected={isConnected} />
        <span className="text-xs text-brand-muted">
          Stream: <code className="text-brand-highlight">{playback.videoId}</code>
        </span>
      </div>

      {/* Main Grid: Cinema Player (Left 8 cols) + Social Hub (Right 4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Player Stage & Controls */}
        <section className="lg:col-span-8 flex flex-col gap-4">
          {/* Video Player Stage */}
          <div className="relative">
            <YouTubePlayer
              onProgress={handleProgress}
              playerRefCallback={(player) => setPlayerInstance(player)}
            />
            {/* Floating Physics Reactions */}
            <ReactionsOverlay reactions={reactions} />
          </div>

          {/* Synchronized Playback Controls */}
          <VideoControls
            currentTime={currentTime}
            duration={duration}
            playerRef={playerInstance}
            onOpenVideoSelector={() => setIsVideoModalOpen(true)}
          />

          {/* Quick Presets Bar (1-Click Switcher) */}
          <PresetsBar onOpenSelector={() => setIsVideoModalOpen(true)} />

          {/* Stream Metadata Card */}
          <div className="glass-panel rounded-2xl p-4 flex items-center justify-between border border-brand-border/60 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-brand-primary/20 text-brand-highlight">
                <Film className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Now Broadcasting</span>
                  <span className="px-2 py-0.5 rounded-full bg-brand-card text-[11px] font-mono text-brand-highlight border border-brand-border font-bold">
                    {playback.videoId}
                  </span>
                </h3>
                <p className="text-xs text-brand-muted mt-0.5">
                  Status: <span className="capitalize font-bold text-brand-highlight">{playback.playState}</span> &bull; Action by {playback.updatedBy.username}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsVideoModalOpen(true)}
              className="text-xs font-bold text-brand-highlight hover:text-white px-3.5 py-2 rounded-xl bg-brand-surface hover:bg-brand-card border border-brand-border/70 hover:border-brand-primary/50 transition-all hidden sm:block"
            >
              Browse Library
            </button>
          </div>
        </section>

        {/* Right Column: Social Hub (Chat & Member Stack) */}
        <section className="lg:col-span-4 flex flex-col h-[620px] lg:h-[720px]">
          {/* Tab Switcher */}
          <div className="grid grid-cols-2 p-1.5 rounded-2xl bg-brand-surface/90 border border-brand-border/70 mb-3 backdrop-blur-md">
            <button
              onClick={() => setActiveSidebarTab('chat')}
              className={`py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 ${
                activeSidebarTab === 'chat'
                  ? 'bg-gradient-to-r from-brand-primary to-brand-hover text-white shadow-glow-sm'
                  : 'text-brand-muted hover:text-white'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Live Chat</span>
            </button>
            <button
              onClick={() => setActiveSidebarTab('participants')}
              className={`py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 ${
                activeSidebarTab === 'participants'
                  ? 'bg-gradient-to-r from-brand-primary to-brand-hover text-white shadow-glow-sm'
                  : 'text-brand-muted hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Members ({participants.length})</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 min-h-0">
            {activeSidebarTab === 'chat' ? <ChatPanel /> : <ParticipantList />}
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
