import React, { useState } from 'react';
import { useWatchParty } from '../../context/WatchPartyContext';
import { formatSecondsToTime } from '../../utils/formatters';
import { LikeButton } from './LikeButton';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize2,
  Search,
  Radio,
} from 'lucide-react';

interface PlaybackControlsProps {
  currentTime: number;
  duration: number;
  playerRef: any;
  onOpenVideoSelector: () => void;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
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
    isLiveSynced,
    setIsLiveSynced,
    timeBehindLive,
    setTimeBehindLive,
    localPlayState,
    setLocalPlayState,
    returnToLive,
    getAuthoritativeTime,
  } = useWatchParty();

  const [isScrubbing, setIsScrubbing] = useState<boolean>(false);
  const [scrubValue, setScrubValue] = useState<number>(0);
  const [volume, setVolume] = useState<number>(85);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const isPlaying = canControl ? playback.playState === 'playing' : localPlayState === 'playing';

  const liveEdge = getAuthoritativeTime();
  // For host: can scrub full duration. For viewer: live stream DVR capped at live edge (cannot watch more than host)
  const maxScrubTime = canControl
    ? (duration > 0 ? duration : 100)
    : Math.max(0.5, liveEdge);

  const displayTime = isScrubbing
    ? (canControl ? scrubValue : Math.min(scrubValue, liveEdge))
    : (canControl ? currentTime : Math.min(currentTime, liveEdge));

  const progressPercent = maxScrubTime > 0
    ? Math.min(100, Math.max(0, (displayTime / maxScrubTime) * 100))
    : 0;

  const handleTogglePlay = () => {
    if (canControl) {
      if (playback.playState === 'playing') {
        pauseVideo(currentTime);
      } else {
        playVideo(currentTime);
      }
    } else {
      // In viewer mode: local playback control on this device only
      if (playerRef) {
        if (localPlayState === 'playing') {
          playerRef.pauseVideo?.();
          setLocalPlayState('paused');
          setIsLiveSynced(false);
        } else {
          playerRef.playVideo?.();
          setLocalPlayState('playing');
        }
      }
    }
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = parseFloat(e.target.value);
    if (!canControl) {
      const currentLive = getAuthoritativeTime();
      setScrubValue(Math.min(rawVal, currentLive));
    } else {
      setScrubValue(rawVal);
    }
  };

  const handleSeekStart = () => {
    setIsScrubbing(true);
    const currentLive = getAuthoritativeTime();
    setScrubValue(canControl ? currentTime : Math.min(currentTime, currentLive));
  };

  const handleSeekEnd = (e: React.MouseEvent<HTMLInputElement> | React.TouchEvent<HTMLInputElement>) => {
    setIsScrubbing(false);
    const rawTarget = parseFloat((e.target as HTMLInputElement).value);
    if (canControl) {
      seekVideo(rawTarget);
      setIsLiveSynced(true);
      setTimeBehindLive(0);
    } else {
      const currentLive = getAuthoritativeTime();
      // Viewers cannot watch more than host: clamp to liveEdge
      const targetValue = Math.min(rawTarget, currentLive);
      const behind = currentLive - targetValue;

      // If user scrubbed to the end (within 1.5s of host), snap to live
      if (behind <= 1.5 || targetValue >= currentLive - 0.5) {
        returnToLive(playerRef);
      } else {
        // Watching earlier part like a video (DVR catch-up mode)
        if (playerRef?.seekTo) {
          playerRef.seekTo(targetValue, true);
        }
        setIsLiveSynced(false);
        setTimeBehindLive(Math.max(0, Math.round(behind)));
      }
    }
  };

  const handleSkip = (seconds: number) => {
    if (canControl) {
      const target = Math.max(0, Math.min(duration, currentTime + seconds));
      seekVideo(target);
      setIsLiveSynced(true);
      setTimeBehindLive(0);
    } else {
      const currentLive = getAuthoritativeTime();
      // Viewers cannot watch more than host: clamp to liveEdge
      const target = Math.max(0, Math.min(currentLive, currentTime + seconds));
      const behind = currentLive - target;

      if (behind <= 1.5 || target >= currentLive - 0.5) {
        returnToLive(playerRef);
      } else {
        if (playerRef?.seekTo) {
          playerRef.seekTo(target, true);
        }
        setIsLiveSynced(false);
        setTimeBehindLive(Math.max(0, Math.round(behind)));
      }
    }
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

  return (
    <div
      className="w-full rounded-xl bg-[#16171B] border border-[#282A33] p-3.5 flex flex-col gap-2.5 shadow-cinema"
      aria-label="Playback Controls"
    >
      {/* Scrubber Progress Slider */}
      <div className="flex flex-col gap-1 w-full">
        <label htmlFor="playback-scrubber" className="sr-only">
          Timeline seek scrubber
        </label>
        <div className="relative flex items-center w-full">
          <input
            id="playback-scrubber"
            type="range"
            min={0}
            max={maxScrubTime}
            step={0.1}
            value={displayTime}
            onMouseDown={handleSeekStart}
            onTouchStart={handleSeekStart}
            onChange={handleSeekChange}
            onMouseUp={handleSeekEnd}
            onTouchEnd={handleSeekEnd}
            aria-label={canControl ? 'Playback timeline' : 'Live stream DVR timeline'}
            aria-valuemin={0}
            aria-valuemax={maxScrubTime}
            aria-valuenow={displayTime}
            className="w-full h-1.5 rounded appearance-none cursor-pointer relative z-10 transition-colors"
            style={{
              background: `linear-gradient(to right, #D6F279 0%, #D6F279 ${progressPercent}%, #282A33 ${progressPercent}%, #282A33 100%)`,
            }}
          />
        </div>

        {/* Timestamps & Permission Status */}
        <div className="flex items-center justify-between text-xs text-[#8E919C] font-mono px-0.5">
          <div className="flex items-center gap-2">
            <span className="text-[#F2F0E9] font-medium">{formatSecondsToTime(displayTime)}</span>
            <span className="text-[#5E606A]">/</span>
            <span>{formatSecondsToTime(canControl ? duration : maxScrubTime)}</span>

            {!canControl && (
              <span
                className="text-[10px] px-1.5 py-0.2 rounded bg-[#D6F279]/10 text-[#D6F279] border border-[#D6F279]/30 font-semibold"
                title="End of timeline is the live position the host is currently watching"
              >
                LIVE EDGE
              </span>
            )}

            {/* Catch-up badge when viewer is behind */}
            {!canControl && !isLiveSynced && timeBehindLive > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#E5A84B]/10 text-[#E5A84B] border border-[#E5A84B]/30 hidden sm:inline">
                Catch-up mode (-{formatSecondsToTime(timeBehindLive)})
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!canControl ? (
              <div className="flex items-center gap-1.5 text-[11px] text-[#8E919C]">
                <Radio className={`w-3 h-3 ${isLiveSynced ? 'text-[#D6F279]' : 'text-[#E5A84B]'}`} />
                <span>
                  {isLiveSynced
                    ? 'Watching Live with Host'
                    : 'DVR Mode · Drag to end for Live'}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-[11px] text-[#D6F279]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D6F279] animate-pulse" />
                <span className="hidden sm:inline">Host broadcast</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Control Actions Bar */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#282A33]/70">
        {/* Left Side: Core Playback Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Main Play / Pause Button */}
          <button
            onClick={handleTogglePlay}
            aria-label={canControl ? (isPlaying ? 'Pause video' : 'Play video') : 'Play/pause locally'}
            className={`flex items-center justify-center w-9 h-9 rounded-md transition-colors ${
              canControl
                ? 'bg-[#D6F279] hover:bg-[#C3E065] text-[#101114]'
                : 'bg-[#1C1E24] hover:bg-[#24262E] text-[#8E919C] hover:text-[#D6F279] border border-[#282A33]'
            }`}
            title={canControl ? (isPlaying ? 'Pause for room' : 'Play for room') : 'Play/pause locally'}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>

          {/* Jump -10s */}
          <button
            onClick={() => handleSkip(-10)}
            aria-label="Rewind 10 seconds"
            className="p-2 rounded-md text-[#8E919C] hover:text-[#F2F0E9] hover:bg-[#24262E] transition-colors"
            title="Rewind 10s"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Jump +10s */}
          <button
            onClick={() => handleSkip(10)}
            aria-label="Fast forward 10 seconds"
            className="p-2 rounded-md text-[#8E919C] hover:text-[#F2F0E9] hover:bg-[#24262E] transition-colors"
            title="Fast forward 10s"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Prominent Live / Return to Live Button */}
          <button
            type="button"
            onClick={() => returnToLive(playerRef)}
            className={`flex items-center gap-1.5 px-2.5 py-1 min-h-[30px] rounded-md text-xs font-mono font-semibold transition-all select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D6F279] ${
              isLiveSynced
                ? 'bg-[#D6F279]/15 border border-[#D6F279]/40 text-[#D6F279]'
                : 'bg-[#1C1E24] hover:bg-[#D6F279] text-[#E5A84B] hover:text-[#101114] border border-[#E5A84B] hover:border-[#D6F279] shadow-cinema cursor-pointer active:scale-95'
            }`}
            title={
              isLiveSynced
                ? 'You are currently in sync with the live room'
                : 'Click to return to the synchronized live room stream'
            }
            aria-label={
              isLiveSynced
                ? 'Watching live'
                : `Return to live (${formatSecondsToTime(timeBehindLive)} behind)`
            }
          >
            <span
              className={`w-2 h-2 rounded-full transition-colors ${
                isLiveSynced
                  ? 'bg-[#D6F279] animate-pulse'
                  : 'bg-[#E5A84B] animate-ping'
              }`}
              aria-hidden="true"
            />
            <span className="font-bold">LIVE</span>
            {!isLiveSynced && timeBehindLive > 0 && (
              <span className="text-[11px] font-mono font-normal">
                -{formatSecondsToTime(timeBehindLive)}
              </span>
            )}
          </button>

          {/* Volume Deck */}
          <div className="flex items-center gap-1.5 ml-1 pl-2 border-l border-[#282A33]">
            <button
              onClick={handleToggleMute}
              aria-label={isMuted ? 'Unmute stream audio' : 'Mute stream audio'}
              className="p-1.5 rounded-md text-[#8E919C] hover:text-[#F2F0E9] hover:bg-[#24262E] transition-colors"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-[#D6F279]" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <label htmlFor="volume-slider" className="sr-only">
              Volume level
            </label>
            <input
              id="volume-slider"
              type="range"
              min={0}
              max={100}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              aria-label="Volume level"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={isMuted ? 0 : volume}
              className="w-16 h-1 bg-[#282A33] rounded cursor-pointer hidden sm:block"
              style={{
                background: `linear-gradient(to right, #D6F279 0%, #D6F279 ${isMuted ? 0 : volume}%, #282A33 ${isMuted ? 0 : volume}%, #282A33 100%)`,
              }}
              title="Volume"
            />
          </div>
        </div>

        {/* Right Side: Quick Actions & Reactions */}
        <div className="flex items-center gap-2">
          {/* Device Playback status pill for Viewers */}
          {!canControl && (
            <span
              className="hidden sm:inline-flex items-center gap-1.5 px-2 py-1 rounded bg-[#1C1E24] border border-[#282A33] text-[10px] font-mono text-[#8E919C]"
              title="You control playback independently on your device. Click LIVE to rejoin the room stream."
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isLiveSynced ? 'bg-[#D6F279]' : 'bg-[#E5A84B]'}`} />
              <span>Your Device</span>
            </span>
          )}

          {/* Change Video button */}
          {canControl && (
            <button
              onClick={onOpenVideoSelector}
              aria-label="Load different YouTube video"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#1C1E24] hover:bg-[#24262E] border border-[#282A33] text-[#F2F0E9] text-xs font-medium transition-colors"
              title="Change YouTube stream"
            >
              <Search className="w-3.5 h-3.5 text-[#D6F279]" />
              <span className="hidden sm:inline">Stream URL</span>
            </button>
          )}

          {/* Live Room Likes Reaction Button */}
          <LikeButton />

          {/* Fullscreen button */}
          <button
            onClick={handleFullscreen}
            aria-label="Toggle fullscreen video mode"
            className="p-1.5 rounded-md text-[#8E919C] hover:text-[#F2F0E9] hover:bg-[#24262E] transition-colors"
            title="Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export const VideoControls = PlaybackControls;
