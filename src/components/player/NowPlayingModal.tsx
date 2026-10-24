import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  Heart,
  ListMusic,
  Mic2,
  Sparkles,
  Zap,
  Smartphone,
} from 'lucide-react';
import { useAudio } from '@/context/AudioContext';
import { resolveArtworkUrl } from '@/services/musicService';
import { formatTime } from '@/utils/formatters';
import { SoundLabTab } from './SoundLabTab';
import { AmbientAudioGlow } from '@/components/common/AmbientAudioGlow';
import { PwaInstallModal } from '@/components/modals/PwaInstallModal';

interface NowPlayingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NowPlayingModal: React.FC<NowPlayingModalProps> = ({ isOpen, onClose }) => {
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    togglePlay,
    nextTrack,
    previousTrack,
    seek,
    volume,
    setVolume,
    isMuted,
    toggleMute,
    repeatMode,
    cycleRepeatMode,
    shuffle,
    toggleShuffle,
    isFavourite,
    toggleFavourite,
    queue,
    queueIndex,
    playTrack,
    isDolbyEnabled,
  } = useAudio();

  const [activeTab, setActiveTab] = useState<'visualizer' | 'lyrics' | 'queue' | 'soundlab'>('visualizer');
  const lyricsContainerRef = useRef<HTMLDivElement>(null);

  // Find active lyrics line
  const lyricsList = Array.isArray(currentTrack?.lyrics) ? currentTrack.lyrics : [];
  let currentLyricsIndex = -1;
  if (lyricsList.length > 0) {
    for (let i = 0; i < lyricsList.length; i++) {
      if (currentTime >= lyricsList[i].time) {
        currentLyricsIndex = i;
      } else {
        break;
      }
    }
  }

  // Auto-scroll lyrics into view smoothly
  useEffect(() => {
    if (isOpen && activeTab === 'lyrics' && currentLyricsIndex >= 0 && lyricsContainerRef.current) {
      const activeEl = lyricsContainerRef.current.children[currentLyricsIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentLyricsIndex, activeTab, isOpen]);

  // Escape key listener to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Early return ONLY after all React hooks have unconditionally executed
  if (!isOpen || !currentTrack) return null;

  const artwork = resolveArtworkUrl(currentTrack);
  const liked = isFavourite(currentTrack.id);
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed inset-0 z-[60] overflow-hidden bg-[#07070a] flex flex-col text-white animate-in fade-in duration-300">
      {/* 1. Underlying Soft Artwork Color Tint */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-25 z-0">
        <img
          src={artwork}
          alt=""
          className="w-full h-full object-cover blur-[90px] scale-125 saturate-150 transform transition-all duration-1000"
        />
      </div>

      {/* 2. Full-Screen Audio-Reactive Beat, Voice & Music Ambient Lighting (Vibrant & Colorful) */}
      <AmbientAudioGlow className="absolute inset-0 z-0" intensity="full" />

      {/* Mobile Top Drag Indicator Bar */}
      <div className="md:hidden pt-[calc(0.5rem+env(safe-area-inset-top,0px))] pb-1 flex justify-center z-20">
        <div className="w-10 h-1 rounded-full bg-white/25" />
      </div>

      {/* Top Header */}
      <header className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-2.5 sm:py-4 border-b border-white/10 backdrop-blur-md bg-black/20">
        <button
          onClick={onClose}
          className="p-1.5 sm:p-2 rounded-full hover:bg-white/10 transition-colors text-gray-300 hover:text-white"
          title="Minimize player"
        >
          <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        <div className="text-center min-w-0 px-2 flex-1">
          <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-widest text-gray-400 truncate">
            {currentTrack.album}
          </p>
          <div className="flex items-center justify-center gap-1.5 mt-0.5">
            {currentTrack.language && (
              <span className="text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white border border-white/15 font-mono">
                {currentTrack.language}
              </span>
            )}
            {currentTrack.genre && (
              <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-full bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 font-mono">
                {currentTrack.genre}
              </span>
            )}
          </div>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex items-center gap-1 bg-white/10 p-0.5 sm:p-1 rounded-xl backdrop-blur-md flex-shrink-0">
          <button
            onClick={() => setActiveTab('visualizer')}
            className={`p-1.5 sm:p-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
              activeTab === 'visualizer'
                ? 'bg-white/20 text-white shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
            title="Cover Art"
          >
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Cover</span>
          </button>
          <button
            onClick={() => setActiveTab('lyrics')}
            className={`p-1.5 sm:p-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
              activeTab === 'lyrics'
                ? 'bg-white/20 text-white shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
            title="Lyrics"
          >
            <Mic2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Lyrics</span>
          </button>
          <button
            onClick={() => setActiveTab('queue')}
            className={`p-1.5 sm:p-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
              activeTab === 'queue'
                ? 'bg-white/20 text-white shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
            title="Queue"
          >
            <ListMusic className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Queue</span>
          </button>
          <button
            onClick={() => setActiveTab('soundlab')}
            className={`p-1.5 sm:p-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
              activeTab === 'soundlab'
                ? 'bg-gradient-to-r from-cyan-500/30 to-purple-500/30 text-white shadow-sm border border-cyan-400/40'
                : 'text-gray-400 hover:text-white'
            }`}
            title="Dolby Atmos & Audio Lab"
          >
            <Zap className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isDolbyEnabled ? 'text-cyan-400' : ''}`} />
            <span className="hidden sm:inline">Dolby / EQ</span>
          </button>

          {/* Native App Install Trigger (Removes Chrome badge on lock screen) */}
          <button
            onClick={() => setIsInstallModalOpen(true)}
            className="p-1.5 sm:p-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 active:scale-95"
            title="Install App (Native Spotify/Apple Music lock screen player)"
          >
            <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400" />
            <span className="hidden sm:inline">App</span>
          </button>
        </div>
      </header>

      {/* Main Body */}
      <div className="relative z-10 flex-1 overflow-y-auto flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
        {activeTab === 'visualizer' && (
          <div className="w-full max-w-md flex flex-col items-center text-center">
            {/* Artwork Card with Vinyl Glow & Glossy Sheen */}
            <div className="relative w-[56vw] max-w-[240px] sm:max-w-[300px] md:max-w-[360px] aspect-square max-h-[32vh] rounded-2xl sm:rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_50px_rgba(250,45,72,0.35)] mb-4 sm:mb-6 border border-white/20 group">
              <img
                src={artwork}
                alt={currentTrack.title}
                className="w-full h-full object-cover shadow-2xl transition-transform duration-700 hover:scale-105"
              />
              {/* Glossy Tempered-Glass Diagonal Sheen Effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />
            </div>

            {/* Track Info with pristine text shadows */}
            <div className="w-full flex items-center justify-between mb-2">
              <div className="text-left min-w-0 flex-1 pr-4">
                <h2 className="text-2xl md:text-3xl font-extrabold truncate text-white tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)]">
                  {currentTrack.title}
                </h2>
                <p className="text-base md:text-lg text-gray-200 font-medium truncate mt-1 drop-shadow-[0_1px_8px_rgba(0,0,0,0.95)]">
                  {currentTrack.artist}
                </p>
              </div>

              <button
                onClick={() => toggleFavourite(currentTrack.id)}
                className={`p-3 rounded-full transition-transform active:scale-90 ${
                  liked
                    ? 'text-[var(--accent-primary)]'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <Heart className={`w-7 h-7 ${liked ? 'fill-[var(--accent-primary)]' : ''}`} />
              </button>
            </div>

            {/* Apple Music & Dolby Atmos Badges */}
            <div className="flex items-center justify-center gap-2.5 mt-2 mb-1 flex-wrap">
              <button
                onClick={() => setActiveTab('soundlab')}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-all shadow-md active:scale-95 border ${
                  isDolbyEnabled
                    ? 'bg-gradient-to-r from-cyan-950/70 to-purple-950/70 border-cyan-400/50 text-cyan-200 shadow-[0_0_16px_rgba(6,182,212,0.3)]'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                }`}
                title="Dolby Atmos 3D Spatial Audio active. Click to open Audio Lab"
              >
                <Zap className={`w-3 h-3 ${isDolbyEnabled ? 'text-cyan-400 fill-cyan-400' : ''}`} />
                <span>Dolby Atmos</span>
              </button>

              <button
                onClick={() => setActiveTab('soundlab')}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 transition-all active:scale-95"
                title="Apple Lossless Studio Mastering Curve. Click to customize"
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Lossless Hi-Fi</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'lyrics' && (
          <div className="w-full max-w-2xl h-full flex flex-col items-center">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-6">
              Synchronized Lyrics
            </h3>
            {lyricsList.length === 0 ? (
              <div className="my-auto text-center text-gray-400">
                <Mic2 className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                <p className="text-lg font-medium">Instrumental or No Lyrics Available</p>
                <p className="text-xs text-gray-500 mt-1">Enjoy the music flow</p>
              </div>
            ) : (
              <div
                ref={lyricsContainerRef}
                className="w-full flex-1 overflow-y-auto space-y-6 text-center py-12 scroll-smooth"
              >
                {lyricsList.map((line, idx) => {
                  const isActive = idx === currentLyricsIndex;
                  return (
                    <p
                      key={idx}
                      onClick={() => seek(line.time)}
                      className={`text-xl md:text-2xl font-bold cursor-pointer transition-all duration-300 ${
                        isActive
                          ? 'text-white scale-105 drop-shadow-[0_0_24px_rgba(250,45,72,0.6)]'
                          : 'text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      {line.text}
                    </p>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'queue' && (
          <div className="w-full max-w-2xl h-full flex flex-col">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">
              Current Play Queue ({queue.length} Tracks)
            </h3>
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-2">
              {queue.map((t, idx) => {
                const isCurrent = idx === queueIndex;
                return (
                  <div
                    key={`${t.id}-${idx}`}
                    onClick={() => playTrack(t, queue)}
                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${
                      isCurrent
                        ? 'bg-[var(--accent-primary)]/20 border border-[var(--accent-primary)]/40 text-white'
                        : 'bg-white/5 hover:bg-white/10 text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 text-center text-xs font-mono text-gray-400">
                        {idx + 1}
                      </span>
                      <img
                        src={resolveArtworkUrl(t)}
                        alt={t.title}
                        className="w-10 h-10 rounded-lg object-cover bg-neutral-800"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate text-white">{t.title}</p>
                        <p className="text-xs text-gray-400 truncate">{t.artist}</p>
                      </div>
                    </div>
                    <span className="font-mono text-xs text-gray-400">
                      {formatTime(t.duration)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'soundlab' && <SoundLabTab />}
      </div>

      {/* Persistent Bottom Controls Drawer in Full Modal (Glassmorphic protection for 100% controls visibility) */}
      <div className="relative z-10 w-full max-w-2xl mx-auto px-4 sm:px-6 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] pt-3 sm:pt-4 bg-black/40 backdrop-blur-2xl rounded-t-3xl border-t border-white/10 shadow-[0_-12px_40px_rgba(0,0,0,0.6)]">
        {/* Scrubber Progress Bar */}
        <div className="w-full mb-3 sm:mb-6">
          <div className="relative group w-full flex items-center py-2 cursor-pointer">
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.5}
              value={currentTime}
              onChange={(e) => seek(parseFloat(e.target.value))}
              className="w-full h-1.5 sm:h-2 rounded-full cursor-pointer"
              style={{
                background: `linear-gradient(to right, var(--accent-primary) 0%, var(--accent-primary) ${progressPercent}%, rgba(255,255,255,0.2) ${progressPercent}%, rgba(255,255,255,0.2) 100%)`,
              }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] sm:text-xs text-gray-400 font-mono">
            <span>{formatTime(currentTime)}</span>
            <span>-{formatTime(Math.max(0, duration - currentTime))}</span>
          </div>
        </div>

        {/* Player Buttons */}
        <div className="flex items-center justify-between mb-4 sm:mb-6 px-2 sm:px-4">
          <button
            onClick={toggleShuffle}
            className={`p-2.5 sm:p-3 rounded-full transition-colors ${
              shuffle ? 'text-[var(--accent-primary)]' : 'text-gray-400 hover:text-white'
            }`}
            title={`Shuffle: ${shuffle ? 'On' : 'Off'}`}
          >
            <Shuffle className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <button
            onClick={previousTrack}
            className="p-2.5 sm:p-3 rounded-full text-gray-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
            title="Previous track"
          >
            <SkipBack className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>

          <button
            onClick={togglePlay}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[var(--accent-primary)] hover:brightness-110 active:scale-95 flex items-center justify-center text-white shadow-[0_0_32px_rgba(250,45,72,0.5)] transition-all"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-7 h-7 sm:w-8 sm:h-8 fill-white text-white" />
            ) : (
              <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-white text-white ml-1" />
            )}
          </button>

          <button
            onClick={nextTrack}
            className="p-2.5 sm:p-3 rounded-full text-gray-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
            title="Next track"
          >
            <SkipForward className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>

          <button
            onClick={cycleRepeatMode}
            className={`p-2.5 sm:p-3 rounded-full transition-colors ${
              repeatMode !== 'off'
                ? 'text-[var(--accent-primary)]'
                : 'text-gray-400 hover:text-white'
            }`}
            title={`Repeat: ${repeatMode}`}
          >
            {repeatMode === 'one' ? (
              <Repeat1 className="w-4 h-4 sm:w-5 sm:h-5" />
            ) : (
              <Repeat className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </button>
        </div>

        {/* Volume Slider */}
        <div className="flex items-center justify-center gap-3 max-w-sm mx-auto px-4">
          <button
            onClick={toggleMute}
            className="p-1.5 text-gray-400 hover:text-white transition-colors"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
            ) : (
              <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={isMuted ? 0 : volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-full h-1 sm:h-1.5 rounded-full cursor-pointer"
            style={{
              background: `linear-gradient(to right, #ffffff 0%, #ffffff ${
                isMuted ? 0 : volume * 100
              }%, rgba(255,255,255,0.2) ${isMuted ? 0 : volume * 100}%, rgba(255,255,255,0.2) 100%)`,
            }}
          />
        </div>
      </div>

      {/* Standalone Native App Installation Modal (Removes Chrome badge on lock screen) */}
      <PwaInstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />
    </div>
  );
};
