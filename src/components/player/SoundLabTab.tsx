import React, { useEffect, useRef } from 'react';
import {
  Zap,
  Sliders,
  RotateCcw,
  Sparkles,
  Headphones,
  Radio,
  Mic2,
  Flame,
  Music,
} from 'lucide-react';
import { useAudio } from '@/context/AudioContext';
import { AUDIO_PRESETS } from '@/config/audio';
import { AudioPresetId, EqualizerSettings } from '@/types/music';

const PRESET_ICONS: Record<AudioPresetId, React.ReactNode> = {
  'dolby-atmos': <Zap className="w-4 h-4 text-cyan-400" />,
  'apple-lossless': <Sparkles className="w-4 h-4 text-amber-400" />,
  'bass-boost': <Flame className="w-4 h-4 text-rose-400" />,
  'vocal-pure': <Mic2 className="w-4 h-4 text-emerald-400" />,
  'concert-hall': <Radio className="w-4 h-4 text-purple-400" />,
  'flat': <Music className="w-4 h-4 text-gray-400" />,
  'custom': <Sliders className="w-4 h-4 text-cyan-400" />,
};

export const SoundLabTab: React.FC = () => {
  const {
    isDolbyEnabled,
    toggleDolby,
    audioPreset,
    setAudioPreset,
    eqSettings,
    setEqBand,
    resetEq,
    getFrequencyData,
    isPlaying,
  } = useAudio();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Live Spectrum Visualizer loop
  useEffect(() => {
    let animId: number;

    const render = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        const data = getFrequencyData();

        if (ctx && data) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          const barWidth = (canvas.width / 32) - 1.5;
          let x = 0;

          for (let i = 0; i < 32; i++) {
            // Pick frequency bin (logarithmic spread)
            const binIdx = Math.floor(Math.pow(i / 32, 1.4) * (data.length - 1));
            const val = isPlaying ? data[binIdx] || 0 : 4;
            const barHeight = Math.max(3, (val / 255) * canvas.height * 0.9);

            // Apple Music gradient: Cyan to Purple to Coral
            const grad = ctx.createLinearGradient(0, canvas.height, 0, 0);
            grad.addColorStop(0, '#06b6d4');
            grad.addColorStop(0.5, '#a855f7');
            grad.addColorStop(1, '#fa2d48');

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.roundRect(x, canvas.height - barHeight, barWidth, barHeight, [2, 2, 0, 0]);
            ctx.fill();

            x += barWidth + 1.5;
          }
        }
      }
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [getFrequencyData, isPlaying]);

  const bands: { key: keyof EqualizerSettings; label: string; freq: string; min: number; max: number; step: number; unit: string }[] = [
    { key: 'subBass', label: 'Sub-Bass', freq: '60 Hz', min: -10, max: 12, step: 0.5, unit: 'dB' },
    { key: 'bassPunch', label: 'Bass Punch', freq: '150 Hz', min: -10, max: 10, step: 0.5, unit: 'dB' },
    { key: 'mid', label: 'Midrange', freq: '1 kHz', min: -8, max: 8, step: 0.5, unit: 'dB' },
    { key: 'vocal', label: 'Vocal Clarity', freq: '3.2 kHz', min: -6, max: 10, step: 0.5, unit: 'dB' },
    { key: 'treble', label: 'Treble & Air', freq: '10 kHz', min: -8, max: 10, step: 0.5, unit: 'dB' },
    { key: 'spatialWidth', label: '3D Spatial Width', freq: 'Dolby Haas', min: 0, max: 1, step: 0.05, unit: '%' },
  ];

  return (
    <div className="w-full max-w-2xl h-full flex flex-col overflow-y-auto px-2 py-4 space-y-6">
      {/* Top Dolby Master Header */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-purple-950/40 via-blue-950/40 to-black/60 border border-blue-500/20 backdrop-blur-xl flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
            isDolbyEnabled
              ? 'bg-gradient-to-tr from-cyan-500 to-purple-600 text-white shadow-[0_0_24px_rgba(6,182,212,0.45)]'
              : 'bg-white/10 text-gray-400'
          }`}>
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">Dolby Atmos Spatial Audio</h3>
              {isDolbyEnabled && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 animate-pulse">
                  Active
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Apple Music 3D Room Virtualizer & Studio Mastering Limiter
            </p>
          </div>
        </div>

        {/* Master Switch */}
        <button
          onClick={toggleDolby}
          className={`relative inline-flex h-7 w-13 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            isDolbyEnabled ? 'bg-gradient-to-r from-cyan-500 to-purple-600' : 'bg-gray-700'
          }`}
          title="Toggle Dolby Atmos Spatial Audio"
        >
          <span
            className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
              isDolbyEnabled ? 'translate-x-6' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Live Audio Spectrum Canvas */}
      <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-col items-center">
        <div className="w-full flex items-center justify-between text-[11px] font-mono text-gray-400 mb-2 px-1">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            Live 24-bit / 96kHz DSP Spectrum
          </span>
          <span>{AUDIO_PRESETS[audioPreset]?.name || 'Custom EQ'}</span>
        </div>
        <canvas
          ref={canvasRef}
          width={400}
          height={64}
          className="w-full h-16 rounded-xl bg-black/50"
        />
      </div>

      {/* Audio Preset Profile Selector */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
            <Headphones className="w-3.5 h-3.5 text-cyan-400" />
            Audio Mastering Profiles
          </h4>
          <button
            onClick={resetEq}
            className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {(Object.keys(AUDIO_PRESETS) as AudioPresetId[]).map((pid) => {
            if (pid === 'custom') return null;
            const p = AUDIO_PRESETS[pid];
            const isSelected = audioPreset === pid;

            return (
              <button
                key={pid}
                onClick={() => setAudioPreset(pid)}
                className={`p-3 rounded-2xl text-left border transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-gradient-to-br from-white/15 to-white/5 border-white/30 text-white shadow-[0_0_20px_rgba(255,255,255,0.15)] scale-[1.02]'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-gray-400 hover:text-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="p-1.5 rounded-lg bg-black/40 border border-white/10">
                    {PRESET_ICONS[pid]}
                  </div>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)] shadow-[0_0_8px_var(--accent-primary)]" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold truncate text-white">{p.name}</p>
                  <p className="text-[10px] text-gray-400 line-clamp-2 mt-0.5 leading-snug">
                    {p.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive 5-Band Parametric EQ Sliders */}
      <div className="p-5 rounded-3xl bg-white/5 border border-white/10 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-purple-400" />
            Acoustic Studio Equalizer
          </h4>
          <span className="text-[11px] font-mono text-cyan-400 font-semibold">
            {audioPreset === 'custom' ? 'Custom Tuning' : 'Profile Active'}
          </span>
        </div>

        <div className="space-y-4 pt-1">
          {bands.map((band) => {
            const val = eqSettings[band.key];
            const displayVal =
              band.unit === '%'
                ? `${Math.round(val * 100)}%`
                : `${val > 0 ? '+' : ''}${val.toFixed(1)} ${band.unit}`;

            return (
              <div key={band.key} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-medium">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-200 font-semibold">{band.label}</span>
                    <span className="text-[10px] font-mono text-gray-500">({band.freq})</span>
                  </div>
                  <span className="font-mono text-xs font-bold text-cyan-300">{displayVal}</span>
                </div>
                <input
                  type="range"
                  min={band.min}
                  max={band.max}
                  step={band.step}
                  value={val}
                  onChange={(e) => setEqBand(band.key, parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-400 hover:accent-cyan-300 transition-colors"
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
