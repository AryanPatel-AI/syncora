import React, { useState } from 'react';
import { useWatchParty } from '../../context/WatchPartyContext';
import { api } from '../../services/api';
import { X, Lock, User, Sparkles, Check } from 'lucide-react';

const AVATAR_OPTIONS = [
  '#34D399',
  '#2BBF88',
  '#34D399',
  '#34D399',
  '#34D399',
  '#F59E0B',
  '#34D399',
  '#34D399',
];

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    authModalMode,
    setAuthModalMode,
    refreshAuth,
    showToast,
  } = useWatchParty();

  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  const [avatarColor, setAvatarColor] = useState<string>(AVATAR_OPTIONS[0]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (authModalMode === 'register') {
        if (!displayName.trim()) {
          throw new Error('Please enter a display name.');
        }
        await api.register({
          username: username.trim(),
          password,
          displayName: displayName.trim(),
          avatarColor,
        });
        showToast('Welcome to Syncora! Account registered.', 'success');
      } else {
        await api.login({
          username: username.trim(),
          password,
        });
        showToast('Signed in successfully!', 'success');
      }

      await refreshAuth();
      setIsAuthModalOpen(false);
      setUsername('');
      setPassword('');
      setDisplayName('');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm rounded-2xl bg-[#11221A] border border-[#234735] shadow-2xl p-6 text-[#D1FAE5] flex flex-col gap-4">
        {/* Close Button */}
        <button
          onClick={() => setIsAuthModalOpen(false)}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-[#8E919C] hover:text-white hover:bg-[#234735] transition-colors"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex flex-col gap-1 text-center">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#34D399] to-[#193225] flex items-center justify-center mx-auto shadow-lg shadow-[#34D399]/20">
            <Sparkles className="w-5 h-5 text-[#09140F]" />
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight mt-1">
            {authModalMode === 'login' ? 'Sign in to Syncora' : 'Create an Account'}
          </h2>
          <p className="text-xs text-[#8E919C]">
            {authModalMode === 'login'
              ? 'Save favorite videos, follow channels, and host watch parties.'
              : 'Join the next generation real-time streaming platform.'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1 rounded-xl bg-[#09140F] border border-[#234735]">
          <button
            type="button"
            onClick={() => {
              setAuthModalMode('login');
              setError(null);
            }}
            className={`py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              authModalMode === 'login'
                ? 'bg-[#193225] text-white shadow-sm'
                : 'text-[#8E919C] hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthModalMode('register');
              setError(null);
            }}
            className={`py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              authModalMode === 'register'
                ? 'bg-[#193225] text-white shadow-sm'
                : 'text-[#8E919C] hover:text-white'
            }`}
          >
            Register
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="px-3 py-2 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] text-xs font-medium">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {authModalMode === 'register' && (
            <div>
              <label className="block text-[11px] font-semibold text-[#8E919C] mb-1">
                Display Name
              </label>
              <input
                type="text"
                placeholder="e.g. Alex River"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="w-full bg-[#09140F] border border-[#234735] rounded-xl px-3 py-2 text-xs text-[#D1FAE5] focus:outline-none focus:border-[#34D399]"
              />
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-[#8E919C] mb-1">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#5E606A]" />
              <input
                type="text"
                placeholder="alphanumeric, no spaces"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                required
                className="w-full bg-[#09140F] border border-[#234735] rounded-xl pl-9 pr-3 py-2 text-xs text-[#D1FAE5] focus:outline-none focus:border-[#34D399]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#8E919C] mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#5E606A]" />
              <input
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full bg-[#09140F] border border-[#234735] rounded-xl pl-9 pr-3 py-2 text-xs text-[#D1FAE5] focus:outline-none focus:border-[#34D399]"
              />
            </div>
          </div>

          {authModalMode === 'register' && (
            <div>
              <label className="block text-[11px] font-semibold text-[#8E919C] mb-1.5">
                Avatar Theme Color
              </label>
              <div className="flex items-center gap-1.5">
                {AVATAR_OPTIONS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setAvatarColor(c)}
                    className={`w-6 h-6 rounded-full transition-transform flex items-center justify-center ${
                      avatarColor === c ? 'scale-110 ring-2 ring-white' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: c }}
                  >
                    {avatarColor === c && <Check className="w-3 h-3 text-white" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-[#34D399] hover:bg-[#2BBF88] text-[#09140F] font-bold text-xs active:scale-95 disabled:opacity-50 transition-all shadow-md shadow-[#34D399]/20 mt-1"
          >
            {loading ? 'Please wait...' : authModalMode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
};
