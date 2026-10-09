import React, { useState } from 'react';
import { useWatchParty } from '../../context/WatchPartyContext';
import { extractYouTubeVideoId } from '../../utils/youtube';
import { VERIFIED_PRESETS, DEFAULT_VIDEO_ID } from '../../utils/constants';
import { X, Tv, Sparkles, Film, Radio, ArrowRight } from 'lucide-react';

export const CreateRoomModal: React.FC = () => {
  const {
    isCreateRoomModalOpen,
    setIsCreateRoomModalOpen,
    createRoom,
    currentUserAccount,
    showToast,
  } = useWatchParty();

  const [username, setUsername] = useState<string>(() => {
    return (
      currentUserAccount?.displayName ||
      currentUserAccount?.username ||
      localStorage.getItem('syncora_username') ||
      ''
    );
  });
  const [selectedVideoId, setSelectedVideoId] = useState<string>(DEFAULT_VIDEO_ID);
  const [customUrl, setCustomUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isCreateRoomModalOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = username.trim();
    if (!finalName) {
      setError('Please provide a display name.');
      return;
    }

    let finalVideoId = selectedVideoId;
    if (customUrl.trim()) {
      const extracted = extractYouTubeVideoId(customUrl);
      if (extracted) {
        finalVideoId = extracted;
      } else {
        setError('Invalid YouTube link. Please paste a valid YouTube watch or live URL.');
        return;
      }
    }

    setError(null);
    setLoading(true);

    try {
      await createRoom(finalName, finalVideoId);
      setIsCreateRoomModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to initialize watch room.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#11221A] border border-[#234735] shadow-2xl p-6 text-[#D1FAE5] flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        <button
          onClick={() => setIsCreateRoomModalOpen(false)}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-[#8E919C] hover:text-white hover:bg-[#234735] transition-colors"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#34D399]/15 text-[#34D399] flex items-center justify-center">
              <Tv className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Start Watch Party Room
            </h2>
          </div>
          <p className="text-xs text-[#8E919C]">
            Host a synchronized viewing room with live chat, role governance, and shared playback.
          </p>
        </div>

        {error && (
          <div className="px-3 py-2 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleCreate} className="flex flex-col gap-3.5">
          <div>
            <label className="block text-[11px] font-semibold text-[#8E919C] mb-1">
              Your Display Name (Host)
            </label>
            <input
              type="text"
              placeholder="e.g. Alex"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              maxLength={30}
              className="w-full bg-[#09140F] border border-[#234735] rounded-xl px-3 py-2 text-xs text-[#D1FAE5] focus:outline-none focus:border-[#34D399]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#8E919C] mb-1">
              Custom YouTube Video or Live Stream URL (Optional)
            </label>
            <input
              type="url"
              placeholder="https://www.youtube.com/watch?v=..."
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              className="w-full bg-[#09140F] border border-[#234735] rounded-xl px-3 py-2 text-xs text-[#D1FAE5] focus:outline-none focus:border-[#34D399]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#8E919C] mb-1.5">
              Or Choose a Verified Starting Preset
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {VERIFIED_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setSelectedVideoId(preset.id);
                    setCustomUrl('');
                  }}
                  className={`flex items-center gap-2.5 p-2 rounded-xl text-left border transition-all ${
                    selectedVideoId === preset.id && !customUrl
                      ? 'bg-[#193225] border-[#34D399] ring-1 ring-[#34D399]'
                      : 'bg-[#09140F] border-[#234735] hover:border-[#2A5540]'
                  }`}
                >
                  <img
                    src={`https://i.ytimg.com/vi/${preset.id}/hqdefault.jpg`}
                    alt={preset.title}
                    className="w-12 h-8 rounded object-cover shrink-0"
                  />
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-[11px] font-semibold text-white truncate">
                      {preset.title}
                    </span>
                    <span className="text-[9px] text-[#8E919C] font-mono">
                      {preset.category}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-[#34D399] text-[#09140F] font-bold text-xs hover:bg-[#2BBF88] active:scale-95 disabled:opacity-50 transition-all shadow-md shadow-[#34D399]/15 flex items-center justify-center gap-1.5 mt-2"
          >
            <span>{loading ? 'Creating Screening Room...' : 'Launch Watch Party'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
