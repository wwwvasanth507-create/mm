import React, { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Play,
  Shuffle,
  Search,
  ArrowUpDown,
  Globe,
  Plus,
  X,
  Sparkles,
} from 'lucide-react';
import { getAllTracks } from '@/services/musicService';
import { TrackRow } from '@/components/common/TrackRow';
import { Track } from '@/types/music';
import { useAudio } from '@/context/AudioContext';

type SortOption = 'title' | 'artist' | 'year' | 'duration';

export const SongsPage: React.FC = () => {
  const [allTracks, setAllTracks] = useState(() => getAllTracks());
  const { playTrack } = useAudio();
  const { onOpenPlaylistModal, onOpenAddSongModal } = useOutletContext<{
    onOpenPlaylistModal: (track: Track) => void;
    onOpenAddSongModal?: () => void;
  }>();

  React.useEffect(() => {
    const handleUpdate = () => setAllTracks(getAllTracks());
    window.addEventListener('wavemusic_tracks_updated', handleUpdate);
    return () => window.removeEventListener('wavemusic_tracks_updated', handleUpdate);
  }, []);

  const [query, setQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('title');

  // Extract available languages
  const availableLanguages = [
    'all',
    ...Array.from(new Set(allTracks.map((t) => t.language).filter(Boolean) as string[])),
  ];

  const filteredTracks = useMemo(() => {
    return allTracks
      .filter((track) => {
        const q = query.toLowerCase().trim();
        if (!q && selectedLanguage === 'all') return true;

        const matchesQuery =
          !q ||
          track.title.toLowerCase().includes(q) ||
          track.artist.toLowerCase().includes(q) ||
          track.album.toLowerCase().includes(q) ||
          track.genre.toLowerCase().includes(q) ||
          (track.language && track.language.toLowerCase().includes(q)) ||
          String(track.year || '').includes(q);

        const matchesLanguage =
          selectedLanguage === 'all'
            ? true
            : track.language?.toLowerCase() === selectedLanguage.toLowerCase();

        return matchesQuery && matchesLanguage;
      })
      .sort((a, b) => {
        if (sortBy === 'title') return a.title.localeCompare(b.title);
        if (sortBy === 'artist') return a.artist.localeCompare(b.artist);
        if (sortBy === 'year') return (b.year || 0) - (a.year || 0);
        if (sortBy === 'duration') return b.duration - a.duration;
        return 0;
      });
  }, [allTracks, query, selectedLanguage, sortBy]);

  const handlePlayAll = () => {
    if (filteredTracks.length > 0) {
      playTrack(filteredTracks[0], filteredTracks);
    }
  };

  const handleShuffleAll = () => {
    if (filteredTracks.length > 0) {
      const shuffled = [...filteredTracks].sort(() => Math.random() - 0.5);
      playTrack(shuffled[0], shuffled);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[var(--accent-primary)] mb-1.5">
            <Sparkles className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-widest">
              Audio Collection
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            All Songs
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            {allTracks.length} tracks • Mastered for Dolby Atmos & Lossless Hi-Fi
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
          <button
            onClick={handlePlayAll}
            disabled={filteredTracks.length === 0}
            className="px-5 py-2.5 rounded-full bg-[var(--accent-primary)] hover:brightness-110 active:scale-95 text-white font-bold text-xs flex items-center gap-2 shadow-[0_0_20px_var(--accent-glow)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Play All</span>
          </button>

          <button
            onClick={handleShuffleAll}
            disabled={filteredTracks.length === 0}
            className="px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/15 active:scale-95 text-white font-semibold text-xs flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>Shuffle</span>
          </button>

          <button
            onClick={() => onOpenAddSongModal?.()}
            className="px-4 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 hover:text-white font-semibold text-xs flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
            <span>Add Song</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-3 sm:p-3.5 rounded-2xl border border-white/10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-full md:max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, artist, album..."
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Language Selector Pills & Sort Dropdown */}
        <div className="flex items-center justify-between md:justify-end gap-2.5 overflow-x-auto pb-1 md:pb-0">
          {/* Language pills */}
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5 text-xs flex-shrink-0">
            <span className="text-[11px] text-gray-400 px-1.5 flex items-center gap-1">
              <Globe className="w-3 h-3" />
            </span>
            {availableLanguages.map((lang) => (
              <button
                key={lang}
                onClick={() => setSelectedLanguage(lang)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-all ${
                  selectedLanguage === lang
                    ? 'bg-[var(--accent-primary)] text-white font-semibold shadow-sm'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {lang === 'all' ? 'All' : lang}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 text-xs text-gray-400 flex-shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-neutral-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[var(--accent-primary)] cursor-pointer"
            >
              <option value="title">Title (A-Z)</option>
              <option value="artist">Artist</option>
              <option value="year">Release Year</option>
              <option value="duration">Duration</option>
            </select>
          </div>
        </div>
      </div>

      {/* Song Table */}
      <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden p-1.5 sm:p-2">
        {/* Table header (Desktop only to prevent awkward column squishing on mobile) */}
        <div className="hidden sm:flex items-center justify-between px-3.5 py-2 text-[11px] font-bold text-gray-500 border-b border-white/5 uppercase tracking-wider">
          <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-4">
            <span className="w-7 text-center">#</span>
            <span className="w-12">Cover</span>
            <span>Title & Artist</span>
          </div>
          <div className="hidden md:block flex-1 max-w-[200px] lg:max-w-[260px] px-3">Album</div>
          <div className="w-20 text-right pr-6">Duration</div>
        </div>

        {/* Mobile quick count bar */}
        <div className="sm:hidden px-3 py-1.5 text-[11px] font-medium text-gray-400 border-b border-white/5 flex items-center justify-between">
          <span>{filteredTracks.length} {filteredTracks.length === 1 ? 'song' : 'songs'}</span>
          {selectedLanguage !== 'all' && (
            <span className="text-[var(--accent-primary)] font-mono">{selectedLanguage}</span>
          )}
        </div>

        {/* Rows */}
        {filteredTracks.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">
            {allTracks.length === 0 ? (
              <div className="space-y-3">
                <p className="text-base font-semibold text-white">No songs found in catalog.</p>
                <button
                  onClick={() => onOpenAddSongModal?.()}
                  className="mt-2 px-5 py-2.5 rounded-full bg-[var(--accent-primary)] hover:brightness-110 active:scale-95 text-white font-bold text-xs inline-flex items-center gap-2 shadow-[0_0_16px_var(--accent-glow)] transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add First Song</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-white font-medium">No songs matching &quot;{query}&quot;</p>
                <p className="text-xs text-gray-500">Try adjusting your search terms or filters.</p>
                <button
                  onClick={() => {
                    setQuery('');
                    setSelectedLanguage('all');
                  }}
                  className="mt-2 px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-xs text-[var(--accent-primary)] font-semibold transition-colors"
                >
                  Clear all filters
                </button>
              </div>
            )}
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
      </div>
    </div>
  );
};
