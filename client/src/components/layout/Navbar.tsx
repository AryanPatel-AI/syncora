import React, { useState } from 'react';
import { useWatchParty } from '../../context/WatchPartyContext';
import { SyncStatusBadge } from '../ui/SyncStatusBadge';
import {
  Play,
  Copy,
  Check,
  Bell,
  LogOut,
  Crown,
  Shield,
  User,
  Share2,
  Radio,
} from 'lucide-react';

interface NavbarProps {
  onOpenRequests: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenRequests }) => {
  const {
    roomId,
    currentUser,
    isHost,
    canControl,
    leaveRoom,
    syncStatus,
    isConnected,
    pendingRequests,
  } = useWatchParty();

  const [copied, setCopied] = useState<boolean>(false);

  const handleCopyLink = () => {
    if (!roomId) return;
    const inviteUrl = `${window.location.origin}/?room=${roomId}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel-elevated border-b border-brand-border/60 shadow-xl px-4 lg:px-8 py-3 flex items-center justify-between backdrop-blur-2xl">
      {/* Brand Identity */}
      <div className="flex items-center gap-3">
        <a href="/" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-primary via-brand-highlight to-cyan-400 flex items-center justify-center shadow-glow group-hover:scale-105 transition-all">
            <Play className="w-5 h-5 fill-white text-white ml-0.5 filter drop-shadow-md" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 border-2 border-brand-dark animate-pulse" />
          </div>

          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
              Syncora
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-brand-primary/20 text-brand-highlight border border-brand-primary/40">
                PRO
              </span>
            </span>
            <span className="text-[11px] text-brand-muted hidden sm:block tracking-wide">
              Every moment, in sync.
            </span>
          </div>
        </a>
      </div>

      {/* When in a Room: Real-time Controls */}
      {roomId && (
        <div className="flex items-center gap-3">
          {/* Live Sync Radar */}
          <div className="hidden md:block">
            <SyncStatusBadge status={syncStatus} isConnected={isConnected} />
          </div>

          {/* Copyable Room Code Pill */}
          <div className="flex items-center gap-2 bg-brand-surface/90 border border-brand-border/80 px-3 py-1.5 rounded-2xl shadow-inner">
            <div className="flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse hidden sm:inline" />
              <span className="text-[10px] text-brand-subtle uppercase tracking-wider hidden sm:inline font-bold">Room:</span>
              <span className="text-xs font-mono font-black text-brand-highlight tracking-widest">{roomId}</span>
            </div>

            <button
              onClick={handleCopyLink}
              className={`p-1.5 rounded-xl transition-all ${
                copied
                  ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/40'
                  : 'bg-brand-card hover:bg-brand-cardHover text-brand-muted hover:text-white border border-brand-border/60'
              }`}
              title="Copy invite link"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Share2 className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {/* Control Requests Bell (Host & Mod) */}
          {canControl && (
            <button
              onClick={onOpenRequests}
              className="relative p-2.5 rounded-2xl bg-brand-surface hover:bg-brand-card border border-brand-border/70 text-brand-muted hover:text-white transition-all shadow-sm"
              title="View participant control requests"
            >
              <Bell className="w-4 h-4" />
              {pendingRequests.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-primary text-[10px] font-black text-white shadow-glow animate-pulse">
                  {pendingRequests.length}
                </span>
              )}
            </button>
          )}

          {/* User Presence Pill */}
          {currentUser && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-brand-surface border border-brand-border/70 shadow-sm">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-md ring-2 ring-white/10"
                style={{ backgroundColor: currentUser.avatarColor || '#8067F5' }}
              >
                {currentUser.username.charAt(0).toUpperCase()}
              </div>

              <span className="text-xs font-bold text-white max-w-[90px] truncate hidden sm:inline">
                {currentUser.username}
              </span>

              {isHost ? (
                <span title="Host" className="flex items-center text-amber-300">
                  <Crown className="w-3.5 h-3.5 fill-current" />
                </span>
              ) : currentUser.role === 'MODERATOR' ? (
                <span title="Moderator" className="flex items-center text-cyan-400">
                  <Shield className="w-3.5 h-3.5 fill-current" />
                </span>
              ) : (
                <span title="Viewer" className="flex items-center text-brand-subtle">
                  <User className="w-3.5 h-3.5" />
                </span>
              )}
            </div>
          )}

          {/* Leave Party Button */}
          <button
            onClick={() => {
              if (confirm('Leave the watch party?')) {
                leaveRoom();
              }
            }}
            className="p-2.5 rounded-2xl text-brand-muted hover:text-red-400 hover:bg-red-950/30 transition-all border border-transparent hover:border-red-500/30"
            title="Leave Watch Party"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      )}
    </header>
  );
};
