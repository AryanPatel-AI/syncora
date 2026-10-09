import React from 'react';
import { ReactionPayload } from '../types';

interface ReactionsOverlayProps {
  reactions: ReactionPayload[];
}

export const ReactionsOverlay: React.FC<ReactionsOverlayProps> = ({ reactions }) => {
  if (reactions.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
      {reactions.map((r, index) => {
        // Vary the horizontal position across 20% to 80%
        const leftPercent = 25 + ((index * 29 + r.timestamp) % 55);
        return (
          <div
            key={r.id}
            className="absolute bottom-10 flex flex-col items-center animate-float drop-shadow-lg"
            style={{ left: `${leftPercent}%` }}
          >
            <span className="text-4xl filter drop-shadow-md select-none">{r.emoji}</span>
            <span className="text-[10px] font-semibold text-white/80 bg-brand-dark/70 px-1.5 py-0.5 rounded-full mt-0.5 border border-white/10 select-none">
              {r.senderName}
            </span>
          </div>
        );
      })}
    </div>
  );
};
