import React from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Heart, Play, Shuffle } from 'lucide-react';
import { useAudio } from '@/context/AudioContext';
import { getTracksByIds } from '@/services/musicService';
import { TrackRow } from '@/components/common/TrackRow';
import { Track } from '@/types/music';

export const FavouritesPage: React.FC = () => {
  const navigate = useNavigate();
  const { favourites, playTrack } = useAudio();
  const { onOpenPlaylistModal } = useOutletContext<{ onOpenPlaylistModal: (track: Track) => void }>();

  const likedTracks = getTracksByIds(favourites);

  const handlePlayAll = () => {
    if (likedTracks.length > 0) {
      playTrack(likedTracks[0], likedTracks);
    }
  };

  const handleShuffleAll = () => {
    if (likedTracks.length > 0) {
      const shuffled = [...likedTracks].sort(() => Math.random() - 0.5);
      playTrack(shuffled[0], shuffled);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[var(--accent-primary)] mb-1">
            <Heart className="w-5 h-5 fill-current" />
            <span className="text-xs font-bold uppercase tracking-widest">Saved Tracks</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Favourites</h1>
          <p className="text-sm text-gray-400 mt-1">
            Your personal collection of liked tracks ({likedTracks.length})
          </p>
        </div>

        {likedTracks.length > 0 && (
          <div className="flex items-center gap-2.5">
            <button
              onClick={handlePlayAll}
              className="px-5 py-2.5 rounded-full bg-[var(--accent-primary)] hover:brightness-110 active:scale-95 text-white font-semibold text-xs flex items-center gap-2 shadow-lg transition-all"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Play All</span>
            </button>
            <button
              onClick={handleShuffleAll}
              className="px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/15 active:scale-95 text-white font-semibold text-xs flex items-center gap-2 transition-all"
            >
              <Shuffle className="w-4 h-4" />
              <span>Shuffle</span>
            </button>
          </div>
        )}
      </div>

      {likedTracks.length === 0 ? (
        <div className="py-24 text-center glass-panel rounded-2xl border border-white/10 p-8 space-y-4">
          <div className="w-16 h-16 rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] flex items-center justify-center mx-auto">
            <Heart className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">No favourite tracks yet</h2>
          <p className="text-sm text-gray-400 max-w-sm mx-auto">
            Tap the heart icon next to any song while streaming to save it to your favourites list.
          </p>
          <button
            onClick={() => navigate('/songs')}
            className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors"
          >
            Explore Songs
          </button>
        </div>
      ) : (
        <div className="glass-panel p-2 rounded-2xl border border-white/10 divide-y divide-white/5">
          {likedTracks.map((track, idx) => (
            <TrackRow
              key={track.id}
              track={track}
              index={idx}
              contextQueue={likedTracks}
              onOpenPlaylistModal={onOpenPlaylistModal}
            />
          ))}
        </div>
      )}
    </div>
  );
};
