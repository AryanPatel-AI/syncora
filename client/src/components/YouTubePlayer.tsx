import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useWatchParty } from '../context/WatchPartyContext';
import { VolumeX, Volume2, ShieldAlert } from 'lucide-react';

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
    seekVideo,
    requestControl,
    updateLocalPlaybackTime,
  } = useWatchParty();

  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const isApiReady = useRef<boolean>(false);
  const isProgrammaticUpdate = useRef<boolean>(false);
  const [isPlayerReady, setIsPlayerReady] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [needsUserGesture, setNeedsUserGesture] = useState<boolean>(false);

  // Helper: compute server authoritative time
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

    return () => {
      // Keep script cached
    };
  }, []);

  // 2. Initialize Player
  const initPlayer = useCallback(() => {
    if (!window.YT || !window.YT.Player || playerRef.current) return;

    playerRef.current = new window.YT.Player('syncora-yt-player-frame', {
      videoId: playback.videoId,
      playerVars: {
        autoplay: playback.playState === 'playing' ? 1 : 0,
        controls: 0, // We render custom synchronized controls
        disablekb: 1, // Prevent native keyboard shortcut desync
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
          if (playerRefCallback) playerRefCallback(event.target);

          // Initial seek & state sync
          const targetTime = getAuthoritativeTime();
          isProgrammaticUpdate.current = true;
          event.target.seekTo(targetTime, true);

          if (playback.playState === 'playing') {
            event.target.playVideo();
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
          console.warn('[YouTube Player Error]:', e.data);
        },
      },
    });
  }, [playback.videoId, getAuthoritativeTime, playerRefCallback]);

  // Handle Player State Changes from YouTube
  const handlePlayerStateChange = (state: number) => {
    if (isProgrammaticUpdate.current) {
      return;
    }

    const player = playerRef.current;
    if (!player) return;

    // YT.PlayerState.PLAYING = 1, PAUSED = 2, BUFFERING = 3, ENDED = 0
    if (state === 1) {
      // User pressed play
      if (!canControl) {
        // Participant not authorized -> revert immediately
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
      // User pressed pause
      if (!canControl) {
        // Participant not authorized -> revert immediately
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

  // 3. React to server playback changes (Video ID change)
  useEffect(() => {
    const player = playerRef.current;
    if (!player || !isPlayerReady) return;

    // Check if video ID changed
    const currentVideoUrl = player.getVideoUrl ? player.getVideoUrl() : '';
    if (playback.videoId && !currentVideoUrl.includes(playback.videoId)) {
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

  // 4. React to server play/pause/seek state updates
  useEffect(() => {
    const player = playerRef.current;
    if (!player || !isPlayerReady) return;

    const authoritativeTime = getAuthoritativeTime();
    const playerTime = player.getCurrentTime ? player.getCurrentTime() : 0;
    const diff = Math.abs(playerTime - authoritativeTime);

    isProgrammaticUpdate.current = true;

    // Correct time if drifted
    if (diff > 1.5) {
      player.seekTo(authoritativeTime, true);
    }

    // Sync play/pause
    if (playback.playState === 'playing') {
      const playPromise = player.playVideo();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {
          setNeedsUserGesture(true);
        });
      }
    } else if (playback.playState === 'paused') {
      player.pauseVideo();
    }

    const timer = setTimeout(() => {
      isProgrammaticUpdate.current = false;
    }, 600);

    return () => clearTimeout(timer);
  }, [playback.playState, playback.currentTime, playback.lastUpdatedAt, isPlayerReady, getAuthoritativeTime]);

  // 5. Periodic drift monitor and progress tick
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

      // Check drift against server authoritative time
      const authTime = getAuthoritativeTime();
      const drift = Math.abs(currentTime - authTime);

      if (playback.playState === 'playing' && drift > 2.0 && !isProgrammaticUpdate.current) {
        console.log(`[Auto-Sync] Drift detected (${drift.toFixed(2)}s). Resyncing to ${authTime.toFixed(1)}s`);
        isProgrammaticUpdate.current = true;
        player.seekTo(authTime, true);
        setTimeout(() => {
          isProgrammaticUpdate.current = false;
        }, 500);
      }

      // Update sync heartbeat in context
      updateLocalPlaybackTime(currentTime);

      // Check mute status
      if (player.isMuted) {
        setIsMuted(player.isMuted());
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlayerReady, playback.playState, getAuthoritativeTime, onProgress, updateLocalPlaybackTime]);

  // Handle user unmute click
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

  return (
    <div ref={containerRef} className="relative w-full rounded-2xl overflow-hidden bg-brand-surface border border-brand-border/60 shadow-2xl group">
      {/* 16:9 Video Aspect Container */}
      <div className="video-container relative bg-black">
        <div id="syncora-yt-player-frame" className="w-full h-full" />
      </div>

      {/* Floating Unmute Banner if Browser Autoplay Was Muted */}
      {(isMuted || needsUserGesture) && (
        <button
          onClick={handleUnmute}
          className="absolute top-4 left-4 z-30 flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-primary/90 hover:bg-brand-hover text-white text-xs font-semibold shadow-glow backdrop-blur-md transition-all animate-bounce"
        >
          <VolumeX className="w-4 h-4" />
          <span>Click to Unmute Audio</span>
        </button>
      )}

      {/* Overlay for non-controllers to prompt request permission if they try to click directly */}
      {!canControl && (
        <div
          onClick={() => {
            requestControl('REQUEST_CONTROL');
          }}
          className="absolute inset-0 z-10 bg-transparent cursor-pointer flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-brand-dark/30 backdrop-blur-[1px]"
          title="Watch-only mode. Click to request control."
        >
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-surface/90 border border-brand-primary/40 text-brand-text shadow-glow-sm">
            <ShieldAlert className="w-4 h-4 text-brand-highlight" />
            <span className="text-sm font-medium">Watch-Only Mode · Click to Request Control</span>
          </div>
        </div>
      )}
    </div>
  );
};
