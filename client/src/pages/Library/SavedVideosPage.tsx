import React, { useState, useEffect } from 'react';
import { useWatchParty } from '../../context/WatchPartyContext';
import { api } from '../../services/api';
import { SavedVideoItem } from '../../types';
import { Bookmark, Play, Users, Trash2, Film } from 'lucide-react';

export const SavedVideosPage: React.FC = () => {
  const { navigateTo, createRoom, currentUserAccount, setIsAuthModalOpen, showToast } = useWatchParty();
  const [savedItems, setSavedItems] = useState<SavedVideoItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!currentUserAccount) {
      setIsAuthModalOpen(true);
      setLoading(false);
      return;
    }

    api
      .getSavedVideos()
      .then((res) => setSavedItems(res.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [currentUserAccount, setIsAuthModalOpen]);

  const handleRemove = async (videoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.removeSavedVideo(videoId);
      setSavedItems((prev) => prev.filter((i) => i.videoId !== videoId));
      showToast('Removed from saved videos', 'info');
    } catch (_) {}
  };

  const handleStartParty = async (videoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const name = currentUserAccount?.displayName || currentUserAccount?.username || 'Host';
    try {
      await createRoom(name, videoId);
    } catch (err: any) {
      showToast(err.message || 'Failed to start room', 'error');
    }
  };

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
      <div className="flex items-center gap-3 pb-3 border-b border-[#282A33]">
        <div className="w-10 h-10 rounded-2xl bg-[#D6F279]/15 text-[#D6F279] flex items-center justify-center">
          <Bookmark className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Saved Videos</h1>
          <p className="text-xs text-[#8E919C]">Your private watch-later collection</p>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-[#8E919C]">Loading saved videos...</div>
      ) : savedItems.length === 0 ? (
        <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#1C1E24] border border-[#282A33] flex items-center justify-center text-[#8E919C]">
            <Film className="w-6 h-6" />
          </div>
          <div className="text-sm font-semibold text-white">No saved videos yet</div>
          <p className="text-xs text-[#8E919C]">Bookmark streams while browsing to watch them later.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {savedItems.map((item) => (
            <div
              key={item.id}
              onClick={() => navigateTo(`/watch/${item.videoId}`)}
              className="group rounded-2xl bg-[#16171B] border border-[#282A33] overflow-hidden hover:border-[#3E4250] transition-all cursor-pointer flex flex-col"
            >
              <div className="relative aspect-video w-full bg-[#101114]">
                <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover" />
                {item.isLive && (
                  <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-[#EF4444] text-[9px] font-bold text-white uppercase">
                    LIVE
                  </span>
                )}
              </div>
              <div className="p-3.5 flex-1 flex flex-col justify-between gap-2">
                <div>
                  <h3 className="text-xs font-semibold text-white line-clamp-2">{item.title}</h3>
                  <p className="text-[10px] text-[#8E919C] mt-1">{item.channelTitle}</p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-[#282A33]/50">
                  <button
                    onClick={(e) => handleStartParty(item.videoId, e)}
                    className="px-2.5 py-1 rounded-lg bg-[#8067F5]/20 text-[#A99BFF] hover:bg-[#8067F5] hover:text-white text-[11px] font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Users className="w-3 h-3" />
                    <span>Watch Party</span>
                  </button>
                  <button
                    onClick={(e) => handleRemove(item.videoId, e)}
                    className="p-1.5 rounded-lg text-[#8E919C] hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
