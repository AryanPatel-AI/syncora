import React, { useState } from 'react';
import { useWatchParty } from '../../context/WatchPartyContext';
import {
  Compass,
  Radio,
  Grid,
  Users,
  Bookmark,
  History,
  Tv,
  ArrowRight,
  Sparkles,
  Layers,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const {
    currentRoute,
    navigateTo,
    joinRoom,
    currentUserAccount,
    setIsAuthModalOpen,
    showToast,
  } = useWatchParty();

  const [quickRoomCode, setQuickRoomCode] = useState<string>('');
  const [isJoining, setIsJoining] = useState<boolean>(false);

  const handleQuickJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = quickRoomCode.trim().toUpperCase();
    if (!code) return;
    if (code.length < 4) {
      showToast('Room code must be at least 4 characters.', 'error');
      return;
    }

    const name =
      currentUserAccount?.displayName ||
      currentUserAccount?.username ||
      localStorage.getItem('syncora_username') ||
      'Viewer';

    setIsJoining(true);
    try {
      const ok = await joinRoom(code, name);
      if (ok) {
        setQuickRoomCode('');
      }
    } finally {
      setIsJoining(false);
    }
  };

  const navItemClass = (path: string) => `
    flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all
    ${
      currentRoute === path
        ? 'bg-[#193225] text-[#D1FAE5] border border-[#234735] shadow-sm'
        : 'text-[#8E919C] hover:text-[#D1FAE5] hover:bg-[#193225]/50'
    }
  `;

  return (
    <aside className="w-60 h-[calc(100vh-4rem)] sticky top-16 bg-[#11221A]/60 border-r border-[#234735] p-3 flex flex-col justify-between hidden md:flex shrink-0 select-none">
      <div className="flex flex-col gap-5 overflow-y-auto pr-1">
        {/* Main Feeds */}
        <div className="flex flex-col gap-1">
          <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#5E606A] mb-1">
            Browse
          </div>
          <button onClick={() => navigateTo('/')} className={navItemClass('/')}>
            <Compass className={`w-4 h-4 ${currentRoute === '/' ? 'text-[#34D399]' : ''}`} />
            <span>Discover</span>
          </button>

          <button onClick={() => navigateTo('/live')} className={navItemClass('/live')}>
            <div className="relative">
              <Radio className={`w-4 h-4 ${currentRoute === '/live' ? 'text-[#EF4444]' : ''}`} />
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[#EF4444] animate-pulse" />
            </div>
            <span className="flex-1 text-left">Live Now</span>
            <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-[#EF4444]/15 text-[#EF4444]">
              HOT
            </span>
          </button>

          <button onClick={() => navigateTo('/explore')} className={navItemClass('/explore')}>
            <Grid className={`w-4 h-4 ${currentRoute === '/explore' ? 'text-[#34D399]' : ''}`} />
            <span>Explore All</span>
          </button>

          <button onClick={() => navigateTo('/categories')} className={navItemClass('/categories')}>
            <Layers className={`w-4 h-4 ${currentRoute === '/categories' ? 'text-[#34D399]' : ''}`} />
            <span>Categories</span>
          </button>
        </div>

        {/* User Library */}
        <div className="flex flex-col gap-1">
          <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#5E606A] mb-1">
            Library
          </div>

          <button
            onClick={() => {
              if (!currentUserAccount) {
                setIsAuthModalOpen(true);
              } else {
                navigateTo('/following');
              }
            }}
            className={navItemClass('/following')}
          >
            <Users className={`w-4 h-4 ${currentRoute === '/following' ? 'text-[#34D399]' : ''}`} />
            <span>Following</span>
          </button>

          <button
            onClick={() => {
              if (!currentUserAccount) {
                setIsAuthModalOpen(true);
              } else {
                navigateTo('/history');
              }
            }}
            className={navItemClass('/history')}
          >
            <History className={`w-4 h-4 ${currentRoute === '/history' ? 'text-[#34D399]' : ''}`} />
            <span>Watch History</span>
          </button>

          <button
            onClick={() => {
              if (!currentUserAccount) {
                setIsAuthModalOpen(true);
              } else {
                navigateTo('/saved');
              }
            }}
            className={navItemClass('/saved')}
          >
            <Bookmark className={`w-4 h-4 ${currentRoute === '/saved' ? 'text-[#34D399]' : ''}`} />
            <span>Saved Videos</span>
          </button>
        </div>

        {/* Creator Tools */}
        <div className="flex flex-col gap-1">
          <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#5E606A] mb-1">
            Broadcasting
          </div>
          <button onClick={() => navigateTo('/studio')} className={navItemClass('/studio')}>
            <Tv className={`w-4 h-4 ${currentRoute === '/studio' ? 'text-[#34D399]' : ''}`} />
            <span>Creator Studio</span>
          </button>
        </div>
      </div>

      {/* Quick Join Watch Party Card */}
      <div className="pt-3 border-t border-[#234735]">
        <div className="p-3 rounded-xl bg-gradient-to-br from-[#193225] to-[#11221A] border border-[#234735] shadow-inner flex flex-col gap-2">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#D1FAE5]">
            <Sparkles className="w-3.5 h-3.5 text-[#34D399]" />
            <span>Join Watch Room</span>
          </div>
          <form onSubmit={handleQuickJoin} className="flex gap-1.5">
            <input
              type="text"
              placeholder="CODE (e.g. AB12CD)"
              value={quickRoomCode}
              onChange={(e) => setQuickRoomCode(e.target.value.toUpperCase())}
              maxLength={10}
              className="w-full bg-[#09140F] border border-[#234735] rounded-lg px-2.5 py-1.5 text-xs font-mono uppercase text-[#D1FAE5] placeholder-[#5E606A] focus:outline-none focus:border-[#34D399]"
            />
            <button
              type="submit"
              disabled={isJoining || !quickRoomCode.trim()}
              className="p-2 rounded-lg bg-[#34D399] text-[#09140F] hover:bg-[#2BBF88] active:scale-95 disabled:opacity-40 transition-all shrink-0"
              aria-label="Submit room code"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
};
