import React, { useState, useEffect } from 'react';
import { useWatchParty } from '../../context/WatchPartyContext';
import { api } from '../../services/api';
import { FollowedChannelItem } from '../../types';
import { Users, UserMinus, Radio } from 'lucide-react';

export const FollowingPage: React.FC = () => {
  const { currentUserAccount, setIsAuthModalOpen, showToast } = useWatchParty();
  const [channels, setChannels] = useState<FollowedChannelItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!currentUserAccount) {
      setIsAuthModalOpen(true);
      setLoading(false);
      return;
    }

    api
      .getFollowedChannels()
      .then((res) => setChannels(res.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [currentUserAccount, setIsAuthModalOpen]);

  const handleUnfollow = async (channelId: string) => {
    try {
      await api.unfollowChannel(channelId);
      setChannels((prev) => prev.filter((c) => c.channelId !== channelId));
      showToast('Unfollowed channel', 'info');
    } catch (_) {}
  };

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
      <div className="flex items-center gap-3 pb-3 border-b border-[#234735]">
        <div className="w-10 h-10 rounded-2xl bg-[#38BDF8]/15 text-[#38BDF8] flex items-center justify-center">
          <Users className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Followed Channels</h1>
          <p className="text-xs text-[#8E919C]">Creators and stream channels you follow</p>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-[#8E919C]">Loading channels...</div>
      ) : channels.length === 0 ? (
        <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#193225] border border-[#234735] flex items-center justify-center text-[#8E919C]">
            <Radio className="w-6 h-6" />
          </div>
          <div className="text-sm font-semibold text-white">No followed channels</div>
          <p className="text-xs text-[#8E919C]">Follow creators on their stream watch pages to track them here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {channels.map((ch) => (
            <div
              key={ch.id}
              className="p-4 rounded-2xl bg-[#11221A] border border-[#234735] flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#8067F5] to-[#5842C3] flex items-center justify-center font-bold text-sm text-white shrink-0">
                  {ch.channelTitle.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm font-semibold text-white truncate">{ch.channelTitle}</span>
                  <span className="text-[10px] text-[#5E606A] font-mono">
                    Followed {new Date(ch.followedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <button
                onClick={() => handleUnfollow(ch.channelId)}
                className="px-3 py-1.5 rounded-xl border border-[#234735] text-xs font-semibold text-[#8E919C] hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors shrink-0"
              >
                Unfollow
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
