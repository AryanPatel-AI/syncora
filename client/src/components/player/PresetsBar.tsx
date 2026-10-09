import React from 'react';
import { useWatchParty } from '../../context/WatchPartyContext';
import { VERIFIED_PRESETS } from '../../utils/constants';
import { Sparkles, Play, Search } from 'lucide-react';

interface PresetsBarProps {
  onOpenSelector: () => void;
}

export const PresetsBar: React.FC<PresetsBarProps> = ({ onOpenSelector }) => {
  const { playback, changeVideo, canControl, showToast } = useWatchParty();

  const handleSelect = (videoId: string, title: string) => {
    if (videoId === playback.videoId) return;

    if (canControl) {
      changeVideo(videoId);
    } else {
      showToast('Only Host or Moderator can change the broadcast stream.', 'info');
    }
  };

  return (
    <div className="w-full rounded-xl bg-[#16171B] border border-[#282A33] p-3 flex flex-col gap-2 shadow-cinema">
      <div className="flex items-center justify-between px-0.5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-[#D6F279]" />
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#8E919C]">
            Verified Screening Presets
          </span>
        </div>
        {canControl && (
          <button
            onClick={onOpenSelector}
            className="flex items-center gap-1 text-[11px] font-medium text-[#D6F279] hover:text-[#C3E065] px-2 py-0.5 rounded border border-[#282A33] hover:border-[#3A3D4A] bg-[#1C1E24] transition-colors"
          >
            <Search className="w-3 h-3" />
            <span>Custom URL</span>
          </button>
        )}
      </div>

      {/* Horizontal Scrollable Presets Cards */}
      <div className="flex items-center gap-2 overflow-x-auto pb-0.5 pt-0.5">
        {VERIFIED_PRESETS.map((preset) => {
          const isActive = preset.id === playback.videoId;

          return (
            <button
              key={preset.id}
              onClick={() => handleSelect(preset.id, preset.title)}
              className={`flex-shrink-0 flex items-center gap-2.5 p-1.5 pr-3 rounded-lg border text-left transition-colors ${
                isActive
                  ? 'bg-[#1C1E24] border-[#D6F279]'
                  : 'bg-[#1C1E24] hover:bg-[#24262E] border-[#282A33] hover:border-[#3A3D4A]'
              }`}
            >
              <div className="relative w-11 h-9 rounded overflow-hidden bg-black flex-shrink-0 border border-[#282A33]">
                <img
                  src={preset.thumbnail}
                  alt={preset.title}
                  className="w-full h-full object-cover"
                />
                {isActive && (
                  <div className="absolute inset-0 bg-[#D6F279]/30 flex items-center justify-center">
                    <span className="w-2 h-2 rounded-full bg-[#D6F279]" />
                  </div>
                )}
              </div>

              <div className="flex flex-col min-w-0 max-w-[120px]">
                <span className={`text-[11px] font-medium truncate ${isActive ? 'text-[#D6F279]' : 'text-[#F2F0E9]'}`}>
                  {preset.title}
                </span>
                <div className="flex items-center gap-1 text-[10px] text-[#8E919C] font-mono">
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
