import React, { useState, useEffect } from 'react';
import { useWatchParty } from '../context/WatchPartyContext';
import { extractYouTubeVideoId, PRESET_VIDEOS } from '../utils/utils';
import {
  Play,
  Users,
  ShieldCheck,
  Zap,
  ArrowRight,
  Sparkles,
  Film,
  Tv,
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
  const [initialVideoUrl, setInitialVideoUrl] = useState<string>('jfKfPfyJRdk');
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [isJoining, setIsJoining] = useState<boolean>(false);
  const [mode, setMode] = useState<'create' | 'join'>('create');

  useEffect(() => {
    if (initialRoomCode) {
      setRoomCode(initialRoomCode);
      setMode('join');
    }
  }, [initialRoomCode]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      alert('Please enter your display name.');
      return;
    }

    localStorage.setItem('syncora_username', username.trim());
    setIsCreating(true);

    try {
      const extractedId = extractYouTubeVideoId(initialVideoUrl) || 'jfKfPfyJRdk';
      await createRoom(username.trim(), extractedId);
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
      {/* Background Decorative Ambient Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-brand-primary/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[350px] h-[350px] bg-brand-highlight/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Hero & Action Section */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-12 lg:py-16 flex flex-col items-center text-center">
        {/* Brand Tag Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-surface border border-brand-primary/30 text-brand-highlight text-xs font-semibold shadow-glow-sm mb-6 animate-pulse-glow">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Every moment, in sync.</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl leading-[1.1] mb-6">
          Movies are better{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-highlight via-brand-primary to-cyan-400">
            together.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-brand-muted max-w-2xl mb-10 leading-relaxed font-normal">
          Create a room. Invite your people. Stream YouTube in perfect real-time synchronization with role-based controls and interactive chat.
        </p>

        {/* Action Card with Tabs */}
        <div className="w-full max-w-md glass-panel-elevated rounded-3xl p-6 sm:p-8 shadow-2xl border border-brand-border/80 flex flex-col gap-6">
          {/* Mode Switcher */}
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-brand-dark/70 border border-brand-border/60">
            <button
              onClick={() => setMode('create')}
              className={`py-2 text-xs font-bold rounded-xl transition-all ${
                mode === 'create'
                  ? 'bg-brand-primary text-white shadow-glow-sm'
                  : 'text-brand-muted hover:text-white'
              }`}
            >
              Create Party
            </button>
            <button
              onClick={() => setMode('join')}
              className={`py-2 text-xs font-bold rounded-xl transition-all ${
                mode === 'join'
                  ? 'bg-brand-primary text-white shadow-glow-sm'
                  : 'text-brand-muted hover:text-white'
              }`}
            >
              Join with Code
            </button>
          </div>

          {/* Form: Create Room */}
          {mode === 'create' ? (
            <form onSubmit={handleCreate} className="flex flex-col gap-4 text-left">
              <div>
                <label className="block text-xs font-semibold text-brand-highlight uppercase tracking-wider mb-1.5">
                  Your Display Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-brand-dark/70 border border-brand-border focus:border-brand-primary text-sm text-white placeholder:text-brand-subtle outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-highlight uppercase tracking-wider mb-1.5">
                  Initial Video (Optional URL or Preset)
                </label>
                <input
                  type="text"
                  placeholder="https://youtube.com/watch?v=..."
                  value={initialVideoUrl}
                  onChange={(e) => setInitialVideoUrl(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-brand-dark/70 border border-brand-border focus:border-brand-primary text-sm text-white placeholder:text-brand-subtle outline-none transition-all"
                />
              </div>

              {/* Quick Preset Selector */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                <span className="text-[10px] text-brand-subtle uppercase font-bold mr-1">Presets:</span>
                {PRESET_VIDEOS.slice(0, 3).map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setInitialVideoUrl(preset.id)}
                    className={`text-[10px] px-2.5 py-1 rounded-lg border whitespace-nowrap transition-all ${
                      initialVideoUrl === preset.id
                        ? 'bg-brand-primary/20 border-brand-primary text-brand-highlight'
                        : 'bg-brand-surface border-brand-border/60 text-brand-muted hover:text-white'
                    }`}
                  >
                    {preset.category}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                disabled={isCreating}
                className="w-full mt-2 py-3 rounded-2xl bg-brand-primary hover:bg-brand-hover text-white text-sm font-bold shadow-glow hover:scale-101 active:scale-99 transition-all flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{isCreating ? 'Creating Watch Room...' : '＋ Create Watch Party'}</span>
              </button>
            </form>
          ) : (
            /* Form: Join Room */
            <form onSubmit={handleJoin} className="flex flex-col gap-4 text-left">
              <div>
                <label className="block text-xs font-semibold text-brand-highlight uppercase tracking-wider mb-1.5">
                  Your Display Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jordan"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-brand-dark/70 border border-brand-border focus:border-brand-primary text-sm text-white placeholder:text-brand-subtle outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-highlight uppercase tracking-wider mb-1.5">
                  Room Invite Code
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SYNC-4A9B"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-2.5 rounded-xl bg-brand-dark/70 border border-brand-border focus:border-brand-primary text-sm font-mono tracking-widest text-white placeholder:text-brand-subtle uppercase outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isJoining}
                className="w-full mt-2 py-3 rounded-2xl bg-brand-primary hover:bg-brand-hover text-white text-sm font-bold shadow-glow hover:scale-101 active:scale-99 transition-all flex items-center justify-center gap-2"
              >
                <span>{isJoining ? 'Connecting to Room...' : 'Join Watch Party'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>

        {/* Feature Highlights Grid */}
        <section className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full text-left">
          <div className="glass-panel p-6 rounded-2xl flex flex-col gap-3 border border-brand-border/60 hover:border-brand-primary/40 transition-all">
            <div className="w-10 h-10 rounded-xl bg-brand-primary/20 text-brand-highlight flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Smart Synchronization</h3>
            <p className="text-xs text-brand-muted leading-relaxed">
              Server-authoritative state engine with sub-second drift detection keeps every participant on the exact same frame.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl flex flex-col gap-3 border border-brand-border/60 hover:border-brand-primary/40 transition-all">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/60 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Role-Based Access</h3>
            <p className="text-xs text-brand-muted leading-relaxed">
              Granular Host, Moderator, and Viewer roles with control requests preventing trolls from disrupting the watch experience.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl flex flex-col gap-3 border border-brand-border/60 hover:border-brand-primary/40 transition-all">
            <div className="w-10 h-10 rounded-xl bg-purple-950/60 text-brand-highlight flex items-center justify-center border border-purple-500/20">
              <Tv className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Interactive Social</h3>
            <p className="text-xs text-brand-muted leading-relaxed">
              Real-time room chat, animated floating emoji reactions, and instant 1-click shareable invitation links.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 border-t border-brand-border/40 text-center text-xs text-brand-subtle">
        <p>Syncora &bull; YouTube Watch Party System &bull; Designed & Built with Modern WebSockets & React</p>
      </footer>
    </div>
  );
};
