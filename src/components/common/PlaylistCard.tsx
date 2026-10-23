import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Music2 } from 'lucide-react';
import { Playlist } from '@/types/music';
import { useAudio } from '@/context/AudioContext';
import { getTracksByIds, resolveArtworkUrl } from '@/services/musicService';

interface PlaylistCardProps {
  playlist: Playlist;
}

export const PlaylistCard: React.FC<PlaylistCardProps> = ({ playlist }) => {
  const navigate = useNavigate();
  const { playTrack } = useAudio();
  const artwork = resolveArtworkUrl(playlist);

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const tracks = getTracksByIds(playlist.trackIds);
    if (tracks.length > 0) {
      playTrack(tracks[0], tracks);
    }
  };

  return (
    <div
      onClick={() => navigate(`/playlist/${playlist.id}`)}
      className="glass-card group relative p-3 rounded-2xl cursor-pointer flex flex-col transition-all duration-200"
    >
      <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-3 bg-neutral-900 shadow-lg flex items-center justify-center">
        {playlist.coverUrl ? (
          <img
            src={artwork}
            alt={playlist.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center">
            <Music2 className="w-12 h-12 text-gray-600" />
          </div>
        )}

        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end justify-end p-3">
          <button
            onClick={handlePlay}
            disabled={playlist.trackIds.length === 0}
            className="w-11 h-11 rounded-full bg-[var(--accent-primary)] text-white flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
            title={`Play ${playlist.name}`}
          >
            <Play className="w-5 h-5 fill-white text-white ml-0.5" />
          </button>
        </div>
      </div>

      <div className="flex flex-col">
        <h3 className="font-semibold text-sm text-white truncate group-hover:text-[var(--accent-primary)] transition-colors">
          {playlist.name}
        </h3>
        <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{playlist.description || 'Custom playlist'}</p>
        <span className="text-[11px] text-gray-500 mt-2">
          {playlist.trackIds.length} {playlist.trackIds.length === 1 ? 'track' : 'tracks'}
        </span>
      </div>
    </div>
  );
};
