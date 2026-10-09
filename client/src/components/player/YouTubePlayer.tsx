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
  const [isPlayerReady, setIsPlayerReady] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [needsUserGesture, setNeedsUserGesture] = useState<boolean>(false);
  const [hasPlaybackError, setHasPlaybackError] = useState<boolean>(false);

  // Helper to detect if content is live
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

  // 1. Load YouTube IFrame API Script
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

  // 2. Initialize Player instance
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

          // Set generous buffer stabilization window (buffer time) to allow stream to buffer
          bufferStabilizationUntilRef.current = Date.now() + 4000;
          isProgrammaticUpdate.current = true;

          // Only seek if non-live content has advanced
          if (!isLive && targetTime > 1.0) {
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

          // YT.PlayerState:
          // -1: UNSTARTED, 1: PLAYING, 2: PAUSED, 3: BUFFERING, 5: CUED
          if (state === 3) {
            // BUFFERING: suspend drift checks so player has ample buffer time to load chunks
            isBufferingRef.current = true;
            bufferStabilizationUntilRef.current = Date.now() + 3500;
          } else if (state === 1) {
            // PLAYING: ensure 2.5s of smooth playback before resuming drift monitoring
            isBufferingRef.current = false;
            bufferStabilizationUntilRef.current = Date.now() + 2500;
          } else if (state === -1 || state === 5) {
            isBufferingRef.current = true;
            bufferStabilizationUntilRef.current = Date.now() + 3500;
          }

          handlePlayerStateChange(state);
        },
        onError: (e: any) => {
          console.warn('[YouTube Player Notice]: Code', e.data);
          // Error codes: 2 (invalid), 5 (HTML5 error), 100 (not found/private), 101/150 (embed disabled)
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

  // Handle Player State Changes
  const handlePlayerStateChange = (state: number) => {
    if (isProgrammaticUpdate.current) return;

    const player = playerRef.current;
    if (!player) return;

    // YT.PlayerState: PLAYING = 1, PAUSED = 2
    if (state === 1) {
      setLocalPlayState('playing');
      if (!canControl) {
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
      const currentTime = player.getCurrentTime ? player.getCurrentTime() : 0;
      pauseVideo(currentTime);
    }
  };

  // 3. React to video ID changes
  useEffect(() => {
    const player = playerRef.current;
    if (!player || !isPlayerReady) return;

    const currentUrl = player.getVideoUrl ? player.getVideoUrl() : '';
    if (playback.videoId && !currentUrl.includes(playback.videoId)) {
      setHasPlaybackError(false);
      isProgrammaticUpdate.current = true;
      isBufferingRef.current = true;
      bufferStabilizationUntilRef.current = Date.now() + 4500; // 4.5s buffer time for new stream to load

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
  }, [playback.videoId, isPlayerReady]);

  // 4. React to server play/pause/seek
  useEffect(() => {
    const player = playerRef.current;
    if (!player || !isPlayerReady) return;

    const isLive = isLiveContent(player);
    const authoritativeTime = getAuthoritativeTime();
    const playerTime = player.getCurrentTime ? player.getCurrentTime() : 0;
    const diff = Math.abs(playerTime - authoritativeTime);

    // If player is actively buffering or stabilizing, do not interrupt its buffer!
    if (isBufferingRef.current || Date.now() < bufferStabilizationUntilRef.current) {
      return;
    }

    isProgrammaticUpdate.current = true;

    // On recorded videos, apply drift seek; on live streams, prevent micro-seeks
    if (!isLive) {
      const isAheadOfHost = !canControl && playerTime > authoritativeTime + 2.5;

      if ((canControl || isLiveSynced || isAheadOfHost) && (diff > 2.2 || isAheadOfHost)) {
        player.seekTo(authoritativeTime, true);
        bufferStabilizationUntilRef.current = Date.now() + 3000;
        if (isAheadOfHost) {
          setIsLiveSynced(true);
          setTimeBehindLive(0);
        }
      }
    }

    if (canControl || isLiveSynced) {
      if (playback.playState === 'playing') {
        const playPromise = player.playVideo();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(() => setNeedsUserGesture(true));
        }
      } else if (playback.playState === 'paused') {
        player.pauseVideo();
      }
    }

    const timer = setTimeout(() => {
      isProgrammaticUpdate.current = false;
    }, 1000);

    return () => clearTimeout(timer);
  }, [playback.playState, playback.currentTime, playback.lastUpdatedAt, isPlayerReady, getAuthoritativeTime, canControl, isLiveSynced, isLiveContent]);

  // 5. Periodic drift and progress monitoring
  useEffect(() => {
    if (!isPlayerReady || !playerRef.current) return;

    const interval = setInterval(() => {
      const player = playerRef.current;
      if (!player || !player.getCurrentTime) return;

      const currentTime = player.getCurrentTime();
      const duration = player.getDuration ? player.getDuration() : 0;
      const isLive = isLiveContent(player);

      if (onProgress) {
        onProgress(currentTime, duration);
      }

      // Check buffering & stabilization window:
      // If the player is buffering or has just sought/started, DO NOT seek!
      const isBuffering = isBufferingRef.current || playerStateRef.current === 3;
      const isStabilizing = Date.now() < bufferStabilizationUntilRef.current;
      const isProgrammatic = isProgrammaticUpdate.current;

      const authTime = getAuthoritativeTime();
      const behindSeconds = authTime - currentTime;

      if (!isBuffering && !isStabilizing && !isProgrammatic) {
        if (isLive) {
          // LIVE STREAM LOGIC:
          // Preserve healthy buffer delay behind live edge so audio never stutters, loops, or gets stuck
          if (!canControl) {
            if (!isLiveSynced) {
              setTimeBehindLive(Math.max(0, Math.round(behindSeconds)));
              if (behindSeconds <= 3.0) {
                setIsLiveSynced(true);
                setTimeBehindLive(0);
              }
            } else {
              // In live synced mode: only resync if viewer has fallen severely behind (> 9.0s)
              if (behindSeconds > 9.0 && playback.playState === 'playing') {
                isProgrammaticUpdate.current = true;
                // Buffer delay: seek to authTime - 2.5s so player gets time to buffer incoming live segments
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
            setTimeBehindLive(0);
          }
        } else {
          // RECORDED VIDEO (VOD) LOGIC:
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
            // Host / Controller mode:
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
      {/* 16:9 Aspect Frame */}
      <div className="video-container relative bg-black">
        <div id="syncora-yt-player-frame" className="w-full h-full" />
      </div>

      {/* Stream Error Recovery Overlay */}
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

      {/* Unmute floating banner */}
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
