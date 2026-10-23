import React from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { History, Trash2, Clock } from 'lucide-react';
import { useAudio } from '@/context/AudioContext';
import { TrackRow } from '@/components/common/TrackRow';
import { Track } from '@/types/music';

export const RecentlyPlayedPage: React.FC = () => {
  const navigate = useNavigate();
  const { history, clearHistory } = useAudio();
  const { onOpenPlaylistModal } = useOutletContext<{ onOpenPlaylistModal: (track: Track) => void }>();

  const historyTracks = history.map((h) => h.track);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[var(--accent-primary)] mb-1">
            <History className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-widest">Listening History</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Recently Played</h1>
          <p className="text-sm text-gray-400 mt-1">
            Tracks you have streamed recently across all sessions ({history.length})
          </p>
        </div>

        {history.length > 0 && (
          <button
            onClick={clearHistory}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-rose-500/15 border border-white/10 hover:border-rose-500/30 text-gray-300 hover:text-rose-400 text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="py-24 text-center glass-panel rounded-2xl border border-white/10 p-8 space-y-4">
          <div className="w-16 h-16 rounded-full bg-white/5 text-gray-400 flex items-center justify-center mx-auto">
            <Clock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">No listening history yet</h2>
          <p className="text-sm text-gray-400 max-w-sm mx-auto">
            Start playing any track from the library or featured albums, and your history will be recorded here automatically.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors"
          >
            Go to Home
          </button>
        </div>
      ) : (
        <div className="glass-panel p-2 rounded-2xl border border-white/10 divide-y divide-white/5">
          {history.map((item, idx) => (
            <div key={`${item.track.id}-${item.playedAt}`} className="flex items-center">
              <div className="flex-1 min-w-0">
                <TrackRow
                  track={item.track}
                  index={idx}
                  contextQueue={historyTracks}
                  onOpenPlaylistModal={onOpenPlaylistModal}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
