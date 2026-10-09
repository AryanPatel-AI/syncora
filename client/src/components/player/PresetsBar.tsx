import React from 'react';
import { useWatchParty } from '../../context/WatchPartyContext';
import { VERIFIED_PRESETS } from '../../utils/constants';
import { Sparkles, Play, Search } from 'lucide-react';

interface PresetsBarProps {
  onOpenSelector: () => void;
}

export const PresetsBar: React.FC<PresetsBarProps> = ({ onOpenSelector }) => {
  const { playback, changeVideo, canControl, requestControl } = useWatchParty();

  const handleSelect = (videoId: string, title: string) => {
    if (videoId === playback.videoId) return;

    if (canControl) {
      changeVideo(videoId);
    } else {
      requestControl('REQUEST_CHANGE_VIDEO', videoId, title);
    }
  };

  return (
    <div className="w-full glass-panel rounded-2xl p-3 border border-brand-border/60 flex flex-col gap-2.5 shadow-lg">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-brand-highlight" />
          <span className="text-xs font-bold text-white tracking-wide uppercase">
            Curated 4K Cinema & Chill Streams
          </span>
        </div>
        <button
          onClick={onOpenSelector}
          className="flex items-center gap-1.5 text-xs font-semibold text-brand-highlight hover:text-white px-2.5 py-1 rounded-xl bg-brand-surface hover:bg-brand-card border border-brand-border/60 transition-all"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Custom URL</span>
        </button>
      </div>

      {/* Horizontal Scrollable Presets Cards */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-1 pt-0.5 scrollbar-thin">
        {VERIFIED_PRESETS.map((preset) => {
          const isActive = preset.id === playback.videoId;

          return (
            <button
              key={preset.id}
              onClick={() => handleSelect(preset.id, preset.title)}
              className={`flex-shrink-0 flex items-center gap-2.5 p-1.5 pr-3 rounded-xl border text-left transition-all ${
                isActive
                  ? 'bg-brand-primary/20 border-brand-primary shadow-glow-sm ring-1 ring-brand-primary'
                  : 'bg-brand-card/50 hover:bg-brand-card border-brand-border/60 hover:border-brand-primary/40'
              }`}
            >
              <div className="relative w-12 h-10 rounded-lg overflow-hidden bg-brand-surface flex-shrink-0">
                <img
                  src={preset.thumbnail}
                  alt={preset.title}
                  className="w-full h-full object-cover"
                />
                {isActive ? (
                  <div className="absolute inset-0 bg-brand-primary/60 flex items-center justify-center">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                    </span>
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <Play className="w-3 h-3 fill-white text-white" />
                  </div>
                )}
              </div>

              <div className="flex flex-col min-w-0 max-w-[130px]">
                <span className="text-[11px] font-semibold text-white truncate">
                  {preset.title}
                </span>
                <div className="flex items-center gap-1 text-[10px] text-brand-muted">
                  <span>{preset.category}</span>
                  <span>&bull;</span>
                  <span>{preset.duration}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
