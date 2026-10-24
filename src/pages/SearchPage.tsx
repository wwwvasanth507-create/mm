import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useOutletContext } from 'react-router-dom';
import { Search, Play, X, Disc3, Users, ListMusic } from 'lucide-react';
import {
  getAllTracks,
  getAllAlbums,
  getAllArtists,
  getCuratedPlaylists,
  resolveArtworkUrl,
} from '@/services/musicService';
import { TrackRow } from '@/components/common/TrackRow';
import { AlbumCard } from '@/components/common/AlbumCard';
import { ArtistCard } from '@/components/common/ArtistCard';
import { PlaylistCard } from '@/components/common/PlaylistCard';
import { Track } from '@/types/music';
import { useAudio } from '@/context/AudioContext';

const QUICK_TAGS = [
  'A.R. Rahman',
  'Anirudh',
  'Govind Vasantha',
  'G. V. Prakash',
  'Melody',
  'Ramayana',
  '96',
  'Coolie',
  'Kantara',
];

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get('q') || '';
  const [inputValue, setInputValue] = useState(urlQuery);

  const { playTrack } = useAudio();
  const { onOpenPlaylistModal } = useOutletContext<{ onOpenPlaylistModal: (track: Track) => void }>();

  // Sync state if URL changes
  useEffect(() => {
    setInputValue(urlQuery);
  }, [urlQuery]);

  const handleInputChange = (val: string) => {
    setInputValue(val);
    if (val.trim()) {
      setSearchParams({ q: val.trim() });
    } else {
      setSearchParams({});
    }
  };

  const handleClear = () => {
    setInputValue('');
    setSearchParams({});
  };

  const query = inputValue.trim().toLowerCase();

  const allTracks = getAllTracks();
  const allAlbums = getAllAlbums();
  const allArtists = getAllArtists();
  const allPlaylists = getCuratedPlaylists();

  const results = useMemo(() => {
    if (!query) {
      return { tracks: [], albums: [], artists: [], playlists: [], topResult: null };
    }

    const tracks = allTracks.filter(
      (t) =>
        t.title.toLowerCase().includes(query) ||
        t.artist.toLowerCase().includes(query) ||
        t.album.toLowerCase().includes(query) ||
        t.genre.toLowerCase().includes(query) ||
        (t.language && t.language.toLowerCase().includes(query)) ||
        String(t.year || '').includes(query)
    );

    const albums = allAlbums.filter(
      (a) =>
        a.title.toLowerCase().includes(query) ||
        a.artist.toLowerCase().includes(query) ||
        a.genre.toLowerCase().includes(query)
    );

    const artists = allArtists.filter(
      (ar) =>
        ar.name.toLowerCase().includes(query) ||
        ar.genre.toLowerCase().includes(query)
    );

    const playlists = allPlaylists.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
    );

    // Top result calculation
    let topResult: Track | null = tracks.length > 0 ? tracks[0] : null;

    return { tracks, albums, artists, playlists, topResult };
  }, [allTracks, allAlbums, allArtists, allPlaylists, query]);

  const hasResults =
    results.tracks.length > 0 ||
    results.albums.length > 0 ||
    results.artists.length > 0 ||
    results.playlists.length > 0;

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Prominent Search Bar (Works on all devices, especially mobile) */}
      <div className="space-y-3">
        <div className="relative w-full">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Search songs, artists, albums, or genres..."
            autoFocus
            className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-sm md:text-base text-white placeholder-gray-500 focus:outline-none focus:border-[var(--accent-primary)] focus:bg-white/10 focus:ring-1 focus:ring-[var(--accent-primary)] shadow-lg transition-all"
          />
          {inputValue && (
            <button
              onClick={handleClear}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick Tag Suggestion Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] text-gray-500 font-semibold px-1 flex-shrink-0">
            Suggested:
          </span>
          {QUICK_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => handleInputChange(tag)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                inputValue.toLowerCase() === tag.toLowerCase()
                  ? 'bg-[var(--accent-primary)] text-white font-semibold'
                  : 'bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/5'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {!query ? (
        <div className="py-16 sm:py-24 text-center glass-panel rounded-3xl border border-white/10 p-6 sm:p-10 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 flex items-center justify-center text-[var(--accent-primary)] mx-auto shadow-xl">
            <Search className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Search WaveMusic
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 max-w-sm mx-auto">
              Find your favourite Tamil cinema anthems, soulful melodies, and composer collections across high-fidelity audio.
            </p>
          </div>
        </div>
      ) : !hasResults ? (
        <div className="py-16 text-center glass-panel rounded-3xl border border-white/10 p-8 space-y-3">
          <p className="text-base sm:text-lg font-semibold text-white">
            No results found for &quot;{inputValue}&quot;
          </p>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            Please check your spelling or try searching for another track name, artist, composer, or album.
          </p>
          <button
            onClick={handleClear}
            className="mt-2 px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-xs text-[var(--accent-primary)] font-semibold transition-colors"
          >
            Clear Search
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Top Result + Matching Songs Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {results.topResult && (
              <div className="lg:col-span-1 space-y-3">
                <h2 className="text-base sm:text-lg font-bold text-white">Top Result</h2>
                <div
                  onClick={() => playTrack(results.topResult!, results.tracks)}
                  className="glass-card group p-5 rounded-2xl border border-white/10 cursor-pointer flex flex-col justify-between h-56 relative overflow-hidden"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={resolveArtworkUrl(results.topResult)}
                      alt={results.topResult.title}
                      className="w-20 h-20 rounded-xl object-cover shadow-xl flex-shrink-0 bg-neutral-900 group-hover:scale-105 transition-transform"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] font-bold">
                        SONG
                      </span>
                      <h3 className="text-base sm:text-lg font-bold text-white truncate mt-1 group-hover:text-[var(--accent-primary)] transition-colors">
                        {results.topResult.title}
                      </h3>
                      <p className="text-xs text-gray-400 truncate mt-0.5">
                        {results.topResult.artist}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <span className="text-xs text-gray-400 truncate max-w-[180px]">
                      {results.topResult.album}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        playTrack(results.topResult!, results.tracks);
                      }}
                      className="w-10 h-10 rounded-full bg-[var(--accent-primary)] text-white flex items-center justify-center shadow-[0_0_16px_var(--accent-glow)] group-hover:scale-110 active:scale-95 transition-transform"
                    >
                      <Play className="w-4 h-4 fill-white ml-0.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Songs Matching Search */}
            <div className={`space-y-3 ${results.topResult ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-bold text-white">Songs</h2>
                <span className="text-xs text-gray-400 font-mono">
                  {results.tracks.length} {results.tracks.length === 1 ? 'song' : 'songs'}
                </span>
              </div>

              <div className="glass-panel rounded-2xl border border-white/10 p-1.5 sm:p-2 divide-y divide-white/5">
                {results.tracks.slice(0, 6).map((track, idx) => (
                  <TrackRow
                    key={track.id}
                    track={track}
                    index={idx}
                    contextQueue={results.tracks}
                    onOpenPlaylistModal={onOpenPlaylistModal}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Matching Albums */}
          {results.albums.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Disc3 className="w-5 h-5 text-[var(--accent-primary)]" />
                <h2 className="text-lg font-bold text-white">Albums</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {results.albums.map((album) => (
                  <AlbumCard key={album.id} album={album} />
                ))}
              </div>
            </div>
          )}

          {/* Matching Artists */}
          {results.artists.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[var(--accent-primary)]" />
                <h2 className="text-lg font-bold text-white">Artists</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {results.artists.map((artist) => (
                  <ArtistCard key={artist.id} artist={artist} />
                ))}
              </div>
            </div>
          )}

          {/* Matching Playlists */}
          {results.playlists.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <ListMusic className="w-5 h-5 text-[var(--accent-primary)]" />
                <h2 className="text-lg font-bold text-white">Playlists</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {results.playlists.map((playlist) => (
                  <PlaylistCard key={playlist.id} playlist={playlist} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
