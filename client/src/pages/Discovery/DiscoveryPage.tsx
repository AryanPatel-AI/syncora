import React, { useState, useEffect } from 'react';
import { useWatchParty } from '../../context/WatchPartyContext';
import { api, filterPlayableVideos } from '../../services/api';
import { VideoItem } from '../../types';
import { FeaturedHero } from '../../components/discovery/FeaturedHero';
import { CategoryPills } from '../../components/discovery/CategoryPills';
import { VideoCard } from '../../components/discovery/VideoCard';
import { Radio, Sparkles, TrendingUp, Search, Film, AlertCircle } from 'lucide-react';

interface DiscoveryPageProps {
  filterType?: 'all' | 'live' | 'explore';
}

export const DiscoveryPage: React.FC<DiscoveryPageProps> = ({ filterType = 'all' }) => {
  const { searchQuery, activeCategory } = useWatchParty();

  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(activeCategory || 'all');
  const [featuredVideo, setFeaturedVideo] = useState<VideoItem | undefined>(undefined);
  const [liveStreams, setLiveStreams] = useState<VideoItem[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (activeCategory) {
      setSelectedCategory(activeCategory);
    }
  }, [activeCategory]);

  // Load categories
  useEffect(() => {
    api
      .getCategories()
      .then((cats) => {
        if (Array.isArray(cats)) setCategories(cats);
      })
      .catch(() => {});
  }, []);

  // Fetch streams & videos
  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setError(null);

    const loadContent = async () => {
      try {
        if (searchQuery.trim()) {
          // Search mode
          const searchRes = await api.searchVideos({
            q: searchQuery.trim(),
            category: selectedCategory,
            type: filterType === 'live' ? 'live' : 'all',
          });
          if (!isCancelled) {
            const playableItems = filterPlayableVideos(searchRes.items || []);
            setVideos(playableItems);
            setLiveStreams(playableItems.filter((v) => v.isLive));
            if (playableItems.length > 0) {
              setFeaturedVideo(playableItems[0]);
            }
          }
        } else if (filterType === 'live') {
          // Live now only mode
          const liveRes = await api.getLiveStreams(selectedCategory);
          if (!isCancelled) {
            const playableLive = filterPlayableVideos(liveRes.items || []);
            setLiveStreams(playableLive);
            setVideos(playableLive);
            if (playableLive.length > 0) {
              setFeaturedVideo(playableLive[0]);
            }
          }
        } else {
          // Normal discovery mode
          const [liveRes, popRes] = await Promise.all([
            api.getLiveStreams(selectedCategory),
            api.getPopularVideos(selectedCategory),
          ]);
          if (!isCancelled) {
            const playableLive = filterPlayableVideos(liveRes.items || []);
            const playablePop = filterPlayableVideos(popRes.items || []);
            setLiveStreams(playableLive);
            setVideos(playablePop);
            if (playableLive.length > 0) {
              setFeaturedVideo(playableLive[0]);
            } else if (playablePop.length > 0) {
              setFeaturedVideo(playablePop[0]);
            }
          }
        }
      } catch (err: any) {
        if (!isCancelled) {
          setError(err.message || 'Failed to load streams');
        }
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    loadContent();
    return () => {
      isCancelled = true;
    };
  }, [searchQuery, selectedCategory, filterType]);

  return (
    <div className="flex-1 flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      {/* Category Pills Header */}
      {categories.length > 0 && (
        <CategoryPills
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={(id) => setSelectedCategory(id)}
        />
      )}

      {/* Featured Hero Banner (When not actively searching) */}
      {!searchQuery && featuredVideo && (
        <FeaturedHero featuredVideo={featuredVideo} />
      )}

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-2xl bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Search Header Banner */}
      {searchQuery && (
        <div className="flex items-center justify-between pb-2 border-b border-[#282A33]">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-[#8E919C]" />
            <h2 className="text-base font-bold text-white">
              Search Results for <span className="text-[#D6F279]">"{searchQuery}"</span>
            </h2>
          </div>
          <span className="text-xs text-[#8E919C] font-mono">
            {videos.length} results
          </span>
        </div>
      )}

      {/* Live Now Section (When not searching and has live streams) */}
      {!searchQuery && filterType !== 'live' && liveStreams.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#EF4444] animate-ping" />
            <h2 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-1.5">
              <span>Live Now</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {liveStreams.slice(0, 4).map((stream) => (
              <VideoCard key={stream.id} video={stream} />
            ))}
          </div>
        </section>
      )}

      {/* Recommended / All Streams Grid */}
      <section className="flex flex-col gap-3">
        {!searchQuery && (
          <div className="flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#8067F5]" />
              <span>
                {filterType === 'live' ? 'All Live Broadcasts' : 'Recommended & Trending'}
              </span>
            </h2>
          </div>
        )}

        {loading ? (
          /* Loading Skeletons */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl bg-[#16171B] border border-[#282A33] overflow-hidden flex flex-col gap-3 animate-pulse p-3"
              >
                <div className="aspect-video w-full rounded-xl bg-[#282A33]/50" />
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#282A33]" />
                  <div className="flex-1 flex flex-col gap-1.5">
                    <div className="h-3.5 w-3/4 rounded bg-[#282A33]" />
                    <div className="h-2.5 w-1/2 rounded bg-[#282A33]" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : videos.length === 0 ? (
          /* Empty State */
          <div className="py-16 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#1C1E24] border border-[#282A33] flex items-center justify-center text-[#8E919C]">
              <Film className="w-6 h-6" />
            </div>
            <div className="text-sm font-semibold text-white">No streams found</div>
            <p className="text-xs text-[#8E919C] max-w-sm">
              Try adjusting your search query or switching categories.
            </p>
          </div>
        ) : (
          /* Videos Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {videos.map((v) => (
              <VideoCard key={v.id} video={v} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
