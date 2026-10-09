import React from 'react';

interface AmbientGlowProps {
  isPlaying?: boolean;
}

export const AmbientGlow: React.FC<AmbientGlowProps> = ({ isPlaying = false }) => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10 select-none" aria-hidden="true">
      {/* Subtle screening room projection cone at top */}
      <div
        className={`absolute top-0 left-1/2 -translate-x-1/2 w-[850px] h-[340px] rounded-full blur-[120px] transition-opacity duration-1000 ${
          isPlaying ? 'opacity-15 bg-[#34D399]' : 'opacity-5 bg-[#34D399]'
        }`}
      />

      {/* Deep cinema vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#09140F]/40 via-[#09140F]/90 to-[#09140F]" />

      {/* Crisp technical drafting grid */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `linear-gradient(to right, #D1FAE5 1px, transparent 1px), linear-gradient(to bottom, #D1FAE5 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />
    </div>
  );
};
