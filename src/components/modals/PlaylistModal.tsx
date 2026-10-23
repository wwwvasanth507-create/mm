import React, { useState } from 'react';
import { X, FolderPlus } from 'lucide-react';
import { useAudio } from '@/context/AudioContext';

interface PlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialName?: string;
  initialDescription?: string;
  playlistId?: string; // If editing an existing playlist
}

export const PlaylistModal: React.FC<PlaylistModalProps> = ({
  isOpen,
  onClose,
  initialName = '',
  initialDescription = '',
  playlistId,
}) => {
  const { createPlaylist, updatePlaylist } = useAudio();
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a playlist name.');
      return;
    }

    if (playlistId) {
      updatePlaylist(playlistId, {
        name: name.trim(),
        description: description.trim(),
      });
    } else {
      createPlaylist(name.trim(), description.trim());
    }

    setName('');
    setDescription('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-[#161620] border border-white/10 rounded-2xl shadow-2xl p-6 text-white animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[var(--accent-primary)]/15 border border-[var(--accent-primary)]/30 flex items-center justify-center text-[var(--accent-primary)]">
            <FolderPlus className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold">
              {playlistId ? 'Edit Playlist' : 'Create New Playlist'}
            </h3>
            <p className="text-xs text-gray-400">
              Save your favourite tracks into custom playlists
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Playlist Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              placeholder="e.g. Midnight Chill, Coding Grooves"
              autoFocus
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/15 focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] outline-none text-sm text-white placeholder-gray-500 transition-colors"
            />
            {error && <p className="text-xs text-rose-400 mt-1.5">{error}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Give your playlist a vibe or theme..."
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/15 focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] outline-none text-sm text-white placeholder-gray-500 transition-colors resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-[var(--accent-primary)] hover:brightness-110 active:scale-95 text-white shadow-lg transition-all"
            >
              {playlistId ? 'Save Changes' : 'Create Playlist'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
