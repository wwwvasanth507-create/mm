import React, { useState, useRef, useEffect } from 'react';
import { Play, Heart, MoreHorizontal, Plus, ListMusic, Radio, Clock } from 'lucide-react';
import { Track } from '@/types/music';
import { useAudio } from '@/context/AudioContext';
import { resolveArtworkUrl } from '@/services/musicService';
import { formatTime } from '@/utils/formatters';

interface TrackRowProps {
  track: Track;
  index?: number;
  showCover?: boolean;
  showAlbum?: boolean;
  showIndex?: boolean;
  contextQueue?: Track[];
  onOpenPlaylistModal?: (track: Track) => void;
}

export const TrackRow: React.FC<TrackRowProps> = ({
  track,
  showCover = true,
  contextQueue,
  onOpenPlaylistModal,
}) => {
  const {
    currentTrack,
    isPlaying,
    playTrack,
    togglePlay,
    isFavourite,
    toggleFavourite,
    addToQueue,
    addNextInQueue,
  } = useAudio();

  const isCurrent = currentTrack?.id === track.id;
  const isCurrentlyPlaying = isCurrent && isPlaying;
  const liked = isFavourite(track.id);
  const artwork = resolveArtworkUrl(track);

  const handleRowClick = () => {
    if (isCurrent) {
      togglePlay();
    } else {
      playTrack(track, contextQueue);
    }
  };

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  return (
    <div
      onClick={handleRowClick}
      className={`group relative flex items-center justify-between px-3 py-2.5 rounded-2xl transition-all duration-150 cursor-pointer select-none active:scale-[0.99] ${
        isCurrent
          ? 'bg-[var(--accent-primary)]/15 border-l-4 border-[var(--accent-primary)] text-white shadow-md'
          : 'hover:bg-white/5 text-gray-200 hover:text-white border-l-4 border-transparent'
      }`}
    >
      {/* Left: Thumbnail & Song Name (Title + Artist) */}
      <div className="flex items-center gap-3 min-w-0 flex-1 pr-3">
        {/* Thumbnail Cover Art */}
        {showCover && (
          <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-neutral-900 shadow-md">
            <img
              src={artwork}
              alt={track.title}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {isCurrentlyPlaying ? (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="flex items-end gap-[2px] h-4">
                  <span className="w-1 bg-[var(--accent-primary)] rounded-full animate-wave-1"></span>
                  <span className="w-1 bg-[var(--accent-primary)] rounded-full animate-wave-2"></span>
                  <span className="w-1 bg-[var(--accent-primary)] rounded-full animate-wave-3"></span>
                </div>
              </div>
            ) : isCurrent ? (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <Play className="w-4 h-4 fill-[var(--accent-primary)] text-[var(--accent-primary)]" />
              </div>
            ) : null}
          </div>
        )}

        {/* Song Name & Artist - Full focus, maximum width, crystal clear */}
        <div className="min-w-0 flex-1">
          <h4
            className={`text-sm sm:text-base font-bold truncate leading-snug transition-colors ${
              isCurrent
                ? 'text-[var(--accent-primary)] font-extrabold'
                : 'text-white group-hover:text-white'
            }`}
            title={track.title}
          >
            {track.title}
          </h4>

          <p className="text-xs sm:text-sm text-gray-400 truncate mt-0.5">
            {track.artist}
          </p>
        </div>
      </div>

      {/* Right: Only the Three-Dot Option Menu Button */}
      <div
        className="relative flex-shrink-0"
        ref={menuRef}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className={`p-2 rounded-full transition-colors ${
            menuOpen
              ? 'bg-white/15 text-white'
              : 'text-gray-400 hover:text-white hover:bg-white/10'
          }`}
          title="Track options"
          aria-label="Track options"
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full mt-1.5 w-52 bg-[#181824] border border-white/10 rounded-2xl shadow-2xl py-1.5 z-40 backdrop-blur-2xl text-xs text-gray-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Header info with duration inside menu */}
            <div className="px-3.5 py-2 border-b border-white/10">
              <p className="font-bold text-white truncate text-xs">{track.title}</p>
              <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-mono mt-0.5">
                <Clock className="w-3 h-3 text-gray-500" />
                <span>Duration: {formatTime(track.duration)}</span>
              </div>
            </div>

            {/* Menu Actions */}
            <button
              onClick={() => {
                setMenuOpen(false);
                addNextInQueue(track);
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-white/10 text-left transition-colors"
            >
              <Radio className="w-4 h-4 text-gray-400" />
              <span>Play Next</span>
            </button>

            <button
              onClick={() => {
                setMenuOpen(false);
                addToQueue(track);
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-white/10 text-left transition-colors"
            >
              <Plus className="w-4 h-4 text-gray-400" />
              <span>Add to Queue</span>
            </button>

            {onOpenPlaylistModal && (
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onOpenPlaylistModal(track);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-white/10 text-left transition-colors"
              >
                <ListMusic className="w-4 h-4 text-gray-400" />
                <span>Add to Playlist...</span>
              </button>
            )}

            <div className="h-px bg-white/10 my-1" />

            <button
              onClick={() => {
                setMenuOpen(false);
                toggleFavourite(track.id);
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-white/10 text-left transition-colors"
            >
              <Heart
                className={`w-4 h-4 ${
                  liked
                    ? 'text-[var(--accent-primary)] fill-[var(--accent-primary)]'
                    : 'text-gray-400'
                }`}
              />
              <span className={liked ? 'text-[var(--accent-primary)] font-semibold' : ''}>
                {liked ? 'Remove from Favourites' : 'Add to Favourites'}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
