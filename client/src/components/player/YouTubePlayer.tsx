import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useWatchParty } from '../../context/WatchPartyContext';
import { VERIFIED_PRESETS } from '../../utils/constants';
import { VolumeX, ShieldAlert, AlertTriangle, RefreshCw } from 'lucide-react';

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
    requestControl,
    updateLocalPlaybackTime,
  } = useWatchParty();

  const playerRef = useRef<any>(null);
  const isApiReady = useRef<boolean>(false);
  const isProgrammaticUpdate = useRef<boolean>(false);
  const [isPlayerReady, setIsPlayerReady] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [needsUserGesture, setNeedsUserGesture] = useState<boolean>(false);
  const [hasPlaybackError, setHasPlaybackError] = useState<boolean>(false);

  // Authoritative server timestamp calculation
  const getAuthoritativeTime = useCallback(() => {
    if (playback.playState === 'playing') {
      const elapsed = (Date.now() - playback.lastUpdatedAt) / 1000;
      return Math.max(0, playback.currentTime + elapsed * playback.playbackRate);
    }
    return Math.max(0, playback.currentTime);
  }, [playback]);

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

          const targetTime = getAuthoritativeTime();
          isProgrammaticUpdate.current = true;
          event.target.seekTo(targetTime, true);

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
          }, 800);
        },
        onStateChange: (event: any) => {
          handlePlayerStateChange(event.data);
        },
        onError: (e: any) => {
          console.warn('[YouTube Player Notice]: Code', e.data);
          // Error codes 100, 101, 150 mean video not found or owner disabled embedding
          if ([2, 5, 100, 101, 150].includes(e.data)) {
            setHasPlaybackError(true);
          }
        },
      },
    });
  }, [playback.videoId, getAuthoritativeTime, playerRefCallback]);

  // Handle Player State Changes
  const handlePlayerStateChange = (state: number) => {
    if (isProgrammaticUpdate.current) return;

    const player = playerRef.current;
    if (!player) return;

    // YT.PlayerState: PLAYING = 1, PAUSED = 2
    if (state === 1) {
      if (!canControl) {
        isProgrammaticUpdate.current = true;
        if (playback.playState === 'paused') {
          player.pauseVideo();
        }
        setTimeout(() => {
          isProgrammaticUpdate.current = false;
        }, 500);
        return;
      }
      const currentTime = player.getCurrentTime() || 0;
      playVideo(currentTime);
    } else if (state === 2) {
      if (!canControl) {
        isProgrammaticUpdate.current = true;
        if (playback.playState === 'playing') {
          player.playVideo();
        }
        setTimeout(() => {
          isProgrammaticUpdate.current = false;
        }, 500);
        return;
      }
      const currentTime = player.getCurrentTime() || 0;
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
      if (player.loadVideoById) {
        player.loadVideoById({
          videoId: playback.videoId,
          startSeconds: playback.currentTime || 0,
        });
      }
      setTimeout(() => {
        isProgrammaticUpdate.current = false;
      }, 1000);
    }
  }, [playback.videoId, isPlayerReady]);

  // 4. React to server play/pause/seek
  useEffect(() => {
    const player = playerRef.current;
    if (!player || !isPlayerReady) return;

    const authoritativeTime = getAuthoritativeTime();
    const playerTime = player.getCurrentTime ? player.getCurrentTime() : 0;
    const diff = Math.abs(playerTime - authoritativeTime);

    isProgrammaticUpdate.current = true;

    if (diff > 1.6) {
      player.seekTo(authoritativeTime, true);
    }

    if (playback.playState === 'playing') {
      const playPromise = player.playVideo();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => setNeedsUserGesture(true));
      }
    } else if (playback.playState === 'paused') {
      player.pauseVideo();
    }

    const timer = setTimeout(() => {
      isProgrammaticUpdate.current = false;
    }, 600);

    return () => clearTimeout(timer);
  }, [playback.playState, playback.currentTime, playback.lastUpdatedAt, isPlayerReady, getAuthoritativeTime]);

  // 5. Periodic drift and progress monitoring
  useEffect(() => {
    if (!isPlayerReady || !playerRef.current) return;

    const interval = setInterval(() => {
      const player = playerRef.current;
      if (!player || !player.getCurrentTime) return;

      const currentTime = player.getCurrentTime();
      const duration = player.getDuration ? player.getDuration() : 0;

      if (onProgress) {
        onProgress(currentTime, duration);
      }

      const authTime = getAuthoritativeTime();
      const drift = Math.abs(currentTime - authTime);

      if (playback.playState === 'playing' && drift > 2.0 && !isProgrammaticUpdate.current) {
        isProgrammaticUpdate.current = true;
        player.seekTo(authTime, true);
        setTimeout(() => {
          isProgrammaticUpdate.current = false;
        }, 500);
      }

      updateLocalPlaybackTime(currentTime);

      if (player.isMuted) {
        setIsMuted(player.isMuted());
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlayerReady, playback.playState, getAuthoritativeTime, onProgress, updateLocalPlaybackTime]);

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
      className={`relative w-full rounded-3xl overflow-hidden bg-brand-surface border transition-all duration-700 shadow-2xl group ${
        isPlaying
          ? 'border-brand-primary/40 shadow-[0_0_50px_-10px_rgba(128,103,245,0.35)]'
          : 'border-brand-border/70 shadow-lg'
      }`}
    >
      {/* 16:9 Aspect Frame */}
      <div className="video-container relative bg-black">
        <div id="syncora-yt-player-frame" className="w-full h-full" />
      </div>

      {/* Playback Error Fallback Overlay */}
      {hasPlaybackError && (
        <div className="absolute inset-0 z-40 bg-brand-dark/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fade-in">
          <div className="p-3.5 rounded-2xl bg-amber-950/60 border border-amber-500/30 text-amber-400 mb-3 shadow-glow-sm">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h4 className="text-base font-bold text-white mb-1">Stream Unavailable on YouTube</h4>
          <p className="text-xs text-brand-muted max-w-sm mb-5">
            This YouTube video is either restricted by its uploader or its live stream ended. Switch to one of our verified 4K streams:
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {VERIFIED_PRESETS.slice(0, 3).map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleFallbackRecover(preset.id)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-primary hover:bg-brand-hover text-white text-xs font-semibold shadow-glow-sm transition-all hover:scale-105 active:scale-95"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Play {preset.title.split(' ')[0]} {preset.title.split(' ')[1]}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Unmute floating banner */}
      {(isMuted || needsUserGesture) && !hasPlaybackError && (
        <button
          onClick={handleUnmute}
          className="absolute top-4 left-4 z-30 flex items-center gap-2 px-3.5 py-2 rounded-full bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold shadow-glow-sm backdrop-blur-md transition-all animate-bounce"
        >
          <VolumeX className="w-4 h-4" />
          <span>Click to Unmute Audio</span>
        </button>
      )}

      {/* Watch-Only Mode Hover Overlay */}
      {!canControl && !hasPlaybackError && (
        <div
          onClick={() => requestControl('REQUEST_CONTROL')}
          className="absolute inset-0 z-10 bg-transparent cursor-pointer flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-brand-dark/40 backdrop-blur-[2px]"
          title="Watch-only mode. Click to request control."
        >
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-brand-surface/90 border border-brand-primary/40 text-brand-text shadow-glow">
            <ShieldAlert className="w-4 h-4 text-brand-highlight" />
            <span className="text-xs font-bold">Watch-Only Mode &bull; Click to Request Playback Control</span>
          </div>
        </div>
      )}
    </div>
  );
};
