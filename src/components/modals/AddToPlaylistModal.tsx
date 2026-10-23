import React from 'react';
import { X, Check, Plus, Music2 } from 'lucide-react';
import { Track } from '@/types/music';
import { useAudio } from '@/context/AudioContext';

interface AddToPlaylistModalProps {
  track: Track | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenCreatePlaylist: () => void;
}

export const AddToPlaylistModal: React.FC<AddToPlaylistModalProps> = ({
  track,
  isOpen,
  onClose,
  onOpenCreatePlaylist,
}) => {
  const { userPlaylists, addTrackToPlaylist, removeTrackFromPlaylist } = useAudio();

  if (!isOpen || !track) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="relative w-full max-w-sm bg-[#161620] border border-white/10 rounded-2xl shadow-2xl p-6 text-white animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-base font-bold mb-1">Add to Playlist</h3>
        <p className="text-xs text-gray-400 truncate mb-4">
          Select playlists for &quot;{track.title}&quot;
        </p>

        <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
          {userPlaylists.length === 0 ? (
            <div className="py-6 text-center text-xs text-gray-400">
              <p>No user playlists yet.</p>
            </div>
          ) : (
            userPlaylists.map((playlist) => {
              const inPlaylist = playlist.trackIds.includes(track.id);
              return (
                <button
                  key={playlist.id}
                  onClick={() => {
                    if (inPlaylist) {
                      removeTrackFromPlaylist(playlist.id, track.id);
                    } else {
                      addTrackToPlaylist(playlist.id, track.id);
                    }
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center text-gray-400 flex-shrink-0">
                      <Music2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate text-white">
                        {playlist.name}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        {playlist.trackIds.length} tracks
                      </p>
                    </div>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                      inPlaylist
                        ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)] text-white'
                        : 'border-white/20 text-transparent'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
          <button
            onClick={() => {
              onClose();
              onOpenCreatePlaylist();
            }}
            className="flex items-center gap-1.5 text-xs font-semibold text-[var(--accent-primary)] hover:underline"
          >
            <Plus className="w-4 h-4" />
            New Playlist
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
