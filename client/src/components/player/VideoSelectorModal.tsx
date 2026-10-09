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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#101114]/90 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-stream-selector-title"
    >
      <div className="relative w-full max-w-xl bg-[#16171B] rounded-xl p-5 sm:p-6 shadow-cinema border border-[#282A33] flex flex-col gap-5 text-[#F2F0E9] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#282A33]">
          <div className="flex items-center gap-2.5">
            <Film className="w-5 h-5 text-[#D6F279]" />
            <div>
              <h2 id="modal-stream-selector-title" className="text-base font-serif font-semibold text-[#F2F0E9]">
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
            className="p-1.5 rounded-md text-[#8E919C] hover:text-[#F2F0E9] hover:bg-[#24262E] transition-colors"
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
              className="flex-1 px-3.5 py-2.5 rounded-md bg-[#101114] border border-[#282A33] focus:border-[#D6F279] text-xs text-[#F2F0E9] placeholder:text-[#5E606A] outline-none transition-colors"
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-md bg-[#D6F279] hover:bg-[#C3E065] text-[#101114] text-xs font-semibold transition-colors flex items-center gap-1.5 flex-shrink-0"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{canControl ? 'Load Stream' : 'Request Stream'}</span>
            </button>
          </div>

          {/* Quick Preview Thumbnail if Valid URL */}
          {previewId && (
            <div className="flex items-center gap-3 p-2.5 rounded-md bg-[#1C1E24] border border-[#282A33] mt-1">
              <img
                src={getYouTubeThumbnail(previewId)}
                alt="Stream Preview"
                className="w-16 h-11 rounded object-cover border border-[#282A33]"
              />
              <div className="flex flex-col">
                <span className="text-xs font-medium text-[#F2F0E9]">YouTube Stream ID Detected</span>
                <span className="text-[11px] font-mono text-[#D6F279]">{previewId}</span>
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
                      ? 'bg-[#D6F279] text-[#101114] font-semibold'
                      : 'bg-[#1C1E24] text-[#8E919C] hover:text-[#F2F0E9] border border-[#282A33]'
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
                className="group flex items-center gap-2.5 p-2 rounded-md bg-[#1C1E24] hover:bg-[#24262E] border border-[#282A33] hover:border-[#3A3D4A] cursor-pointer transition-colors text-left"
              >
                <div className="relative w-14 h-11 rounded overflow-hidden bg-black flex-shrink-0 border border-[#282A33]">
                  <img
                    src={preset.thumbnail}
                    alt={preset.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-[#101114]/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="w-3.5 h-3.5 fill-[#D6F279] text-[#D6F279]" />
                  </div>
                </div>

                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-medium text-[#F2F0E9] truncate group-hover:text-[#D6F279] transition-colors">
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
