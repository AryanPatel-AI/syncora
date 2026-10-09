import React, { useState } from 'react';
import { useWatchParty } from '../../context/WatchPartyContext';
import { extractYouTubeVideoId, getYouTubeThumbnail } from '../../utils/youtube';
import { VERIFIED_PRESETS } from '../../utils/constants';
import { isUnplayableVideo } from '../../services/api';
import { X, Search, Play, Sparkles, AlertCircle, Film, Radio, MonitorPlay } from 'lucide-react';

interface VideoSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VideoSelectorModal: React.FC<VideoSelectorModalProps> = ({ isOpen, onClose }) => {
  const { changeVideo, canControl } = useWatchParty();
  const [urlInput, setUrlInput] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleApply = (videoIdToLoad?: string) => {
    const rawId = videoIdToLoad || urlInput;
    const extractedId = extractYouTubeVideoId(rawId);

    if (!extractedId) {
      setError('Please enter a valid YouTube URL or 11-character video ID.');
      return;
    }

    if (isUnplayableVideo(extractedId)) {
      setError('This video cannot be played because external embedding has been disabled by the owner.');
      return;
    }

    if (!canControl) {
      setError('Only the Host or Moderator can change the broadcast stream for the room.');
      return;
    }

    changeVideo(extractedId);
    onClose();
    setUrlInput('');
    setError(null);
  };

  const categories = ['All', 'Cinema', 'Nature', 'Chill', 'Tech'];

  const filteredPresets = activeCategory === 'All'
    ? VERIFIED_PRESETS
    : VERIFIED_PRESETS.filter((p) => p.category === activeCategory);

  const previewId = extractYouTubeVideoId(urlInput);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#09140F]/90 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-stream-selector-title"
    >
      <div className="relative w-full max-w-xl bg-[#11221A] rounded-xl p-5 sm:p-6 shadow-cinema border border-[#234735] flex flex-col gap-5 text-[#D1FAE5] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#234735]">
          <div className="flex items-center gap-2.5">
            <Film className="w-5 h-5 text-[#34D399]" />
            <div>
              <h2 id="modal-stream-selector-title" className="text-base font-serif font-semibold text-[#D1FAE5]">
                Change Screening Stream
              </h2>
              <p className="text-xs text-[#8E919C]">
                {canControl
                  ? 'Broadcast any YouTube URL or select an open cinema reel'
                  : 'Submit a video change request to the room host'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-md text-[#8E919C] hover:text-[#D1FAE5] hover:bg-[#224433] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Custom URL Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleApply();
          }}
          className="flex flex-col gap-2"
        >
          <label htmlFor="custom-stream-url" className="text-xs font-mono uppercase tracking-wider text-[#8E919C]">
            YouTube URL or Video ID
          </label>
          <div className="flex gap-2">
            <input
              id="custom-stream-url"
              type="text"
              placeholder="https://www.youtube.com/watch?v=aqz-KE-bpKQ"
              value={urlInput}
              onChange={(e) => {
                setUrlInput(e.target.value);
                setError(null);
              }}
              className="flex-1 px-3.5 py-2.5 rounded-md bg-[#09140F] border border-[#234735] focus:border-[#34D399] text-xs text-[#D1FAE5] placeholder:text-[#5E606A] outline-none transition-colors"
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-md bg-[#34D399] hover:bg-[#2BBF88] text-[#09140F] text-xs font-semibold transition-colors flex items-center gap-1.5 flex-shrink-0"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{canControl ? 'Load Stream' : 'Request Stream'}</span>
            </button>
          </div>

          {/* Quick Preview Thumbnail if Valid URL */}
          {previewId && (
            <div className="flex items-center gap-3 p-2.5 rounded-md bg-[#193225] border border-[#234735] mt-1">
              <img
                src={getYouTubeThumbnail(previewId)}
                alt="Stream Preview"
                className="w-16 h-11 rounded object-cover border border-[#234735]"
              />
              <div className="flex flex-col">
                <span className="text-xs font-medium text-[#D1FAE5]">YouTube Stream ID Detected</span>
                <span className="text-[11px] font-mono text-[#34D399]">{previewId}</span>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-1.5 text-xs text-[#F87171] mt-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{error}</span>
            </div>
          )}
        </form>

        {/* Curated Presets Library */}
        <div className="flex flex-col gap-3 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-[#8E919C]">
              Curated Screening Presets
            </span>

            {/* Category Pills */}
            <div className="flex items-center gap-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`text-[11px] px-2.5 py-0.5 rounded-md transition-colors ${
                    activeCategory === cat
                      ? 'bg-[#34D399] text-[#09140F] font-semibold'
                      : 'bg-[#193225] text-[#8E919C] hover:text-[#D1FAE5] border border-[#234735]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
            {filteredPresets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleApply(preset.id)}
                className="group flex items-center gap-2.5 p-2 rounded-md bg-[#193225] hover:bg-[#224433] border border-[#234735] hover:border-[#2A5540] cursor-pointer transition-colors text-left"
              >
                <div className="relative w-14 h-11 rounded overflow-hidden bg-black flex-shrink-0 border border-[#234735]">
                  <img
                    src={preset.thumbnail}
                    alt={preset.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-[#09140F]/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="w-3.5 h-3.5 fill-[#34D399] text-[#34D399]" />
                  </div>
                </div>

                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-medium text-[#D1FAE5] truncate group-hover:text-[#34D399] transition-colors">
                    {preset.title}
                  </span>
                  <div className="flex items-center gap-1.5 text-[10px] text-[#8E919C] mt-0.5 font-mono">
                    <span>{preset.category}</span>
                    <span>&bull;</span>
                    <span>{preset.duration}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
