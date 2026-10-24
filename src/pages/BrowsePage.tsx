import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Compass, Play, Globe } from 'lucide-react';
import { getAllTracks } from '@/services/musicService';
import { TrackRow } from '@/components/common/TrackRow';
import { Track } from '@/types/music';
import { useAudio } from '@/context/AudioContext';

interface GenreDefinition {
  name: string;
  query: string[];
  color: string;
  description: string;
}

const GENRE_CARDS: GenreDefinition[] = [
  {
    name: 'All Genres',
    query: [],
    color: 'from-pink-500 to-rose-600',
    description: 'Explore the full sound spectrum',
  },
  {
    name: 'Soulful Melody',
    query: ['melody', 'romantic', 'soulful', 'acoustic'],
    color: 'from-amber-500 to-rose-600',
    description: 'Acoustic strings, violin solos, and heartfelt vocal ballads',
  },
  {
    name: 'Devotional & Chants',
    query: ['devotional', 'classical', 'spiritual'],
    color: 'from-purple-600 to-indigo-700',
    description: 'Ancient chants, Sanskrit tandavams, and divine orchestral power',
  },
  {
    name: 'Action Themes & Rock',
    query: ['action', 'samba', 'rock', 'theme'],
    color: 'from-orange-500 to-red-600',
    description: 'High-octane mass cinematic anthems and electric guitars',
  },
  {
    name: 'Dance Pop & Retro Disco',
    query: ['dance', 'disco', 'pop'],
    color: 'from-blue-600 to-cyan-600',
    description: 'Electrifying club grooves, retro beats, and party vibes',
  },
  {
    name: 'Folk & Root Soul',
    query: ['folk', 'soul'],
    color: 'from-emerald-600 to-teal-700',
    description: 'Earthly acoustics, native percussion, and rustic melodies',
  },
  {
    name: 'Rap & Hip-Hop',
    query: ['rap', 'hip-hop'],
    color: 'from-fuchsia-600 to-indigo-700',
    description: 'Fast flow rhymes, bass punch, and dynamic street beats',
  },
];

export const BrowsePage: React.FC = () => {
  const [selectedGenre, setSelectedGenre] = useState<string>('All Genres');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('All');
  const { onOpenPlaylistModal } = useOutletContext<{ onOpenPlaylistModal: (track: Track) => void }>();
  const { playTrack } = useAudio();

  const allTracks = getAllTracks();

  // Extract unique languages present in catalog
  const availableLanguages = [
    'All',
    ...Array.from(new Set(allTracks.map((t) => t.language).filter(Boolean) as string[])),
  ];

  const currentGenreDef = GENRE_CARDS.find((g) => g.name === selectedGenre);

  const filteredTracks = allTracks.filter((t) => {
    const matchesGenre =
      !currentGenreDef ||
      currentGenreDef.query.length === 0 ||
      currentGenreDef.query.some((q) => t.genre.toLowerCase().includes(q));

    const matchesLanguage =
      selectedLanguage === 'All' ||
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
        <div className="flex items-center gap-2 text-[var(--accent-primary)] mb-1">
          <Compass className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-widest">Explore & Discover</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Browse Music
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-1">
          Explore curated moods, dynamic genres, and regional cinema soundtracks
        </p>
      </div>

      {/* Language Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-xs font-semibold text-gray-400 flex items-center gap-1.5 mr-1 flex-shrink-0">
          <Globe className="w-3.5 h-3.5" />
          Language:
        </span>
        {availableLanguages.map((lang) => (
          <button
            key={lang}
            onClick={() => setSelectedLanguage(lang)}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              selectedLanguage === lang
                ? 'bg-[var(--accent-primary)] text-white font-semibold shadow-md'
                : 'bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/5'
            }`}
          >
            {lang}
          </button>
        ))}
      </div>

      {/* Genre Cards Grid */}
      <section>
        <h2 className="text-base sm:text-lg font-bold text-white mb-3.5">Moods & Genres</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {GENRE_CARDS.map((genre) => {
            const isSelected = selectedGenre === genre.name;
            const count =
              genre.query.length === 0
                ? allTracks.length
                : allTracks.filter((t) =>
                    genre.query.some((q) => t.genre.toLowerCase().includes(q))
                  ).length;

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
                    <h3 className="font-extrabold text-sm sm:text-base text-white tracking-tight leading-snug">
                      {genre.name}
                    </h3>
                    <p className="text-[10px] sm:text-[11px] text-white/80 line-clamp-1 mt-0.5">
                      {genre.description}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-white/90 font-mono">
                    <span>{count} {count === 1 ? 'track' : 'tracks'}</span>
                    {isSelected && (
                      <span className="px-1.5 py-0.5 rounded bg-black/40 backdrop-blur-md text-[9px] font-bold">
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
      <section className="glass-panel p-3.5 sm:p-5 rounded-2xl border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>{selectedGenre}</span>
              {selectedLanguage !== 'All' && (
                <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-gray-300 font-normal">
                  ({selectedLanguage})
                </span>
              )}
              <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-gray-400 font-mono">
                {filteredTracks.length}
              </span>
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Lossless streaming playback from your configured library
            </p>
          </div>

          {filteredTracks.length > 0 && (
            <button
              onClick={() => handlePlayGenre(filteredTracks)}
              className="px-4 py-2 rounded-full bg-[var(--accent-primary)] hover:brightness-110 active:scale-95 text-white font-semibold text-xs inline-flex items-center gap-1.5 shadow-[0_0_16px_var(--accent-glow)] transition-all self-start sm:self-auto"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Play Collection</span>
            </button>
          )}
        </div>

        {filteredTracks.length === 0 ? (
          <div className="py-12 text-center text-gray-500 text-sm">
            No tracks found matching this genre and language combination.
          </div>
        ) : (
          <div className="divide-y divide-white/5">
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
