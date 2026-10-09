import React, { useState } from 'react';
import { useWatchParty } from '../../context/WatchPartyContext';
import { api } from '../../services/api';
import { VideoItem } from '../../types';
import { Play, Users, Bookmark, Radio, Check } from 'lucide-react';

interface VideoCardProps {
  video: VideoItem;
}

export const VideoCard: React.FC<VideoCardProps> = ({ video }) => {
  const {
    navigateTo,
    createRoom,
    currentUserAccount,
    setIsAuthModalOpen,
    showToast,
  } = useWatchParty();

  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isStartingParty, setIsStartingParty] = useState<boolean>(false);

  const handleWatchSolo = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigateTo(`/watch/${video.id}`);
  };

  const handleStartParty = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const name =
      currentUserAccount?.displayName ||
      currentUserAccount?.username ||
      localStorage.getItem('syncora_username') ||
      'Host';

    setIsStartingParty(true);
    try {
      await createRoom(name, video.id);
    } catch (err: any) {
      showToast(err.message || 'Failed to start party', 'error');
    } finally {
      setIsStartingParty(false);
    }
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUserAccount) {
      setIsAuthModalOpen(true);
      return;
    }

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

  return (
    <div
      onClick={handleWatchSolo}
      className="group relative flex flex-col rounded-2xl bg-[#16171B] border border-[#282A33] overflow-hidden hover:border-[#3E4250] hover:shadow-xl hover:shadow-black/40 transition-all duration-200 cursor-pointer"
    >
      {/* Thumbnail Container */}
      <div className="relative aspect-video w-full overflow-hidden bg-[#101114]">
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`;
          }}
        />

        {/* Live or Duration Badge */}
        {video.isLive ? (
          <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-[#EF4444] text-white text-[10px] font-extrabold tracking-wider uppercase flex items-center gap-1 shadow-md">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
            LIVE
          </div>
        ) : video.duration ? (
          <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-sm text-[10px] font-mono font-medium text-white">
            {video.duration}
          </div>
        ) : null}

        {/* Live concurrent viewers when available */}
        {video.isLive && typeof video.concurrentViewers === 'number' && (
          <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-sm text-[10px] font-mono text-[#F2F0E9] flex items-center gap-1">
            <Radio className="w-3 h-3 text-[#EF4444]" />
            <span>{video.concurrentViewers.toLocaleString()} watching</span>
          </div>
        )}

        {/* Hover Quick Actions Bar */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-3">
          <button
            onClick={handleWatchSolo}
            className="p-2 rounded-xl bg-white text-black font-semibold text-xs hover:bg-[#D6F279] active:scale-95 transition-all shadow-lg flex items-center gap-1.5"
            title="Watch stream"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Watch</span>
          </button>

          <button
            onClick={handleStartParty}
            disabled={isStartingParty}
            className="p-2 rounded-xl bg-[#8067F5] text-white font-semibold text-xs hover:bg-[#6c51ee] active:scale-95 transition-all shadow-lg flex items-center gap-1.5"
            title="Start Watch Party"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Party</span>
          </button>

          <button
            onClick={handleSave}
            className={`p-2 rounded-xl border backdrop-blur-md active:scale-95 transition-all shadow-lg ${
              isSaved
                ? 'bg-[#D6F279] text-[#101114] border-[#D6F279]'
                : 'bg-black/60 text-white border-white/20 hover:bg-black/80'
            }`}
            title={isSaved ? 'Saved' : 'Save for later'}
          >
            {isSaved ? <Check className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Metadata Container */}
      <div className="p-3.5 flex flex-col gap-2">
        <div className="flex gap-2.5 items-start">
          {/* Channel avatar */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#8067F5] to-[#5842C3] flex items-center justify-center font-bold text-xs text-white shrink-0 mt-0.5">
            {video.channelTitle ? video.channelTitle.charAt(0).toUpperCase() : 'Y'}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-xs sm:text-sm font-semibold text-[#F2F0E9] line-clamp-2 leading-snug group-hover:text-white transition-colors">
              {video.title}
            </h3>

            <p className="text-[11px] text-[#8E919C] truncate mt-1">
              {video.channelTitle}
            </p>

            <div className="flex items-center gap-2 text-[10px] text-[#5E606A] mt-0.5 font-mono">
              {!video.isLive && typeof video.viewCount === 'number' && (
                <span>{video.viewCount.toLocaleString()} views</span>
              )}
              {video.category && (
                <span className="capitalize px-1.5 py-0.2 rounded bg-[#1C1E24] text-[#8E919C] border border-[#282A33]">
                  {video.category}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
