import React from 'react';

interface AmbientGlowProps {
  isPlaying?: boolean;
}

export const AmbientGlow: React.FC<AmbientGlowProps> = ({ isPlaying = false }) => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
      {/* Primary Radial Glow */}
      <div
        className={`absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] rounded-full blur-[140px] transition-all duration-1000 ${
          isPlaying
            ? 'bg-gradient-to-tr from-brand-primary/25 via-brand-highlight/20 to-cyan-500/15 scale-110 opacity-100'
            : 'bg-brand-primary/10 scale-95 opacity-60'
        }`}
      />

      {/* Secondary Ambient Corner Radials */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-brand-primary/10 rounded-full blur-[130px]" />
      <div className="absolute top-1/2 -right-32 w-96 h-96 bg-brand-highlight/10 rounded-full blur-[140px]" />
      <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-cyan-500/5 rounded-full blur-[150px]" />

      {/* Subtle Starry / Mesh Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)`,
          backgroundSize: '36px 36px',
        }}
      />
    </div>
  );
};
