import React, { useState } from 'react';
import { useWatchParty } from '../../context/WatchPartyContext';
import { extractYouTubeVideoId, getYouTubeThumbnail } from '../../utils/youtube';
import { VERIFIED_PRESETS } from '../../utils/constants';
import { X, Search, Play, Sparkles, AlertCircle, Film, Radio, MonitorPlay } from 'lucide-react';

interface VideoSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VideoSelectorModal: React.FC<VideoSelectorModalProps> = ({ isOpen, onClose }) => {
  const { changeVideo, canControl, requestControl } = useWatchParty();
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

    if (canControl) {
      changeVideo(extractedId);
      onClose();
      setUrlInput('');
      setError(null);
    } else {
      requestControl('REQUEST_CHANGE_VIDEO', extractedId, 'New video change request');
      onClose();
      setUrlInput('');
      setError(null);
    }
  };

  const categories = ['All', 'Cinema', 'Nature', 'Chill', 'Tech'];

  const filteredPresets = activeCategory === 'All'
    ? VERIFIED_PRESETS
    : VERIFIED_PRESETS.filter((p) => p.category === activeCategory);

  const previewId = extractYouTubeVideoId(urlInput);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/85 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-2xl glass-panel-elevated rounded-3xl p-6 sm:p-8 shadow-2xl border border-brand-border/80 flex flex-col gap-6 text-brand-text max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-brand-border/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-brand-primary to-brand-highlight text-white shadow-glow-sm">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white">Stream Selector</h2>
              <p className="text-xs text-brand-muted">
                {canControl ? 'Broadcast any YouTube stream to everyone in the room' : 'Submit a video change request to the host'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-brand-muted hover:text-white hover:bg-brand-surface transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Custom URL Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleApply();
          }}
          className="flex flex-col gap-2.5"
        >
          <label className="text-xs font-bold text-brand-highlight uppercase tracking-wider">
            Enter Any YouTube Link or ID
          </label>
          <div className="flex gap-2.5">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="https://www.youtube.com/watch?v=aqz-KE-bpKQ"
                value={urlInput}
                onChange={(e) => {
                  setUrlInput(e.target.value);
                  setError(null);
                }}
                className="w-full px-4 py-3 rounded-2xl bg-brand-dark/70 border border-brand-border focus:border-brand-primary text-sm placeholder:text-brand-subtle transition-all outline-none"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-brand-primary to-brand-hover text-white text-sm font-bold shadow-glow hover:scale-102 active:scale-98 transition-all flex items-center gap-2 flex-shrink-0"
            >
              <Search className="w-4 h-4" />
              <span>Load Stream</span>
            </button>
          </div>

          {/* Quick Preview Thumbnail if Valid URL */}
          {previewId && (
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-brand-surface/70 border border-brand-border/60 animate-fade-in mt-1">
              <img
                src={getYouTubeThumbnail(previewId)}
                alt="Preview"
                className="w-20 h-14 rounded-xl object-cover"
              />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white">Valid YouTube Stream Detected</span>
                <span className="text-[11px] font-mono text-brand-highlight">ID: {previewId}</span>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-1.5 text-xs text-red-400 mt-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{error}</span>
            </div>
          )}
        </form>

        {/* Curated Presets Library */}
        <div className="flex flex-col gap-3.5 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-brand-highlight uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Verified 4K Presets</span>
            </span>

            {/* Category Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`text-[11px] px-2.5 py-1 rounded-xl font-medium transition-all ${
                    activeCategory === cat
                      ? 'bg-brand-primary text-white shadow-glow-sm'
                      : 'bg-brand-surface text-brand-muted hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
            {filteredPresets.map((preset) => (
              <div
                key={preset.id}
                onClick={() => handleApply(preset.id)}
                className="group flex items-center gap-3 p-3 rounded-2xl bg-brand-surface/60 hover:bg-brand-surface border border-brand-border/60 hover:border-brand-primary/50 cursor-pointer transition-all hover:scale-[1.02]"
              >
                <div className="relative w-16 h-14 rounded-xl overflow-hidden bg-brand-card flex-shrink-0">
                  <img
                    src={preset.thumbnail}
                    alt={preset.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-brand-dark/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="w-5 h-5 fill-white text-white" />
                  </div>
                </div>

                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-brand-text truncate group-hover:text-brand-highlight transition-colors">
                    {preset.title}
                  </span>
                  <span className="text-[11px] text-brand-muted truncate">{preset.creator}</span>
                  <div className="flex items-center gap-1.5 text-[10px] text-brand-subtle mt-0.5">
                    <span className="px-1.5 py-0.5 rounded-md bg-brand-card text-brand-highlight">{preset.category}</span>
                    <span>{preset.duration}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
