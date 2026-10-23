import React from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { Play, Shuffle, ArrowLeft, Disc3, Clock } from 'lucide-react';
import { getAlbumById, getTracksByIds, resolveArtworkUrl } from '@/services/musicService';
import { TrackRow } from '@/components/common/TrackRow';
import { useAudio } from '@/context/AudioContext';
import { formatTime } from '@/utils/formatters';
import { Track } from '@/types/music';

export const AlbumDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { playTrack } = useAudio();
  const { onOpenPlaylistModal } = useOutletContext<{ onOpenPlaylistModal: (track: Track) => void }>();

  const album = id ? getAlbumById(id) : undefined;

  if (!album) {
    return (
      <div className="py-24 text-center text-white space-y-4">
        <Disc3 className="w-16 h-16 mx-auto text-gray-600 animate-pulse" />
        <h2 className="text-2xl font-bold">Album Not Found</h2>
        <p className="text-sm text-gray-400">The requested album could not be found.</p>
        <button
          onClick={() => navigate('/albums')}
          className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors"
        >
          Back to Albums
        </button>
      </div>
    );
  }

  const tracks = getTracksByIds(album.trackIds);
  const totalDuration = tracks.reduce((acc, t) => acc + (t.duration || 0), 0);
  const artwork = resolveArtworkUrl(album);

  const handlePlayAlbum = () => {
    if (tracks.length > 0) {
      playTrack(tracks[0], tracks);
    }
  };

  const handleShuffleAlbum = () => {
    if (tracks.length > 0) {
      const shuffled = [...tracks].sort(() => Math.random() - 0.5);
      playTrack(shuffled[0], shuffled);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Back button */}
      <button
        onClick={() => navigate('/albums')}
        className="inline-flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Albums</span>
      </button>

      {/* Album Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6 sm:gap-8 pb-6 border-b border-white/10">
        <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-2xl overflow-hidden shadow-2xl bg-neutral-900 flex-shrink-0 border border-white/10">
          <img
            src={artwork}
            alt={album.title}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1 space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-[var(--accent-primary)] font-mono">
            ALBUM
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
            {album.title}
          </h1>

          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-300">
            <span className="font-semibold text-white text-sm">{album.artist}</span>
            <span>•</span>
            <span>{album.releaseYear}</span>
            <span>•</span>
            <span>{tracks.length} {tracks.length === 1 ? 'song' : 'songs'}</span>
            <span>•</span>
            <span className="flex items-center gap-1 font-mono text-gray-400">
              <Clock className="w-3.5 h-3.5" />
              {formatTime(totalDuration)}
            </span>
          </div>

          {album.description && (
            <p className="text-xs sm:text-sm text-gray-400 max-w-xl leading-relaxed">
              {album.description}
            </p>
          )}

          <div className="flex items-center gap-3 pt-3">
            <button
              onClick={handlePlayAlbum}
              disabled={tracks.length === 0}
              className="px-6 py-2.5 rounded-full bg-[var(--accent-primary)] hover:brightness-110 active:scale-95 text-white font-bold text-xs flex items-center gap-2 shadow-lg disabled:opacity-50 transition-all"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Play Album</span>
            </button>

            <button
              onClick={handleShuffleAlbum}
              disabled={tracks.length === 0}
              className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/15 active:scale-95 text-white font-semibold text-xs flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <Shuffle className="w-4 h-4" />
              <span>Shuffle</span>
            </button>
          </div>
        </div>
      </div>

      {/* Album Tracklist */}
      <div className="space-y-1">
        <h2 className="text-base font-bold text-white mb-3">Tracklist</h2>
        {tracks.map((track, idx) => (
          <TrackRow
            key={track.id}
            track={track}
            index={idx}
            showAlbum={false}
            contextQueue={tracks}
            onOpenPlaylistModal={onOpenPlaylistModal}
          />
        ))}
      </div>
    </div>
  );
};
