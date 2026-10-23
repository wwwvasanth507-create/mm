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
} from 'lucide-react';
import { useAudio } from '@/context/AudioContext';
import { resolveArtworkUrl } from '@/services/musicService';
import { formatTime } from '@/utils/formatters';

interface NowPlayingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NowPlayingModal: React.FC<NowPlayingModalProps> = ({ isOpen, onClose }) => {
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
  } = useAudio();

  const [activeTab, setActiveTab] = useState<'visualizer' | 'lyrics' | 'queue'>('visualizer');
  const lyricsContainerRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !currentTrack) return null;

  const artwork = resolveArtworkUrl(currentTrack);
  const liked = isFavourite(currentTrack.id);
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Find active lyrics line
  const lyricsList = Array.isArray(currentTrack.lyrics) ? currentTrack.lyrics : [];
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
    if (activeTab === 'lyrics' && currentLyricsIndex >= 0 && lyricsContainerRef.current) {
      const activeEl = lyricsContainerRef.current.children[currentLyricsIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentLyricsIndex, activeTab]);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-[#0c0c10] flex flex-col text-white animate-in fade-in duration-300">
      {/* Blurred dynamic glowing ambient background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-40">
        <img
          src={artwork}
          alt=""
          className="w-full h-full object-cover blur-[100px] scale-125 saturate-150 transform transition-all duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-black/40 to-black/60" />
      </div>

      {/* Top Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/10 backdrop-blur-md">
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-white/10 transition-colors text-gray-300 hover:text-white"
          title="Minimize player"
        >
          <ChevronDown className="w-6 h-6" />
        </button>

        <div className="text-center min-w-0 px-4">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
            Playing From {currentTrack.album}
          </p>
          <div className="flex items-center justify-center gap-1.5 mt-0.5">
            {currentTrack.language && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white border border-white/15 font-mono">
                {currentTrack.language}
              </span>
            )}
            {currentTrack.year && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-gray-300 font-mono">
                {currentTrack.year}
              </span>
            )}
            {currentTrack.genre && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 font-mono">
                {currentTrack.genre}
              </span>
            )}
          </div>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl backdrop-blur-md">
          <button
            onClick={() => setActiveTab('visualizer')}
            className={`p-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'visualizer'
                ? 'bg-white/20 text-white shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
            title="Cover & Visualizer"
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">Visuals</span>
          </button>
          <button
            onClick={() => setActiveTab('lyrics')}
            className={`p-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'lyrics'
                ? 'bg-white/20 text-white shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
            title="Lyrics"
          >
            <Mic2 className="w-4 h-4" />
            <span className="hidden sm:inline">Lyrics</span>
          </button>
          <button
            onClick={() => setActiveTab('queue')}
            className={`p-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'queue'
                ? 'bg-white/20 text-white shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
            title="Queue"
          >
            <ListMusic className="w-4 h-4" />
            <span className="hidden sm:inline">Queue</span>
          </button>
        </div>
      </header>

      {/* Main Body */}
      <div className="relative z-10 flex-1 overflow-y-auto flex flex-col items-center justify-center p-6 md:p-8">
        {activeTab === 'visualizer' && (
          <div className="w-full max-w-md flex flex-col items-center text-center">
            {/* Artwork Card with Vinyl Glow */}
            <div className="relative w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 rounded-3xl overflow-hidden shadow-2xl mb-8 border border-white/10 group">
              <img
                src={artwork}
                alt={currentTrack.title}
                className="w-full h-full object-cover shadow-2xl transition-transform duration-700 hover:scale-105"
              />

              {/* Animated Equalizer Wave Bars Overlay */}
              <div className="absolute bottom-4 right-4 flex items-end gap-1.5 px-3 py-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/10">
                <span
                  className={`w-1 rounded-full bg-[var(--accent-primary)] ${
                    isPlaying ? 'animate-wave-1' : 'h-2'
                  }`}
                />
                <span
                  className={`w-1 rounded-full bg-[var(--accent-primary)] ${
                    isPlaying ? 'animate-wave-2' : 'h-3'
                  }`}
                />
                <span
                  className={`w-1 rounded-full bg-[var(--accent-primary)] ${
                    isPlaying ? 'animate-wave-3' : 'h-1.5'
                  }`}
                />
                <span
                  className={`w-1 rounded-full bg-[var(--accent-primary)] ${
                    isPlaying ? 'animate-wave-4' : 'h-2.5'
                  }`}
                />
              </div>
            </div>

            {/* Track Info */}
            <div className="w-full flex items-center justify-between mb-2">
              <div className="text-left min-w-0 flex-1 pr-4">
                <h2 className="text-2xl md:text-3xl font-extrabold truncate text-white tracking-tight">
                  {currentTrack.title}
                </h2>
                <p className="text-base md:text-lg text-gray-300 font-medium truncate mt-1">
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
      </div>

      {/* Persistent Bottom Controls Drawer in Full Modal */}
      <div className="relative z-10 w-full max-w-2xl mx-auto px-6 pb-8 pt-4">
        {/* Scrubber Progress Bar */}
        <div className="w-full mb-6">
          <div className="relative group w-full flex items-center">
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.5}
              value={currentTime}
              onChange={(e) => seek(parseFloat(e.target.value))}
              className="w-full h-2 rounded-full cursor-pointer"
              style={{
                background: `linear-gradient(to right, var(--accent-primary) 0%, var(--accent-primary) ${progressPercent}%, rgba(255,255,255,0.2) ${progressPercent}%, rgba(255,255,255,0.2) 100%)`,
              }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-gray-400 font-mono mt-2">
            <span>{formatTime(currentTime)}</span>
            <span>-{formatTime(Math.max(0, duration - currentTime))}</span>
          </div>
        </div>

        {/* Player Buttons */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={toggleShuffle}
            className={`p-3 rounded-full transition-colors ${
              shuffle ? 'text-[var(--accent-primary)]' : 'text-gray-400 hover:text-white'
            }`}
            title={`Shuffle: ${shuffle ? 'On' : 'Off'}`}
          >
            <Shuffle className="w-5 h-5" />
          </button>

          <button
            onClick={previousTrack}
            className="p-3 rounded-full text-gray-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
            title="Previous track"
          >
            <SkipBack className="w-7 h-7" />
          </button>

          <button
            onClick={togglePlay}
            className="w-16 h-16 rounded-full bg-[var(--accent-primary)] hover:brightness-110 active:scale-95 flex items-center justify-center text-white shadow-[0_0_32px_rgba(250,45,72,0.5)] transition-all"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-8 h-8 fill-white text-white" />
            ) : (
              <Play className="w-8 h-8 fill-white text-white ml-1" />
            )}
          </button>

          <button
            onClick={nextTrack}
            className="p-3 rounded-full text-gray-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
            title="Next track"
          >
            <SkipForward className="w-7 h-7" />
          </button>

          <button
            onClick={cycleRepeatMode}
            className={`p-3 rounded-full transition-colors ${
              repeatMode !== 'off'
                ? 'text-[var(--accent-primary)]'
                : 'text-gray-400 hover:text-white'
            }`}
            title={`Repeat: ${repeatMode}`}
          >
            {repeatMode === 'one' ? (
              <Repeat1 className="w-5 h-5" />
            ) : (
              <Repeat className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Volume Slider */}
        <div className="flex items-center justify-center gap-3 max-w-sm mx-auto">
          <button
            onClick={toggleMute}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-5 h-5 text-gray-500" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={isMuted ? 0 : volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-full h-1.5 rounded-full"
            style={{
              background: `linear-gradient(to right, #ffffff 0%, #ffffff ${
                isMuted ? 0 : volume * 100
              }%, rgba(255,255,255,0.2) ${isMuted ? 0 : volume * 100}%, rgba(255,255,255,0.2) 100%)`,
            }}
          />
        </div>
      </div>
    </div>
  );
};
