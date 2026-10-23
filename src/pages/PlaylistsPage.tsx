import React, { useState } from 'react';
import { ListMusic, Plus, Sparkles, FolderPlus } from 'lucide-react';
import { getCuratedPlaylists } from '@/services/musicService';
import { PlaylistCard } from '@/components/common/PlaylistCard';
import { useAudio } from '@/context/AudioContext';
import { PlaylistModal } from '@/components/modals/PlaylistModal';

export const PlaylistsPage: React.FC = () => {
  const curated = getCuratedPlaylists();
  const { userPlaylists } = useAudio();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Page Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[var(--accent-primary)] mb-1">
            <ListMusic className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-widest">Collections</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Playlists</h1>
          <p className="text-sm text-gray-400 mt-1">
            Curated moods, audio showcases, and your personal custom playlists
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2.5 rounded-full bg-[var(--accent-primary)] hover:brightness-110 active:scale-95 text-white font-semibold text-xs flex items-center gap-2 shadow-lg transition-all"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Playlist</span>
        </button>
      </div>

      {/* User Playlists Section */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <FolderPlus className="w-5 h-5 text-gray-300" />
          <h2 className="text-xl font-bold text-white">Your Playlists</h2>
          <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-gray-400 font-mono">
            {userPlaylists.length}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {/* Create New Playlist Card */}
          <div
            onClick={() => setIsModalOpen(true)}
            className="glass-card group p-4 rounded-2xl cursor-pointer flex flex-col items-center justify-center text-center aspect-square border-2 border-dashed border-white/15 hover:border-[var(--accent-primary)] transition-all"
          >
            <div className="w-12 h-12 rounded-full bg-white/5 group-hover:bg-[var(--accent-primary)]/20 text-gray-400 group-hover:text-[var(--accent-primary)] flex items-center justify-center transition-colors mb-2">
              <Plus className="w-6 h-6 stroke-[2.5]" />
            </div>
            <p className="font-bold text-sm text-white group-hover:text-[var(--accent-primary)] transition-colors">
              Create Playlist
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5">Add your custom tracks</p>
          </div>

          {userPlaylists.map((playlist) => (
            <PlaylistCard key={playlist.id} playlist={playlist} />
          ))}
        </div>
      </section>

      {/* Curated Playlists Section */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-[var(--accent-primary)]" />
          <h2 className="text-xl font-bold text-white">Curated Collections</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {curated.map((playlist) => (
            <PlaylistCard key={playlist.id} playlist={playlist} />
          ))}
        </div>
      </section>

      <PlaylistModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};
