import React, { useEffect, useRef } from 'react';
import { audioDsp } from '@/services/audioDspService';

interface AmbientAudioGlowProps {
  className?: string;
  intensity?: 'subtle' | 'full';
}

export const AmbientAudioGlow: React.FC<AmbientAudioGlowProps> = ({
  className = '',
  intensity = 'full',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const beatRef = useRef<HTMLDivElement>(null);
  const voiceRef = useRef<HTMLDivElement>(null);
  const musicRef = useRef<HTMLDivElement>(null);
  const coreRef = useRef<HTMLDivElement>(null);
  const strobeRef = useRef<HTMLDivElement>(null);
  const washRef = useRef<HTMLDivElement>(null);

  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    let active = true;

    const tick = () => {
      if (!active) return;

      const state = audioDsp.getAudioReactiveState();
      const { beat, voice, music, colors, isPlaying } = state;

      // Dynamic Master Opacity: Dims to 0.22 on valleys, bursts to 1.0 on max beats
      if (containerRef.current) {
        if (!isPlaying) {
          containerRef.current.style.opacity = '0.12';
        } else {
          const maxMult = intensity === 'full' ? 1.0 : 0.75;
          const master = Math.min(1.0, (0.22 + beat * 0.58 + voice * 0.20) * maxMult);
          containerRef.current.style.opacity = master.toFixed(3);
        }
      }

      // Node 1: Beat / Sub-Bass & Snare Kick (Ruby/Crimson/Pink)
      if (beatRef.current) {
        const scale = (0.80 + beat * 0.75).toFixed(3);
        const opacity = (0.15 + beat * 0.85).toFixed(3);
        const brightness = (1 + beat * 0.85).toFixed(2);
        const glow = Math.round(beat * 45);
        beatRef.current.style.transform = `translate3d(0, 0, 0) scale(${scale})`;
        beatRef.current.style.opacity = opacity;
        beatRef.current.style.backgroundColor = colors.primary;
        beatRef.current.style.filter = `brightness(${brightness}) drop-shadow(0 0 ${glow}px ${colors.primary})`;
      }

      // Node 2: Voice / Mid Harmonics (Electric Violet/Purple)
      if (voiceRef.current) {
        const scale = (0.84 + voice * 0.60).toFixed(3);
        const opacity = (0.18 + voice * 0.82).toFixed(3);
        const brightness = (1 + voice * 0.70).toFixed(2);
        voiceRef.current.style.transform = `translate3d(0, 0, 0) scale(${scale})`;
        voiceRef.current.style.opacity = opacity;
        voiceRef.current.style.backgroundColor = colors.secondary;
        voiceRef.current.style.filter = `brightness(${brightness})`;
      }

      // Node 3: Music / Treble & Shimmering Hi-Hats (Cyan/Aqua/Amber)
      if (musicRef.current) {
        const scale = (0.88 + music * 0.55).toFixed(3);
        const opacity = (0.15 + music * 0.85).toFixed(3);
        const brightness = (1 + music * 0.90).toFixed(2);
        musicRef.current.style.transform = `translate3d(0, 0, 0) scale(${scale})`;
        musicRef.current.style.opacity = opacity;
        musicRef.current.style.backgroundColor = colors.accent;
        musicRef.current.style.filter = `brightness(${brightness})`;
      }

      // Node 4: Aura Core behind artwork
      if (coreRef.current) {
        const energy = beat * 0.6 + voice * 0.4;
        const scale = (0.80 + energy * 0.60).toFixed(3);
        const opacity = (0.12 + energy * 0.88).toFixed(3);
        coreRef.current.style.transform = `translate3d(-50%, -50%, 0) scale(${scale})`;
        coreRef.current.style.opacity = opacity;
        coreRef.current.style.backgroundColor = colors.ambient;
      }

      // Strobe / Transient Blink Layer: Instantly flashes on sharp drum beats and snare hits
      if (strobeRef.current) {
        if (isPlaying && beat > 0.62) {
          const flashPower = Math.pow((beat - 0.62) / 0.38, 1.8) * 0.85;
          strobeRef.current.style.opacity = flashPower.toFixed(3);
          strobeRef.current.style.background = `radial-gradient(circle at 50% 45%, ${colors.primary} 0%, transparent 68%)`;
        } else {
          strobeRef.current.style.opacity = '0';
        }
      }

      // Atmospheric Luminous Base Wash
      if (washRef.current) {
        const washOpacity = (0.12 + beat * 0.35).toFixed(3);
        washRef.current.style.opacity = washOpacity;
        washRef.current.style.background = `radial-gradient(ellipse at 50% 40%, ${colors.primary} 0%, ${colors.secondary} 45%, transparent 75%)`;
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
  }, [intensity]);

  return (
    <div
      ref={containerRef}
      className={`pointer-events-none overflow-hidden select-none transition-opacity duration-300 ${className}`}
      style={{ opacity: 0.2 }}
      aria-hidden="true"
    >
      {/* Node 1: Beat / Sub-Bass Kick (Center-Bottom - Ruby/Coral/Pink) */}
      <div
        ref={beatRef}
        className="absolute -bottom-[14%] left-[12%] w-[72vw] max-w-[850px] h-[72vw] max-h-[850px] rounded-full blur-[65px] sm:blur-[90px] will-change-transform mix-blend-screen transition-transform duration-75 ease-out"
      />

      {/* Node 2: Voice / Mid Vocals (Top-Left - Electric Violet/Purple) */}
      <div
        ref={voiceRef}
        className="absolute top-[6%] -left-[14%] w-[65vw] max-w-[760px] h-[65vw] max-h-[760px] rounded-full blur-[60px] sm:blur-[85px] will-change-transform mix-blend-screen transition-transform duration-100 ease-out"
      />

      {/* Node 3: Music / Treble & Melodies (Top-Right - Shimmering Cyan/Teal/Aqua) */}
      <div
        ref={musicRef}
        className="absolute -top-[12%] -right-[12%] w-[66vw] max-w-[780px] h-[66vw] max-h-[780px] rounded-full blur-[60px] sm:blur-[85px] will-change-transform mix-blend-screen transition-transform duration-75 ease-out"
      />

      {/* Node 4: Aura Center (Directly behind album artwork - Warm Radiant Core) */}
      <div
        ref={coreRef}
        className="absolute top-[35%] left-[50%] w-[54vw] max-w-[560px] h-[54vw] max-h-[560px] rounded-full blur-[55px] sm:blur-[80px] will-change-transform mix-blend-screen transition-transform duration-120 ease-out"
      />

      {/* High-Impact Transient Strobe / Blink Layer (Triggers on sharp rhythm hits) */}
      <div
        ref={strobeRef}
        className="absolute inset-0 pointer-events-none mix-blend-screen transition-opacity duration-75"
        style={{ opacity: 0 }}
      />

      {/* Base Atmospheric Color Wash */}
      <div
        ref={washRef}
        className="absolute inset-0 transition-opacity duration-150"
        style={{ opacity: 0.15 }}
      />
    </div>
  );
};
