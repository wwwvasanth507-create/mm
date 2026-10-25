import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Heart,
  MoreHorizontal,
  Plus,
  ListMusic,
  Radio,
  Clock,
  Film,
  Download,
  CheckCircle2,
  Edit,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { Track } from '@/types/music';
import { useAudio } from '@/context/AudioContext';
import { resolveArtworkUrl, deleteUserTrack } from '@/services/musicService';
import {
  isTrackDownloaded,
  downloadTrack,
  deleteDownloadedTrack,
} from '@/services/downloadService';
import { formatTime } from '@/utils/formatters';

interface TrackRowProps {
  track: Track;
  index?: number;
  showCover?: boolean;
  showAlbum?: boolean;
  showIndex?: boolean;
  contextQueue?: Track[];
  onOpenPlaylistModal?: (track: Track) => void;
  onEditTrack?: (track: Track) => void;
}

export const TrackRow: React.FC<TrackRowProps> = ({
  track,
  showCover = true,
  contextQueue,
  onOpenPlaylistModal,
  onEditTrack,
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

  const [isDownloaded, setIsDownloaded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  useEffect(() => {
    let isMounted = true;
    isTrackDownloaded(track.id).then((dl) => {
      if (isMounted) setIsDownloaded(dl);
    });

    const handleDlCompleted = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.trackId === track.id) {
        setIsDownloaded(true);
        setIsDownloading(false);
      }
    };

    const handleDlDeleted = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.trackId === track.id) {
        setIsDownloaded(false);
      }
    };

    window.addEventListener('wavemusic_download_completed', handleDlCompleted);
    window.addEventListener('wavemusic_download_deleted', handleDlDeleted);

    return () => {
      isMounted = false;
      window.removeEventListener('wavemusic_download_completed', handleDlCompleted);
      window.removeEventListener('wavemusic_download_deleted', handleDlDeleted);
    };
  }, [track.id]);

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

  const handleDownloadClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDownloading) return;

    if (isDownloaded) {
      if (window.confirm(`Remove offline download for "${track.title}"?`)) {
        await deleteDownloadedTrack(track.id);
        setIsDownloaded(false);
      }
    } else {
      setIsDownloading(true);
      setDownloadProgress(0);
      const res = await downloadTrack(track, (pct) => setDownloadProgress(pct));
      setIsDownloading(false);
      if (res.success) {
        setIsDownloaded(true);
      } else if (res.error && !res.error.includes('cancel')) {
        alert(res.error);
      }
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    if (window.confirm(`Are you sure you want to remove "${track.title}" from your library?`)) {
      deleteUserTrack(track.id);
    }
  };

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
                <span className="w-3 h-3 rounded-full bg-[var(--accent-primary)] shadow-[0_0_10px_var(--accent-primary)] animate-pulse" />
              </div>
            ) : isCurrent ? (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <Play className="w-4 h-4 fill-[var(--accent-primary)] text-[var(--accent-primary)]" />
              </div>
            ) : null}
          </div>
        )}

        {/* Song Name & Artist */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
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
            {track.videoUrl && (
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 flex-shrink-0">
                VIDEO
              </span>
            )}
            {isDownloaded && (
              <span
                title="Downloaded (Offline Available)"
                className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex-shrink-0 inline-flex items-center gap-1"
              >
                <CheckCircle2 className="w-2.5 h-2.5" />
                OFFLINE
              </span>
            )}
          </div>

          <p className="text-xs sm:text-sm text-gray-400 truncate mt-0.5">
            {track.artist}
          </p>
        </div>
      </div>

      {/* Right Action Icons: Download button + Three-Dot Menu */}
      <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={handleDownloadClick}
          className={`p-2 rounded-full transition-colors ${
            isDownloaded
              ? 'text-emerald-400 hover:bg-emerald-500/10'
              : isDownloading
              ? 'text-cyan-400'
              : 'text-gray-400 hover:text-white hover:bg-white/10 opacity-70 group-hover:opacity-100'
          }`}
          title={
            isDownloaded
              ? 'Offline Available (Click to remove)'
              : isDownloading
              ? `Downloading ${downloadProgress}%`
              : 'Download for offline playback'
          }
        >
          {isDownloading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : isDownloaded ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <Download className="w-4 h-4" />
          )}
        </button>

        <div className="relative" ref={menuRef}>
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
              <div className="px-3.5 py-2 border-b border-white/10">
                <p className="font-bold text-white truncate text-xs">{track.title}</p>
                <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-mono mt-0.5">
                  <Clock className="w-3 h-3 text-gray-500" />
                  <span>Duration: {formatTime(track.duration)}</span>
                </div>
              </div>

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

              <button
                onClick={(e) => {
                  setMenuOpen(false);
                  handleDownloadClick(e);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-white/10 text-left transition-colors"
              >
                <Download className="w-4 h-4 text-cyan-400" />
                <span>{isDownloaded ? 'Remove Offline Download' : 'Download Offline'}</span>
              </button>

              {onEditTrack && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onEditTrack(track);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-white/10 text-left transition-colors text-amber-300"
                >
                  <Edit className="w-4 h-4 text-amber-400" />
                  <span>Edit Metadata</span>
                </button>
              )}

              {track.videoUrl && (
                <a
                  href={track.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-white/10 text-left transition-colors text-rose-300"
                >
                  <Film className="w-4 h-4 text-rose-400" />
                  <span>Watch Video Song</span>
                </a>
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

              <button
                onClick={handleDeleteClick}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-rose-500/15 text-left transition-colors text-rose-400"
              >
                <Trash2 className="w-4 h-4" />
                <span>Remove from Library</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};