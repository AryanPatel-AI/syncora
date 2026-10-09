import React, { useState, useEffect } from 'react';
import { useWatchParty } from '../../context/WatchPartyContext';
import { api } from '../../services/api';
import { WatchHistoryItem } from '../../types';
import { History, Trash2, Film, Play } from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const { navigateTo, currentUserAccount, setIsAuthModalOpen, showToast } = useWatchParty();
  const [historyItems, setHistoryItems] = useState<WatchHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!currentUserAccount) {
      setIsAuthModalOpen(true);
      setLoading(false);
      return;
    }

    api
      .getWatchHistory()
      .then((res) => setHistoryItems(res.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [currentUserAccount, setIsAuthModalOpen]);

  const handleClearHistory = async () => {
    try {
      await api.clearHistory();
      setHistoryItems([]);
      showToast('Viewing history cleared.', 'info');
    } catch (_) {}
  };

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
      <div className="flex items-center justify-between pb-3 border-b border-[#234735]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#34D399]/15 text-[#34D399] flex items-center justify-center">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Watch History</h1>
            <p className="text-xs text-[#8E919C]">Streams and videos you recently viewed</p>
          </div>
        </div>

        {historyItems.length > 0 && (
          <button
            onClick={handleClearHistory}
            className="px-3 py-1.5 rounded-xl border border-[#234735] text-xs font-semibold text-[#8E919C] hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-[#8E919C]">Loading viewing history...</div>
      ) : historyItems.length === 0 ? (
        <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#193225] border border-[#234735] flex items-center justify-center text-[#8E919C]">
            <Film className="w-6 h-6" />
          </div>
          <div className="text-sm font-semibold text-white">No viewing history</div>
          <p className="text-xs text-[#8E919C]">Videos and streams you watch will automatically appear here.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 max-w-3xl">
          {historyItems.map((item) => (
            <div
              key={item.id}
              onClick={() => navigateTo(`/watch/${item.videoId}`)}
              className="flex gap-4 p-3 rounded-2xl bg-[#11221A] border border-[#234735] hover:border-[#2A5540] transition-colors cursor-pointer items-center"
            >
              <div className="relative w-36 aspect-video rounded-xl overflow-hidden bg-[#09140F] shrink-0">
                <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0 flex flex-col gap-1">
                <h3 className="text-xs sm:text-sm font-semibold text-white line-clamp-1">{item.title}</h3>
                <p className="text-[11px] text-[#8E919C] truncate">{item.channelTitle}</p>
                <span className="text-[10px] text-[#5E606A] font-mono">
                  Watched {new Date(item.watchedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
