import React, { useState } from 'react';
import { useWatchParty } from '../context/WatchPartyContext';
import { SyncBadge } from './SyncBadge';
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
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-brand-border/60 shadow-lg px-4 lg:px-8 py-3 flex items-center justify-between">
      {/* Brand logo & tagline */}
      <div className="flex items-center gap-3">
        <a href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-primary to-brand-highlight flex items-center justify-center shadow-glow-sm group-hover:scale-105 transition-all">
            <Play className="w-4 h-4 fill-white text-white ml-0.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-black tracking-tight text-white flex items-center gap-1">
              Syncora
              <span className="w-1.5 h-1.5 rounded-full bg-brand-highlight animate-pulse" />
            </span>
            <span className="text-[10px] text-brand-muted hidden sm:block tracking-wide">
              Every moment, in sync.
            </span>
          </div>
        </a>
      </div>

      {/* Room Controls (When inside a room) */}
      {roomId && (
        <div className="flex items-center gap-3">
          {/* Sync Badge */}
          <div className="hidden md:block">
            <SyncBadge status={syncStatus} isConnected={isConnected} />
          </div>

          {/* Room Code & Copy Link */}
          <div className="flex items-center gap-1.5 bg-brand-surface/80 border border-brand-border/80 px-2.5 py-1.5 rounded-xl shadow-inner">
            <span className="text-[11px] text-brand-subtle uppercase tracking-wider hidden sm:inline">Room:</span>
            <span className="text-xs font-mono font-bold text-brand-highlight tracking-widest">{roomId}</span>
            <button
              onClick={handleCopyLink}
              className="ml-1 p-1 rounded-md text-brand-muted hover:text-white hover:bg-brand-card transition-all"
              title="Copy room invite link"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Pending Requests Notification Bell (Host & Mod) */}
          {canControl && (
            <button
              onClick={onOpenRequests}
              className="relative p-2 rounded-xl bg-brand-surface hover:bg-brand-card border border-brand-border/60 text-brand-muted hover:text-white transition-all"
              title="View participant control requests"
            >
              <Bell className="w-4 h-4" />
              {pendingRequests.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-primary text-[10px] font-bold text-white shadow-glow-sm animate-pulse">
                  {pendingRequests.length}
                </span>
              )}
            </button>
          )}

          {/* User Badge */}
          {currentUser && (
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-brand-surface border border-brand-border/60">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
                style={{ backgroundColor: currentUser.avatarColor || '#8067F5' }}
              >
                {currentUser.username.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-semibold text-white max-w-[80px] truncate hidden sm:inline">
                {currentUser.username}
              </span>
              {isHost ? (
                <span title="Host"><Crown className="w-3 h-3 text-amber-300" /></span>
              ) : currentUser.role === 'MODERATOR' ? (
                <span title="Moderator"><Shield className="w-3 h-3 text-cyan-400" /></span>
              ) : (
                <span title="Viewer"><User className="w-3 h-3 text-brand-subtle" /></span>
              )}
            </div>
          )}

          {/* Leave Button */}
          <button
            onClick={leaveRoom}
            className="p-2 rounded-xl text-brand-muted hover:text-red-400 hover:bg-red-950/30 transition-all border border-transparent hover:border-red-500/30"
            title="Leave Watch Party"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      )}
    </header>
  );
};
