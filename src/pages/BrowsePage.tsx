import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Compass, Play, Globe } from 'lucide-react';
import { getAllTracks } from '@/services/musicService';
import { TrackRow } from '@/components/common/TrackRow';
import { Track } from '@/types/music';
import { useAudio } from '@/context/AudioContext';

const GENRE_CARDS = [
  {
    name: 'All Genres',
    color: 'from-pink-500 to-rose-600',
    description: 'Explore the full sound spectrum',
  },
  {
    name: 'Melody',
    color: 'from-amber-500 to-rose-600',
    description: 'Soulful melodies, acoustic strings, and heartfelt vocals',
  },
  {
    name: 'Classical Fusion',
    color: 'from-purple-600 to-indigo-700',
    description: 'Traditional ragas fused with modern orchestration',
  },
  {
    name: 'Ambient Electronic',
    color: 'from-indigo-600 to-purple-800',
    description: 'Expansive spatial reverbs and warm analog textures',
  },
  {
    name: 'Deep House',
    color: 'from-blue-600 to-cyan-600',
    description: 'Hypnotic repetitive 4/4 beats for late night focus',
  },
  {
    name: 'Synthwave',
    color: 'from-orange-500 to-red-600',
    description: 'Neon boulevards, retro synthesizers, and driving arpeggiators',
  },
  {
    name: 'Progressive Trance',
    color: 'from-fuchsia-600 to-indigo-700',
    description: 'Climbing melodic crescendos and energetic rhythms',
  },
];

export const BrowsePage: React.FC = () => {
  const [selectedGenre, setSelectedGenre] = useState<string>('All Genres');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('All Languages');
  const { onOpenPlaylistModal } = useOutletContext<{ onOpenPlaylistModal: (track: Track) => void }>();
  const { playTrack } = useAudio();

  const allTracks = getAllTracks();

  // Extract unique languages present in catalog
  const availableLanguages = [
    'All Languages',
    ...Array.from(new Set(allTracks.map((t) => t.language).filter(Boolean) as string[])),
  ];

  const filteredTracks = allTracks.filter((t) => {
    const matchesGenre =
      selectedGenre === 'All Genres' ||
      t.genre.toLowerCase().includes(selectedGenre.toLowerCase());

    const matchesLanguage =
      selectedLanguage === 'All Languages' ||
      (t.language && t.language.toLowerCase() === selectedLanguage.toLowerCase());

    return matchesGenre && matchesLanguage;
  });

  const handlePlayGenre = (genreTracks: Track[]) => {
    if (genreTracks.length > 0) {
      playTrack(genreTracks[0], genreTracks);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Page Title */}
      <div>
        <div className="flex items-center gap-2.5 text-[var(--accent-primary)] mb-1">
          <Compass className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-widest">Explore & Discover</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Browse Music</h1>
        <p className="text-sm text-gray-400 mt-1">
          Curated genres, atmospheric moods, and languages across your manual catalog
        </p>
      </div>

      {/* Language Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-gray-400 flex items-center gap-1.5 mr-1">
          <Globe className="w-3.5 h-3.5" />
          Language:
        </span>
        {availableLanguages.map((lang) => (
          <button
            key={lang}
            onClick={() => setSelectedLanguage(lang)}
            className={`px-3 py-1 rounded-xl text-xs font-medium transition-colors ${
              selectedLanguage === lang
                ? 'bg-[var(--accent-primary)] text-white shadow-md'
                : 'bg-white/5 hover:bg-white/10 text-gray-300'
            }`}
          >
            {lang}
          </button>
        ))}
      </div>

      {/* Genre Cards Grid */}
      <section>
        <h2 className="text-lg font-bold text-white mb-4">Moods & Genres</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {GENRE_CARDS.map((genre) => {
            const isSelected = selectedGenre === genre.name;
            const count =
              genre.name === 'All Genres'
                ? allTracks.length
                : allTracks.filter((t) => t.genre.toLowerCase().includes(genre.name.toLowerCase())).length;

            return (
              <div
                key={genre.name}
                onClick={() => setSelectedGenre(genre.name)}
                className={`relative overflow-hidden p-4 rounded-2xl cursor-pointer transition-all duration-200 bg-gradient-to-br ${
                  genre.color
                } ${
                  isSelected
                    ? 'ring-2 ring-white scale-[1.02] shadow-2xl'
                    : 'opacity-85 hover:opacity-100 hover:scale-[1.01]'
                }`}
              >
                <div className="relative z-10 flex flex-col justify-between h-24">
                  <div>
                    <h3 className="font-extrabold text-base text-white tracking-tight leading-snug">
                      {genre.name}
                    </h3>
                    <p className="text-[11px] text-white/80 line-clamp-1 mt-0.5">
                      {genre.description}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-white/90 font-mono">
                    <span>{count} {count === 1 ? 'track' : 'tracks'}</span>
                    {isSelected && (
                      <span className="px-1.5 py-0.5 rounded bg-black/30 backdrop-blur-md text-[10px] font-bold">
                        ACTIVE
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Filtered Tracks Section */}
      <section className="glass-panel p-5 rounded-2xl border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>{selectedGenre}</span>
              {selectedLanguage !== 'All Languages' && (
                <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-gray-300 font-normal">
                  ({selectedLanguage})
                </span>
              )}
              <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-gray-400 font-mono">
                {filteredTracks.length}
              </span>
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Direct progressive audio playback from your manual catalog URLs
            </p>
          </div>

          {filteredTracks.length > 0 && (
            <button
              onClick={() => handlePlayGenre(filteredTracks)}
              className="px-4 py-2 rounded-full bg-[var(--accent-primary)] hover:brightness-110 active:scale-95 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Play All</span>
            </button>
          )}
        </div>

        {filteredTracks.length === 0 ? (
          <div className="py-12 text-center text-gray-500 text-sm">
            No tracks found matching this genre and language combination.
          </div>
        ) : (
          <div className="space-y-1">
            {filteredTracks.map((track, idx) => (
              <TrackRow
                key={track.id}
                track={track}
                index={idx}
                contextQueue={filteredTracks}
                onOpenPlaylistModal={onOpenPlaylistModal}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
