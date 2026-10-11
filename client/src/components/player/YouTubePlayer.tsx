import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useWatchParty } from '../../context/WatchPartyContext';
import { VERIFIED_PRESETS, DEFAULT_VIDEO_ID } from '../../utils/constants';
import { markVideoAsUnplayable } from '../../services/api';
import { VolumeX, AlertTriangle, RefreshCw } from 'lucide-react';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YouTubePlayerProps {
  onProgress?: (currentTime: number, duration: number) => void;
  playerRefCallback?: (player: any) => void;
}

export const YouTubePlayer: React.FC<YouTubePlayerProps> = ({ onProgress, playerRefCallback }) => {
  const {
    playback,
    canControl,
    playVideo,
    pauseVideo,
    changeVideo,
    setLocalPlayState,
    updateLocalPlaybackTime,
    isLiveSynced,
    setIsLiveSynced,
    setTimeBehindLive,
    getAuthoritativeTime,
    showToast,
  } = useWatchParty();

  const playerRef = useRef<any>(null);
  const isApiReady = useRef<boolean>(false);
  const isProgrammaticUpdate = useRef<boolean>(false);
  const isBufferingRef = useRef<boolean>(false);
  const bufferStabilizationUntilRef = useRef<number>(Date.now() + 4000);
  const playerStateRef = useRef<number>(-1);
  const lastLoadedVideoIdRef = useRef<string>(playback.videoId);
  const lastAppliedPlayStateRef = useRef<string>(playback.playState);
  const lastAppliedUpdatedAtRef = useRef<number>(playback.lastUpdatedAt);
  const liveEdgeRef = useRef<number>(0);
  const [isPlayerReady, setIsPlayerReady] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [needsUserGesture, setNeedsUserGesture] = useState<boolean>(false);
  const [hasPlaybackError, setHasPlaybackError] = useState<boolean>(false);

  const isLiveContent = useCallback((player: any): boolean => {
    if (!player) return false;
    try {
      const data = player.getVideoData ? player.getVideoData() : null;
      if (data && data.isLive) return true;
      const dur = player.getDuration ? player.getDuration() : 0;
      if (dur === 0) return true;
    } catch (_) {}
    return Boolean(playback.isLive);
  }, [playback.isLive]);

  useEffect(() => {
    if (window.YT && window.YT.Player) {
      isApiReady.current = true;
      initPlayer();
      return;
    }

    const prevReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (prevReady) prevReady();
      isApiReady.current = true;
      initPlayer();
    };

    if (!document.getElementById('youtube-iframe-api-script')) {
      const tag = document.createElement('script');
      tag.id = 'youtube-iframe-api-script';
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
    }
  }, []);

  const initPlayer = useCallback(() => {
    if (!window.YT || !window.YT.Player || playerRef.current) return;

    playerRef.current = new window.YT.Player('syncora-yt-player-frame', {
      videoId: playback.videoId,
      playerVars: {
        autoplay: playback.playState === 'playing' ? 1 : 0,
        controls: 0,
        disablekb: 1,
        enablejsapi: 1,
        modestbranding: 1,
        rel: 0,
        iv_load_policy: 3,
        fs: 0,
        origin: window.location.origin,
      },
      events: {
        onReady: (event: any) => {
          setIsPlayerReady(true);
          setHasPlaybackError(false);
          if (playerRefCallback) playerRefCallback(event.target);

          const isLive = isLiveContent(event.target);
          const targetTime = getAuthoritativeTime();

          bufferStabilizationUntilRef.current = Date.now() + 4000;
          isProgrammaticUpdate.current = true;

          if ((!isLive && targetTime > 1.0) || (isLive && playback.currentTime > 1.0)) {
            event.target.seekTo(targetTime, true);
          }

          if (playback.playState === 'playing') {
            const playPromise = event.target.playVideo();
            if (playPromise && typeof playPromise.catch === 'function') {
              playPromise.catch(() => setNeedsUserGesture(true));
            }
          } else {
            event.target.pauseVideo();
          }

          setTimeout(() => {
            isProgrammaticUpdate.current = false;
          }, 1200);
        },
        onStateChange: (event: any) => {
          const state = event.data;
          playerStateRef.current = state;

          if (state === 3) {
            isBufferingRef.current = true;
            bufferStabilizationUntilRef.current = Date.now() + 3000;
          } else if (state === 1) {
            isBufferingRef.current = false;
            bufferStabilizationUntilRef.current = Date.now() + 2000;
          } else if (state === 2) {
            isBufferingRef.current = false;
          } else if (state === -1 || state === 5) {
            isBufferingRef.current = true;
            bufferStabilizationUntilRef.current = Date.now() + 3000;
          }

          handlePlayerStateChange(state);
        },
        onError: (e: any) => {
          console.warn('[YouTube Player Notice]: Code', e.data);
          if ([2, 5, 100, 101, 150].includes(e.data)) {
            markVideoAsUnplayable(playback.videoId);
            setHasPlaybackError(true);
            if (canControl) {
              showToast('Stream is unavailable for external embedding. Switching to verified screening stream...', 'error');
              setTimeout(() => {
                handleFallbackRecover(DEFAULT_VIDEO_ID);
              }, 1500);
            }
          }
        },
      },
    });
  }, [playback.videoId, getAuthoritativeTime, playerRefCallback, isLiveContent, canControl, showToast]);

  const handlePlayerStateChange = (state: number) => {
    if (isProgrammaticUpdate.current) return;

    const player = playerRef.current;
    if (!player) return;

    if (state === 1) {
      setLocalPlayState('playing');
      if (!canControl) {
        return;
      }
      if (playback.playState === 'playing') {
        return;
      }
      const currentTime = player.getCurrentTime ? player.getCurrentTime() : 0;
      playVideo(currentTime);
    } else if (state === 2) {
      setLocalPlayState('paused');
      if (!canControl) {
        setIsLiveSynced(false);
        return;
      }
      if (playback.playState === 'paused') {
        return;
      }
      const currentTime = player.getCurrentTime ? player.getCurrentTime() : 0;
      pauseVideo(currentTime);
    }
  };

  useEffect(() => {
    const player = playerRef.current;
    if (!player || !isPlayerReady) return;

    if (playback.videoId && lastLoadedVideoIdRef.current !== playback.videoId) {
      lastLoadedVideoIdRef.current = playback.videoId;
      setHasPlaybackError(false);
      isProgrammaticUpdate.current = true;
      isBufferingRef.current = true;
      bufferStabilizationUntilRef.current = Date.now() + 3500;

      if (player.loadVideoById) {
        player.loadVideoById({
          videoId: playback.videoId,
          startSeconds: playback.currentTime || 0,
        });
      }
      setTimeout(() => {
        isProgrammaticUpdate.current = false;
      }, 1500);
    }
  }, [playback.videoId, isPlayerReady, playback.currentTime]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player || !isPlayerReady) return;

    const isLive = isLiveContent(player);
    const authoritativeTime = getAuthoritativeTime();
    const playerTime = player.getCurrentTime ? player.getCurrentTime() : 0;
    const diff = Math.abs(playerTime - authoritativeTime);

    const isTimestampUpdated = lastAppliedUpdatedAtRef.current !== playback.lastUpdatedAt;

    // A. Seek handling
    if (canControl || isLiveSynced) {
      const driftThreshold = isLive ? 3.5 : 2.0;
      const shouldSeek = (isTimestampUpdated && diff > 1.0) || diff > driftThreshold;
      if (shouldSeek) {
        isProgrammaticUpdate.current = true;
        player.seekTo(authoritativeTime, true);
        bufferStabilizationUntilRef.current = Date.now() + 2500;
      }

      if (playback.playState === 'playing') {
        isProgrammaticUpdate.current = true;
        setLocalPlayState('playing');
        const playPromise = player.playVideo();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(() => setNeedsUserGesture(true));
        }
      } else if (playback.playState === 'paused') {
        isProgrammaticUpdate.current = true;
        setLocalPlayState('paused');
        player.pauseVideo();
      }
    } else {
      const isAheadOfHost = !canControl && playerTime > authoritativeTime + 2.5;
      if (!isLive && isAheadOfHost) {
        isProgrammaticUpdate.current = true;
        player.seekTo(authoritativeTime, true);
        setIsLiveSynced(true);
        setTimeBehindLive(0);
        bufferStabilizationUntilRef.current = Date.now() + 2000;
      }
    }

    lastAppliedPlayStateRef.current = playback.playState;
    lastAppliedUpdatedAtRef.current = playback.lastUpdatedAt;

    const timer = setTimeout(() => {
      isProgrammaticUpdate.current = false;
    }, 1000);

    return () => clearTimeout(timer);
  }, [
    playback.playState,
    playback.currentTime,
    playback.lastUpdatedAt,
    isPlayerReady,
    getAuthoritativeTime,
    canControl,
    isLiveSynced,
    isLiveContent,
    setLocalPlayState,
    setIsLiveSynced,
    setTimeBehindLive,
  ]);

  useEffect(() => {
    if (!isPlayerReady || !playerRef.current) return;

    const interval = setInterval(() => {
      const player = playerRef.current;
      if (!player || !player.getCurrentTime) return;

      const currentTime = player.getCurrentTime();
      const duration = player.getDuration ? player.getDuration() : 0;
      const isLive = isLiveContent(player);

      if (isLive) {
        if (duration > 0) {
          liveEdgeRef.current = Math.max(liveEdgeRef.current, duration);
        } else {
          liveEdgeRef.current = Math.max(liveEdgeRef.current, currentTime);
        }
      }

      if (onProgress) {
        onProgress(currentTime, duration);
      }

      const isBuffering = isBufferingRef.current || playerStateRef.current === 3;
      const isStabilizing = Date.now() < bufferStabilizationUntilRef.current;
      const isProgrammatic = isProgrammaticUpdate.current;

      const authTime = getAuthoritativeTime();
      const behindSeconds = authTime - currentTime;

      if (!isBuffering && !isStabilizing && !isProgrammatic) {
        if (isLive) {
          if (!canControl) {
            if (!isLiveSynced) {
              setTimeBehindLive(Math.max(0, Math.round(behindSeconds)));
              if (behindSeconds <= 3.0) {
                setIsLiveSynced(true);
                setTimeBehindLive(0);
              }
            } else {
              if (behindSeconds > 9.0 && playback.playState === 'playing') {
                isProgrammaticUpdate.current = true;
                const safeTarget = Math.max(0, authTime - 2.5);
                player.seekTo(safeTarget, true);
                bufferStabilizationUntilRef.current = Date.now() + 4500;
                setTimeout(() => {
                  isProgrammaticUpdate.current = false;
                }, 1200);
              }
              setTimeBehindLive(0);
            }
          } else {
            const liveHead = Math.max(duration, liveEdgeRef.current);
            const behindLive = Math.max(0, liveHead - currentTime);
            if (behindLive > 4.0) {
              setIsLiveSynced(false);
              setTimeBehindLive(Math.round(behindLive));
            } else {
              setIsLiveSynced(true);
              setTimeBehindLive(0);
            }
          }
        } else {
          if (!canControl) {
            if (currentTime > authTime + 2.5) {
              isProgrammaticUpdate.current = true;
              player.seekTo(authTime, true);
              setIsLiveSynced(true);
              setTimeBehindLive(0);
              bufferStabilizationUntilRef.current = Date.now() + 3500;
              setTimeout(() => {
                isProgrammaticUpdate.current = false;
              }, 800);
            } else if (!isLiveSynced) {
              setTimeBehindLive(Math.max(0, Math.round(behindSeconds)));
              if (behindSeconds <= 2.0) {
                setIsLiveSynced(true);
                setTimeBehindLive(0);
              }
            } else {
              const drift = Math.abs(currentTime - authTime);
              if (playback.playState === 'playing' && drift > 2.5) {
                isProgrammaticUpdate.current = true;
                player.seekTo(authTime, true);
                bufferStabilizationUntilRef.current = Date.now() + 3500;
                setTimeout(() => {
                  isProgrammaticUpdate.current = false;
                }, 800);
              }
              setTimeBehindLive(0);
            }
          } else {
            const drift = Math.abs(currentTime - authTime);
            if (playback.playState === 'playing' && drift > 2.5) {
              isProgrammaticUpdate.current = true;
              player.seekTo(authTime, true);
              bufferStabilizationUntilRef.current = Date.now() + 3500;
              setTimeout(() => {
                isProgrammaticUpdate.current = false;
              }, 800);
            }
            setTimeBehindLive(0);
          }
        }
      }

      updateLocalPlaybackTime(currentTime);

      if (player.isMuted) {
        setIsMuted(player.isMuted());
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlayerReady, playback.playState, getAuthoritativeTime, onProgress, updateLocalPlaybackTime, canControl, isLiveSynced, setIsLiveSynced, setTimeBehindLive, isLiveContent]);

  const handleUnmute = () => {
    if (playerRef.current) {
      playerRef.current.unMute();
      playerRef.current.setVolume(85);
      setIsMuted(false);
      setNeedsUserGesture(false);
      if (playback.playState === 'playing') {
        playerRef.current.playVideo();
      }
    }
  };

  const handleFallbackRecover = (videoId: string) => {
    setHasPlaybackError(false);
    changeVideo(videoId);
  };

  const isPlaying = playback.playState === 'playing';

  return (
    <div
      className={`relative w-full rounded-xl overflow-hidden bg-[#0B0C0E] border transition-colors duration-200 shadow-cinema group ${
        isPlaying ? 'border-[#3E4250]' : 'border-[#282A33]'
      }`}
    >
      <div className="video-container relative bg-black">
        <div id="syncora-yt-player-frame" className="w-full h-full" />
      </div>

      {hasPlaybackError && (
        <div className="absolute inset-0 z-40 bg-[#101114]/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
          <div className="p-3 rounded-lg bg-[#24262E] border border-[#F59E0B]/40 text-[#F59E0B] mb-3">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-semibold text-[#F2F0E9] mb-1">Stream Unavailable for Embedding</h4>
          <p className="text-xs text-[#8E919C] max-w-sm mb-4">
            The video owner has disabled external playback, or the stream has ended. Select a verified screening stream:
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {VERIFIED_PRESETS.slice(0, 3).map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleFallbackRecover(preset.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#D6F279] hover:bg-[#C3E065] text-[#101114] text-xs font-semibold transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Switch to {preset.title.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {(isMuted || needsUserGesture) && !hasPlaybackError && (
        <button
          onClick={handleUnmute}
          className="absolute top-3 left-3 z-30 flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#D6F279] text-[#101114] text-xs font-semibold shadow-fine hover:bg-[#C3E065] transition-colors"
        >
          <VolumeX className="w-4 h-4" />
          <span>Click to Unmute Stream Audio</span>
        </button>
      )}
    </div>
  );
};
