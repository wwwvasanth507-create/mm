import React, { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Music,
  Play,
  Shuffle,
  Search,
  ArrowUpDown,
  Globe,
} from 'lucide-react';
import { getAllTracks } from '@/services/musicService';
import { TrackRow } from '@/components/common/TrackRow';
import { Track } from '@/types/music';
import { useAudio } from '@/context/AudioContext';

type SortOption = 'title' | 'artist' | 'year' | 'duration';

export const SongsPage: React.FC = () => {
  const allTracks = getAllTracks();
  const { playTrack } = useAudio();
  const { onOpenPlaylistModal } = useOutletContext<{ onOpenPlaylistModal: (track: Track) => void }>();

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
        const q = query.toLowerCase();
        const matchesQuery =
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
          <div className="flex items-center gap-2 text-[var(--accent-primary)] mb-1">
            <Music className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-widest">Manual Catalog</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">All Songs</h1>
          <p className="text-sm text-gray-400 mt-1">
            Direct streaming for all tracks configured in <code className="text-gray-300 font-mono text-xs">src/data/music.json</code> ({allTracks.length} songs)
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handlePlayAll}
            disabled={filteredTracks.length === 0}
            className="px-5 py-2.5 rounded-full bg-[var(--accent-primary)] hover:brightness-110 active:scale-95 text-white font-semibold text-xs flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Play All</span>
          </button>

          <button
            onClick={handleShuffleAll}
            disabled={filteredTracks.length === 0}
            className="px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/15 active:scale-95 text-white font-semibold text-xs flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <Shuffle className="w-4 h-4" />
            <span>Shuffle</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-3.5 rounded-2xl border border-white/10 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by title, artist, language, year..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[var(--accent-primary)]"
          />
        </div>

        {/* Language Selector Pills & Sort Dropdown */}
        <div className="flex items-center justify-between w-full md:w-auto gap-3">
          {/* Language pills */}
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5 text-xs overflow-x-auto max-w-xs sm:max-w-none">
            <span className="text-[11px] text-gray-400 px-1 hidden sm:inline flex items-center gap-1">
              <Globe className="w-3 h-3" />
            </span>
            {availableLanguages.map((lang) => (
              <button
                key={lang}
                onClick={() => setSelectedLanguage(lang)}
                className={`px-3 py-1 rounded-lg font-medium capitalize transition-colors ${
                  selectedLanguage === lang
                    ? 'bg-white/20 text-white font-semibold shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {lang === 'all' ? 'All' : lang}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-neutral-900 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-[var(--accent-primary)] cursor-pointer"
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
      <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden p-2">
        {/* Table header */}
        <div className="flex items-center justify-between px-3.5 py-2 text-xs font-semibold text-gray-500 border-b border-white/5 uppercase tracking-wider">
          <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-4">
            <span className="w-6 text-center">#</span>
            <span className="w-11">Cover</span>
            <span>Title & Artist</span>
          </div>
          <div className="hidden md:block flex-1 max-w-[220px] px-2">Album</div>
          <div className="w-24 text-right pr-6">Duration</div>
        </div>

        {/* Rows */}
        {filteredTracks.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">
            {allTracks.length === 0 ? (
              <div>
                <p>No songs added to catalog yet.</p>
                <p className="text-xs text-gray-500 mt-1">Open <code className="text-[var(--accent-primary)] font-mono">src/data/music.json</code> to add your tracks.</p>
              </div>
            ) : (
              <div>
                <p>No songs found matching your filter criteria.</p>
                <button
                  onClick={() => {
                    setQuery('');
                    setSelectedLanguage('all');
                  }}
                  className="mt-2 text-xs text-[var(--accent-primary)] hover:underline"
                >
                  Clear filters
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
