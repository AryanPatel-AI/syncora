import React, { useState, useEffect, useRef } from 'react';
import { useWatchParty } from '../../context/WatchPartyContext';
import { api, filterPlayableVideos, markVideoAsUnplayable } from '../../services/api';
import { DEFAULT_VIDEO_ID } from '../../utils/constants';
import { VideoItem } from '../../types';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Tv,
  Users,
  Bookmark,
  Share2,
  ExternalLink,
  Radio,
  ThumbsUp,
  ThumbsDown,
  Flag,
  Check,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Sparkles,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

interface StreamWatchPageProps {
  videoId: string;
}

export const StreamWatchPage: React.FC<StreamWatchPageProps> = ({ videoId }) => {
  const {
    createRoom,
    currentUserAccount,
    setIsAuthModalOpen,
    navigateTo,
    showToast,
  } = useWatchParty();

  const [video, setVideo] = useState<VideoItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Player state
  const [player, setPlayer] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(85);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isTheater, setIsTheater] = useState<boolean>(false);
  const [playerError, setPlayerError] = useState<string | null>(null);

  // Social actions state
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [isDisliked, setIsDisliked] = useState<boolean>(false);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [likeCount, setLikeCount] = useState<number>(0);
  const [isDescExpanded, setIsDescExpanded] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'syncora' | 'youtube' | 'related'>('syncora');

  // Related streams
  const [relatedVideos, setRelatedVideos] = useState<VideoItem[]>([]);

  // Local Syncora stream chat
  const [chatMessages, setChatMessages] = useState<
    { id: string; sender: string; text: string; time: string; color: string }[]
  >([
    {
      id: 'c1',
      sender: 'Syncora Bot',
      text: 'Welcome to the live viewing room! Feel free to chat with other viewers.',
      time: 'Now',
      color: '#8067F5',
    },
  ]);
  const [inputMessage, setInputMessage] = useState<string>('');

  const containerRef = useRef<HTMLDivElement>(null);

  // Load video details
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setPlayerError(null);

    api
      .getVideoDetails(videoId)
      .then((data) => {
        if (!cancelled) {
          setVideo(data);
          setLikeCount(data.likeCount || 0);

          // Record history if logged in
          if (currentUserAccount) {
            api.recordHistory({
              videoId: data.id,
              title: data.title,
              channelTitle: data.channelTitle,
              thumbnailUrl: data.thumbnailUrl,
            }).catch(() => {});
          }
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load video details');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    // Load related
    api
      .getPopularVideos()
      .then((res) => {
        if (!cancelled && Array.isArray(res.items)) {
          const playable = filterPlayableVideos(res.items.filter((v) => v.id !== videoId));
          setRelatedVideos(playable.slice(0, 8));
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [videoId, currentUserAccount]);

  // Check saved and following status
  useEffect(() => {
    if (currentUserAccount && video) {
      api.getSavedVideos().then((res) => {
        if (res.items?.some((i) => i.videoId === video.id)) {
          setIsSaved(true);
        }
      }).catch(() => {});

      api.getFollowedChannels().then((res) => {
        if (res.items?.some((i) => i.channelId === video.channelId)) {
          setIsFollowing(true);
        }
      }).catch(() => {});
    }
  }, [currentUserAccount, video]);

  // Initialize YouTube IFrame Player
  useEffect(() => {
    let ytPlayer: any = null;

    const onYouTubeReady = () => {
      if (!window.YT || !window.YT.Player) return;

      ytPlayer = new window.YT.Player('solo-stream-player', {
        videoId,
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 0,
          enablejsapi: 1,
          modestbranding: 1,
          rel: 0,
          origin: window.location.origin,
        },
        events: {
          onReady: (event: any) => {
            setPlayer(event.target);
            event.target.setVolume(volume);
            setDuration(event.target.getDuration() || 0);
            event.target.playVideo();
          },
          onStateChange: (event: any) => {
            if (event.data === 1) setIsPlaying(true);
            else if (event.data === 2) setIsPlaying(false);
          },
          onError: () => {
            markVideoAsUnplayable(videoId);
            setPlayerError('This video cannot be embedded or has playback restrictions.');
          },
        },
      });
    };

    if (window.YT && window.YT.Player) {
      onYouTubeReady();
    } else {
      const prevReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prevReady) prevReady();
        onYouTubeReady();
      };
      if (!document.getElementById('youtube-iframe-api-script')) {
        const tag = document.createElement('script');
        tag.id = 'youtube-iframe-api-script';
        tag.src = 'https://www.youtube.com/iframe_api';
        document.body.appendChild(tag);
      }
    }

    // Time ticker
    const interval = setInterval(() => {
      if (ytPlayer && typeof ytPlayer.getCurrentTime === 'function') {
        const cur = ytPlayer.getCurrentTime();
        if (typeof cur === 'number') setCurrentTime(cur);
      }
    }, 500);

    return () => {
      clearInterval(interval);
      if (ytPlayer && typeof ytPlayer.destroy === 'function') {
        ytPlayer.destroy();
      }
    };
  }, [videoId]);

  const togglePlay = () => {
    if (!player) return;
    if (isPlaying) {
      player.pauseVideo();
    } else {
      player.playVideo();
    }
  };

  const toggleMute = () => {
    if (!player) return;
    if (isMuted) {
      player.unMute();
      setIsMuted(false);
    } else {
      player.mute();
      setIsMuted(true);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setVolume(val);
    if (player) {
      player.setVolume(val);
      if (val === 0) {
        player.mute();
        setIsMuted(true);
      } else if (isMuted) {
        player.unMute();
        setIsMuted(false);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = parseFloat(e.target.value);
    setCurrentTime(target);
    if (player) player.seekTo(target, true);
  };

  const handleReturnToLive = () => {
    if (player && video?.isLive) {
      // Leave a 2.5s buffer delay so the stream has time to buffer smoothly without stuttering
      const target = Math.max(0, duration - 2.5);
      player.seekTo(target, true);
      player.playVideo();
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  const handleStartWatchParty = async () => {
    const name =
      currentUserAccount?.displayName ||
      currentUserAccount?.username ||
      localStorage.getItem('syncora_username') ||
      'Host';
    try {
      await createRoom(name, videoId);
    } catch (err: any) {
      showToast(err.message || 'Failed to start watch party', 'error');
    }
  };

  const handleLike = () => {
    if (isLiked) {
      setIsLiked(false);
      setLikeCount((prev) => Math.max(0, prev - 1));
    } else {
      setIsLiked(true);
      setIsDisliked(false);
      setLikeCount((prev) => prev + 1);
      showToast('Liked this stream!', 'success');
    }
  };

  const handleDislike = () => {
    if (isDisliked) {
      setIsDisliked(false);
    } else {
      setIsDisliked(true);
      if (isLiked) {
        setIsLiked(false);
        setLikeCount((prev) => Math.max(0, prev - 1));
      }
    }
  };

  const handleToggleFollow = async () => {
    if (!currentUserAccount) {
      setIsAuthModalOpen(true);
      return;
    }
    if (!video) return;

    try {
      if (isFollowing) {
        await api.unfollowChannel(video.channelId);
        setIsFollowing(false);
        showToast(`Unfollowed ${video.channelTitle}`, 'info');
      } else {
        await api.followChannel({
          channelId: video.channelId,
          channelTitle: video.channelTitle,
          avatarUrl: video.channelAvatarUrl,
        });
        setIsFollowing(true);
        showToast(`Following ${video.channelTitle}`, 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update follow', 'error');
    }
  };

  const handleToggleSave = async () => {
    if (!currentUserAccount) {
      setIsAuthModalOpen(true);
      return;
    }
    if (!video) return;

    try {
      if (isSaved) {
        await api.removeSavedVideo(video.id);
        setIsSaved(false);
        showToast('Removed from saved videos.', 'info');
      } else {
        await api.saveVideo({
          videoId: video.id,
          title: video.title,
          channelTitle: video.channelTitle,
          thumbnailUrl: video.thumbnailUrl,
          duration: video.duration,
          isLive: video.isLive,
        });
        setIsSaved(true);
        showToast('Saved to your library.', 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Action failed', 'error');
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast('Link copied to clipboard!', 'success');
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputMessage.trim();
    if (!text) return;

    const sender =
      currentUserAccount?.displayName ||
      currentUserAccount?.username ||
      'Viewer';

    setChatMessages((prev) => [
      ...prev,
      {
        id: `msg_${Date.now()}`,
        sender,
        text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        color: currentUserAccount?.avatarColor || '#8067F5',
      },
    ]);
    setInputMessage('');
  };

  return (
    <div className="flex-1 max-w-[1600px] mx-auto w-full p-3 sm:p-6 flex flex-col gap-5">
      {/* Main Grid: Player on left, Social Drawer on right */}
      <div className={`grid gap-5 ${isTheater ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-12'}`}>
        {/* Left Column: Player & Metadata */}
        <div className={isTheater ? 'w-full' : 'lg:col-span-8 flex flex-col gap-4'}>
          {/* Player Container */}
          <div
            ref={containerRef}
            className="relative w-full aspect-video rounded-2xl bg-black border border-[#282A33] overflow-hidden group shadow-2xl flex items-center justify-center"
          >
            <div id="solo-stream-player" className="w-full h-full" />

            {/* Error Overlay */}
            {playerError && (
              <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center gap-3 p-6 text-center z-30">
                <AlertCircle className="w-8 h-8 text-[#EF4444]" />
                <h3 className="text-sm font-bold text-white">Playback Unavailable</h3>
                <p className="text-xs text-[#8E919C] max-w-sm">{playerError}</p>
                <div className="flex items-center gap-2 flex-wrap justify-center">
                  <button
                    onClick={() => navigateTo(`/watch/${DEFAULT_VIDEO_ID}`)}
                    className="px-4 py-2 rounded-xl bg-[#D6F279] text-[#101114] text-xs font-semibold hover:bg-[#c3e065] flex items-center gap-2"
                  >
                    <span>Play Verified Stream</span>
                  </button>
                  <a
                    href={`https://www.youtube.com/watch?v=${videoId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-xl bg-[#1C1E24] text-[#8E919C] hover:text-white border border-[#282A33] text-xs font-semibold flex items-center gap-2"
                  >
                    <span>Open on YouTube</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            )}

            {/* Custom Interactive Player Controls Bar */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 sm:p-4 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2 z-20">
              {/* Progress Slider (Only for non-live seekable content) */}
              {!video?.isLive && duration > 0 && (
                <input
                  type="range"
                  min={0}
                  max={duration}
                  step={0.1}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-[#D6F279]"
                />
              )}

              <div className="flex items-center justify-between gap-3 text-white text-xs">
                <div className="flex items-center gap-3">
                  <button
                    onClick={togglePlay}
                    className="p-1.5 rounded-lg hover:bg-white/20 active:scale-95 transition-all"
                  >
                    {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                  </button>

                  {/* Volume Slider */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleMute}
                      className="p-1 rounded hover:bg-white/20"
                    >
                      {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      className="w-16 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-white"
                    />
                  </div>

                  {/* Live Badge or Time Display */}
                  {video?.isLive ? (
                    <button
                      onClick={handleReturnToLive}
                      className="px-2 py-0.5 rounded bg-[#EF4444] text-[10px] font-bold uppercase tracking-wider text-white flex items-center gap-1 active:scale-95"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      LIVE
                    </button>
                  ) : duration > 0 ? (
                    <span className="text-[11px] font-mono text-[#8E919C]">
                      {Math.floor(currentTime / 60)}:{(Math.floor(currentTime % 60)).toString().padStart(2, '0')} /{' '}
                      {Math.floor(duration / 60)}:{(Math.floor(duration % 60)).toString().padStart(2, '0')}
                    </span>
                  ) : null}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsTheater((prev) => !prev)}
                    className={`p-1.5 rounded-lg hover:bg-white/20 text-xs flex items-center gap-1 ${
                      isTheater ? 'text-[#D6F279]' : 'text-white'
                    }`}
                    title="Toggle theater mode"
                  >
                    <Tv className="w-4 h-4" />
                  </button>

                  <button
                    onClick={toggleFullscreen}
                    className="p-1.5 rounded-lg hover:bg-white/20"
                    title="Fullscreen"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Stream Details & Actions Bar */}
          {video && (
            <div className="flex flex-col gap-3 pt-2">
              <h1 className="text-lg sm:text-2xl font-bold text-white tracking-tight leading-snug">
                {video.title}
              </h1>

              {/* Channel Row & Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#282A33]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#8067F5] to-[#5842C3] flex items-center justify-center font-bold text-white shadow-md">
                    {video.channelTitle ? video.channelTitle.charAt(0).toUpperCase() : 'C'}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm text-white">
                      {video.channelTitle}
                    </span>
                    <span className="text-[10px] text-[#8E919C] font-mono">
                      {video.isLive ? 'Broadcasting Live' : 'Uploaded Video'}
                    </span>
                  </div>

                  <button
                    onClick={handleToggleFollow}
                    className={`ml-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 ${
                      isFollowing
                        ? 'bg-[#1C1E24] text-[#8E919C] border border-[#282A33]'
                        : 'bg-white text-black hover:bg-[#D6F279]'
                    }`}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                </div>

                {/* Primary Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Start Watch Party Button */}
                  <button
                    onClick={handleStartWatchParty}
                    className="px-3.5 py-2 rounded-xl bg-[#8067F5] text-white text-xs font-bold hover:bg-[#6e53f0] active:scale-95 transition-all shadow-md shadow-[#8067F5]/25 flex items-center gap-1.5"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Start Watch Party</span>
                  </button>

                  {/* Like & Dislike */}
                  <div className="flex items-center rounded-xl bg-[#1C1E24] border border-[#282A33] overflow-hidden text-xs">
                    <button
                      onClick={handleLike}
                      className={`flex items-center gap-1.5 px-3 py-2 hover:bg-[#282A33] transition-colors ${
                        isLiked ? 'text-[#D6F279]' : 'text-[#8E919C]'
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span className="font-mono text-[11px]">{likeCount}</span>
                    </button>
                    <div className="w-[1px] h-4 bg-[#282A33]" />
                    <button
                      onClick={handleDislike}
                      className={`px-3 py-2 hover:bg-[#282A33] transition-colors ${
                        isDisliked ? 'text-[#EF4444]' : 'text-[#8E919C]'
                      }`}
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Save */}
                  <button
                    onClick={handleToggleSave}
                    className={`p-2 rounded-xl border text-xs transition-colors ${
                      isSaved
                        ? 'bg-[#D6F279]/15 border-[#D6F279]/30 text-[#D6F279]'
                        : 'bg-[#1C1E24] border-[#282A33] text-[#8E919C] hover:text-white'
                    }`}
                    title={isSaved ? 'Saved in library' : 'Save video'}
                  >
                    <Bookmark className="w-4 h-4" />
                  </button>

                  {/* Share */}
                  <button
                    onClick={handleShare}
                    className="p-2 rounded-xl bg-[#1C1E24] border border-[#282A33] text-[#8E919C] hover:text-white transition-colors"
                    title="Share link"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>

                  {/* Open in YouTube */}
                  <a
                    href={`https://www.youtube.com/watch?v=${videoId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl bg-[#1C1E24] border border-[#282A33] text-[#8E919C] hover:text-white transition-colors"
                    title="Open on YouTube"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Description & Stats Box */}
              <div className="p-4 rounded-2xl bg-[#16171B] border border-[#282A33] text-xs flex flex-col gap-2">
                <div className="flex items-center gap-3 font-semibold text-[#8E919C]">
                  {video.isLive && typeof video.concurrentViewers === 'number' && (
                    <span className="text-[#EF4444] font-mono flex items-center gap-1">
                      <Radio className="w-3 h-3" />
                      {video.concurrentViewers.toLocaleString()} watching now
                    </span>
                  )}
                  {!video.isLive && typeof video.viewCount === 'number' && (
                    <span className="font-mono text-white">
                      {video.viewCount.toLocaleString()} views
                    </span>
                  )}
                  <span>•</span>
                  <span>{new Date(video.publishedAt).toLocaleDateString()}</span>
                </div>

                <div className={`text-[#F2F0E9] leading-relaxed whitespace-pre-wrap ${!isDescExpanded ? 'line-clamp-3' : ''}`}>
                  {video.description || 'No description provided by creator.'}
                </div>

                <button
                  onClick={() => setIsDescExpanded((prev) => !prev)}
                  className="text-xs font-semibold text-[#8067F5] hover:text-[#A99BFF] self-start flex items-center gap-1 mt-1"
                >
                  <span>{isDescExpanded ? 'Show less' : 'Show more'}</span>
                  {isDescExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Chat & Recommendations Panel */}
        <div className="lg:col-span-4 flex flex-col h-[640px] rounded-2xl bg-[#16171B] border border-[#282A33] overflow-hidden shadow-xl">
          {/* Tabs */}
          <div className="grid grid-cols-3 p-1 bg-[#101114] border-b border-[#282A33] text-xs font-medium">
            <button
              onClick={() => setActiveTab('syncora')}
              className={`py-2 rounded-xl transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'syncora'
                  ? 'bg-[#1C1E24] text-white shadow-sm'
                  : 'text-[#8E919C] hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-[#D6F279]" />
              <span>Live Chat</span>
            </button>

            <button
              onClick={() => setActiveTab('youtube')}
              className={`py-2 rounded-xl transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'youtube'
                  ? 'bg-[#1C1E24] text-white shadow-sm'
                  : 'text-[#8E919C] hover:text-white'
              }`}
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#EF4444]" />
              <span>YT Chat</span>
            </button>

            <button
              onClick={() => setActiveTab('related')}
              className={`py-2 rounded-xl transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'related'
                  ? 'bg-[#1C1E24] text-white shadow-sm'
                  : 'text-[#8E919C] hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#A99BFF]" />
              <span>Related</span>
            </button>
          </div>

          {/* Tab 1: Syncora Live Chat */}
          {activeTab === 'syncora' && (
            <div className="flex-1 flex flex-col justify-between overflow-hidden">
              <div className="flex-1 p-3.5 overflow-y-auto flex flex-col gap-2.5">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className="text-xs leading-relaxed flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold" style={{ color: msg.color }}>
                        {msg.sender}
                      </span>
                      <span className="text-[10px] text-[#5E606A]">{msg.time}</span>
                    </div>
                    <span className="text-[#F2F0E9] break-words">{msg.text}</span>
                  </div>
                ))}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendChat} className="p-3 bg-[#101114] border-t border-[#282A33] flex gap-2">
                <input
                  type="text"
                  placeholder="Chat with other viewers..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  maxLength={300}
                  className="flex-1 bg-[#16171B] border border-[#282A33] rounded-xl px-3 py-2 text-xs text-[#F2F0E9] placeholder-[#5E606A] focus:outline-none focus:border-[#D6F279]"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim()}
                  className="px-3.5 py-2 rounded-xl bg-[#D6F279] text-[#101114] font-bold text-xs hover:bg-[#c8e860] active:scale-95 disabled:opacity-40 transition-all"
                >
                  Send
                </button>
              </form>
            </div>
          )}

          {/* Tab 2: YouTube Live Chat Embed */}
          {activeTab === 'youtube' && (
            <div className="flex-1 flex flex-col">
              <div className="p-2 bg-[#1C1E24] text-[10px] text-[#8E919C] border-b border-[#282A33] text-center">
                Official YouTube Live Chat Embed. Note: Chat embedding is subject to YouTube channel permissions.
              </div>
              <iframe
                title="YouTube Live Chat"
                src={`https://www.youtube.com/live_chat?v=${videoId}&embed_domain=${window.location.hostname}`}
                className="w-full flex-1 border-none"
              />
            </div>
          )}

          {/* Tab 3: Related Videos */}
          {activeTab === 'related' && (
            <div className="flex-1 p-3 overflow-y-auto flex flex-col gap-2.5">
              {relatedVideos.map((item) => (
                <div
                  key={item.id}
                  onClick={() => navigateTo(`/watch/${item.id}`)}
                  className="flex gap-2.5 p-2 rounded-xl hover:bg-[#1C1E24] border border-transparent hover:border-[#282A33] cursor-pointer transition-colors"
                >
                  <img
                    src={item.thumbnailUrl}
                    alt={item.title}
                    className="w-24 aspect-video rounded-lg object-cover shrink-0"
                  />
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-xs font-semibold text-[#F2F0E9] line-clamp-2 leading-snug">
                      {item.title}
                    </span>
                    <span className="text-[10px] text-[#8E919C] truncate mt-1">
                      {item.channelTitle}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
