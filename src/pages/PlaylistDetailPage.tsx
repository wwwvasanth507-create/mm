import React, { useState } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import {
  Play,
  Shuffle,
  ArrowLeft,
  ListMusic,
  Trash2,
  Edit2,
  Clock,
  Music2,
  Plus,
} from 'lucide-react';
import {
  getPlaylistById,
  getTracksByIds,
  resolveArtworkUrl,
} from '@/services/musicService';
import { TrackRow } from '@/components/common/TrackRow';
import { useAudio } from '@/context/AudioContext';
import { formatTime } from '@/utils/formatters';
import { Track } from '@/types/music';
import { PlaylistModal } from '@/components/modals/PlaylistModal';

export const PlaylistDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { playTrack, deletePlaylist, removeTrackFromPlaylist } = useAudio();
  const { onOpenPlaylistModal } = useOutletContext<{ onOpenPlaylistModal: (track: Track) => void }>();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const playlist = id ? getPlaylistById(id) : undefined;

  if (!playlist) {
    return (
      <div className="py-24 text-center text-white space-y-4">
        <ListMusic className="w-16 h-16 mx-auto text-gray-600 animate-pulse" />
        <h2 className="text-2xl font-bold">Playlist Not Found</h2>
        <p className="text-sm text-gray-400">The requested playlist does not exist or has been deleted.</p>
        <button
          onClick={() => navigate('/playlists')}
          className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors"
        >
          Back to Playlists
        </button>
      </div>
    );
  }

  const tracks = getTracksByIds(playlist.trackIds);
  const totalDuration = tracks.reduce((acc, t) => acc + (t.duration || 0), 0);
  const artwork = resolveArtworkUrl(playlist);

  const handlePlay = () => {
    if (tracks.length > 0) {
      playTrack(tracks[0], tracks);
    }
  };

  const handleShuffle = () => {
    if (tracks.length > 0) {
      const shuffled = [...tracks].sort(() => Math.random() - 0.5);
      playTrack(shuffled[0], shuffled);
    }
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${playlist.name}"?`)) {
      deletePlaylist(playlist.id);
      navigate('/playlists');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <button
        onClick={() => navigate('/playlists')}
        className="inline-flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Playlists</span>
      </button>

      {/* Playlist Banner Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6 sm:gap-8 pb-6 border-b border-white/10">
        <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-2xl overflow-hidden shadow-2xl bg-neutral-900 flex-shrink-0 border border-white/10 flex items-center justify-center">
          {playlist.coverUrl ? (
            <img
              src={artwork}
              alt={playlist.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center">
              <Music2 className="w-16 h-16 text-gray-600" />
            </div>
          )}
        </div>

        <div className="flex-1 space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-[var(--accent-primary)] font-mono">
            {playlist.isUserCreated ? 'CUSTOM PLAYLIST' : 'CURATED PLAYLIST'}
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
            {playlist.name}
          </h1>

          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-300">
            <span>{tracks.length} {tracks.length === 1 ? 'song' : 'songs'}</span>
            <span>•</span>
            <span className="flex items-center gap-1 font-mono text-gray-400">
              <Clock className="w-3.5 h-3.5" />
              {formatTime(totalDuration)}
            </span>
          </div>

          {playlist.description && (
            <p className="text-xs sm:text-sm text-gray-400 max-w-xl leading-relaxed">
              {playlist.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-3">
            <button
              onClick={handlePlay}
              disabled={tracks.length === 0}
              className="px-6 py-2.5 rounded-full bg-[var(--accent-primary)] hover:brightness-110 active:scale-95 text-white font-bold text-xs flex items-center gap-2 shadow-lg disabled:opacity-50 transition-all"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Play</span>
            </button>

            <button
              onClick={handleShuffle}
              disabled={tracks.length === 0}
              className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/15 active:scale-95 text-white font-semibold text-xs flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <Shuffle className="w-4 h-4" />
              <span>Shuffle</span>
            </button>

            {playlist.isUserCreated && (
              <>
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="p-2.5 rounded-full bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white transition-colors"
                  title="Edit Playlist"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                <button
                  onClick={handleDelete}
                  className="p-2.5 rounded-full bg-white/5 hover:bg-rose-500/20 text-gray-300 hover:text-rose-400 transition-colors"
                  title="Delete Playlist"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tracklist */}
      <div className="space-y-1">
        <h2 className="text-base font-bold text-white mb-3">Songs</h2>
        {tracks.length === 0 ? (
          <div className="py-16 text-center text-gray-500 text-sm space-y-3">
            <p>This playlist has no songs yet.</p>
            <button
              onClick={() => navigate('/songs')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Browse Songs to Add
            </button>
          </div>
        ) : (
          tracks.map((track, idx) => (
            <div key={track.id} className="relative group/pl">
              <TrackRow
                track={track}
                index={idx}
                contextQueue={tracks}
                onOpenPlaylistModal={onOpenPlaylistModal}
              />
              {playlist.isUserCreated && (
                <button
                  onClick={() => removeTrackFromPlaylist(playlist.id, track.id)}
                  className="absolute right-12 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-500 hover:text-rose-400 opacity-0 group-hover/pl:opacity-100 transition-opacity"
                  title="Remove from this playlist"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {playlist.isUserCreated && (
        <PlaylistModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          initialName={playlist.name}
          initialDescription={playlist.description}
          playlistId={playlist.id}
        />
      )}
    </div>
  );
};
