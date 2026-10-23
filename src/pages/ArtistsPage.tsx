import React from 'react';
import { Users } from 'lucide-react';
import { getAllArtists } from '@/services/musicService';
import { ArtistCard } from '@/components/common/ArtistCard';

export const ArtistsPage: React.FC = () => {
  const artists = getAllArtists();

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <div className="flex items-center gap-2 text-[var(--accent-primary)] mb-1">
          <Users className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-widest">Performers</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Artists</h1>
        <p className="text-sm text-gray-400 mt-1">
          Featured producers, composers, and sound sculptors ({artists.length})
        </p>
      </div>

      {artists.length === 0 ? (
        <div className="py-20 text-center text-gray-400 text-sm glass-card rounded-2xl border border-white/5 p-8">
          <p>No artists found yet.</p>
          <p className="text-xs text-gray-500 mt-1">Artists are automatically generated when you add songs with an artist name to music.json.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {artists.map((artist) => (
            <ArtistCard key={artist.id} artist={artist} />
          ))}
        </div>
      )}
    </div>
  );
};
