import React, { useState } from 'react';
import { useWatchParty } from '../../context/WatchPartyContext';
import { formatSecondsToTime } from '../../utils/formatters';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize2,
  Lock,
  Hand,
  Check,
  Search,
} from 'lucide-react';

interface VideoControlsProps {
  currentTime: number;
  duration: number;
  playerRef: any;
  onOpenVideoSelector: () => void;
}

export const VideoControls: React.FC<VideoControlsProps> = ({
  currentTime,
  duration,
  playerRef,
  onOpenVideoSelector,
}) => {
  const {
    playback,
    canControl,
    playVideo,
    pauseVideo,
    seekVideo,
    requestControl,
  } = useWatchParty();

  const [isScrubbing, setIsScrubbing] = useState<boolean>(false);
  const [scrubValue, setScrubValue] = useState<number>(0);
  const [volume, setVolume] = useState<number>(85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [hasRequested, setHasRequested] = useState<boolean>(false);

  const isPlaying = playback.playState === 'playing';
  const displayTime = isScrubbing ? scrubValue : currentTime;
  const progressPercent = duration > 0 ? (displayTime / duration) * 100 : 0;

  const handleTogglePlay = () => {
    if (!canControl) {
      handleRequestControl();
      return;
    }
    if (isPlaying) {
      pauseVideo(currentTime);
    } else {
      playVideo(currentTime);
    }
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canControl) return;
    setScrubValue(parseFloat(e.target.value));
  };

  const handleSeekStart = () => {
    if (!canControl) return;
    setIsScrubbing(true);
    setScrubValue(currentTime);
  };

  const handleSeekEnd = (e: React.MouseEvent<HTMLInputElement> | React.TouchEvent<HTMLInputElement>) => {
    if (!canControl) return;
    setIsScrubbing(false);
    const targetValue = parseFloat((e.target as HTMLInputElement).value);
    seekVideo(targetValue);
  };

  const handleSkip = (seconds: number) => {
    if (!canControl) return;
    const target = Math.max(0, Math.min(duration, currentTime + seconds));
    seekVideo(target);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setVolume(val);
    if (playerRef) {
      playerRef.setVolume(val);
      if (val === 0) {
        playerRef.mute();
        setIsMuted(true);
      } else if (isMuted) {
        playerRef.unMute();
        setIsMuted(false);
      }
    }
  };

  const handleToggleMute = () => {
    if (!playerRef) return;
    if (isMuted) {
      playerRef.unMute();
      playerRef.setVolume(volume || 80);
      setIsMuted(false);
    } else {
      playerRef.mute();
      setIsMuted(true);
    }
  };

  const handleFullscreen = () => {
    const frame = document.getElementById('syncora-yt-player-frame');
    if (!frame) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      frame.requestFullscreen?.() || (frame.parentElement?.requestFullscreen && frame.parentElement.requestFullscreen());
    }
  };

  const handleRequestControl = () => {
    requestControl('REQUEST_CONTROL');
    setHasRequested(true);
    setTimeout(() => setHasRequested(false), 5000);
  };

  return (
    <div className="w-full glass-panel-elevated rounded-2xl p-4 flex flex-col gap-3 shadow-2xl border border-brand-border/70 backdrop-blur-2xl">
      {/* Scrub Track */}
      <div className="flex flex-col gap-1.5 w-full">
        <div className="relative group/scrub flex items-center">
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={displayTime}
            disabled={!canControl}
            onMouseDown={handleSeekStart}
            onTouchStart={handleSeekStart}
            onChange={handleSeekChange}
            onMouseUp={handleSeekEnd}
            onTouchEnd={handleSeekEnd}
            className={`w-full h-2 rounded-lg appearance-none cursor-pointer bg-brand-surface relative z-10 transition-all ${
              canControl
                ? 'cursor-pointer accent-brand-primary'
                : 'cursor-not-allowed opacity-75 accent-brand-muted'
            }`}
            style={{
              background: `linear-gradient(to right, #8067F5 0%, #A99BFF ${progressPercent}%, #1E293B ${progressPercent}%, #1E293B 100%)`,
            }}
          />
        </div>

        {/* Timestamps & Lock status */}
        <div className="flex items-center justify-between text-xs text-brand-muted font-mono font-medium px-1">
          <div className="flex items-center gap-2">
            <span>{formatSecondsToTime(displayTime)}</span>
            {isPlaying && (
              /* Mini Audio Wave Visualizer */
              <div className="flex items-end gap-0.5 h-3 ml-1">
                <span className="w-0.5 h-3 bg-brand-primary rounded-full animate-pulse" />
                <span className="w-0.5 h-2 bg-brand-highlight rounded-full animate-bounce" />
                <span className="w-0.5 h-3.5 bg-brand-primary rounded-full animate-pulse delay-100" />
                <span className="w-0.5 h-1.5 bg-cyan-400 rounded-full animate-bounce delay-150" />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!canControl && (
              <span className="flex items-center gap-1 text-[11px] text-brand-highlight bg-brand-surface px-2 py-0.5 rounded-full border border-brand-border">
                <Lock className="w-3 h-3 text-brand-highlight" />
                <span>Controls Locked (Viewer Mode)</span>
              </span>
            )}
            <span>{formatSecondsToTime(duration)}</span>
          </div>
        </div>
      </div>

      {/* Buttons Bar */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-brand-border/40">
        {/* Left Side: Playback controls */}
        <div className="flex items-center gap-2">
          {/* Main Play / Pause Button */}
          <button
            onClick={handleTogglePlay}
            disabled={!canControl}
            className={`flex items-center justify-center w-11 h-11 rounded-2xl transition-all shadow-md ${
              canControl
                ? 'bg-gradient-to-tr from-brand-primary to-brand-highlight hover:from-brand-hover hover:to-brand-primary text-white shadow-glow hover:scale-105 active:scale-95'
                : 'bg-brand-surface text-brand-subtle cursor-not-allowed border border-brand-border/60'
            }`}
            title={canControl ? (isPlaying ? 'Pause' : 'Play') : 'Request control to play/pause'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          {/* Jump -10s */}
          <button
            onClick={() => handleSkip(-10)}
            disabled={!canControl}
            className={`p-2.5 rounded-xl text-brand-muted hover:text-white transition-all ${
              canControl ? 'hover:bg-brand-card active:scale-95' : 'cursor-not-allowed opacity-40'
            }`}
            title="Rewind 10 seconds"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Jump +10s */}
          <button
            onClick={() => handleSkip(10)}
            disabled={!canControl}
            className={`p-2.5 rounded-xl text-brand-muted hover:text-white transition-all ${
              canControl ? 'hover:bg-brand-card active:scale-95' : 'cursor-not-allowed opacity-40'
            }`}
            title="Fast forward 10 seconds"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Volume Deck */}
          <div className="flex items-center gap-2 ml-2 pl-2 border-l border-brand-border/50">
            <button
              onClick={handleToggleMute}
              className="p-2 rounded-xl text-brand-muted hover:text-white hover:bg-brand-card transition-all"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-brand-highlight" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={100}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-16 sm:w-20 h-1.5 bg-brand-border rounded-lg appearance-none cursor-pointer accent-brand-primary hidden sm:block"
              title="Volume"
            />
          </div>
        </div>

        {/* Right Side: Actions */}
        <div className="flex items-center gap-2">
          {/* Request Control button for Viewers */}
          {!canControl && (
            <button
              onClick={handleRequestControl}
              disabled={hasRequested}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                hasRequested
                  ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
                  : 'bg-brand-primary/20 hover:bg-brand-primary/30 border border-brand-primary/50 text-brand-highlight shadow-glow-sm hover:scale-105 active:scale-95 animate-pulse-glow'
              }`}
            >
              {hasRequested ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Request Sent</span>
                </>
              ) : (
                <>
                  <Hand className="w-3.5 h-3.5" />
                  <span>Raise Hand / Request Control</span>
                </>
              )}
            </button>
          )}

          {/* Change Video button */}
          {canControl && (
            <button
              onClick={onOpenVideoSelector}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-surface hover:bg-brand-card border border-brand-border/70 hover:border-brand-primary/50 text-brand-text text-xs font-semibold transition-all hover:scale-102 active:scale-98"
              title="Change YouTube video"
            >
              <Search className="w-3.5 h-3.5 text-brand-highlight" />
              <span className="hidden sm:inline">Search URL</span>
            </button>
          )}

          {/* Fullscreen button */}
          <button
            onClick={handleFullscreen}
            className="p-2.5 rounded-xl text-brand-muted hover:text-white hover:bg-brand-card transition-all"
            title="Toggle fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
