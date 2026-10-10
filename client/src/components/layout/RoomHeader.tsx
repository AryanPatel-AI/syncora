import React, { useState } from 'react';
import { useWatchParty } from '../../context/WatchPartyContext';
import { SyncStatusBadge } from '../ui/SyncStatusBadge';
import { AudiencePresence } from '../room/AudiencePresence';
import {
  Copy,
  Check,
  LogOut,
  Crown,
  Shield,
  User,
  Radio,
  KeyRound,
  Clock,
} from 'lucide-react';

interface RoomHeaderProps {
  onOpenRequests?: () => void;
}

export const RoomHeader: React.FC<RoomHeaderProps> = () => {
  const {
    roomId,
    currentUser,
    isHost,
    canControl,
    pendingRequests,
    requestControl,
    setIsRequestsModalOpen,
    leaveRoom,
    syncStatus,
    isConnected,
  } = useWatchParty();

  const [copied, setCopied] = useState<boolean>(false);

  const myPendingRequest = pendingRequests.find(
    (r) => r.userId === currentUser?.id && r.status === 'pending'
  );
  const isRequestPending = Boolean(myPendingRequest);

  const handleCopyLink = () => {
    if (!roomId) return;
    const inviteUrl = `${window.location.origin}/room/${roomId}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#101114]/95 border-b border-[#282A33] px-4 lg:px-6 py-2.5 flex items-center justify-between backdrop-blur-sm">
      {/* Brand & Room Title */}
      <div className="flex items-center gap-3">
        <a href="/" className="flex items-center gap-2.5 group">
          <div className="w-2.5 h-2.5 rounded-sm bg-[#D6F279] group-hover:scale-110 transition-transform" />
          <span className="font-serif text-lg tracking-tight font-medium text-[#F2F0E9] group-hover:text-[#D6F279] transition-colors">
            Syncora
          </span>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#8E919C] border-l border-[#282A33] pl-2.5 hidden sm:inline">
            Screening Room
          </span>
        </a>
      </div>

      {/* When in a Room: Real-time Controls */}
      {roomId && (
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Real-time frame sync status */}
          <div className="hidden sm:block">
            <SyncStatusBadge status={syncStatus} isConnected={isConnected} />
          </div>

          {/* Live Audience Presence indicator and roster popover */}
          <AudiencePresence />

          {/* Host Pending Control Requests Pill */}
          {canControl && pendingRequests.length > 0 && (
            <button
              onClick={() => setIsRequestsModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#E5A84B]/20 border border-[#E5A84B] text-[#E5A84B] text-xs font-semibold hover:bg-[#E5A84B]/30 transition-colors cursor-pointer animate-pulse"
              title="Review pending playback control requests"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Requests ({pendingRequests.length})</span>
            </button>
          )}

          {/* Viewer Request Playback Control Button */}
          {!canControl && (
            isRequestPending ? (
              <span
                className="hidden md:inline-flex items-center gap-1 text-[11px] font-mono px-2 py-1 rounded bg-[#E5A84B]/10 border border-[#E5A84B]/30 text-[#E5A84B]"
                title="Your playback request is awaiting host review"
              >
                <Clock className="w-3 h-3 animate-spin" />
                <span>Request Pending</span>
              </span>
            ) : (
              <button
                onClick={() => requestControl('REQUEST_CONTROL')}
                className="hidden md:inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded bg-[#D6F279] hover:bg-[#C3E065] text-[#101114] transition-colors cursor-pointer shadow-sm"
                title="Request playback control access from the host"
              >
                <KeyRound className="w-3 h-3" />
                <span>Request Access</span>
              </button>
            )
          )}

          {/* Room Code & Copy Button */}
          <div className="flex items-center gap-1.5 bg-[#16171B] border border-[#282A33] px-2.5 py-1 rounded-md text-xs">
            <Radio className="w-3 h-3 text-[#D6F279] hidden md:inline" />
            <span className="text-[10px] text-[#8E919C] uppercase font-mono tracking-wider hidden md:inline">Room</span>
            <span className="font-mono font-medium text-[#F2F0E9] tracking-wider text-xs">{roomId}</span>
            <button
              onClick={handleCopyLink}
              className="p-1 rounded text-[#8E919C] hover:text-[#F2F0E9] hover:bg-[#24262E] transition-colors ml-0.5"
              title="Copy invite link to clipboard"
              aria-label="Copy invite link"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-[#D6F279]" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {/* User Presence & Role Pill */}
          {currentUser && (
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#16171B] border border-[#282A33] text-xs">
              <span className="text-xs font-medium text-[#F2F0E9] max-w-[100px] truncate">
                {currentUser.username}
              </span>
              {isHost ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#E5A84B]/10 text-[#E5A84B] border border-[#E5A84B]/30" title="Host">
                  <Crown className="w-3 h-3" />
                  <span className="hidden lg:inline">Host</span>
                </span>
              ) : currentUser.role === 'MODERATOR' ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#82A8F8]/10 text-[#82A8F8] border border-[#82A8F8]/30" title="Moderator">
                  <Shield className="w-3 h-3" />
                  <span className="hidden lg:inline">Mod</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#282A33]/50 text-[#8E919C] border border-[#282A33]" title="Viewer">
                  <User className="w-3 h-3" />
                  <span className="hidden lg:inline">Viewer</span>
                </span>
              )}
            </div>
          )}

          {/* Leave Screening Room Button */}
          <button
            onClick={() => {
              if (confirm('Leave this screening room?')) {
                leaveRoom();
              }
            }}
            className="p-1.5 rounded-md text-[#8E919C] hover:text-[#F87171] hover:bg-[#F87171]/10 border border-transparent hover:border-[#F87171]/30 transition-colors"
            title="Leave room"
            aria-label="Leave screening room"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      )}
    </header>
  );
};

export const Navbar = RoomHeader;
