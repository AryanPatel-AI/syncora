import React, { useState } from 'react';
import { useWatchParty } from '../context/WatchPartyContext';
import { extractYouTubeVideoId, PRESET_VIDEOS } from '../utils/utils';
import { X, Search, Play, Sparkles, AlertCircle } from 'lucide-react';

interface VideoSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VideoSelectorModal: React.FC<VideoSelectorModalProps> = ({ isOpen, onClose }) => {
  const { changeVideo, canControl, requestControl } = useWatchParty();
  const [urlInput, setUrlInput] = useState<string>('');
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
      // If viewer, request change
      requestControl('REQUEST_CHANGE_VIDEO', extractedId, 'New video request');
      onClose();
      setUrlInput('');
      setError(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl glass-panel-elevated rounded-2xl p-6 shadow-2xl border border-brand-border/80 flex flex-col gap-5 text-brand-text">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-brand-border/50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-brand-primary/20 text-brand-highlight">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Change YouTube Video</h2>
              <p className="text-xs text-brand-muted">
                {canControl ? 'Synchronize a new video for everyone in the room' : 'Submit a video change request to the host'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-brand-muted hover:text-white hover:bg-brand-surface transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* URL Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleApply();
          }}
          className="flex flex-col gap-2"
        >
          <label className="text-xs font-semibold text-brand-highlight uppercase tracking-wider">
            Paste YouTube URL or Video ID
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="https://www.youtube.com/watch?v=..."
                value={urlInput}
                onChange={(e) => {
                  setUrlInput(e.target.value);
                  setError(null);
                }}
                className="w-full px-4 py-2.5 rounded-xl bg-brand-dark/70 border border-brand-border focus:border-brand-primary focus:ring-1 focus:ring-brand-primary text-sm placeholder:text-brand-subtle transition-all outline-none"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-hover text-white text-sm font-semibold shadow-glow-sm hover:scale-102 active:scale-98 transition-all flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              <span>Load</span>
            </button>
          </div>
          {error && (
            <div className="flex items-center gap-1.5 text-xs text-red-400 mt-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{error}</span>
            </div>
          )}
        </form>

        {/* Curated Presets Library */}
        <div className="flex flex-col gap-3 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-brand-highlight uppercase tracking-wider">
              Popular Presets
            </span>
            <span className="text-[11px] text-brand-subtle">Click to play instantly</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
            {PRESET_VIDEOS.map((preset) => (
              <div
                key={preset.id}
                onClick={() => handleApply(preset.id)}
                className="group flex items-center gap-3 p-2.5 rounded-xl bg-brand-surface/70 hover:bg-brand-surface border border-brand-border/60 hover:border-brand-primary/50 cursor-pointer transition-all hover:scale-[1.01]"
              >
                <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-brand-card flex-shrink-0">
                  <img
                    src={preset.thumbnail}
                    alt={preset.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-brand-dark/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="w-4 h-4 fill-white text-white" />
                  </div>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-brand-text truncate group-hover:text-brand-highlight transition-colors">
                    {preset.title}
                  </span>
                  <span className="text-[11px] text-brand-muted truncate">{preset.creator}</span>
                  <span className="text-[10px] text-brand-subtle mt-0.5">{preset.category}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
