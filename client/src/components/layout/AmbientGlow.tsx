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
          isPlaying ? 'opacity-15 bg-[#D6F279]' : 'opacity-5 bg-[#D6F279]'
        }`}
      />

      {/* Deep cinema vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#101114]/40 via-[#101114]/90 to-[#101114]" />

      {/* Crisp technical drafting grid */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `linear-gradient(to right, #F2F0E9 1px, transparent 1px), linear-gradient(to bottom, #F2F0E9 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />
    </div>
  );
};
