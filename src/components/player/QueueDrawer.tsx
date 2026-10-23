import React from 'react';
import { X, Trash2, ListMusic, Volume2 } from 'lucide-react';
import { useAudio } from '@/context/AudioContext';
import { resolveArtworkUrl } from '@/services/musicService';
import { formatTime } from '@/utils/formatters';

interface QueueDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QueueDrawer: React.FC<QueueDrawerProps> = ({ isOpen, onClose }) => {
  const {
    queue,
    queueIndex,
    currentTrack,
    isPlaying,
    playTrack,
    removeFromQueue,
    clearQueue,
  } = useAudio();

  if (!isOpen) return null;

  const totalDuration = queue.reduce((acc, t) => acc + (t.duration || 0), 0);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end">
      <div className="relative w-full max-w-md h-full bg-[#121217] border-l border-white/10 shadow-2xl flex flex-col text-white animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ListMusic className="w-5 h-5 text-[var(--accent-primary)]" />
            <h3 className="font-bold text-base">Play Queue</h3>
            <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-gray-400">
              {queue.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={clearQueue}
              className="p-1.5 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-white/5 transition-colors"
              title="Clear Queue"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Currently Playing Card */}
          {currentTrack && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                Now Playing
              </p>
              <div className="p-3 rounded-xl bg-white/10 border border-[var(--accent-primary)]/30 flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-neutral-800">
                  <img
                    src={resolveArtworkUrl(currentTrack)}
                    alt={currentTrack.title}
                    className="w-full h-full object-cover"
                  />
                  {isPlaying && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Volume2 className="w-5 h-5 text-[var(--accent-primary)] animate-pulse" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate text-[var(--accent-primary)]">
                    {currentTrack.title}
                  </p>
                  <p className="text-xs text-gray-300 truncate">{currentTrack.artist}</p>
                </div>
                <span className="text-xs text-gray-400 font-mono">
                  {formatTime(currentTrack.duration)}
                </span>
              </div>
            </div>
          )}

          {/* Up Next List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Up Next ({queue.length})
              </p>
              <span className="text-xs text-gray-500 font-mono">
                Total {formatTime(totalDuration)}
              </span>
            </div>

            {queue.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-8">Queue is empty</p>
            ) : (
              <div className="space-y-1">
                {queue.map((track, idx) => {
                  const isCurrent = idx === queueIndex;
                  return (
                    <div
                      key={`${track.id}-${idx}`}
                      onClick={() => playTrack(track, queue)}
                      className={`group flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-white/10 text-[var(--accent-primary)]'
                          : 'hover:bg-white/5 text-gray-300 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span className="text-xs text-gray-500 w-5 text-center">
                          {idx + 1}
                        </span>
                        <img
                          src={resolveArtworkUrl(track)}
                          alt={track.title}
                          className="w-9 h-9 rounded-md object-cover flex-shrink-0 bg-neutral-800"
                        />
                        <div className="min-w-0 flex-1 pr-2">
                          <p className="text-xs font-semibold truncate text-white">
                            {track.title}
                          </p>
                          <p className="text-[11px] text-gray-400 truncate">
                            {track.artist}
                          </p>
                        </div>
                      </div>

                      <div
                        className="flex items-center gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="text-xs text-gray-500 font-mono">
                          {formatTime(track.duration)}
                        </span>
                        <button
                          onClick={() => removeFromQueue(idx)}
                          className="p-1 rounded text-gray-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remove from queue"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
