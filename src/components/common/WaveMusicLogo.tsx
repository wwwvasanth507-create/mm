import React from 'react';

interface WaveMusicLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export const WaveMusicLogo: React.FC<WaveMusicLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
}) => {
  const iconDimensions = {
    sm: 'w-7 h-7 rounded-lg',
    md: 'w-9 h-9 rounded-xl',
    lg: 'w-12 h-12 rounded-2xl',
  }[size];

  const textSize = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
  }[size];

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Glowing Neon Crest Logo */}
      <div
        className={`relative ${iconDimensions} overflow-hidden shadow-[0_0_16px_var(--accent-glow)] flex items-center justify-center p-[1px] bg-gradient-to-tr from-[#FA2D48] via-[#A855F7] to-[#06B6D4] transition-transform duration-300 hover:scale-105`}
      >
        <img
          src="/logo.png"
          alt="WaveMusic"
          className="w-full h-full object-cover rounded-[inherit]"
          onError={(e) => {
            // Fallback to SVG if image not loaded
            const target = e.currentTarget;
            target.src = '/favicon.svg';
          }}
        />
      </div>

      {/* Styled Brand Typography */}
      {showText && (
        <div className="flex flex-col leading-none">
          <span className={`font-black tracking-tight text-white ${textSize}`}>
            Wave
            <span className="bg-gradient-to-r from-[var(--accent-primary)] via-[#C084FC] to-[#06B6D4] bg-clip-text text-transparent">
              Music
            </span>
          </span>
          <span className="text-[9px] font-mono tracking-widest uppercase text-cyan-400/90 mt-0.5 font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            24/7 Non-Stop Hi-Fi
          </span>
        </div>
      )}
    </div>
  );
};
