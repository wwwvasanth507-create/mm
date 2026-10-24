import React, { useEffect, useRef, useState } from 'react';
import { audioDsp, AudioReactiveState } from '@/services/audioDspService';

interface AmbientAudioGlowProps {
  className?: string;
  intensity?: 'subtle' | 'full';
}

export const AmbientAudioGlow: React.FC<AmbientAudioGlowProps> = ({
  className = '',
  intensity = 'subtle',
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

      // Throttle to ~35fps for butter-smooth mobile performance and low battery impact
      if (now - lastUpdateRef.current >= 28) {
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

  // Scale and opacity adjustments based on intensity mode
  const baseOpacity = intensity === 'full' ? 0.55 : 0.35;
  const activeOpacity = isPlaying ? baseOpacity : 0.12;

  // Beat kick scale factor
  const beatScale = 1 + beat * 0.32;
  // Vocal swell scale factor
  const voiceScale = 1 + voice * 0.28;
  // Treble melody scale factor
  const musicScale = 1 + music * 0.25;

  return (
    <div
      className={`pointer-events-none overflow-hidden select-none transition-opacity duration-1000 ${className}`}
      style={{ opacity: activeOpacity }}
      aria-hidden="true"
    >
      {/* Dynamic Audio-Reactive Light Node 1: Beat / Sub-Bass Kick (Center-Bottom) */}
      <div
        className="absolute -bottom-[15%] left-[20%] w-[55vw] max-w-[700px] h-[55vw] max-h-[700px] rounded-full blur-[110px] sm:blur-[130px] transition-transform duration-200 ease-out will-change-transform"
        style={{
          backgroundColor: colors.primary,
          transform: `translate3d(0, 0, 0) scale(${beatScale})`,
        }}
      />

      {/* Dynamic Audio-Reactive Light Node 2: Voice / Mid Harmonics (Left-Center) */}
      <div
        className="absolute top-[25%] -left-[10%] w-[50vw] max-w-[650px] h-[50vw] max-h-[650px] rounded-full blur-[110px] sm:blur-[140px] transition-transform duration-300 ease-out will-change-transform"
        style={{
          backgroundColor: colors.secondary,
          transform: `translate3d(0, 0, 0) scale(${voiceScale})`,
        }}
      />

      {/* Dynamic Audio-Reactive Light Node 3: Music / Instruments & Treble (Top-Right) */}
      <div
        className="absolute -top-[10%] -right-[10%] w-[52vw] max-w-[680px] h-[52vw] max-h-[680px] rounded-full blur-[110px] sm:blur-[135px] transition-transform duration-250 ease-out will-change-transform"
        style={{
          backgroundColor: colors.accent,
          transform: `translate3d(0, 0, 0) scale(${musicScale})`,
        }}
      />

      {/* Atmospheric Base Color Wash */}
      <div
        className="absolute inset-0 transition-colors duration-700"
        style={{
          background: `radial-gradient(ellipse at center, ${colors.primary} 0%, transparent 70%)`,
          opacity: 0.2,
        }}
      />

      {/* Contrast & Readability Shield: Ensures text and UI elements remain 100% visible and undisturbed */}
      <div className="absolute inset-0 bg-[#0a0a0c]/45 backdrop-brightness-95 pointer-events-none" />
    </div>
  );
};
