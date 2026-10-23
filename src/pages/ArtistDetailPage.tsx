import React from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { Play, Shuffle, ArrowLeft, Users } from 'lucide-react';
import {
  getArtistById,
  getTracksByIds,
  getAllAlbums,
  resolveArtworkUrl,
} from '@/services/musicService';
import { TrackRow } from '@/components/common/TrackRow';
import { AlbumCard } from '@/components/common/AlbumCard';
import { useAudio } from '@/context/AudioContext';
import { Track } from '@/types/music';

export const ArtistDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { playTrack } = useAudio();
  const { onOpenPlaylistModal } = useOutletContext<{ onOpenPlaylistModal: (track: Track) => void }>();

  const artist = id ? getArtistById(id) : undefined;

  if (!artist) {
    return (
      <div className="py-24 text-center text-white space-y-4">
        <Users className="w-16 h-16 mx-auto text-gray-600 animate-pulse" />
        <h2 className="text-2xl font-bold">Artist Not Found</h2>
        <p className="text-sm text-gray-400">The requested artist profile does not exist.</p>
        <button
          onClick={() => navigate('/artists')}
          className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors"
        >
          Back to Artists
        </button>
      </div>
    );
  }

  const topTracks = getTracksByIds(artist.topTrackIds);
  const artistAlbums = getAllAlbums().filter((a) => artist.albumIds.includes(a.id));
  const avatar = resolveArtworkUrl(artist);

  const handlePlayTopSongs = () => {
    if (topTracks.length > 0) {
      playTrack(topTracks[0], topTracks);
    }
  };

  const handleShuffleTopSongs = () => {
    if (topTracks.length > 0) {
      const shuffled = [...topTracks].sort(() => Math.random() - 0.5);
      playTrack(shuffled[0], shuffled);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <button
        onClick={() => navigate('/artists')}
        className="inline-flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Artists</span>
      </button>

      {/* Artist Hero Header with dynamic banner */}
      <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-neutral-900">
        <div className="absolute inset-0 z-0">
          <img
            src={artist.bannerUrl || avatar}
            alt=""
            className="w-full h-full object-cover blur-md opacity-40 saturate-150"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-black/50 to-transparent" />
        </div>

        <div className="relative z-10 p-6 sm:p-8 md:p-10 flex flex-col sm:flex-row items-center sm:items-end gap-6 text-center sm:text-left">
          <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden shadow-2xl border-2 border-white/20 flex-shrink-0 bg-neutral-900">
            <img
              src={avatar}
              alt={artist.name}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="space-y-2 flex-1">
            <span className="text-xs font-bold uppercase tracking-widest text-[var(--accent-primary)] font-mono">
              VERIFIED ARTIST
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
              {artist.name}
            </h1>
            <p className="text-xs text-gray-300">
              <span className="text-white font-semibold">{artist.monthlyListeners}</span> monthly listeners • {artist.genre}
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-3">
              <button
                onClick={handlePlayTopSongs}
                disabled={topTracks.length === 0}
                className="px-6 py-2.5 rounded-full bg-[var(--accent-primary)] hover:brightness-110 active:scale-95 text-white font-bold text-xs flex items-center gap-2 shadow-lg disabled:opacity-50 transition-all"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Play Top Songs</span>
              </button>

              <button
                onClick={handleShuffleTopSongs}
                disabled={topTracks.length === 0}
                className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/15 active:scale-95 text-white font-semibold text-xs flex items-center gap-2 transition-all disabled:opacity-50"
              >
                <Shuffle className="w-4 h-4" />
                <span>Shuffle</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Artist Bio */}
      {artist.bio && (
        <section className="glass-panel p-5 rounded-2xl border border-white/10">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-2">
            About {artist.name}
          </h2>
          <p className="text-sm text-gray-300 leading-relaxed max-w-3xl">{artist.bio}</p>
        </section>
      )}

      {/* Top Songs */}
      <section className="space-y-2">
        <h2 className="text-lg font-bold text-white mb-3">Popular Tracks</h2>
        <div className="space-y-1">
          {topTracks.map((track, idx) => (
            <TrackRow
              key={track.id}
              track={track}
              index={idx}
              contextQueue={topTracks}
              onOpenPlaylistModal={onOpenPlaylistModal}
            />
          ))}
        </div>
      </section>

      {/* Discography / Albums */}
      {artistAlbums.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">Discography</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {artistAlbums.map((album) => (
              <AlbumCard key={album.id} album={album} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
