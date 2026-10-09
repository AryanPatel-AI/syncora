import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useWatchParty } from '../../context/WatchPartyContext';
import { VERIFIED_PRESETS } from '../../utils/constants';
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
  } = useWatchParty();

  const playerRef = useRef<any>(null);
  const isApiReady = useRef<boolean>(false);
  const isProgrammaticUpdate = useRef<boolean>(false);
  const [isPlayerReady, setIsPlayerReady] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [needsUserGesture, setNeedsUserGesture] = useState<boolean>(false);
  const [hasPlaybackError, setHasPlaybackError] = useState<boolean>(false);

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
      setLocalPlayState('playing');
      if (!canControl) {
        // Viewer is playing locally on their device only
        return;
      }
      const currentTime = player.getCurrentTime() || 0;
      playVideo(currentTime);
    } else if (state === 2) {
      setLocalPlayState('paused');
      if (!canControl) {
        // Viewer paused locally on their device only: enter catch-up mode
        setIsLiveSynced(false);
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

    // Viewers cannot watch more than the host: if player is ahead of authoritative time, force seek back
    const isAheadOfHost = !canControl && playerTime > authoritativeTime + 0.8;

    // Only force-seek if viewer is in live sync mode, or can control, or is ahead of host
    if ((canControl || isLiveSynced || isAheadOfHost) && (diff > 1.6 || isAheadOfHost)) {
      player.seekTo(authoritativeTime, true);
      if (isAheadOfHost) {
        setIsLiveSynced(true);
        setTimeBehindLive(0);
      }
    }

    // Only force server play/pause state if viewer is in live sync mode or can control
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
    }, 600);

    return () => clearTimeout(timer);
  }, [playback.playState, playback.currentTime, playback.lastUpdatedAt, isPlayerReady, getAuthoritativeTime, canControl, isLiveSynced]);

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
      const behindSeconds = authTime - currentTime;

      if (!canControl) {
        // Enforce: Viewer CANNOT watch more than the host!
        if (currentTime > authTime + 0.8) {
          isProgrammaticUpdate.current = true;
          player.seekTo(authTime, true);
          setIsLiveSynced(true);
          setTimeBehindLive(0);
          setTimeout(() => {
            isProgrammaticUpdate.current = false;
          }, 400);
        } else if (!isLiveSynced) {
          // In viewer DVR catch-up mode:
          setTimeBehindLive(Math.max(0, Math.round(behindSeconds)));
          // If viewer has naturally caught up to the live edge, seamlessly restore live sync
          if (behindSeconds <= 1.5) {
            setIsLiveSynced(true);
            setTimeBehindLive(0);
          }
        } else {
          // In live synced mode: keep synchronized with host broadcast
          const drift = Math.abs(currentTime - authTime);
          if (playback.playState === 'playing' && drift > 2.0 && !isProgrammaticUpdate.current) {
            isProgrammaticUpdate.current = true;
            player.seekTo(authTime, true);
            setTimeout(() => {
              isProgrammaticUpdate.current = false;
            }, 500);
          }
          setTimeBehindLive(0);
        }
      } else {
        // In Host / Controller mode:
        const drift = Math.abs(currentTime - authTime);
        if (playback.playState === 'playing' && drift > 2.0 && !isProgrammaticUpdate.current) {
          isProgrammaticUpdate.current = true;
          player.seekTo(authTime, true);
          setTimeout(() => {
            isProgrammaticUpdate.current = false;
          }, 500);
        }
        setTimeBehindLive(0);
      }

      updateLocalPlaybackTime(currentTime);

      if (player.isMuted) {
        setIsMuted(player.isMuted());
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlayerReady, playback.playState, getAuthoritativeTime, onProgress, updateLocalPlaybackTime, canControl, isLiveSynced, setIsLiveSynced, setTimeBehindLive]);

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
