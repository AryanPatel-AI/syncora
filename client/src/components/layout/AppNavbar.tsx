import React, { useState, useEffect, useRef } from 'react';
import { useWatchParty } from '../../context/WatchPartyContext';
import { api } from '../../services/api';
import { NotificationItem } from '../../types';
import {
  Search,
  Plus,
  Bell,
  User,
  Radio,
  Tv,
  Film,
  LogOut,
  Bookmark,
  History,
  Users,
  Compass,
  Check,
  ExternalLink,
  X,
  Sparkles,
} from 'lucide-react';

interface AppNavbarProps {
  onToggleSidebar?: () => void;
}

export const AppNavbar: React.FC<AppNavbarProps> = ({ onToggleSidebar }) => {
  const {
    currentRoute,
    navigateTo,
    searchQuery,
    setSearchQuery,
    currentUserAccount,
    setIsAuthModalOpen,
    setAuthModalMode,
    setIsCreateRoomModalOpen,
    logout,
    showToast,
  } = useWatchParty();

  const [searchInput, setSearchInput] = useState<string>(searchQuery);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const createRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  // Load notifications if user is authenticated
  useEffect(() => {
    if (currentUserAccount) {
      api
        .getNotifications()
        .then((res) => {
          if (Array.isArray(res.items)) {
            setNotifications(res.items);
            setUnreadCount(res.items.filter((n) => !n.isRead).length);
          }
        })
        .catch(() => {});
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [currentUserAccount]);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
      if (createRef.current && !createRef.current.contains(e.target as Node)) {
        setIsCreateMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchInput.trim();
    setSearchQuery(q);
    if (currentRoute !== '/' && currentRoute !== '/explore') {
      navigateTo('/explore');
    }
  };

  const handleMarkNotificationsRead = async () => {
    try {
      await api.markNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (_) {}
  };

  return (
    <header className="sticky top-0 z-40 w-full h-16 bg-[#11221A]/95 backdrop-blur-md border-b border-[#234735] px-3 sm:px-6 flex items-center justify-between gap-3 select-none">
      {/* Brand & Left Navigation */}
      <div className="flex items-center gap-4 sm:gap-6">
        <button
          onClick={() => navigateTo('/')}
          className="flex items-center gap-2.5 text-left group transition-transform active:scale-95"
          aria-label="Syncora Home"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#34D399] to-[#193225] flex items-center justify-center shadow-lg shadow-[#34D399]/20 group-hover:shadow-[#34D399]/40 transition-all">
            <Radio className="w-5 h-5 text-[#09140F] animate-pulse" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg tracking-tight text-white font-sans">
                SYNCORA
              </span>
              <span className="px-1.5 py-0.2 text-[9px] font-bold tracking-wider uppercase rounded bg-[#34D399]/15 text-[#34D399] border border-[#34D399]/30">
                LIVE
              </span>
            </div>
            <span className="text-[10px] text-[#8E919C] tracking-wide -mt-0.5 hidden sm:block">
              Stream & Watch Together
            </span>
          </div>
        </button>

        {/* Quick Route Nav Pills (Desktop) */}
        <nav className="hidden md:flex items-center gap-1 ml-2">
          <button
            onClick={() => navigateTo('/')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              currentRoute === '/'
                ? 'bg-[#193225] text-[#D1FAE5] border border-[#234735]'
                : 'text-[#8E919C] hover:text-[#D1FAE5] hover:bg-[#193225]/50'
            }`}
          >
            Discover
          </button>
          <button
            onClick={() => navigateTo('/live')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              currentRoute === '/live'
                ? 'bg-[#193225] text-[#D1FAE5] border border-[#234735]'
                : 'text-[#8E919C] hover:text-[#D1FAE5] hover:bg-[#193225]/50'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444] animate-ping" />
            Live Now
          </button>
          <button
            onClick={() => navigateTo('/explore')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              currentRoute === '/explore'
                ? 'bg-[#193225] text-[#D1FAE5] border border-[#234735]'
                : 'text-[#8E919C] hover:text-[#D1FAE5] hover:bg-[#193225]/50'
            }`}
          >
            Explore
          </button>
        </nav>
      </div>

      {/* Global Search Bar */}
      <div className="flex-1 max-w-md mx-2 sm:mx-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E919C]" />
          <input
            type="text"
            placeholder="Search streams, videos, channels..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full bg-[#09140F] border border-[#234735] rounded-full pl-9 pr-9 py-2 text-xs sm:text-sm text-[#D1FAE5] placeholder-[#5E606A] focus:outline-none focus:border-[#34D399] focus:ring-1 focus:ring-[#34D399] transition-all"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                setSearchQuery('');
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8E919C] hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </form>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Create Dropdown */}
        <div className="relative" ref={createRef}>
          <button
            onClick={() => setIsCreateMenuOpen((prev) => !prev)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#34D399] text-[#09140F] font-semibold text-xs hover:bg-[#2BBF88] active:scale-95 transition-all shadow-md shadow-[#34D399]/10"
            aria-label="Create room or watch party"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Create</span>
          </button>

          {isCreateMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-[#193225] border border-[#234735] rounded-xl shadow-2xl p-1.5 z-50 flex flex-col gap-1 text-xs font-medium">
              <button
                onClick={() => {
                  setIsCreateMenuOpen(false);
                  setIsCreateRoomModalOpen(true);
                }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-[#D1FAE5] hover:bg-[#234735] transition-colors"
              >
                <div className="w-7 h-7 rounded-md bg-[#34D399]/15 text-[#34D399] flex items-center justify-center">
                  <Tv className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold">Start Watch Party</div>
                  <div className="text-[10px] text-[#8E919C]">Synchronized screening room</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsCreateMenuOpen(false);
                  navigateTo('/studio');
                }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-[#D1FAE5] hover:bg-[#234735] transition-colors"
              >
                <div className="w-7 h-7 rounded-md bg-[#34D399]/15 text-[#34D399] flex items-center justify-center">
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold">Creator Broadcasting</div>
                  <div className="text-[10px] text-[#8E919C]">RTMP/HLS ingest setup</div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Notifications Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotificationsOpen((prev) => !prev)}
            className="relative p-2 rounded-lg bg-[#193225] border border-[#234735] text-[#8E919C] hover:text-[#D1FAE5] hover:bg-[#224433] transition-colors"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#34D399] ring-2 ring-[#11221A]" />
            )}
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-[#193225] border border-[#234735] rounded-xl shadow-2xl p-3 z-50 flex flex-col gap-2">
              <div className="flex items-center justify-between pb-2 border-b border-[#234735]">
                <span className="font-semibold text-xs text-white">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkNotificationsRead}
                    className="text-[10px] text-[#34D399] hover:underline flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" /> Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-64 overflow-y-auto flex flex-col gap-1.5 divide-y divide-[#234735]/50">
                {notifications.length === 0 ? (
                  <div className="py-6 text-center text-xs text-[#8E919C]">
                    No notifications yet
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`pt-1.5 first:pt-0 text-xs flex flex-col gap-0.5 ${
                        !n.isRead ? 'text-[#D1FAE5]' : 'text-[#8E919C]'
                      }`}
                    >
                      <div className="font-medium text-white text-[11px]">{n.title}</div>
                      <div className="text-[11px] leading-relaxed">{n.message}</div>
                      <div className="text-[9px] text-[#5E606A]">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Account Menu / Sign In */}
        <div className="relative" ref={profileRef}>
          {currentUserAccount ? (
            <button
              onClick={() => setIsProfileOpen((prev) => !prev)}
              className="flex items-center gap-2 p-1.5 rounded-lg bg-[#193225] border border-[#234735] hover:border-[#34D399] transition-all"
              aria-label="User Profile Menu"
            >
              <div
                className="w-7 h-7 rounded-md flex items-center justify-center font-bold text-xs text-[#09140F]"
                style={{ backgroundColor: currentUserAccount.avatarColor || '#34D399' }}
              >
                {(currentUserAccount.displayName || currentUserAccount.username).charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-medium text-[#D1FAE5] hidden sm:inline max-w-[100px] truncate">
                {currentUserAccount.displayName || currentUserAccount.username}
              </span>
            </button>
          ) : (
            <button
              onClick={() => {
                setAuthModalMode('login');
                setIsAuthModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#193225] border border-[#234735] text-xs font-medium text-[#D1FAE5] hover:bg-[#234735] transition-colors"
            >
              <User className="w-3.5 h-3.5 text-[#8E919C]" />
              <span>Sign In</span>
            </button>
          )}

          {isProfileOpen && currentUserAccount && (
            <div className="absolute right-0 mt-2 w-52 bg-[#193225] border border-[#234735] rounded-xl shadow-2xl p-1.5 z-50 flex flex-col gap-1 text-xs">
              <div className="px-3 py-2 border-b border-[#234735]">
                <div className="font-semibold text-white truncate">
                  {currentUserAccount.displayName}
                </div>
                <div className="text-[10px] text-[#8E919C] font-mono">
                  @{currentUserAccount.username}
                </div>
              </div>

              <button
                onClick={() => {
                  setIsProfileOpen(false);
                  navigateTo('/saved');
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-left text-[#D1FAE5] hover:bg-[#234735] transition-colors"
              >
                <Bookmark className="w-3.5 h-3.5 text-[#34D399]" />
                <span>Saved Videos</span>
              </button>

              <button
                onClick={() => {
                  setIsProfileOpen(false);
                  navigateTo('/history');
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-left text-[#D1FAE5] hover:bg-[#234735] transition-colors"
              >
                <History className="w-3.5 h-3.5 text-[#34D399]" />
                <span>Watch History</span>
              </button>

              <button
                onClick={() => {
                  setIsProfileOpen(false);
                  navigateTo('/following');
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-left text-[#D1FAE5] hover:bg-[#234735] transition-colors"
              >
                <Users className="w-3.5 h-3.5 text-[#34D399]" />
                <span>Followed Channels</span>
              </button>

              <div className="border-t border-[#234735] my-0.5" />

              <button
                onClick={() => {
                  setIsProfileOpen(false);
                  logout();
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-left text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
