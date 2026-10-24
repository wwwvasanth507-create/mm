import React, { useEffect, useRef, useState } from 'react';
import { audioDsp, AudioReactiveState } from '@/services/audioDspService';

interface AmbientAudioGlowProps {
  className?: string;
  intensity?: 'subtle' | 'full';
}

export const AmbientAudioGlow: React.FC<AmbientAudioGlowProps> = ({
  className = '',
  intensity = 'full',
}) => {
  const [reactive, setReactive] = useState<AudioReactiveState>(() =>
    audioDsp.getAudioReactiveState()
  );

  const animFrameRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    let active = true;

    const tick = (now: number) => {
      if (!active) return;

      // Throttle to ~40fps for silky-smooth animation and high responsiveness
      if (now - lastUpdateRef.current >= 24) {
        lastUpdateRef.current = now;
        setReactive(audioDsp.getAudioReactiveState());
      }

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      active = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  const { beat, voice, music, colors, isPlaying } = reactive;

  // Saturated, highly visible opacity levels
  const baseOpacity = intensity === 'full' ? 0.92 : 0.70;
  const activeOpacity = isPlaying ? baseOpacity : 0.28;

  // Audio-reactive scale multipliers
  const beatScale = 1 + beat * 0.42;
  const voiceScale = 1 + voice * 0.38;
  const musicScale = 1 + music * 0.35;
  const coreScale = 1 + (beat + voice) * 0.25;

  return (
    <div
      className={`pointer-events-none overflow-hidden select-none transition-opacity duration-700 ${className}`}
      style={{ opacity: activeOpacity }}
      aria-hidden="true"
    >
      {/* Dynamic Audio-Reactive Light Node 1: Beat / Sub-Bass Kick (Center-Bottom - Ruby/Coral/Magenta) */}
      <div
        className="absolute -bottom-[12%] left-[15%] w-[68vw] max-w-[820px] h-[68vw] max-h-[820px] rounded-full blur-[70px] sm:blur-[95px] transition-transform duration-150 ease-out will-change-transform mix-blend-screen"
        style={{
          backgroundColor: colors.primary,
          transform: `translate3d(0, 0, 0) scale(${beatScale})`,
        }}
      />

      {/* Dynamic Audio-Reactive Light Node 2: Voice / Mid Vocals (Top-Left - Electric Violet/Purple/Pink) */}
      <div
        className="absolute top-[8%] -left-[12%] w-[62vw] max-w-[740px] h-[62vw] max-h-[740px] rounded-full blur-[65px] sm:blur-[90px] transition-transform duration-200 ease-out will-change-transform mix-blend-screen"
        style={{
          backgroundColor: colors.secondary,
          transform: `translate3d(0, 0, 0) scale(${voiceScale})`,
        }}
      />

      {/* Dynamic Audio-Reactive Light Node 3: Music / Treble & Melodies (Top-Right - Shimmering Cyan/Teal/Aqua) */}
      <div
        className="absolute -top-[10%] -right-[10%] w-[64vw] max-w-[760px] h-[64vw] max-h-[760px] rounded-full blur-[65px] sm:blur-[90px] transition-transform duration-180 ease-out will-change-transform mix-blend-screen"
        style={{
          backgroundColor: colors.accent,
          transform: `translate3d(0, 0, 0) scale(${musicScale})`,
        }}
      />

      {/* Dynamic Audio-Reactive Light Node 4: Aura Center (Directly behind album artwork - Warm Radiant Core) */}
      <div
        className="absolute top-[35%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[52vw] max-w-[550px] h-[52vw] max-h-[550px] rounded-full blur-[60px] sm:blur-[85px] transition-transform duration-220 ease-out will-change-transform mix-blend-screen"
        style={{
          backgroundColor: colors.ambient,
          transform: `translate3d(-50%, -50%, 0) scale(${coreScale})`,
        }}
      />

      {/* Atmospheric Base Luminous Wash */}
      <div
        className="absolute inset-0 transition-colors duration-500"
        style={{
          background: `radial-gradient(ellipse at 50% 40%, ${colors.primary} 0%, ${colors.secondary} 40%, transparent 75%)`,
          opacity: 0.35,
        }}
      />
    </div>
  );
};
