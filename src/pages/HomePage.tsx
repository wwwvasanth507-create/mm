import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  Play,
  Shuffle,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Disc3,
  ListMusic,
  Users,
  Plus,
} from 'lucide-react';
import { useAudio } from '@/context/AudioContext';
import {
  getAllTracks,
  getAllAlbums,
  getAllArtists,
  getCuratedPlaylists,
  resolveArtworkUrl,
} from '@/services/musicService';
import { TrackRow } from '@/components/common/TrackRow';
import { AlbumCard } from '@/components/common/AlbumCard';
import { PlaylistCard } from '@/components/common/PlaylistCard';
import { ArtistCard } from '@/components/common/ArtistCard';
import { Track } from '@/types/music';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { playTrack, currentTrack, isPlaying } = useAudio();
  const { onOpenPlaylistModal, onOpenAddSongModal } = useOutletContext<{
    onOpenPlaylistModal: (track: Track) => void;
    onOpenAddSongModal?: () => void;
  }>();

  const [allTracks, setAllTracks] = useState(() => getAllTracks());
  const [allAlbums, setAllAlbums] = useState(() => getAllAlbums());
  const [allArtists, setAllArtists] = useState(() => getAllArtists());
  const playlists = getCuratedPlaylists();

  useEffect(() => {
    const handleUpdate = () => {
      setAllTracks(getAllTracks());
      setAllAlbums(getAllAlbums());
      setAllArtists(getAllArtists());
    };
    window.addEventListener('wavemusic_tracks_updated', handleUpdate);
    return () => window.removeEventListener('wavemusic_tracks_updated', handleUpdate);
  }, []);

  // Featured Hero Track
  const featuredTrack = allTracks[0];

  const handlePlayHero = () => {
    if (featuredTrack) {
      playTrack(featuredTrack, allTracks);
    }
  };

  const handleShuffleAll = () => {
    if (allTracks.length > 0) {
      const shuffled = [...allTracks].sort(() => Math.random() - 0.5);
      playTrack(shuffled[0], shuffled);
    }
  };

  if (allTracks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 sm:p-8 space-y-6 animate-in fade-in duration-300">
        <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[var(--accent-primary)] shadow-2xl">
          <Disc3 className="w-10 h-10 animate-spin" style={{ animationDuration: '6s' }} />
        </div>
        <div className="max-w-md space-y-3">
          <h2 className="text-2xl font-bold text-white tracking-tight">Your Music Library is Ready</h2>
          <p className="text-sm text-gray-400 leading-relaxed">
            All demo songs have been cleared. Add songs via <code className="px-2 py-0.5 rounded bg-white/10 font-mono text-xs text-[var(--accent-primary)]">src/data/music.json</code> or add them directly using the button below:
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => onOpenAddSongModal?.()}
              className="px-6 py-2.5 rounded-full bg-[var(--accent-primary)] hover:brightness-110 active:scale-95 text-white font-bold text-xs inline-flex items-center gap-2 shadow-[0_0_20px_var(--accent-glow)] transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Song Manually</span>
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-white font-semibold text-xs transition-colors"
            >
              Settings & Guide
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-300">
      {/* Hero Featured Banner (Apple Music Style) */}
      {featuredTrack && (
        <section className="relative w-full rounded-3xl overflow-hidden shadow-2xl border border-white/10 group">
          {/* Dynamic Background Backdrop */}
          <div className="absolute inset-0 z-0">
            <img
              src={resolveArtworkUrl(featuredTrack)}
              alt=""
              className="w-full h-full object-cover blur-2xl scale-110 opacity-40 saturate-150 transform transition-transform duration-1000 group-hover:scale-125"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0d0d12] via-[#0d0d12]/80 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-transparent to-transparent" />
          </div>

          {/* Hero Content */}
          <div className="relative z-10 p-6 sm:p-8 md:p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div className="max-w-xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-semibold backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                <span className="text-gray-200">Featured Track</span>
                <span className="w-1 h-1 rounded-full bg-gray-400" />
                <span className="text-[var(--accent-primary)] font-mono">{featuredTrack.language || 'Music'}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
                {featuredTrack.title}
              </h1>

              <p className="text-gray-300 text-sm sm:text-base font-medium line-clamp-2">
                By <span className="text-white font-semibold">{featuredTrack.artist}</span> • From the album{' '}
                <span className="text-white font-semibold">{featuredTrack.album}</span>
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={handlePlayHero}
                  className="px-6 py-3 rounded-full bg-[var(--accent-primary)] hover:brightness-110 active:scale-95 text-white font-bold text-sm shadow-[0_0_24px_var(--accent-glow)] flex items-center gap-2.5 transition-all"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>{currentTrack?.id === featuredTrack.id && isPlaying ? 'Playing' : 'Listen Now'}</span>
                </button>

                <button
                  onClick={handleShuffleAll}
                  className="px-5 py-3 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white font-semibold text-sm backdrop-blur-md flex items-center gap-2 transition-all"
                >
                  <Shuffle className="w-4 h-4" />
                  <span>Shuffle All</span>
                </button>
              </div>
            </div>

            {/* Hero Artwork Box */}
            <div className="hidden sm:block relative w-44 h-44 md:w-56 md:h-56 rounded-2xl overflow-hidden shadow-2xl flex-shrink-0 border border-white/20">
              <img
                src={resolveArtworkUrl(featuredTrack)}
                alt={featuredTrack.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-3 right-3 px-2 py-0.5 rounded bg-black/60 backdrop-blur-md text-[10px] font-mono text-emerald-400 border border-white/10">
                {featuredTrack.year || '2025'}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Feature Highlight Callout Card */}
      <section className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[var(--accent-primary)]/15 border border-[var(--accent-primary)]/30 flex items-center justify-center text-[var(--accent-primary)] flex-shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Direct Audio URL Streaming Engine
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Add your songs directly to <code className="text-gray-300">src/data/music.json</code> with direct HTTPS URLs from any server or storage provider.
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/songs')}
          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors flex-shrink-0"
        >
          <span>Browse All Songs</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </section>

      {/* Trending & Quick Picks Tracks */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <TrendingUp className="w-5 h-5 text-[var(--accent-primary)]" />
            <h2 className="text-xl font-bold tracking-tight text-white">Trending Tracks</h2>
          </div>
          <button
            onClick={() => navigate('/songs')}
            className="text-xs font-semibold text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
          >
            <span>See all ({allTracks.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {allTracks.slice(0, 6).map((track, idx) => (
            <TrackRow
              key={track.id}
              track={track}
              index={idx}
              contextQueue={allTracks}
              onOpenPlaylistModal={onOpenPlaylistModal}
            />
          ))}
        </div>
      </section>

      {/* Featured Albums */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <Disc3 className="w-5 h-5 text-[var(--accent-primary)]" />
            <h2 className="text-xl font-bold tracking-tight text-white">Featured Albums</h2>
          </div>
          <button
            onClick={() => navigate('/albums')}
            className="text-xs font-semibold text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
          >
            <span>See all</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {allAlbums.map((album) => (
            <AlbumCard key={album.id} album={album} />
          ))}
        </div>
      </section>

      {/* Curated Playlists */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <ListMusic className="w-5 h-5 text-[var(--accent-primary)]" />
            <h2 className="text-xl font-bold tracking-tight text-white">Curated Playlists</h2>
          </div>
          <button
            onClick={() => navigate('/playlists')}
            className="text-xs font-semibold text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
          >
            <span>Explore all</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {playlists.map((playlist) => (
            <PlaylistCard key={playlist.id} playlist={playlist} />
          ))}
        </div>
      </section>

      {/* Featured Artists */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-[var(--accent-primary)]" />
            <h2 className="text-xl font-bold tracking-tight text-white">Featured Artists</h2>
          </div>
          <button
            onClick={() => navigate('/artists')}
            className="text-xs font-semibold text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
          >
            <span>See all</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {allArtists.map((artist) => (
            <ArtistCard key={artist.id} artist={artist} />
          ))}
        </div>
      </section>
    </div>
  );
};
