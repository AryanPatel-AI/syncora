import React, { useState, useEffect } from 'react';
import { useWatchParty } from '../../context/WatchPartyContext';
import { extractYouTubeVideoId } from '../../utils/youtube';
import { VERIFIED_PRESETS, DEFAULT_VIDEO_ID } from '../../utils/constants';
import { AmbientGlow } from '../../components/layout/AmbientGlow';
import {
  Play,
  ArrowRight,
  Radio,
  Users,
  Shield,
  Film,
  Sparkles,
  Heart,
} from 'lucide-react';

interface HomePageProps {
  initialRoomCode?: string;
}

export const HomePage: React.FC<HomePageProps> = ({ initialRoomCode }) => {
  const { createRoom, joinRoom } = useWatchParty();

  const [username, setUsername] = useState<string>(() => {
    return localStorage.getItem('syncora_username') || '';
  });
  const [joinUsername, setJoinUsername] = useState<string>(() => {
    return localStorage.getItem('syncora_username') || '';
  });
  const [roomCode, setRoomCode] = useState<string>(initialRoomCode || '');
  const [selectedVideoId, setSelectedVideoId] = useState<string>(DEFAULT_VIDEO_ID);
  const [customUrl, setCustomUrl] = useState<string>('');
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [isJoining, setIsJoining] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);

  useEffect(() => {
    if (initialRoomCode) {
      setRoomCode(initialRoomCode.toUpperCase());
    }
  }, [initialRoomCode]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = username.trim();
    if (!finalName) {
      setCreateError('Please enter a display name to create a room.');
      return;
    }
    if (finalName.length < 2 || finalName.length > 30) {
      setCreateError('Display name must be between 2 and 30 characters.');
      return;
    }

    setCreateError(null);
    setIsCreating(true);

    try {
      const finalVideoId = customUrl.trim()
        ? extractYouTubeVideoId(customUrl) || selectedVideoId
        : selectedVideoId;

      await createRoom(finalName, finalVideoId);
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create watch room.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = (joinUsername || username).trim();
    if (!finalName) {
      setJoinError('Please enter your display name.');
      return;
    }
    if (finalName.length < 2 || finalName.length > 30) {
      setJoinError('Display name must be between 2 and 30 characters.');
      return;
    }

    const finalCode = roomCode.trim().toUpperCase();
    if (!finalCode) {
      setJoinError('Please enter a room invitation code.');
      return;
    }
    if (finalCode.length < 4 || finalCode.length > 12) {
      setJoinError('Room code should be between 4 and 12 characters.');
      return;
    }

    setJoinError(null);
    setIsJoining(true);

    try {
      const success = await joinRoom(finalCode, finalName);
      if (!success) {
        setJoinError('Could not join room. Please check the code and try again.');
      }
    } catch (err: any) {
      setJoinError(err.message || 'Could not join room.');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-53px)] flex flex-col justify-between overflow-hidden bg-[#09140F]">
      {/* Intimate Screening Room Backdrop */}
      <AmbientGlow isPlaying={false} />

      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-10 lg:py-14 flex flex-col gap-12 w-full">
        {/* Editorial Heading Section */}
        <section className="flex flex-col items-center text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#11221A] border border-[#234735] text-[11px] font-mono text-[#8E919C] mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#34D399]" />
            <span className="text-[#34D399]">Live Sync Engine</span>
            <span className="text-[#5E606A]">&bull;</span>
            <span>Intimate Digital Screening Room</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-[#D1FAE5] leading-[1.12] mb-4">
            An intimate screening room for people watching together across distances.
          </h1>

          <p className="text-sm sm:text-base text-[#8E919C] leading-relaxed max-w-2xl font-normal">
            Create a private session. Invite your circle. Experience frame-locked YouTube playback where everyone shares the exact same pause, seek, and stream changes.
          </p>
        </section>

        {/* Invitation Banner if arriving via room link */}
        {initialRoomCode && (
          <div className="max-w-4xl w-full mx-auto p-4 rounded-xl bg-[#193225] border border-[#34D399]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-cinema">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#34D399]/10 border border-[#34D399]/20 flex items-center justify-center flex-shrink-0">
                <Radio className="w-4 h-4 text-[#34D399]" />
              </div>
              <div>
                <div className="text-xs font-mono uppercase tracking-wider text-[#8E919C]">
                  Direct Room Invitation
                </div>
                <div className="text-sm font-medium text-[#D1FAE5]">
                  You have been invited to watch party: <span className="font-mono text-[#34D399] tracking-wider font-bold">{initialRoomCode}</span>
                </div>
              </div>
            </div>
            <div className="text-xs text-[#8E919C]">
              Enter your display name in the <span className="text-[#34D399] font-medium">Join Room</span> form below to enter.
            </div>
          </div>
        )}

        {/* Dual Actions Form Grid: Create Room (Left) vs Join Room (Right) */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full mx-auto">
          {/* Create Room Card */}
          <div className="rounded-xl bg-[#11221A] border border-[#234735] p-5 sm:p-6 flex flex-col justify-between shadow-cinema">
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#234735]">
                <div className="flex items-center gap-2">
                  <Play className="w-4 h-4 text-[#34D399]" />
                  <h2 className="text-sm font-mono uppercase tracking-wider text-[#D1FAE5] font-medium">
                    Create New Room
                  </h2>
                </div>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#E5A84B]/10 text-[#E5A84B] border border-[#E5A84B]/30">
                  Host Role
                </span>
              </div>

              {createError && (
                <div className="p-2.5 rounded-md bg-[#F87171]/10 border border-[#F87171]/30 text-xs text-[#F87171]">
                  {createError}
                </div>
              )}

              <div>
                <label
                  htmlFor="create-username"
                  className="block text-xs font-mono uppercase tracking-wider text-[#8E919C] mb-1.5"
                >
                  Your Display Name
                </label>
                <input
                  id="create-username"
                  type="text"
                  required
                  disabled={isCreating}
                  placeholder="e.g. Jordan"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setJoinUsername(e.target.value);
                    setCreateError(null);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-md bg-[#09140F] border border-[#234735] focus:border-[#34D399] text-xs text-[#D1FAE5] placeholder:text-[#5E606A] outline-none transition-colors disabled:opacity-50"
                />
              </div>

              {/* Starter Reel Selector */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#8E919C] mb-1.5">
                  Starter Cinema Reel
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
                      className={`flex items-center gap-2 p-2 rounded-md border text-left transition-colors ${selectedVideoId === preset.id && !customUrl
                        ? 'bg-[#193225] border-[#34D399] text-[#34D399]'
                        : 'bg-[#09140F] border-[#234735] text-[#8E919C] hover:text-[#D1FAE5]'
                        }`}
                    >
                      <img
                        src={preset.thumbnail}
                        alt=""
                        className="w-7 h-7 rounded object-cover flex-shrink-0"
                      />
                      <span className="text-[11px] font-medium truncate">
                        {preset.title.split(' ')[0]} {preset.title.split(' ')[1]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom YouTube URL */}
              <div>
                <label
                  htmlFor="create-custom-url"
                  className="block text-[11px] font-mono uppercase tracking-wider text-[#5E606A] mb-1"
                >
                  Or Custom YouTube URL (Optional)
                </label>
                <input
                  id="create-custom-url"
                  type="text"
                  placeholder="https://youtube.com/watch?v=..."
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-[#09140F] border border-[#234735] focus:border-[#34D399] text-xs text-[#D1FAE5] placeholder:text-[#5E606A] outline-none transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={isCreating}
                className="w-full mt-2 py-2.5 rounded-md bg-[#34D399] hover:bg-[#2BBF88] text-[#09140F] text-xs font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{isCreating ? 'Launching Screening Room...' : 'Launch Screening Room'}</span>
              </button>
            </form>
          </div>

          {/* Join Existing Room Card */}
          <div className="rounded-xl bg-[#11221A] border border-[#234735] p-5 sm:p-6 flex flex-col justify-between shadow-cinema">
            <form onSubmit={handleJoin} className="flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#234735]">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-[#34D399]" />
                  <h2 className="text-sm font-mono uppercase tracking-wider text-[#D1FAE5] font-medium">
                    Join Existing Room
                  </h2>
                </div>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#234735]/50 text-[#8E919C] border border-[#234735]">
                  Viewer Role
                </span>
              </div>

              {joinError && (
                <div className="p-2.5 rounded-md bg-[#F87171]/10 border border-[#F87171]/30 text-xs text-[#F87171]">
                  {joinError}
                </div>
              )}

              <div>
                <label
                  htmlFor="join-username"
                  className="block text-xs font-mono uppercase tracking-wider text-[#8E919C] mb-1.5"
                >
                  Your Display Name
                </label>
                <input
                  id="join-username"
                  type="text"
                  required
                  disabled={isJoining}
                  placeholder="e.g. Taylor"
                  value={joinUsername}
                  onChange={(e) => {
                    setJoinUsername(e.target.value);
                    setJoinError(null);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-md bg-[#09140F] border border-[#234735] focus:border-[#34D399] text-xs text-[#D1FAE5] placeholder:text-[#5E606A] outline-none transition-colors disabled:opacity-50"
                />
              </div>

              <div>
                <label
                  htmlFor="join-room-code"
                  className="block text-xs font-mono uppercase tracking-wider text-[#8E919C] mb-1.5"
                >
                  Room Invitation Code
                </label>
                <input
                  id="join-room-code"
                  type="text"
                  required
                  disabled={isJoining}
                  placeholder="e.g. SYNC-4A9B"
                  value={roomCode}
                  onChange={(e) => {
                    setRoomCode(e.target.value.toUpperCase());
                    setJoinError(null);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-md bg-[#09140F] border border-[#234735] focus:border-[#34D399] text-xs font-mono tracking-widest text-[#D1FAE5] placeholder:text-[#5E606A] uppercase outline-none transition-colors disabled:opacity-50"
                />
              </div>

              <div className="p-3 rounded-md bg-[#09140F] border border-[#234735] text-[11px] text-[#8E919C] leading-relaxed">
                <span className="text-[#D1FAE5] font-medium">How joining works:</span> You join the room as a Viewer. When you enter, your player synchronizes with the host's exact frame. You can request playback control at any time.
              </div>

              <button
                type="submit"
                disabled={isJoining}
                className="w-full mt-2 py-2.5 rounded-md bg-[#193225] hover:bg-[#224433] border border-[#234735] hover:border-[#234735] text-[#D1FAE5] text-xs font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{isJoining ? 'Connecting to Room...' : 'Enter Screening Room'}</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#34D399]" />
              </button>
            </form>
          </div>
        </section>

        {/* Visual Preview of the Watch-Room Experience */}
        <section className="flex flex-col gap-3 max-w-4xl w-full mx-auto">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-mono uppercase tracking-wider text-[#8E919C]">
              Screening Room Interface Preview
            </span>
            <span className="text-[11px] font-mono text-[#34D399]">
              Frame-Accurate Synchronization
            </span>
          </div>

          <div className="rounded-xl bg-[#11221A] border border-[#234735] p-4 shadow-cinema flex flex-col gap-3">
            {/* Simulated Stage Header */}
            <div className="flex items-center justify-between pb-2.5 border-b border-[#234735] text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-sm bg-[#34D399]" />
                <span className="font-serif font-medium text-[#D1FAE5]">Syncora Screening</span>
                <span className="font-mono text-[10px] text-[#8E919C] border-l border-[#234735] pl-2">
                  ROOM: SYNC-4A9B
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-[#34D399]" />
                <span className="text-[#8E919C]">In Sync (±0.02s)</span>
              </div>
            </div>

            {/* Simulated Video Canvas + Discussion Stack */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-stretch">
              {/* Simulated Video Stage (8 cols) */}
              <div className="md:col-span-8 flex flex-col gap-2">
                <div className="relative aspect-video rounded-lg bg-black border border-[#234735] flex flex-col items-center justify-center overflow-hidden">
                  {/* Subtle cinema still background */}
                  <img
                    src="https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=80"
                    alt="Cinema Still Preview"
                    className="absolute inset-0 w-full h-full object-cover opacity-60 filter contrast-125"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

                  {/* Center play indicator */}
                  <div className="relative z-10 w-10 h-10 rounded-full bg-[#34D399] text-[#09140F] flex items-center justify-center shadow-cinema">
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </div>

                  {/* Corner stream indicator */}
                  <div className="absolute bottom-2 left-2.5 z-10 text-[10px] font-mono text-[#D1FAE5] bg-[#09140F]/80 px-2 py-0.5 rounded border border-[#234735]">
                    Reel: Big Buck Bunny 4K
                  </div>
                </div>

                {/* Scrubber bar */}
                <div className="p-2.5 rounded-lg bg-[#09140F] border border-[#234735] flex flex-col gap-1.5">
                  <div className="w-full h-1 bg-[#234735] rounded overflow-hidden">
                    <div className="w-[42%] h-full bg-[#34D399]" />
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#8E919C]">
                    <span className="text-[#D1FAE5]">04:18 / 10:34</span>
                    <span className="text-[#34D399]">Broadcasting to 3 Viewers</span>
                  </div>
                </div>
              </div>

              {/* Sidebar (4 cols) */}
              <div className="md:col-span-4 flex flex-col justify-between p-3 rounded-lg bg-[#09140F] border border-[#234735] gap-2.5 text-xs">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[#8E919C] pb-1.5 border-b border-[#234735] mb-2">
                    Active Participants
                  </div>
                  <div className="flex flex-col gap-1.5 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-[#D1FAE5] font-medium">Jordan (Host)</span>
                      <span className="text-[10px] font-mono text-[#E5A84B]">👑 Host</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#D1FAE5]">Taylor</span>
                      <span className="text-[10px] font-mono text-[#82A8F8]">🛡️ Mod</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#8E919C]">Casey</span>
                      <span className="text-[10px] font-mono text-[#5E606A]">Viewer</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#234735]">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[#8E919C] mb-1">
                    Screening Notes
                  </div>
                  <div className="p-2 rounded bg-[#11221A] border border-[#234735] text-[10px] text-[#8E919C] leading-snug">
                    <span className="text-[#D1FAE5] font-medium">Taylor:</span> Synchronized at 04:18.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-4 border-t border-[#234735] flex justify-center items-center text-xs font-mono text-[#5E606A]">
        <p>Made with <span className="heart">❤️</span> by <span>Aryan Patel</span></p>
      </footer>
    </div>
  );
};
