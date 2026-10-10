import React, { useState } from 'react';
import { useWatchParty } from '../../context/WatchPartyContext';
import { VideoStage } from '../../components/player/VideoStage';
import { PlaybackControls } from '../../components/player/PlaybackControls';
import { PresetsBar } from '../../components/player/PresetsBar';
import { ParticipantList } from '../../components/room/ParticipantList';
import { ChatSection } from '../../components/chat/ChatSection';
import { ApprovalQueue } from '../../components/room/ApprovalQueue';
import { VideoSelectorModal } from '../../components/player/VideoSelectorModal';
import { AmbientGlow } from '../../components/layout/AmbientGlow';
import {
  MessageSquare,
  Users,
  Film,
  ListVideo,
  Play,
  Trash2,
  Plus,
  ShieldAlert,
  Check,
} from 'lucide-react';

interface WatchRoomPageProps {
  isRequestsModalOpen?: boolean;
  setIsRequestsModalOpen?: (open: boolean) => void;
}

export const WatchRoomPage: React.FC<WatchRoomPageProps> = () => {
  const {
    playback,
    participants,
    canControl,
    pendingRequests,
    handleControlRequest,
    isRequestsModalOpen,
    setIsRequestsModalOpen,
    roomQueue,
    removeFromQueue,
    playNextInQueue,
  } = useWatchParty();

  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [playerInstance, setPlayerInstance] = useState<any>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState<boolean>(false);
  const [activeSidebarTab, setActiveSidebarTab] = useState<'discussion' | 'participants' | 'queue'>('discussion');
  const [showYTChat, setShowYTChat] = useState<boolean>(false);

  const handleProgress = (current: number, total: number) => {
    setCurrentTime(current);
    if (total > 0) {
      setDuration(total);
    }
  };

  const isPlaying = playback.playState === 'playing';

  return (
    <div className="relative max-w-7xl mx-auto px-3 sm:px-6 py-4 flex flex-col gap-4 overflow-hidden">
      {/* Intimate Screening Room Ambient Backdrop */}
      <AmbientGlow isPlaying={isPlaying} />

      {/* Host / Moderator Control Request Banner */}
      {canControl && pendingRequests.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-[#1C1E24] border border-[#E5A84B]/40 shadow-cinema gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 rounded-lg bg-[#E5A84B]/15 text-[#E5A84B] border border-[#E5A84B]/30 flex-shrink-0">
              <ShieldAlert className="w-4 h-4 animate-pulse" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#F2F0E9] truncate">
                  {pendingRequests[0].username} is requesting playback control access
                </span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[#E5A84B]/20 text-[#E5A84B]">
                  New Request
                </span>
              </div>
              <span className="text-[11px] text-[#8E919C]">
                Approve to grant them Moderator playback permissions.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-auto">
            <button
              onClick={() => handleControlRequest(pendingRequests[0].id, 'rejected')}
              className="px-2.5 py-1.5 rounded-md text-xs text-[#8E919C] hover:text-[#F87171] hover:bg-[#F87171]/10 border border-[#282A33] transition-colors cursor-pointer"
            >
              Decline
            </button>
            <button
              onClick={() => handleControlRequest(pendingRequests[0].id, 'approved')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#D6F279] hover:bg-[#C3E065] text-[#101114] text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Approve Access</span>
            </button>
            {pendingRequests.length > 1 && (
              <button
                onClick={() => setIsRequestsModalOpen(true)}
                className="text-xs text-[#D6F279] underline hover:text-[#C3E065] px-1 transition-colors cursor-pointer"
              >
                All ({pendingRequests.length})
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Theater Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Cinema Stage & Playback Controls */}
        <section className="lg:col-span-8 flex flex-col gap-3.5" aria-label="Screening Stage">
          <VideoStage
            onProgress={handleProgress}
            playerRefCallback={(player) => setPlayerInstance(player)}
            onOpenSelector={() => setIsVideoModalOpen(true)}
          />

          <PlaybackControls
            currentTime={currentTime}
            duration={duration}
            playerRef={playerInstance}
            onOpenVideoSelector={() => setIsVideoModalOpen(true)}
          />

          <PresetsBar onOpenSelector={() => setIsVideoModalOpen(true)} />
        </section>

        {/* Right Column: Social & Moderation Sidebar */}
        <section className="lg:col-span-4 flex flex-col h-[620px] lg:h-[700px]">
          {/* Tab Switcher */}
          <div className="grid grid-cols-3 p-1 rounded-lg bg-[#16171B] border border-[#282A33] mb-2.5 text-xs">
            <button
              onClick={() => setActiveSidebarTab('discussion')}
              className={`py-1.5 font-medium rounded transition-colors flex items-center justify-center gap-1 ${
                activeSidebarTab === 'discussion'
                  ? 'bg-[#1C1E24] text-[#F2F0E9] border border-[#3E4250]'
                  : 'text-[#8E919C] hover:text-[#F2F0E9]'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-[#D6F279]" />
              <span>Chat</span>
            </button>

            <button
              onClick={() => setActiveSidebarTab('participants')}
              className={`py-1.5 font-medium rounded transition-colors flex items-center justify-center gap-1 ${
                activeSidebarTab === 'participants'
                  ? 'bg-[#1C1E24] text-[#F2F0E9] border border-[#3E4250]'
                  : 'text-[#8E919C] hover:text-[#F2F0E9]'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-[#D6F279]" />
              <span>({participants.length})</span>
            </button>

            <button
              onClick={() => setActiveSidebarTab('queue')}
              className={`py-1.5 font-medium rounded transition-colors flex items-center justify-center gap-1 relative ${
                activeSidebarTab === 'queue'
                  ? 'bg-[#1C1E24] text-[#F2F0E9] border border-[#3E4250]'
                  : 'text-[#8E919C] hover:text-[#F2F0E9]'
              }`}
            >
              <ListVideo className="w-3.5 h-3.5 text-[#A99BFF]" />
              <span>Queue</span>
              {roomQueue.length > 0 && (
                <span className="w-3.5 h-3.5 rounded-full bg-[#A99BFF] text-[#101114] text-[9px] font-bold font-mono flex items-center justify-center">
                  {roomQueue.length}
                </span>
              )}
            </button>
          </div>

          {/* Active Tab Panel */}
          <div className="flex-1 min-h-0 flex flex-col">
            {activeSidebarTab === 'discussion' && (
              <div className="flex-1 flex flex-col h-full">
                {/* Optional YouTube Chat Toggle */}
                <div className="flex items-center justify-between pb-1.5 mb-1 px-1 text-[11px] text-[#8E919C]">
                  <span>Room Discussion Mode</span>
                  <button
                    onClick={() => setShowYTChat((p) => !p)}
                    className="hover:text-white flex items-center gap-1 underline"
                  >
                    {showYTChat ? 'Show Syncora Chat' : 'Show YouTube Live Chat'}
                  </button>
                </div>

                {showYTChat ? (
                  <div className="flex-1 rounded-xl bg-[#16171B] border border-[#282A33] overflow-hidden flex flex-col">
                    <iframe
                      title="YouTube Live Chat Embed"
                      src={`https://www.youtube.com/live_chat?v=${playback.videoId}&embed_domain=${window.location.hostname}`}
                      className="w-full flex-1 border-none"
                    />
                  </div>
                ) : (
                  <ChatSection />
                )}
              </div>
            )}

            {activeSidebarTab === 'participants' && <ParticipantList />}

            {activeSidebarTab === 'queue' && (
              <div className="h-full rounded-xl bg-[#16171B] border border-[#282A33] p-3.5 flex flex-col justify-between overflow-hidden">
                <div className="flex items-center justify-between pb-2.5 border-b border-[#282A33]">
                  <div className="flex items-center gap-2">
                    <ListVideo className="w-4 h-4 text-[#A99BFF]" />
                    <span className="text-xs font-mono uppercase tracking-wider text-[#F2F0E9] font-medium">
                      Shared Room Queue
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-[#A99BFF]">
                    {roomQueue.length} Videos
                  </span>
                </div>

                {/* Queue list */}
                <div className="flex-1 overflow-y-auto py-2.5 flex flex-col gap-2">
                  {roomQueue.length === 0 ? (
                    <div className="py-12 text-center text-xs text-[#8E919C] flex flex-col items-center gap-2">
                      <Film className="w-6 h-6 text-[#5E606A]" />
                      <span>The shared room queue is empty</span>
                      <span className="text-[10px] text-[#5E606A]">
                        Add videos from discovery or using the selector.
                      </span>
                    </div>
                  ) : (
                    roomQueue.map((item, idx) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-2.5 p-2 rounded-xl bg-[#1C1E24] border border-[#282A33]"
                      >
                        <span className="text-[10px] font-mono text-[#5E606A] w-4 text-center">
                          {idx + 1}
                        </span>
                        <img
                          src={item.thumbnailUrl || `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`}
                          alt={item.title}
                          className="w-14 aspect-video rounded object-cover shrink-0"
                        />
                        <div className="flex-1 min-w-0 flex flex-col">
                          <span className="text-xs font-semibold text-white truncate">
                            {item.title}
                          </span>
                          <span className="text-[9px] text-[#8E919C]">
                            Added by {item.addedByName}
                          </span>
                        </div>
                        {canControl && (
                          <button
                            onClick={() => removeFromQueue(item.id)}
                            className="p-1.5 rounded text-[#8E919C] hover:text-[#EF4444] transition-colors"
                            title="Remove from queue"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Queue Controls */}
                <div className="pt-2 border-t border-[#282A33] flex items-center justify-between gap-2">
                  <button
                    onClick={() => setIsVideoModalOpen(true)}
                    className="flex-1 py-2 rounded-xl bg-[#1C1E24] hover:bg-[#282A33] border border-[#282A33] text-xs font-semibold text-[#F2F0E9] flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Video</span>
                  </button>

                  {canControl && roomQueue.length > 0 && (
                    <button
                      onClick={playNextInQueue}
                      className="px-3.5 py-2 rounded-xl bg-[#A99BFF] hover:bg-[#9887f5] text-[#101114] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Play Next</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Stream Selector Modal */}
      <VideoSelectorModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
      />

      {/* Playback Control Approval Queue Modal */}
      {isRequestsModalOpen && (
        <ApprovalQueue onClose={() => setIsRequestsModalOpen(false)} />
      )}
    </div>
  );
};

export const RoomPage = WatchRoomPage;
