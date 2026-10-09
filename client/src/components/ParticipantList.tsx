import React, { useState } from 'react';
import { useWatchParty } from '../context/WatchPartyContext';
import { Participant, Role } from '../types';
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
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-primary/20 border border-brand-primary/40 text-brand-highlight text-[10px] font-bold tracking-wider uppercase">
          <Crown className="w-3 h-3 text-amber-300" />
          <span>Host</span>
        </span>
      );
    }
    if (role === 'MODERATOR') {
      return (
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 text-[10px] font-bold tracking-wider uppercase">
          <Shield className="w-3 h-3" />
          <span>Mod</span>
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-surface/60 border border-brand-border text-brand-muted text-[10px] font-semibold tracking-wider uppercase">
        <User className="w-3 h-3" />
        <span>Viewer</span>
      </span>
    );
  };

  return (
    <div className="flex flex-col h-full bg-brand-surface/50 rounded-2xl border border-brand-border/60 overflow-hidden shadow-xl">
      {/* Header */}
      <div className="p-4 border-b border-brand-border/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-brand-primary/20 text-brand-highlight">
            <Users className="w-4 h-4" />
          </div>
          <span className="text-sm font-bold text-white tracking-wide">Participants</span>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-brand-card text-brand-muted text-xs font-semibold border border-brand-border/50">
          {participants.length}
        </span>
      </div>

      {/* Participants scrollable list */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
        {participants.map((p) => {
          const isCurrentUser = p.id === currentUser?.id;
          const isTargetHost = p.isHost || p.role === 'HOST';

          return (
            <div
              key={p.id}
              className={`relative flex items-center justify-between p-2.5 rounded-xl transition-all border ${
                isCurrentUser
                  ? 'bg-brand-primary/10 border-brand-primary/30'
                  : 'bg-brand-card/40 hover:bg-brand-card/70 border-brand-border/40'
              }`}
            >
              {/* User info */}
              <div className="flex items-center gap-3 min-w-0">
                {/* Avatar with initials */}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-sm"
                  style={{ backgroundColor: p.avatarColor || '#8067F5' }}
                >
                  {p.username.charAt(0).toUpperCase()}
                </div>

                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-white truncate max-w-[120px]">
                      {p.username}
                    </span>
                    {isCurrentUser && (
                      <span className="text-[10px] text-brand-highlight font-medium">(You)</span>
                    )}
                  </div>
                  <div className="mt-0.5">{getRoleBadge(p.role, p.isHost)}</div>
                </div>
              </div>

              {/* Host actions menu (Host can manage anyone except themselves) */}
              {isHost && !isCurrentUser && (
                <div className="relative">
                  <button
                    onClick={() =>
                      setActiveMenuUserId(activeMenuUserId === p.id ? null : p.id)
                    }
                    className="p-1.5 rounded-lg text-brand-muted hover:text-white hover:bg-brand-surface transition-all"
                    title="Manage participant"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {/* Dropdown Menu */}
                  {activeMenuUserId === p.id && (
                    <div className="absolute right-0 top-full mt-1 z-30 w-44 rounded-xl glass-panel-elevated p-1.5 shadow-2xl border border-brand-border text-xs flex flex-col gap-1 animate-fade-in">
                      {/* Promote to Mod */}
                      {p.role === 'PARTICIPANT' && (
                        <button
                          onClick={() => {
                            assignRole(p.id, 'MODERATOR');
                            setActiveMenuUserId(null);
                          }}
                          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-brand-text hover:bg-brand-primary hover:text-white transition-all text-left"
                        >
                          <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Promote to Mod</span>
                        </button>
                      )}

                      {/* Demote to Viewer */}
                      {p.role === 'MODERATOR' && (
                        <button
                          onClick={() => {
                            assignRole(p.id, 'PARTICIPANT');
                            setActiveMenuUserId(null);
                          }}
                          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-brand-text hover:bg-brand-surface transition-all text-left"
                        >
                          <User className="w-3.5 h-3.5 text-brand-subtle" />
                          <span>Demote to Viewer</span>
                        </button>
                      )}

                      {/* Transfer Host */}
                      {!isTargetHost && (
                        <button
                          onClick={() => {
                            if (confirm(`Transfer Host role to ${p.username}? You will become a Moderator.`)) {
                              transferHost(p.id);
                              setActiveMenuUserId(null);
                            }
                          }}
                          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-amber-300 hover:bg-amber-950/50 transition-all text-left"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                          <span>Make Host</span>
                        </button>
                      )}

                      {/* Remove Participant */}
                      {!isTargetHost && (
                        <button
                          onClick={() => {
                            if (confirm(`Remove ${p.username} from the watch party?`)) {
                              removeParticipant(p.id);
                              setActiveMenuUserId(null);
                            }
                          }}
                          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-red-400 hover:bg-red-950/50 transition-all text-left border-t border-brand-border/40 mt-1 pt-1"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          <span>Remove from Party</span>
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
