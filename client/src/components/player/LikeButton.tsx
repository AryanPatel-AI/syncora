import React, { useState, useRef } from 'react';
import { useWatchParty } from '../../context/WatchPartyContext';
import { Heart } from 'lucide-react';

interface LikeButtonProps {
  className?: string;
}

export const LikeButton: React.FC<LikeButtonProps> = ({ className = '' }) => {
  const { likeCount, sendLike, isConnected } = useWatchParty();
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [isCooldown, setIsCooldown] = useState<boolean>(false);
  const animationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLike = () => {
    if (!isConnected || isCooldown) return;

    // Trigger local animation
    setIsAnimating(true);
    setIsCooldown(true);

    if (animationTimerRef.current) {
      clearTimeout(animationTimerRef.current);
    }

    animationTimerRef.current = setTimeout(() => {
      setIsAnimating(false);
    }, 450);

    // 500ms client cooldown to prevent spam
    setTimeout(() => {
      setIsCooldown(false);
    }, 500);

    sendLike();
  };

  return (
    <button
      type="button"
      onClick={handleLike}
      disabled={!isConnected}
      aria-label={`Like this screening. Current total: ${likeCount} likes`}
      title={isCooldown ? 'Cooldown (500ms)' : 'Send a like to the room'}
      className={`group relative inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[34px] rounded-md border transition-all select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#34D399] ${
        isAnimating
          ? 'bg-[#34D399]/15 border-[#34D399] text-[#34D399]'
          : 'bg-[#11221A] hover:bg-[#193225] border-[#234735] hover:border-[#2A5540] text-[#8E919C] hover:text-[#D1FAE5]'
      } disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
    >
      <Heart
        className={`w-4 h-4 transition-transform ${
          isAnimating
            ? 'animate-heart-pulse fill-[#34D399] text-[#34D399]'
            : 'text-[#8E919C] group-hover:text-[#34D399] group-hover:scale-110'
        }`}
        aria-hidden="true"
      />

      <span
        className={`font-mono text-xs font-semibold tabular-nums transition-colors ${
          isAnimating ? 'text-[#34D399]' : 'text-[#D1FAE5]'
        }`}
        aria-live="polite"
      >
        {likeCount}
      </span>

      <span className="sr-only">Room Likes</span>
    </button>
  );
};
