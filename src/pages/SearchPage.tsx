import React, { useMemo } from 'react';
import { useSearchParams, useOutletContext } from 'react-router-dom';
import { Search, Play } from 'lucide-react';
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

export const SearchPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = (searchParams.get('q') || '').trim();
  const { playTrack } = useAudio();
  const { onOpenPlaylistModal } = useOutletContext<{ onOpenPlaylistModal: (track: Track) => void }>();

  const allTracks = getAllTracks();
  const allAlbums = getAllAlbums();
  const allArtists = getAllArtists();
  const allPlaylists = getCuratedPlaylists();

  const results = useMemo(() => {
    if (!query) {
      return { tracks: [], albums: [], artists: [], playlists: [], topResult: null };
    }
    const q = query.toLowerCase();

    const tracks = allTracks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        t.album.toLowerCase().includes(q) ||
        t.genre.toLowerCase().includes(q)
    );

    const albums = allAlbums.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.artist.toLowerCase().includes(q) ||
        a.genre.toLowerCase().includes(q)
    );

    const artists = allArtists.filter(
      (ar) =>
        ar.name.toLowerCase().includes(q) ||
        ar.genre.toLowerCase().includes(q)
    );

    const playlists = allPlaylists.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );

    // Top result calculation
    let topResult: Track | null = tracks.length > 0 ? tracks[0] : null;

    return { tracks, albums, artists, playlists, topResult };
  }, [allTracks, allAlbums, allArtists, allPlaylists, query]);

  if (!query) {
    return (
      <div className="py-24 text-center glass-panel rounded-2xl border border-white/10 p-8 space-y-4 animate-in fade-in duration-300">
        <Search className="w-16 h-16 mx-auto text-gray-600 animate-pulse" />
        <h2 className="text-xl font-bold text-white">Search WaveMusic</h2>
        <p className="text-sm text-gray-400 max-w-sm mx-auto">
          Type in the top search bar to find tracks, albums, performers, and playlists across your Cloudflare R2 library.
        </p>
      </div>
    );
  }

  const hasResults =
    results.tracks.length > 0 ||
    results.albums.length > 0 ||
    results.artists.length > 0 ||
    results.playlists.length > 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-[var(--accent-primary)] mb-1">
          Search Results
        </p>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Results for &quot;{query}&quot;
        </h1>
      </div>

      {!hasResults ? (
        <div className="py-20 text-center glass-panel rounded-2xl border border-white/10 p-8 space-y-3">
          <p className="text-lg font-semibold text-white">No results found for &quot;{query}&quot;</p>
          <p className="text-xs text-gray-400">
            Please check your spelling or try searching for another song title, artist, or album.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Top Result + Top Matching Songs Split */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {results.topResult && (
              <div className="lg:col-span-1 space-y-3">
                <h2 className="text-lg font-bold text-white">Top Result</h2>
                <div
                  onClick={() => playTrack(results.topResult!, results.tracks)}
                  className="glass-card group p-5 rounded-2xl border border-white/10 cursor-pointer flex flex-col justify-between h-56 relative overflow-hidden"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={resolveArtworkUrl(results.topResult)}
                      alt={results.topResult.title}
                      className="w-20 h-20 rounded-xl object-cover shadow-xl flex-shrink-0 bg-neutral-900"
                    />
                    <div className="min-w-0">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] font-bold">
                        SONG
                      </span>
                      <h3 className="text-lg font-bold text-white truncate mt-1 group-hover:text-[var(--accent-primary)] transition-colors">
                        {results.topResult.title}
                      </h3>
                      <p className="text-xs text-gray-400 truncate">{results.topResult.artist}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <span className="text-xs text-gray-400">{results.topResult.album}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        playTrack(results.topResult!, results.tracks);
                      }}
                      className="w-10 h-10 rounded-full bg-[var(--accent-primary)] text-white flex items-center justify-center shadow-lg group-hover:scale-110 active:scale-95 transition-transform"
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
                <h2 className="text-lg font-bold text-white">Matching Songs</h2>
                <span className="text-xs text-gray-500 font-mono">
                  {results.tracks.length} found
                </span>
              </div>

              <div className="space-y-1">
                {results.tracks.slice(0, 5).map((track, idx) => (
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

          {/* Artists Matching Search */}
          {results.artists.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-white">Artists</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {results.artists.map((artist) => (
                  <ArtistCard key={artist.id} artist={artist} />
                ))}
              </div>
            </section>
          )}

          {/* Albums Matching Search */}
          {results.albums.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-white">Albums</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {results.albums.map((album) => (
                  <AlbumCard key={album.id} album={album} />
                ))}
              </div>
            </section>
          )}

          {/* Playlists Matching Search */}
          {results.playlists.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-white">Playlists</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {results.playlists.map((playlist) => (
                  <PlaylistCard key={playlist.id} playlist={playlist} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};
