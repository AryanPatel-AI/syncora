import React from 'react';
import { ReactionPayload } from '../../types';

interface ReactionsOverlayProps {
  reactions: ReactionPayload[];
}

export const ReactionsOverlay: React.FC<ReactionsOverlayProps> = ({ reactions }) => {
  if (reactions.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-30">
      {reactions.map((r, index) => {
        // Pseudo-random left coordinate distributed across the screen width
        const leftPercent = 20 + ((index * 37 + (r.timestamp % 100)) % 60);

        return (
          <div
            key={r.id}
            className="absolute bottom-12 flex flex-col items-center animate-float drop-shadow-2xl pointer-events-none"
            style={{ left: `${leftPercent}%` }}
          >
            <span className="text-5xl filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] select-none transform hover:scale-125 transition-transform">
              {r.emoji}
            </span>
            <span className="text-[10px] font-black tracking-wide text-white bg-brand-dark/80 px-2 py-0.5 rounded-full mt-1 border border-brand-primary/40 shadow-glow-sm select-none backdrop-blur-md">
              {r.senderName}
            </span>
          </div>
        );
      })}
    </div>
  );
};
