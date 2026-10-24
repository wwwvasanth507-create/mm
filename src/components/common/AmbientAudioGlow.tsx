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
  const auroraRef = useRef<HTMLDivElement>(null);
  const shockwaveRef = useRef<HTMLDivElement>(null);
  const beatRef = useRef<HTMLDivElement>(null);
  const voiceRef = useRef<HTMLDivElement>(null);
  const musicRef = useRef<HTMLDivElement>(null);
  const warmRef = useRef<HTMLDivElement>(null);
  const coreRef = useRef<HTMLDivElement>(null);
  const strobeRef = useRef<HTMLDivElement>(null);
  const washRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);

  const animFrameRef = useRef<number | null>(null);
  const rotationRef = useRef<number>(0);

  useEffect(() => {
    let active = true;

    const tick = () => {
      if (!active) return;

      const state = audioDsp.getAudioReactiveState();
      const { beat, voice, music, energy, colors, isPlaying } = state;

      rotationRef.current = (rotationRef.current + 0.15 + energy * 0.25) % 360;
      const rot = rotationRef.current;

      // 1. Dynamic Master Opacity: Dims down to 0.22 on quiet valleys, bursts to 1.0 on max beats
      if (containerRef.current) {
        if (!isPlaying) {
          containerRef.current.style.opacity = '0.12';
        } else {
          const maxMult = intensity === 'full' ? 1.0 : 0.75;
          const master = Math.min(1.0, (0.24 + beat * 0.56 + voice * 0.20) * maxMult);
          containerRef.current.style.opacity = master.toFixed(3);
        }
      }

      // 2. Swirling Aurora Liquid Mesh Gradient (Continuous organic color movement)
      if (auroraRef.current) {
        auroraRef.current.style.transform = `rotate(${rot.toFixed(1)}deg) scale(${1.15 + beat * 0.25})`;
        auroraRef.current.style.opacity = isPlaying ? (0.35 + beat * 0.45).toFixed(3) : '0.10';
      }

      // 3. Acoustic Bass Shockwave Ripple Ring (Centered directly behind album art)
      if (shockwaveRef.current) {
        if (isPlaying && beat > 0.40) {
          const waveScale = 1.0 + (beat - 0.40) * 0.75;
          const waveOpacity = Math.pow((beat - 0.40) / 0.60, 1.4) * 0.65;
          shockwaveRef.current.style.transform = `translate3d(-50%, -50%, 0) scale(${waveScale.toFixed(3)})`;
          shockwaveRef.current.style.opacity = waveOpacity.toFixed(3);
          shockwaveRef.current.style.borderColor = colors.primary;
          shockwaveRef.current.style.boxShadow = `0 0 40px ${colors.primary}, inset 0 0 25px ${colors.secondary}`;
        } else {
          shockwaveRef.current.style.opacity = '0';
        }
      }

      // 4. Node 1: Beat / Sub-Bass & Kick (Center-Bottom - Ruby Red / Neon Coral / Pink)
      if (beatRef.current) {
        const scale = (0.82 + beat * 0.78).toFixed(3);
        const opacity = (0.18 + beat * 0.82).toFixed(3);
        const brightness = (1 + beat * 0.85).toFixed(2);
        const glow = Math.round(beat * 50);
        beatRef.current.style.transform = `translate3d(0, 0, 0) scale(${scale})`;
        beatRef.current.style.opacity = opacity;
        beatRef.current.style.backgroundColor = colors.primary;
        beatRef.current.style.filter = `brightness(${brightness}) drop-shadow(0 0 ${glow}px ${colors.primary})`;
      }

      // 5. Node 2: Voice / Mid Vocals (Top-Left - Electric Violet / Orchid / Magenta)
      if (voiceRef.current) {
        const scale = (0.84 + voice * 0.65).toFixed(3);
        const opacity = (0.18 + voice * 0.82).toFixed(3);
        const brightness = (1 + voice * 0.75).toFixed(2);
        voiceRef.current.style.transform = `translate3d(0, 0, 0) scale(${scale})`;
        voiceRef.current.style.opacity = opacity;
        voiceRef.current.style.backgroundColor = colors.secondary;
        voiceRef.current.style.filter = `brightness(${brightness})`;
      }

      // 6. Node 3: Music / Treble & Shimmering Hi-Hats (Top-Right - Shimmering Cyan / Teal / Aqua)
      if (musicRef.current) {
        const scale = (0.86 + music * 0.60).toFixed(3);
        const opacity = (0.16 + music * 0.84).toFixed(3);
        const brightness = (1 + music * 0.95).toFixed(2);
        musicRef.current.style.transform = `translate3d(0, 0, 0) scale(${scale})`;
        musicRef.current.style.opacity = opacity;
        musicRef.current.style.backgroundColor = colors.accent;
        musicRef.current.style.filter = `brightness(${brightness})`;
      }

      // 7. Node 4: Warm Golden Harmonic Sunlight (Bottom-Right - Warm Amber / Gold)
      if (warmRef.current) {
        const warmScale = (0.85 + (beat * 0.4 + music * 0.6) * 0.50).toFixed(3);
        const warmOpacity = (0.12 + beat * 0.70).toFixed(3);
        warmRef.current.style.transform = `translate3d(0, 0, 0) scale(${warmScale})`;
        warmRef.current.style.opacity = warmOpacity;
      }

      // 8. Node 5: Aura Core behind artwork (Directly centered halo)
      if (coreRef.current) {
        const coreEnergy = beat * 0.6 + voice * 0.4;
        const scale = (0.80 + coreEnergy * 0.65).toFixed(3);
        const opacity = (0.15 + coreEnergy * 0.85).toFixed(3);
        coreRef.current.style.transform = `translate3d(-50%, -50%, 0) scale(${scale})`;
        coreRef.current.style.opacity = opacity;
        coreRef.current.style.backgroundColor = colors.ambient;
      }

      // 9. Strobe / Transient Blink Layer: Instantly flashes on sharp drum beats and snare hits
      if (strobeRef.current) {
        if (isPlaying && beat > 0.60) {
          const flashPower = Math.pow((beat - 0.60) / 0.40, 1.6) * 0.85;
          strobeRef.current.style.opacity = flashPower.toFixed(3);
          strobeRef.current.style.background = `radial-gradient(circle at 50% 45%, ${colors.primary} 0%, transparent 70%)`;
        } else {
          strobeRef.current.style.opacity = '0';
        }
      }

      // 10. Atmospheric Luminous Base Wash
      if (washRef.current) {
        const washOpacity = (0.14 + beat * 0.36).toFixed(3);
        washRef.current.style.opacity = washOpacity;
        washRef.current.style.background = `radial-gradient(ellipse at 50% 40%, ${colors.primary} 0%, ${colors.secondary} 45%, transparent 75%)`;
      }

      // 11. Floating Luminescent Ambient Stardust Particles
      if (particlesRef.current) {
        particlesRef.current.style.opacity = isPlaying ? (0.35 + beat * 0.65).toFixed(3) : '0.10';
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
      {/* Dynamic Swirling Aurora Mesh Gradient Background */}
      <div
        ref={auroraRef}
        className="absolute -inset-[30%] opacity-40 mix-blend-screen blur-[90px] will-change-transform pointer-events-none transition-opacity duration-300"
        style={{
          background: `conic-gradient(from 180deg at 50% 50%, #fa2d48 0deg, #a855f7 90deg, #06b6d4 180deg, #f59e0b 270deg, #fa2d48 360deg)`,
        }}
      />

      {/* Acoustic Bass Shockwave Ripple Ring (Centered directly behind album art) */}
      <div
        ref={shockwaveRef}
        className="absolute top-[35%] left-[50%] w-[68vw] max-w-[340px] sm:max-w-[420px] aspect-square rounded-full border-2 border-white/40 pointer-events-none transition-all duration-75 mix-blend-screen will-change-transform"
        style={{ opacity: 0 }}
      />

      {/* Node 1: Beat / Sub-Bass Kick (Center-Bottom - Ruby Red / Coral) */}
      <div
        ref={beatRef}
        className="absolute -bottom-[15%] left-[10%] w-[75vw] max-w-[880px] h-[75vw] max-h-[880px] rounded-full blur-[65px] sm:blur-[90px] will-change-transform mix-blend-screen transition-transform duration-75 ease-out"
      />

      {/* Node 2: Voice / Mid Vocals (Top-Left - Electric Violet / Purple) */}
      <div
        ref={voiceRef}
        className="absolute top-[5%] -left-[15%] w-[68vw] max-w-[780px] h-[68vw] max-h-[780px] rounded-full blur-[60px] sm:blur-[85px] will-change-transform mix-blend-screen transition-transform duration-100 ease-out"
      />

      {/* Node 3: Music / Treble & Melodies (Top-Right - Shimmering Cyan / Teal / Aqua) */}
      <div
        ref={musicRef}
        className="absolute -top-[12%] -right-[12%] w-[68vw] max-w-[800px] h-[68vw] max-h-[800px] rounded-full blur-[60px] sm:blur-[85px] will-change-transform mix-blend-screen transition-transform duration-75 ease-out"
      />

      {/* Node 4: Golden Harmonic Sunlight (Bottom-Right - Warm Amber / Sunburst) */}
      <div
        ref={warmRef}
        className="absolute bottom-[5%] -right-[10%] w-[60vw] max-w-[700px] h-[60vw] max-h-[700px] rounded-full blur-[70px] sm:blur-[95px] will-change-transform mix-blend-screen transition-transform duration-120 ease-out bg-[#f59e0b]/50"
      />

      {/* Node 5: Aura Core directly behind album artwork (Warm Radiant Center) */}
      <div
        ref={coreRef}
        className="absolute top-[35%] left-[50%] w-[56vw] max-w-[580px] h-[56vw] max-h-[580px] rounded-full blur-[55px] sm:blur-[80px] will-change-transform mix-blend-screen transition-transform duration-120 ease-out"
      />

      {/* High-Impact Transient Strobe / Blink Layer (Sharp rhythm hits) */}
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

      {/* Floating Luminescent Ambient Stardust Particles */}
      <div
        ref={particlesRef}
        className="absolute inset-0 pointer-events-none overflow-hidden transition-opacity duration-500"
        style={{ opacity: 0.3 }}
      >
        <div className="absolute top-[20%] left-[25%] w-1.5 h-1.5 rounded-full bg-white/70 blur-[0.5px] animate-pulse" />
        <div className="absolute top-[45%] left-[15%] w-2 h-2 rounded-full bg-cyan-300/80 blur-[1px] animate-ping" style={{ animationDuration: '3s' }} />
        <div className="absolute top-[30%] right-[22%] w-1.5 h-1.5 rounded-full bg-purple-300/80 blur-[0.5px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-[65%] right-[28%] w-2.5 h-2.5 rounded-full bg-rose-400/80 blur-[1px] animate-pulse" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-[75%] left-[35%] w-1.5 h-1.5 rounded-full bg-amber-300/80 blur-[0.5px] animate-pulse" style={{ animationDelay: '0.5s' }} />
        <div className="absolute top-[15%] right-[40%] w-1 h-1 rounded-full bg-white/60 blur-[0.5px]" />
      </div>
    </div>
  );
};
