import React, { useState, useRef, useEffect } from 'react';
import { useWatchParty } from '../../context/WatchPartyContext';
import { ParticipantAvatar } from './ParticipantAvatar';
import { Users, Crown, Shield, User, ChevronDown, Share2, Copy, Check } from 'lucide-react';

export const AudiencePresence: React.FC = () => {
  const { participants, audienceCount, currentUser, roomId } = useWatchParty();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on Escape or click outside
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const count = audienceCount || participants.length || 1;
  const displayedAvatars = participants.slice(0, 3);
  const remainingCount = Math.max(0, participants.length - displayedAvatars.length);

  const handleCopyLink = () => {
    if (!roomId) return;
    const inviteUrl = `${window.location.origin}/room/${roomId}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative inline-block" ref={popoverRef}>
      {/* Trigger Button in Header */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={`Audience presence: Watching now ${count} participants. Click to view roster`}
        className={`flex items-center gap-2 px-2.5 py-1 rounded-md border text-xs transition-colors select-none ${
          isOpen
            ? 'bg-[#1C1E24] border-[#D6F279] text-[#F2F0E9]'
            : 'bg-[#16171B] border-[#282A33] hover:border-[#3A3D4A] text-[#8E919C] hover:text-[#F2F0E9]'
        }`}
      >
        {/* Overlapping Avatar Stack */}
        <div className="flex items-center -space-x-1.5 overflow-hidden">
          {displayedAvatars.map((p) => (
            <ParticipantAvatar
              key={p.id}
              participant={p}
              size="sm"
              showOnlineDot={false}
              className="ring-1 ring-[#101114]"
            />
          ))}
          {remainingCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-[#1C1E24] border border-[#282A33] text-[9px] font-mono text-[#D6F279] flex items-center justify-center font-bold">
              +{remainingCount}
            </span>
          )}
        </div>

        {/* Live Audience Count Label */}
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" aria-hidden="true" />
          <span className="text-[11px] font-medium text-[#F2F0E9]">
            Watching now <span className="font-mono text-[#8E919C]">&middot;</span>{' '}
            <span className="font-mono text-[#D6F279] font-semibold">{count}</span>
          </span>
        </div>

        <ChevronDown
          className={`w-3 h-3 text-[#8E919C] transition-transform duration-150 ${
            isOpen ? 'rotate-180 text-[#D6F279]' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {/* Accessible Popover Panel */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Active Audience Members"
          className="absolute right-0 top-full mt-2 z-50 w-72 rounded-xl bg-[#16171B] border border-[#282A33] shadow-cinema p-3 flex flex-col gap-3 text-xs animate-in fade-in zoom-in-95 duration-100"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-[#282A33]">
            <div className="flex items-center gap-1.5 text-[#F2F0E9] font-medium">
              <Users className="w-3.5 h-3.5 text-[#D6F279]" />
              <span>In This Screening</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#101114] text-[#8E919C] border border-[#282A33]">
              {count} connected
            </span>
          </div>

          {/* Participant Roster List */}
          <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto pr-0.5">
            {participants.map((p) => {
              const isMe = p.id === currentUser?.id;
              const isHost = p.isHost || p.role === 'HOST';
              const isModerator = p.role === 'MODERATOR';

              return (
                <div
                  key={p.id}
                  className={`flex items-center justify-between p-1.5 rounded-md transition-colors ${
                    isMe ? 'bg-[#1C1E24] border border-[#3E4250]' : 'hover:bg-[#1C1E24]/50'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <ParticipantAvatar participant={p} size="sm" showOnlineDot={true} />
                    <span className="text-xs text-[#F2F0E9] truncate font-medium max-w-[120px]">
                      {p.username}
                      {isMe && <span className="text-[10px] text-[#8E919C] ml-1 font-mono">(You)</span>}
                    </span>
                  </div>

                  {/* Role Badges */}
                  <div>
                    {isHost && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#E5A84B]/10 text-[#E5A84B] border border-[#E5A84B]/30">
                        <Crown className="w-2.5 h-2.5" />
                        <span>Host</span>
                      </span>
                    )}
                    {isModerator && !isHost && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#82A8F8]/10 text-[#82A8F8] border border-[#82A8F8]/30">
                        <Shield className="w-2.5 h-2.5" />
                        <span>Mod</span>
                      </span>
                    )}
                    {!isHost && !isModerator && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#1C1E24] text-[#8E919C] border border-[#282A33]">
                        <User className="w-2.5 h-2.5" />
                        <span>Viewer</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Useful Empty State (When only 1 viewer is in room) */}
          {participants.length <= 1 && (
            <div className="p-2.5 rounded-lg bg-[#101114] border border-[#282A33] flex flex-col gap-2 text-center">
              <p className="text-[11px] text-[#8E919C] leading-snug">
                You're the only one here right now. Invite friends to watch together!
              </p>
              <button
                onClick={handleCopyLink}
                className="w-full py-1.5 rounded-md bg-[#1C1E24] hover:bg-[#24262E] border border-[#282A33] hover:border-[#D6F279]/50 text-[#F2F0E9] text-[11px] font-medium transition-colors flex items-center justify-center gap-1.5"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-[#D6F279]" />
                    <span className="text-[#D6F279]">Link Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-[#8E919C]" />
                    <span>Copy Invite Link</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
