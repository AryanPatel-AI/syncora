import React, { useState, useEffect } from 'react';
import { useWatchParty } from '../../context/WatchPartyContext';
import { extractYouTubeVideoId } from '../../utils/youtube';
import { VERIFIED_PRESETS, DEFAULT_VIDEO_ID } from '../../utils/constants';
import { AmbientGlow } from '../../components/layout/AmbientGlow';
import {
  Play,
  ArrowRight,
  Sparkles,
  Zap,
  ShieldCheck,
  Tv,
  Users,
  Copy,
  Radio,
  Flame,
} from 'lucide-react';

interface HomePageProps {
  initialRoomCode?: string;
}

export const HomePage: React.FC<HomePageProps> = ({ initialRoomCode }) => {
  const { createRoom, joinRoom } = useWatchParty();

  const [username, setUsername] = useState<string>(() => {
    return localStorage.getItem('syncora_username') || '';
  });
  const [roomCode, setRoomCode] = useState<string>(initialRoomCode || '');
  const [selectedVideoId, setSelectedVideoId] = useState<string>(DEFAULT_VIDEO_ID);
  const [customUrl, setCustomUrl] = useState<string>('');
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [isJoining, setIsJoining] = useState<boolean>(false);
  const [mode, setMode] = useState<'create' | 'join'>('create');

  useEffect(() => {
    if (initialRoomCode) {
      setRoomCode(initialRoomCode);
      setMode('join');
    }
  }, [initialRoomCode]);

  const handleCreate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const finalName = username.trim() || 'Alex';
    localStorage.setItem('syncora_username', finalName);
    setIsCreating(true);

    try {
      const finalVideoId = customUrl.trim()
        ? extractYouTubeVideoId(customUrl) || selectedVideoId
        : selectedVideoId;

      await createRoom(finalName, finalVideoId);
    } finally {
      setIsCreating(false);
    }
  };

  const handleQuickDemo = async () => {
    const demoNames = ['Jordan', 'Taylor', 'Casey', 'Sam', 'Morgan'];
    const randomName = demoNames[Math.floor(Math.random() * demoNames.length)];
    setUsername(randomName);
    localStorage.setItem('syncora_username', randomName);
    setIsCreating(true);

    try {
      await createRoom(randomName, DEFAULT_VIDEO_ID);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      alert('Please enter your display name.');
      return;
    }
    if (!roomCode.trim()) {
      alert('Please enter a room code.');
      return;
    }

    localStorage.setItem('syncora_username', username.trim());
    setIsJoining(true);

    try {
      await joinRoom(roomCode.trim().toUpperCase(), username.trim());
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-65px)] flex flex-col justify-between overflow-hidden">
      {/* Dynamic Ambient Glow Backdrop */}
      <AmbientGlow isPlaying={false} />

      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-12 lg:py-16 flex flex-col items-center text-center">
        {/* Glowing Badge Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-surface/90 border border-brand-primary/40 text-brand-highlight text-xs font-bold shadow-glow-sm mb-6 animate-pulse-glow backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Syncora 2.0 &bull; Every moment, in sync.</span>
        </div>

        {/* Hero Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-4xl leading-[1.08] mb-6">
          Movies are better{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-highlight via-brand-primary to-cyan-400">
            together.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-brand-muted max-w-2xl mb-8 leading-relaxed font-normal">
          Create a room. Invite your people. Stream YouTube videos in frame-accurate synchronization with server-validated controls and real-time chat.
        </p>

        {/* 1-Click Instant Demo Room Button */}
        <div className="mb-8">
          <button
            onClick={handleQuickDemo}
            disabled={isCreating}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-brand-surface/80 hover:bg-brand-card border border-brand-primary/40 hover:border-brand-primary text-xs font-bold text-brand-highlight shadow-glow-sm hover:scale-105 active:scale-95 transition-all"
          >
            <Flame className="w-4 h-4 text-amber-400" />
            <span>Try 1-Click Instant Demo Room (No setup)</span>
          </button>
        </div>

        {/* Main Action Card */}
        <div className="w-full max-w-lg glass-panel-elevated rounded-3xl p-6 sm:p-8 shadow-2xl border border-brand-border/80 flex flex-col gap-6 backdrop-blur-2xl">
          {/* Switcher: Create vs Join */}
          <div className="grid grid-cols-2 p-1.5 rounded-2xl bg-brand-dark/80 border border-brand-border/60">
            <button
              onClick={() => setMode('create')}
              className={`py-2.5 text-xs font-extrabold rounded-xl transition-all ${
                mode === 'create'
                  ? 'bg-gradient-to-r from-brand-primary to-brand-hover text-white shadow-glow'
                  : 'text-brand-muted hover:text-white'
              }`}
            >
              ＋ Create Watch Party
            </button>
            <button
              onClick={() => setMode('join')}
              className={`py-2.5 text-xs font-extrabold rounded-xl transition-all ${
                mode === 'join'
                  ? 'bg-gradient-to-r from-brand-primary to-brand-hover text-white shadow-glow'
                  : 'text-brand-muted hover:text-white'
              }`}
            >
              Join with Room Code
            </button>
          </div>

          {/* Form: Create Party */}
          {mode === 'create' ? (
            <form onSubmit={handleCreate} className="flex flex-col gap-4 text-left">
              <div>
                <label className="block text-xs font-extrabold text-brand-highlight uppercase tracking-wider mb-1.5">
                  Your Display Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-brand-dark/70 border border-brand-border focus:border-brand-primary text-sm text-white placeholder:text-brand-subtle outline-none transition-all shadow-inner"
                />
              </div>

              {/* Starter Stream Selection */}
              <div>
                <label className="block text-xs font-extrabold text-brand-highlight uppercase tracking-wider mb-1.5">
                  Choose Starter Stream
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {VERIFIED_PRESETS.slice(0, 4).map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setSelectedVideoId(preset.id);
                        setCustomUrl('');
                      }}
                      className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all ${
                        selectedVideoId === preset.id && !customUrl
                          ? 'bg-brand-primary/20 border-brand-primary shadow-glow-sm ring-1 ring-brand-primary'
                          : 'bg-brand-surface/70 hover:bg-brand-surface border-brand-border/60 text-brand-muted hover:text-white'
                      }`}
                    >
                      <img
                        src={preset.thumbnail}
                        alt={preset.title}
                        className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                      />
                      <span className="text-[11px] font-bold truncate text-white">
                        {preset.title.split(' ')[0]} {preset.title.split(' ')[1]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Or Paste Custom URL */}
              <div>
                <label className="block text-[11px] font-semibold text-brand-subtle uppercase tracking-wider mb-1">
                  Or Paste Custom YouTube URL
                </label>
                <input
                  type="text"
                  placeholder="https://youtube.com/watch?v=..."
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-brand-dark/70 border border-brand-border focus:border-brand-primary text-xs text-white placeholder:text-brand-subtle outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isCreating}
                className="w-full mt-2 py-3.5 rounded-2xl bg-gradient-to-tr from-brand-primary via-brand-highlight to-brand-primary hover:from-brand-hover hover:to-brand-primary text-white text-sm font-black shadow-glow hover:scale-102 active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{isCreating ? 'Creating Watch Room...' : '＋ Launch Watch Party'}</span>
              </button>
            </form>
          ) : (
            /* Form: Join Party */
            <form onSubmit={handleJoin} className="flex flex-col gap-4 text-left">
              <div>
                <label className="block text-xs font-extrabold text-brand-highlight uppercase tracking-wider mb-1.5">
                  Your Display Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jordan"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-brand-dark/70 border border-brand-border focus:border-brand-primary text-sm text-white placeholder:text-brand-subtle outline-none transition-all shadow-inner"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-brand-highlight uppercase tracking-wider mb-1.5">
                  Room Invite Code
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SYNC-4A9B"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 rounded-2xl bg-brand-dark/70 border border-brand-border focus:border-brand-primary text-sm font-mono tracking-widest text-white placeholder:text-brand-subtle uppercase outline-none transition-all shadow-inner"
                />
              </div>

              <button
                type="submit"
                disabled={isJoining}
                className="w-full mt-2 py-3.5 rounded-2xl bg-gradient-to-tr from-brand-primary to-brand-hover text-white text-sm font-black shadow-glow hover:scale-102 active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <span>{isJoining ? 'Connecting to Room...' : 'Enter Watch Room'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>

        {/* Feature Bento Grid */}
        <section className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full text-left">
          <div className="glass-panel p-6 rounded-3xl flex flex-col gap-3.5 border border-brand-border/60 hover:border-brand-primary/50 transition-all hover:scale-102">
            <div className="w-12 h-12 rounded-2xl bg-brand-primary/20 text-brand-highlight flex items-center justify-center shadow-glow-sm">
              <Zap className="w-6 h-6 text-brand-highlight" />
            </div>
            <h3 className="text-base font-extrabold text-white">Sub-Second Sync Engine</h3>
            <p className="text-xs text-brand-muted leading-relaxed">
              Server-authoritative timestamp math with automatic drift correction keeps everyone watching the exact same frame.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-3xl flex flex-col gap-3.5 border border-brand-border/60 hover:border-cyan-500/40 transition-all hover:scale-102">
            <div className="w-12 h-12 rounded-2xl bg-cyan-950/60 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-white">Role-Based Access (RBAC)</h3>
            <p className="text-xs text-brand-muted leading-relaxed">
              Granular Host, Moderator, and Viewer permissions with real-time approval requests to protect the room from disruptions.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-3xl flex flex-col gap-3.5 border border-brand-border/60 hover:border-purple-500/40 transition-all hover:scale-102">
            <div className="w-12 h-12 rounded-2xl bg-purple-950/60 text-brand-highlight flex items-center justify-center border border-purple-500/30">
              <Tv className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-white">Interactive Social Hub</h3>
            <p className="text-xs text-brand-muted leading-relaxed">
              Real-time room chat, floating physics emoji reactions, instant 1-click shareable URLs, and curated 4K cinema presets.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 border-t border-brand-border/40 text-center text-xs text-brand-subtle backdrop-blur-md">
        <p>Syncora &bull; Professional YouTube Watch Party Platform &bull; Built with Modern WebSockets & React</p>
      </footer>
    </div>
  );
};
