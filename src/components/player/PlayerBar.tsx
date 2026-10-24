import React, { useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  Volume1,
  Heart,
  ListMusic,
  Maximize2,
  AlertCircle,
  Loader2,
  Zap,
  Film,
} from 'lucide-react';
import { useAudio } from '@/context/AudioContext';
import { resolveArtworkUrl } from '@/services/musicService';
import { formatTime } from '@/utils/formatters';

interface PlayerBarProps {
  onOpenQueue: () => void;
  onOpenNowPlaying: () => void;
  onOpenVideo?: () => void;
}

export const PlayerBar: React.FC<PlayerBarProps> = ({
  onOpenQueue,
  onOpenNowPlaying,
  onOpenVideo,
}) => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isBuffering,
    repeatMode,
    shuffle,
    error,
    queue,
    togglePlay,
    nextTrack,
    previousTrack,
    seek,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeatMode,
    isFavourite,
    toggleFavourite,
    resume,
    isDolbyEnabled,
    toggleDolby,
  } = useAudio();

  const [hoverSeekTime, setHoverSeekTime] = useState<number | null>(null);
  const [hoverSeekPos, setHoverSeekPos] = useState<number>(0);

  if (!currentTrack) {
    return null;
  }

  const artwork = resolveArtworkUrl(currentTrack);
  const liked = isFavourite(currentTrack.id);
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverSeekPos(e.clientX - rect.left);
    setHoverSeekTime(pos * duration);
  };

  const handleMouseLeave = () => {
    setHoverSeekTime(null);
  };

  return (
    <>
      {/* ============================================================== */}
      {/* MOBILE MINI PLAYER (Screen width < 768px)                      */}
      {/* Floating Apple/Spotify-style card docked above bottom nav      */}
      {/* ============================================================== */}
      <div className="md:hidden fixed bottom-[calc(3.75rem+env(safe-area-inset-bottom,0px))] left-2.5 right-2.5 z-40 animate-in slide-in-from-bottom duration-300">
        {/* Error alert toast for mobile */}
        {error && (
          <div className="mb-1.5 bg-rose-950/95 border border-rose-500/40 text-rose-200 text-[11px] px-3 py-1.5 rounded-xl flex items-center justify-between shadow-lg">
            <span className="truncate mr-2">{error}</span>
            <button
              onClick={resume}
              className="px-2 py-0.5 rounded bg-rose-600 font-bold text-[10px] text-white flex-shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        <div
          onClick={onOpenNowPlaying}
          className="relative bg-[#161620]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.7)] p-2 pr-3 flex items-center justify-between gap-3 cursor-pointer select-none active:scale-[0.99] transition-transform overflow-hidden"
        >
          {/* Top Edge Slim Progress Line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/10">
            <div
              className="h-full bg-[var(--accent-primary)] transition-all duration-200"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Left: Thumbnail + Title + Artist */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="relative w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 bg-neutral-900 shadow-md">
              <img
                src={artwork}
                alt={currentTrack.title}
                className="w-full h-full object-cover"
              />
              {isBuffering && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate text-white leading-tight">
                {currentTrack.title}
              </p>
              <p className="text-xs text-gray-400 truncate mt-0.5">
                {currentTrack.artist}
              </p>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div
            className="flex items-center gap-1.5 flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Quick Video Toggle Button */}
            {onOpenVideo && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenVideo();
                }}
                className={`p-2 rounded-full transition-colors ${
                  currentTrack.videoUrl
                    ? 'text-rose-400 hover:text-rose-300'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Play Video Song"
                aria-label="Play video song"
              >
                <Film className="w-4 h-4" />
              </button>
            )}

            {/* Quick Favourite Toggle */}
            <button
              onClick={() => toggleFavourite(currentTrack.id)}
              className={`p-2 rounded-full transition-colors ${
                liked ? 'text-[var(--accent-primary)]' : 'text-gray-400 hover:text-white'
              }`}
              title={liked ? 'Remove from Favourites' : 'Add to Favourites'}
              aria-label="Toggle favourite"
            >
              <Heart className={`w-4 h-4 ${liked ? 'fill-[var(--accent-primary)]' : ''}`} />
            </button>

            {/* Play/Pause Button */}
            <button
              onClick={togglePlay}
              disabled={isBuffering && !isPlaying}
              className="w-9 h-9 rounded-full bg-[var(--accent-primary)] text-white flex items-center justify-center shadow-[0_0_16px_var(--accent-glow)] active:scale-90 transition-transform"
              title={isPlaying ? 'Pause' : 'Play'}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isBuffering ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-4 h-4 fill-white" />
              ) : (
                <Play className="w-4 h-4 fill-white ml-0.5" />
              )}
            </button>

            {/* Next Track Button */}
            <button
              onClick={nextTrack}
              className="p-2 rounded-full text-gray-300 hover:text-white active:scale-90 transition-transform"
              title="Next Track"
              aria-label="Next track"
            >
              <SkipForward className="w-4 h-4 fill-current" />
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* DESKTOP FULL PLAYER BAR (Screen width >= 768px)               */}
      {/* Pinned to bottom-0 with 3-column control center                */}
      {/* ============================================================== */}
      <footer className="hidden md:block fixed bottom-0 left-0 right-0 z-40 glass-player text-white px-6 py-3 transition-all duration-200">
        {/* Top Error Alert Banner if audio error occurs */}
        {error && (
          <div className="absolute top-0 left-0 right-0 -translate-y-full bg-rose-950/95 border-t border-rose-500/40 text-rose-200 text-xs px-4 py-1.5 flex items-center justify-between backdrop-blur-md">
            <div className="flex items-center gap-2 min-w-0">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span className="truncate">{error}</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 ml-3">
              <button
                onClick={resume}
                className="px-2 py-0.5 rounded bg-rose-600/50 hover:bg-rose-600 text-white font-semibold text-[11px]"
              >
                Retry
              </button>
              <button
                onClick={nextTrack}
                className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white text-[11px]"
              >
                Skip
              </button>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
          {/* Left: Track Details */}
          <div
            onClick={onOpenNowPlaying}
            className="flex items-center gap-3 min-w-0 w-1/4 cursor-pointer group select-none p-1.5 -ml-1.5 rounded-xl hover:bg-white/5 transition-colors"
            title="Click to open full player"
          >
            <div
              className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform bg-neutral-900 shadow-md"
            >
              <img
                src={artwork}
                alt={currentTrack.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Maximize2 className="w-4 h-4 text-white" />
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h4
                  className="text-sm font-semibold truncate group-hover:underline text-white"
                >
                  {currentTrack.title}
                </h4>
                {currentTrack.language && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/10 text-gray-300 font-mono">
                    {currentTrack.language}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 truncate mt-0.5 group-hover:text-gray-300">
                {currentTrack.artist} {currentTrack.year ? `• ${currentTrack.year}` : ''}
              </p>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFavourite(currentTrack.id);
              }}
              className={`p-1.5 rounded-full transition-colors flex-shrink-0 ${
                liked
                  ? 'text-[var(--accent-primary)]'
                  : 'text-gray-400 hover:text-white'
              }`}
              title={liked ? 'Remove from Favourites' : 'Add to Favourites'}
            >
              <Heart className={`w-4 h-4 ${liked ? 'fill-[var(--accent-primary)]' : ''}`} />
            </button>
          </div>

          {/* Center: Controls & Scrubber */}
          <div className="flex flex-col items-center flex-1 max-w-xl">
            {/* Action buttons */}
            <div className="flex items-center gap-5 mb-1">
              <button
                onClick={toggleShuffle}
                className={`p-1.5 rounded-full transition-colors ${
                  shuffle ? 'text-[var(--accent-primary)]' : 'text-gray-400 hover:text-white'
                }`}
                title={`Shuffle: ${shuffle ? 'On' : 'Off'}`}
              >
                <Shuffle className="w-4 h-4" />
              </button>

              <button
                onClick={previousTrack}
                className="p-1.5 rounded-full text-gray-300 hover:text-white active:scale-90 transition-transform"
                title="Previous Track (P)"
              >
                <SkipBack className="w-5 h-5 fill-current" />
              </button>

              <button
                onClick={togglePlay}
                disabled={isBuffering && !isPlaying}
                className="w-10 h-10 rounded-full bg-[var(--accent-primary)] hover:brightness-110 active:scale-95 flex items-center justify-center text-white shadow-[0_0_16px_var(--accent-glow)] transition-all"
                title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
              >
                {isBuffering ? (
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                ) : isPlaying ? (
                  <Pause className="w-5 h-5 fill-white text-white" />
                ) : (
                  <Play className="w-5 h-5 fill-white text-white ml-0.5" />
                )}
              </button>

              <button
                onClick={nextTrack}
                className="p-1.5 rounded-full text-gray-300 hover:text-white active:scale-90 transition-transform"
                title="Next Track (N)"
              >
                <SkipForward className="w-5 h-5 fill-current" />
              </button>

              <button
                onClick={cycleRepeatMode}
                className={`p-1.5 rounded-full transition-colors ${
                  repeatMode !== 'off'
                    ? 'text-[var(--accent-primary)]'
                    : 'text-gray-400 hover:text-white'
                }`}
                title={`Repeat: ${repeatMode} (R)`}
              >
                {repeatMode === 'one' ? (
                  <Repeat1 className="w-4 h-4" />
                ) : (
                  <Repeat className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Scrubber with hover time preview */}
            <div className="w-full flex items-center gap-2.5 text-xs text-gray-400 font-mono select-none">
              <span className="w-9 text-right text-[11px]">{formatTime(currentTime)}</span>

              <div
                className="relative flex-1 group py-1.5 flex items-center cursor-pointer"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              >
                {hoverSeekTime !== null && (
                  <div
                    className="absolute -top-7 -translate-x-1/2 bg-neutral-900 border border-white/20 px-1.5 py-0.5 rounded text-[10px] text-white pointer-events-none shadow-lg z-20"
                    style={{ left: `${hoverSeekPos}px` }}
                  >
                    {formatTime(hoverSeekTime)}
                  </div>
                )}

                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  step={0.25}
                  value={currentTime}
                  onChange={(e) => seek(parseFloat(e.target.value))}
                  className="w-full h-1 group-hover:h-1.5 rounded-full transition-all cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, var(--accent-primary) 0%, var(--accent-primary) ${progressPercent}%, rgba(255,255,255,0.2) ${progressPercent}%, rgba(255,255,255,0.2) 100%)`,
                  }}
                />
              </div>

              <span className="w-9 text-[11px] text-gray-500">
                {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* Right: Volume & Drawer shortcuts */}
          <div className="flex items-center justify-end gap-2.5 w-1/4">
            <div className="flex items-center gap-2 group w-32">
              <button
                onClick={toggleMute}
                className="p-1 text-gray-400 hover:text-white transition-colors"
                title="Toggle Mute (M)"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-gray-500" />
                ) : volume < 0.5 ? (
                  <Volume1 className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={isMuted ? 0 : volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full h-1 group-hover:h-1.5 rounded-full cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #ffffff 0%, #ffffff ${
                    isMuted ? 0 : volume * 100
                  }%, rgba(255,255,255,0.2) ${isMuted ? 0 : volume * 100}%, rgba(255,255,255,0.2) 100%)`,
                }}
              />
            </div>

            {/* Quick Dolby Atmos Spatial Audio Toggle */}
            <button
              onClick={toggleDolby}
              className={`p-1.5 px-2.5 rounded-full text-[11px] font-extrabold flex items-center gap-1.5 transition-all border ${
                isDolbyEnabled
                  ? 'bg-gradient-to-r from-cyan-950/80 to-purple-950/80 border-cyan-400/50 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.35)]'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
              }`}
              title={
                isDolbyEnabled
                  ? 'Dolby Atmos Spatial 3D Active (Click to toggle)'
                  : 'Dolby Atmos Spatial Audio Disabled (Click to activate)'
              }
            >
              <Zap className={`w-3.5 h-3.5 ${isDolbyEnabled ? 'text-cyan-400 fill-cyan-400' : ''}`} />
              <span className="hidden xl:inline">DOLBY</span>
            </button>

            {/* Quick Video Player Button */}
            {onOpenVideo && (
              <button
                onClick={onOpenVideo}
                className={`p-1.5 px-2.5 rounded-full text-[11px] font-extrabold flex items-center gap-1.5 transition-all border ${
                  currentTrack.videoUrl
                    ? 'bg-rose-950/70 border-rose-500/50 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.35)] hover:bg-rose-900/60'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                }`}
                title="Play Music Video"
              >
                <Film className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden xl:inline">VIDEO</span>
              </button>
            )}

            <button
              onClick={onOpenQueue}
              className="relative p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Queue"
            >
              <ListMusic className="w-4 h-4" />
              {queue.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[var(--accent-primary)]" />
              )}
            </button>

            <button
              onClick={onOpenNowPlaying}
              className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Full Screen Player"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </footer>
    </>
  );
};
