import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play } from 'lucide-react';
import { Album } from '@/types/music';
import { useAudio } from '@/context/AudioContext';
import { getTracksByIds, resolveArtworkUrl } from '@/services/musicService';

interface AlbumCardProps {
  album: Album;
}

export const AlbumCard: React.FC<AlbumCardProps> = ({ album }) => {
  const navigate = useNavigate();
  const { playTrack } = useAudio();
  const artwork = resolveArtworkUrl(album);

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const tracks = getTracksByIds(album.trackIds);
    if (tracks.length > 0) {
      playTrack(tracks[0], tracks);
    }
  };

  return (
    <div
      onClick={() => navigate(`/album/${album.id}`)}
      className="glass-card group relative p-3 rounded-2xl cursor-pointer flex flex-col transition-all duration-200"
    >
      <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-3 bg-neutral-900 shadow-lg">
        <img
          src={artwork}
          alt={album.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Hover quick play floating pill */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end justify-end p-3">
          <button
            onClick={handlePlay}
            className="w-11 h-11 rounded-full bg-[var(--accent-primary)] text-white flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-transform"
            title={`Play ${album.title}`}
          >
            <Play className="w-5 h-5 fill-white text-white ml-0.5" />
          </button>
        </div>
      </div>

      <div className="flex flex-col">
        <h3 className="font-semibold text-sm text-white truncate group-hover:text-[var(--accent-primary)] transition-colors">
          {album.title}
        </h3>
        <p className="text-xs text-gray-400 truncate mt-0.5">{album.artist}</p>
        <div className="flex items-center gap-2 mt-2 text-[11px] text-gray-500">
          <span>{album.releaseYear}</span>
          <span>•</span>
          <span>{album.trackCount} {album.trackCount === 1 ? 'track' : 'tracks'}</span>
        </div>
      </div>
    </div>
  );
};
