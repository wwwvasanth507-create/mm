import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play } from 'lucide-react';
import { Artist } from '@/types/music';
import { useAudio } from '@/context/AudioContext';
import { getTracksByIds, resolveArtworkUrl } from '@/services/musicService';

interface ArtistCardProps {
  artist: Artist;
}

export const ArtistCard: React.FC<ArtistCardProps> = ({ artist }) => {
  const navigate = useNavigate();
  const { playTrack } = useAudio();
  const avatar = resolveArtworkUrl(artist);

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const tracks = getTracksByIds(artist.topTrackIds);
    if (tracks.length > 0) {
      playTrack(tracks[0], tracks);
    }
  };

  return (
    <div
      onClick={() => navigate(`/artist/${artist.id}`)}
      className="glass-card group relative p-3 rounded-2xl cursor-pointer flex flex-col items-center text-center transition-all duration-200"
    >
      <div className="relative w-32 h-32 md:w-36 md:h-36 rounded-full overflow-hidden mb-3 bg-neutral-900 shadow-xl border border-white/5">
        <img
          src={avatar}
          alt={artist.name}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <button
            onClick={handlePlay}
            className="w-11 h-11 rounded-full bg-[var(--accent-primary)] text-white flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-transform"
            title={`Play top songs by ${artist.name}`}
          >
            <Play className="w-5 h-5 fill-white text-white ml-0.5" />
          </button>
        </div>
      </div>

      <h3 className="font-semibold text-sm text-white truncate max-w-full group-hover:text-[var(--accent-primary)] transition-colors">
        {artist.name}
      </h3>
      <p className="text-xs text-gray-400 truncate mt-0.5">{artist.genre}</p>
      <span className="text-[11px] text-gray-500 mt-1">{artist.monthlyListeners} monthly</span>
    </div>
  );
};
