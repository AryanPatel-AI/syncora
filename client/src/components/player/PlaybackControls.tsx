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
  Lock,
  KeyRound,
  Clock,
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
    currentUser,
    pendingRequests,
    requestControl,
    showToast,
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

  // Check if current user has a pending playback control request
  const myPendingRequest = pendingRequests.find(
    (r) => r.userId === currentUser?.id && r.status === 'pending'
  );
  const isRequestPending = Boolean(myPendingRequest);

  const isPlaying = playback.playState === 'playing';

  const liveEdge = getAuthoritativeTime();
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
      if (isRequestPending) {
        showToast('Playback is locked. Your request is currently waiting for Host approval.', 'info');
      } else {
        showToast('Playback controls are locked for viewers. Click "Request Access" to request control from the Host.', 'info');
      }
    }
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canControl) return;
    const rawVal = parseFloat(e.target.value);
    setScrubValue(rawVal);
  };

  const handleSeekStart = () => {
    if (!canControl) {
      if (!isRequestPending) {
        showToast('Timeline seek is locked for viewers. Request playback access from the Host.', 'info');
      }
      return;
    }
    setIsScrubbing(true);
    setScrubValue(currentTime);
  };

  const handleSeekEnd = (e: React.MouseEvent<HTMLInputElement> | React.TouchEvent<HTMLInputElement>) => {
    if (!canControl) return;
    setIsScrubbing(false);
    const rawTarget = parseFloat((e.target as HTMLInputElement).value);
    seekVideo(rawTarget);
    setIsLiveSynced(true);
    setTimeBehindLive(0);
  };

  const handleSkip = (seconds: number) => {
    if (canControl) {
      const target = Math.max(0, Math.min(duration, currentTime + seconds));
      seekVideo(target);
      setIsLiveSynced(true);
      setTimeBehindLive(0);
    } else {
      showToast('Playback controls are locked for viewers. Request access from the Host to seek.', 'info');
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
      {/* Playback Lock Banner for Viewers */}
      {!canControl && (
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#111215] border border-[#282A33] gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 rounded-md bg-[#E5A84B]/15 text-[#E5A84B] border border-[#E5A84B]/30 flex-shrink-0">
              <Lock className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-[#F2F0E9] truncate">
                Playback controls are locked for viewers
              </span>
              <span className="text-[11px] text-[#8E919C] truncate hidden sm:inline">
                {isRequestPending
                  ? 'Your request was sent to the Host. Awaiting approval...'
                  : 'Host controls playback. Request access to play, pause, or change stream.'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {isRequestPending ? (
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#E5A84B]/10 text-[#E5A84B] border border-[#E5A84B]/30 text-xs font-mono font-medium"
                title="Your request is pending host review"
              >
                <Clock className="w-3.5 h-3.5 animate-spin" />
                <span>Pending Approval</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => requestControl('REQUEST_CONTROL')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#D6F279] hover:bg-[#C3E065] text-[#101114] text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                title="Request playback control access from the host"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Request Access</span>
              </button>
            )}
          </div>
        </div>
      )}

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
            disabled={!canControl}
            onMouseDown={handleSeekStart}
            onTouchStart={handleSeekStart}
            onChange={handleSeekChange}
            onMouseUp={handleSeekEnd}
            onTouchEnd={handleSeekEnd}
            aria-label={canControl ? 'Playback timeline' : 'Playback timeline (locked)'}
            aria-valuemin={0}
            aria-valuemax={maxScrubTime}
            aria-valuenow={displayTime}
            className={`w-full h-1.5 rounded appearance-none relative z-10 transition-colors ${
              canControl ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
            }`}
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
                className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-[#E5A84B]/10 text-[#E5A84B] border border-[#E5A84B]/30 font-semibold"
                title="Playback timeline is locked to the host broadcast"
              >
                <Lock className="w-2.5 h-2.5" />
                LOCKED
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
                    ? 'Synced with Host'
                    : 'Catch-up Mode · Click Live to sync'}
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
            aria-label={canControl ? (isPlaying ? 'Pause video' : 'Play video') : 'Playback locked for viewers'}
            className={`flex items-center justify-center w-9 h-9 rounded-md transition-colors ${
              canControl
                ? 'bg-[#D6F279] hover:bg-[#C3E065] text-[#101114] cursor-pointer'
                : 'bg-[#1C1E24] text-[#8E919C] hover:text-[#E5A84B] border border-[#282A33] cursor-pointer'
            }`}
            title={
              canControl
                ? (isPlaying ? 'Pause for room' : 'Play for room')
                : (isRequestPending
                    ? 'Request pending host review'
                    : 'Playback locked for viewers. Click to request access.')
            }
          >
            {canControl ? (
              isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )
            ) : (
              <Lock className="w-4 h-4 text-[#E5A84B]" />
            )}
          </button>

          {/* Jump -10s */}
          <button
            onClick={() => handleSkip(-10)}
            disabled={!canControl}
            aria-label="Rewind 10 seconds"
            className={`p-2 rounded-md transition-colors ${
              canControl
                ? 'text-[#8E919C] hover:text-[#F2F0E9] hover:bg-[#24262E] cursor-pointer'
                : 'text-[#484A54] cursor-not-allowed opacity-40'
            }`}
            title={canControl ? 'Rewind 10s' : 'Rewind locked for viewers'}
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Jump +10s */}
          <button
            onClick={() => handleSkip(10)}
            disabled={!canControl}
            aria-label="Fast forward 10 seconds"
            className={`p-2 rounded-md transition-colors ${
              canControl
                ? 'text-[#8E919C] hover:text-[#F2F0E9] hover:bg-[#24262E] cursor-pointer'
                : 'text-[#484A54] cursor-not-allowed opacity-40'
            }`}
            title={canControl ? 'Fast forward 10s' : 'Fast forward locked for viewers'}
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
          {/* Status badge / Request Access button for Viewers */}
          {!canControl && (
            isRequestPending ? (
              <span
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#E5A84B]/10 border border-[#E5A84B]/30 text-[10px] font-mono text-[#E5A84B]"
                title="Awaiting host approval for playback control"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#E5A84B] animate-pulse" />
                <span>Request Pending</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => requestControl('REQUEST_CONTROL')}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#1C1E24] hover:bg-[#282A33] border border-[#282A33] text-[10px] font-mono text-[#D6F279] hover:text-white transition-colors cursor-pointer"
                title="Request playback access to control stream"
              >
                <KeyRound className="w-3 h-3 text-[#D6F279]" />
                <span>Request Access</span>
              </button>
            )
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
