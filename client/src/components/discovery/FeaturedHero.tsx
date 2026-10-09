import React from 'react';
import { useWatchParty } from '../../context/WatchPartyContext';
import { VideoItem } from '../../types';
import { Play, Users, Radio, Sparkles } from 'lucide-react';

interface FeaturedHeroProps {
  featuredVideo?: VideoItem;
}

export const FeaturedHero: React.FC<FeaturedHeroProps> = ({ featuredVideo }) => {
  const { navigateTo, createRoom, currentUserAccount, showToast } = useWatchParty();

  if (!featuredVideo) return null;

  const handleStartParty = async () => {
    const name =
      currentUserAccount?.displayName ||
      currentUserAccount?.username ||
      localStorage.getItem('syncora_username') ||
      'Host';
    try {
      await createRoom(name, featuredVideo.id);
    } catch (err: any) {
      showToast(err.message || 'Failed to start party', 'error');
    }
  };

  return (
    <div className="relative w-full rounded-3xl overflow-hidden bg-gradient-to-br from-[#193225] to-[#09140F] border border-[#234735] shadow-2xl p-6 sm:p-10 flex flex-col justify-end min-h-[340px] sm:min-h-[400px]">
      {/* Background Graphic & Backdrop */}
      <div className="absolute inset-0 z-0">
        <img
          src={featuredVideo.thumbnailUrl}
          alt={featuredVideo.title}
          className="w-full h-full object-cover object-center opacity-30 mix-blend-luminosity scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#09140F] via-[#09140F]/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#09140F] via-[#09140F]/60 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-2xl flex flex-col gap-3">
        <div className="flex items-center gap-2">
          {featuredVideo.isLive ? (
            <div className="px-2.5 py-1 rounded-md bg-[#EF4444] text-white text-[10px] font-extrabold tracking-wider uppercase flex items-center gap-1.5 shadow-lg shadow-[#EF4444]/25">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              FEATURED LIVE STREAM
            </div>
          ) : (
            <div className="px-2.5 py-1 rounded-md bg-[#8067F5]/20 text-[#A99BFF] border border-[#8067F5]/30 text-[10px] font-bold tracking-wider uppercase flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-[#34D399]" />
              FEATURED PREMIERE
            </div>
          )}

          {featuredVideo.isLive && typeof featuredVideo.concurrentViewers === 'number' && (
            <div className="px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm text-[10px] font-mono text-[#D1FAE5] flex items-center gap-1">
              <Radio className="w-3 h-3 text-[#EF4444]" />
              <span>{featuredVideo.concurrentViewers.toLocaleString()} watching now</span>
            </div>
          )}
        </div>

        <h1 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight line-clamp-2">
          {featuredVideo.title}
        </h1>

        <p className="text-xs sm:text-sm text-[#8E919C] line-clamp-2 leading-relaxed max-w-xl">
          {featuredVideo.description || `Live stream on Syncora by ${featuredVideo.channelTitle}.`}
        </p>

        {/* Channel Details & Actions */}
        <div className="flex flex-wrap items-center gap-4 pt-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#8067F5] to-[#5842C3] flex items-center justify-center font-bold text-xs text-white">
              {featuredVideo.channelTitle.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs font-semibold text-[#D1FAE5]">
              {featuredVideo.channelTitle}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => navigateTo(`/watch/${featuredVideo.id}`)}
              className="px-4 py-2 rounded-xl bg-white text-black font-bold text-xs hover:bg-[#34D399] active:scale-95 transition-all shadow-lg flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Watch Now</span>
            </button>

            <button
              onClick={handleStartParty}
              className="px-4 py-2 rounded-xl bg-[#8067F5] text-white font-bold text-xs hover:bg-[#6e53f0] active:scale-95 transition-all shadow-lg shadow-[#8067F5]/25 flex items-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Host Watch Party</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
