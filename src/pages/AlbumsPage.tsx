import React from 'react';
import { Disc3 } from 'lucide-react';
import { getAllAlbums } from '@/services/musicService';
import { AlbumCard } from '@/components/common/AlbumCard';

export const AlbumsPage: React.FC = () => {
  const albums = getAllAlbums();

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <div className="flex items-center gap-2 text-[var(--accent-primary)] mb-1">
          <Disc3 className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-widest">Discography</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Albums</h1>
        <p className="text-sm text-gray-400 mt-1">
          Complete conceptual albums and high fidelity releases ({albums.length})
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {albums.map((album) => (
          <AlbumCard key={album.id} album={album} />
        ))}
      </div>
    </div>
  );
};
