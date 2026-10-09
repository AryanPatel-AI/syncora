import React from 'react';
import { useWatchParty } from '../../context/WatchPartyContext';
import { YouTubePlayer } from './YouTubePlayer';
import { FloatingReaction } from './FloatingReaction';
import { Film, Radio } from 'lucide-react';

interface VideoStageProps {
  onProgress: (current: number, total: number) => void;
  playerRefCallback: (player: any) => void;
  onOpenSelector: () => void;
}

export const VideoStage: React.FC<VideoStageProps> = ({
  onProgress,
  playerRefCallback,
  onOpenSelector,
}) => {
  const { playback, canControl, isLiveSynced, returnToLive, timeBehindLive } = useWatchParty();
  const isPlaying = playback.playState === 'playing';

  return (
    <section className="flex flex-col gap-2.5 w-full" aria-label="Screening Stage">
      {/* Video Player Display Frame */}
      <div className="relative w-full">
        <YouTubePlayer
          onProgress={onProgress}
          playerRefCallback={playerRefCallback}
        />
        {/* Real-time floating reactions & like hearts overlay */}
        <FloatingReaction />
      </div>

      {/* Under-Player Metadata Bar */}
      <div className="flex items-center justify-between px-3.5 py-2 rounded-lg bg-[#16171B] border border-[#282A33] text-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <Film className="w-3.5 h-3.5 text-[#D6F279] flex-shrink-0" />
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[#8E919C] text-[11px] font-mono uppercase tracking-wider hidden sm:inline">
              Stream
            </span>
            <span className="font-mono text-xs text-[#F2F0E9] font-medium truncate">
              {playback.videoId}
            </span>
            <span className="text-[#5E606A]">&bull;</span>
            <span className="inline-flex items-center gap-1 text-[11px] text-[#8E919C]">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isPlaying ? 'bg-[#D6F279]' : 'bg-[#5E606A]'
                }`}
              />
              <span className="capitalize">{playback.playState}</span>
            </span>

            {/* Live Status Pill */}
            {isLiveSynced ? (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#D6F279]/10 text-[#D6F279] border border-[#D6F279]/30">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D6F279] animate-pulse" />
                LIVE
              </span>
            ) : (
              <button
                type="button"
                onClick={() => returnToLive()}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#E5A84B]/15 text-[#E5A84B] border border-[#E5A84B]/40 hover:bg-[#D6F279] hover:text-[#101114] hover:border-[#D6F279] transition-all cursor-pointer"
                title="Click to jump to live room playback"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#E5A84B]" />
                Return to Live {timeBehindLive > 0 && `(-${timeBehindLive}s)`}
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canControl && (
            <button
              onClick={onOpenSelector}
              className="text-[11px] font-medium text-[#D6F279] hover:text-[#C3E065] px-2.5 py-1 rounded border border-[#282A33] hover:border-[#383B47] bg-[#1C1E24] transition-colors"
            >
              Change Video
            </button>
          )}
        </div>
      </div>
    </section>
  );
};
