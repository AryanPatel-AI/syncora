import React from 'react';
import { useWatchParty } from '../../context/WatchPartyContext';
import { Heart } from 'lucide-react';

export const FloatingReaction: React.FC = () => {
  const { reactions } = useWatchParty();

  // If there are no active reactions, render nothing
  if (reactions.length === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="absolute bottom-6 right-6 z-30 pointer-events-none select-none flex flex-col items-end gap-1.5 overflow-visible"
    >
      {reactions.map((reaction, index) => {
        const isHeart = reaction.emoji === '❤️' || reaction.type === 'like';

        return (
          <div
            key={reaction.id}
            className="animate-float-up flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#16171B]/90 border border-[#282A33] shadow-cinema backdrop-blur-xs text-xs font-medium text-[#F2F0E9]"
            style={{
              animationDelay: `${index * 60}ms`,
            }}
          >
            {isHeart ? (
              <Heart className="w-3.5 h-3.5 fill-[#D6F279] text-[#D6F279]" />
            ) : (
              <span className="text-sm leading-none">{reaction.emoji}</span>
            )}
            <span className="text-[11px] text-[#8E919C] font-mono max-w-[90px] truncate">
              {reaction.senderName}
            </span>
          </div>
        );
      })}
    </div>
  );
};
