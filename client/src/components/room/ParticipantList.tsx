import React, { useState } from 'react';
import { useWatchParty } from '../../context/WatchPartyContext';
import { Role } from '../../types';
import {
  Crown,
  Shield,
  User,
  MoreVertical,
  UserCheck,
  UserX,
  ArrowRightLeft,
  Users,
} from 'lucide-react';

export const ParticipantList: React.FC = () => {
  const {
    participants,
    currentUser,
    isHost,
    assignRole,
    removeParticipant,
    transferHost,
  } = useWatchParty();

  const [activeMenuUserId, setActiveMenuUserId] = useState<string | null>(null);

  const getRoleBadge = (role: Role, isRoomHost: boolean) => {
    if (isRoomHost || role === 'HOST') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#E5A84B]/10 text-[#E5A84B] border border-[#E5A84B]/30">
          <Crown className="w-3 h-3 text-[#E5A84B]" />
          <span>Host</span>
        </span>
      );
    }
    if (role === 'MODERATOR') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#82A8F8]/10 text-[#82A8F8] border border-[#82A8F8]/30">
          <Shield className="w-3 h-3 text-[#82A8F8]" />
          <span>Mod</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#1C1E24] text-[#8E919C] border border-[#282A33]">
        <User className="w-3 h-3" />
        <span>Viewer</span>
      </span>
    );
  };

  return (
    <div className="flex flex-col h-full rounded-xl bg-[#16171B] border border-[#282A33] overflow-hidden shadow-cinema">
      {/* Header */}
      <div className="p-3.5 border-b border-[#282A33] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-[#D6F279]" />
          <span className="text-xs font-mono uppercase tracking-wider text-[#F2F0E9] font-medium">
            Room Participants
          </span>
        </div>
        <span className="px-2 py-0.5 rounded bg-[#1C1E24] text-[#D6F279] text-[11px] font-mono border border-[#282A33]">
          {participants.length} online
        </span>
      </div>

      {/* Participants List */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
        {participants.map((p) => {
          const isCurrentUser = p.id === currentUser?.id;
          const isTargetHost = p.isHost || p.role === 'HOST';

          return (
            <div
              key={p.id}
              className={`relative flex items-center justify-between p-2.5 rounded-lg transition-colors border ${
                isCurrentUser
                  ? 'bg-[#1C1E24] border-[#383B47]'
                  : 'bg-[#1C1E24]/60 hover:bg-[#1C1E24] border-[#282A33]'
              }`}
            >
              {/* User details */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative flex-shrink-0">
                  <div
                    className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-mono font-medium text-[#101114] bg-[#D6F279]"
                  >
                    {p.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#D6F279] border border-[#101114]" />
                </div>

                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-[#F2F0E9] truncate max-w-[120px]">
                      {p.username}
                    </span>
                    {isCurrentUser && (
                      <span className="text-[10px] text-[#8E919C] font-mono">(You)</span>
                    )}
                  </div>
                  <div className="mt-0.5">{getRoleBadge(p.role, p.isHost)}</div>
                </div>
              </div>

              {/* Host actions button */}
              {isHost && !isCurrentUser && (
                <div className="relative">
                  <button
                    onClick={() => setActiveMenuUserId(activeMenuUserId === p.id ? null : p.id)}
                    className="p-1.5 rounded-md text-[#8E919C] hover:text-[#F2F0E9] hover:bg-[#24262E] transition-colors"
                    title="Manage participant"
                    aria-label={`Manage ${p.username}`}
                  >
                    <MoreVertical className="w-3.5 h-3.5" />
                  </button>

                  {/* Dropdown Menu */}
                  {activeMenuUserId === p.id && (
                    <div className="absolute right-0 top-full mt-1 z-40 w-44 rounded-lg bg-[#16171B] p-1.5 shadow-cinema border border-[#282A33] text-xs flex flex-col gap-1">
                      {p.role === 'PARTICIPANT' && (
                        <button
                          onClick={() => {
                            assignRole(p.id, 'MODERATOR');
                            setActiveMenuUserId(null);
                          }}
                          className="flex items-center gap-2 px-2.5 py-1.5 rounded text-[#F2F0E9] hover:bg-[#24262E] text-left transition-colors"
                        >
                          <UserCheck className="w-3.5 h-3.5 text-[#82A8F8]" />
                          <span>Promote to Mod</span>
                        </button>
                      )}

                      {p.role === 'MODERATOR' && (
                        <button
                          onClick={() => {
                            assignRole(p.id, 'PARTICIPANT');
                            setActiveMenuUserId(null);
                          }}
                          className="flex items-center gap-2 px-2.5 py-1.5 rounded text-[#F2F0E9] hover:bg-[#24262E] text-left transition-colors"
                        >
                          <User className="w-3.5 h-3.5 text-[#8E919C]" />
                          <span>Demote to Viewer</span>
                        </button>
                      )}

                      {!isTargetHost && (
                        <button
                          onClick={() => {
                            if (confirm(`Transfer Host role to ${p.username}?`)) {
                              transferHost(p.id);
                              setActiveMenuUserId(null);
                            }
                          }}
                          className="flex items-center gap-2 px-2.5 py-1.5 rounded text-[#E5A84B] hover:bg-[#24262E] text-left transition-colors"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                          <span>Transfer Host</span>
                        </button>
                      )}

                      {!isTargetHost && (
                        <button
                          onClick={() => {
                            if (confirm(`Remove ${p.username} from this room?`)) {
                              removeParticipant(p.id);
                              setActiveMenuUserId(null);
                            }
                          }}
                          className="flex items-center gap-2 px-2.5 py-1.5 rounded text-[#F87171] hover:bg-[#F87171]/10 text-left transition-colors border-t border-[#282A33] mt-1 pt-1.5"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          <span>Remove from Room</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
