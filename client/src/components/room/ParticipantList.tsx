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
        <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-primary/20 border border-brand-primary/50 text-amber-300 text-[10px] font-black tracking-wider uppercase shadow-glow-sm">
          <Crown className="w-3 h-3 fill-current text-amber-300" />
          <span>Host</span>
        </span>
      );
    }
    if (role === 'MODERATOR') {
      return (
        <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-950/70 border border-cyan-500/40 text-cyan-400 text-[10px] font-black tracking-wider uppercase shadow-sm">
          <Shield className="w-3 h-3 fill-current" />
          <span>Mod</span>
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-surface/80 border border-brand-border text-brand-muted text-[10px] font-bold tracking-wider uppercase">
        <User className="w-3 h-3" />
        <span>Viewer</span>
      </span>
    );
  };

  return (
    <div className="flex flex-col h-full glass-panel-elevated rounded-3xl border border-brand-border/70 overflow-hidden shadow-2xl backdrop-blur-2xl">
      {/* Header */}
      <div className="p-4 border-b border-brand-border/50 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-brand-primary/20 text-brand-highlight">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <span className="text-sm font-extrabold text-white tracking-wide">Participants</span>
            <div className="text-[10px] text-brand-muted">Active Room Members</div>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full bg-brand-surface text-brand-highlight text-xs font-black border border-brand-border/60">
          {participants.length} online
        </span>
      </div>

      {/* Participants List */}
      <div className="flex-1 overflow-y-auto p-3.5 flex flex-col gap-2.5 scrollbar-thin">
        {participants.map((p) => {
          const isCurrentUser = p.id === currentUser?.id;
          const isTargetHost = p.isHost || p.role === 'HOST';

          return (
            <div
              key={p.id}
              className={`relative flex items-center justify-between p-3 rounded-2xl transition-all border ${
                isCurrentUser
                  ? 'bg-brand-primary/15 border-brand-primary/40 shadow-glow-sm'
                  : 'bg-brand-card/40 hover:bg-brand-card/80 border-brand-border/50'
              }`}
            >
              {/* User details */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative flex-shrink-0">
                  <div
                    className="w-9 h-9 rounded-2xl flex items-center justify-center text-xs font-black text-white shadow-md ring-2 ring-white/10"
                    style={{ backgroundColor: p.avatarColor || '#8067F5' }}
                  >
                    {p.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-brand-dark" />
                </div>

                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white truncate max-w-[130px]">
                      {p.username}
                    </span>
                    {isCurrentUser && (
                      <span className="text-[10px] text-brand-highlight font-bold">(You)</span>
                    )}
                  </div>
                  <div className="mt-1">{getRoleBadge(p.role, p.isHost)}</div>
                </div>
              </div>

              {/* Host actions button */}
              {isHost && !isCurrentUser && (
                <div className="relative">
                  <button
                    onClick={() => setActiveMenuUserId(activeMenuUserId === p.id ? null : p.id)}
                    className="p-2 rounded-xl text-brand-muted hover:text-white hover:bg-brand-surface transition-all"
                    title="Manage user"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {/* Dropdown Menu */}
                  {activeMenuUserId === p.id && (
                    <div className="absolute right-0 top-full mt-1.5 z-40 w-48 rounded-2xl glass-panel-elevated p-2 shadow-2xl border border-brand-border text-xs flex flex-col gap-1 animate-fade-in backdrop-blur-2xl">
                      {p.role === 'PARTICIPANT' && (
                        <button
                          onClick={() => {
                            assignRole(p.id, 'MODERATOR');
                            setActiveMenuUserId(null);
                          }}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl text-brand-text hover:bg-brand-primary hover:text-white transition-all text-left font-semibold"
                        >
                          <UserCheck className="w-4 h-4 text-cyan-400" />
                          <span>Promote to Mod</span>
                        </button>
                      )}

                      {p.role === 'MODERATOR' && (
                        <button
                          onClick={() => {
                            assignRole(p.id, 'PARTICIPANT');
                            setActiveMenuUserId(null);
                          }}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl text-brand-text hover:bg-brand-surface transition-all text-left font-semibold"
                        >
                          <User className="w-4 h-4 text-brand-subtle" />
                          <span>Demote to Viewer</span>
                        </button>
                      )}

                      {!isTargetHost && (
                        <button
                          onClick={() => {
                            if (confirm(`Transfer Host rights to ${p.username}?`)) {
                              transferHost(p.id);
                              setActiveMenuUserId(null);
                            }
                          }}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl text-amber-300 hover:bg-amber-950/50 transition-all text-left font-semibold"
                        >
                          <ArrowRightLeft className="w-4 h-4" />
                          <span>Transfer Host</span>
                        </button>
                      )}

                      {!isTargetHost && (
                        <button
                          onClick={() => {
                            if (confirm(`Remove ${p.username} from the party?`)) {
                              removeParticipant(p.id);
                              setActiveMenuUserId(null);
                            }
                          }}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl text-red-400 hover:bg-red-950/50 transition-all text-left font-semibold border-t border-brand-border/50 mt-1 pt-1.5"
                        >
                          <UserX className="w-4 h-4" />
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
