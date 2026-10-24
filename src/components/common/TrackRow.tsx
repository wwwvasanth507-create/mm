import React from 'react';
import { Play, Heart, MoreHorizontal, Plus, ListMusic, Radio } from 'lucide-react';
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
  index,
  showCover = true,
  showAlbum = true,
  showIndex = true,
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

  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
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
      className={`group relative flex items-center justify-between px-2.5 sm:px-3.5 py-2 sm:py-2.5 rounded-xl transition-all duration-150 cursor-pointer select-none ${
        isCurrent
          ? 'bg-[var(--accent-primary)]/10 border-l-2 border-[var(--accent-primary)] text-white shadow-sm'
          : 'hover:bg-white/5 text-gray-300 hover:text-white border-l-2 border-transparent'
      }`}
    >
      {/* Left: Index / Play Icon & Track Info */}
      <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1 pr-2 sm:pr-4">
        {/* Track Index (Hidden on mobile < sm to give maximum breathing room to song title) */}
        {showIndex && (
          <div className="hidden sm:flex w-7 text-center text-xs font-semibold text-gray-500 group-hover:text-white items-center justify-center flex-shrink-0">
            {isCurrentlyPlaying ? (
              <div className="flex items-end gap-[2px] h-3.5">
                <span className="w-1 bg-[var(--accent-primary)] rounded-full animate-wave-1"></span>
                <span className="w-1 bg-[var(--accent-primary)] rounded-full animate-wave-2"></span>
                <span className="w-1 bg-[var(--accent-primary)] rounded-full animate-wave-3"></span>
              </div>
            ) : isCurrent ? (
              <span className="text-[var(--accent-primary)] font-bold text-sm">▶</span>
            ) : (
              <>
                <span className="group-hover:hidden">{index !== undefined ? index + 1 : ''}</span>
                <Play className="w-3.5 h-3.5 hidden group-hover:block fill-white text-white" />
              </>
            )}
          </div>
        )}

        {/* Thumbnail Artwork */}
        {showCover && (
          <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl overflow-hidden flex-shrink-0 bg-neutral-800 shadow-md">
            <img
              src={artwork}
              alt={track.title}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {isCurrentlyPlaying && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="flex items-end gap-[2px] h-4">
                  <span className="w-1 bg-[var(--accent-primary)] rounded-full animate-wave-1"></span>
                  <span className="w-1 bg-[var(--accent-primary)] rounded-full animate-wave-2"></span>
                  <span className="w-1 bg-[var(--accent-primary)] rounded-full animate-wave-3"></span>
                </div>
              </div>
            )}
            {!isCurrentlyPlaying && isCurrent && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <Play className="w-3.5 h-3.5 fill-[var(--accent-primary)] text-[var(--accent-primary)]" />
              </div>
            )}
          </div>
        )}

        {/* Track Title and Artist Details */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <h4
              className={`text-sm font-semibold truncate min-w-0 flex-1 leading-snug ${
                isCurrent ? 'text-[var(--accent-primary)] font-bold' : 'text-white'
              }`}
              title={track.title}
            >
              {track.title}
            </h4>

            {track.isExplicit && (
              <span
                className="text-[9px] px-1 py-0.5 rounded bg-neutral-800 text-gray-300 border border-white/20 font-bold leading-none flex-shrink-0"
                title="Explicit Content"
              >
                E
              </span>
            )}

            {track.isDemo && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono tracking-wider flex-shrink-0">
                DEMO
              </span>
            )}
          </div>

          <p className="text-xs text-gray-400 truncate mt-0.5 flex items-center gap-1.5">
            <span className="truncate">{track.artist}</span>
            {track.language && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-gray-300 font-mono flex-shrink-0">
                {track.language}
              </span>
            )}
            {track.year && <span className="hidden sm:inline text-gray-500">• {track.year}</span>}
          </p>
        </div>
      </div>

      {/* Middle: Album Name (Desktop) */}
      {showAlbum && (
        <div className="hidden md:block flex-1 max-w-[200px] lg:max-w-[260px] px-3 truncate text-xs text-gray-400">
          {track.album}
        </div>
      )}

      {/* Right: Favourite, Duration, More Actions */}
      <div
        className="flex items-center gap-1 sm:gap-2.5 text-xs text-gray-400 flex-shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Heart / Favourite Toggle */}
        <button
          onClick={() => toggleFavourite(track.id)}
          className={`p-1.5 sm:p-2 rounded-full transition-transform active:scale-90 ${
            liked
              ? 'text-[var(--accent-primary)] opacity-100'
              : 'text-gray-500 hover:text-white opacity-100 sm:opacity-0 sm:group-hover:opacity-100'
          }`}
          title={liked ? 'Remove from Favourites' : 'Add to Favourites'}
          aria-label="Toggle favourite"
        >
          <Heart className={`w-4 h-4 ${liked ? 'fill-[var(--accent-primary)]' : ''}`} />
        </button>

        {/* Duration (Hidden on mobile < sm to save space) */}
        <span className="hidden sm:inline-block font-mono text-[11px] sm:text-xs w-9 sm:w-10 text-right text-gray-400">
          {formatTime(track.duration)}
        </span>

        {/* More Actions Dropdown Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Track options"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-48 bg-[#181822] border border-white/10 rounded-xl shadow-2xl py-1 z-30 backdrop-blur-xl text-xs text-gray-200 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-1.5 border-b border-white/5 sm:hidden">
                <p className="text-[10px] text-gray-400 font-mono">
                  Duration: {formatTime(track.duration)}
                </p>
              </div>

              <button
                onClick={() => {
                  setMenuOpen(false);
                  addNextInQueue(track);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/10 text-left transition-colors"
              >
                <Radio className="w-3.5 h-3.5 text-gray-400" />
                Play Next
              </button>

              <button
                onClick={() => {
                  setMenuOpen(false);
                  addToQueue(track);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/10 text-left transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-gray-400" />
                Add to Queue
              </button>

              {onOpenPlaylistModal && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenPlaylistModal(track);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/10 text-left transition-colors"
                >
                  <ListMusic className="w-3.5 h-3.5 text-gray-400" />
                  Add to Playlist...
                </button>
              )}

              <div className="h-px bg-white/10 my-1" />

              <button
                onClick={() => {
                  setMenuOpen(false);
                  toggleFavourite(track.id);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/10 text-left transition-colors"
              >
                <Heart
                  className={`w-3.5 h-3.5 ${
                    liked ? 'text-[var(--accent-primary)] fill-[var(--accent-primary)]' : 'text-gray-400'
                  }`}
                />
                {liked ? 'Remove from Favourites' : 'Add to Favourites'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
