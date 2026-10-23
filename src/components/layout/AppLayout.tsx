import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Home,
  Compass,
  Music,
  Disc3,
  Users,
  ListMusic,
  Heart,
  History,
  Settings,
  Search,
  Plus,
  Radio,
  Keyboard,
} from 'lucide-react';
import { useAudio } from '@/context/AudioContext';
import { AUDIO_CONFIG } from '@/config/audio';
import { Track } from '@/types/music';
import { PlayerBar } from '@/components/player/PlayerBar';
import { QueueDrawer } from '@/components/player/QueueDrawer';
import { NowPlayingModal } from '@/components/player/NowPlayingModal';
import { PlaylistModal } from '@/components/modals/PlaylistModal';
import { AddToPlaylistModal } from '@/components/modals/AddToPlaylistModal';
import { ShortcutsModal } from '@/components/modals/ShortcutsModal';

export const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const { userPlaylists, activeAccent, setActiveAccent } = useAudio();

  const [searchQuery, setSearchQuery] = useState('');
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isNowPlayingOpen, setIsNowPlayingOpen] = useState(false);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [addToPlaylistTrack, setAddToPlaylistTrack] = useState<Track | null>(null);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
      isActive
        ? 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] font-semibold shadow-sm'
        : 'text-gray-400 hover:text-white hover:bg-white/5'
    }`;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0a0a0c] text-white">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 h-full bg-[#101015] border-r border-white/5 flex-shrink-0 select-none">
        {/* Brand Header */}
        <div className="p-5 flex items-center justify-between border-b border-white/5">
          <NavLink to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[var(--accent-primary)] to-purple-600 flex items-center justify-center shadow-[0_0_16px_var(--accent-glow)] group-hover:scale-105 transition-transform">
              <Radio className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-white block">
                {AUDIO_CONFIG.siteName}
              </span>
              <span className="text-[10px] text-gray-400 font-mono tracking-wider uppercase block">
                Direct Stream
              </span>
            </div>
          </NavLink>
        </div>

        {/* Scrollable Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {/* Main Discover Menu */}
          <div>
            <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2">
              Discover
            </p>
            <nav className="space-y-1">
              <NavLink to="/" className={navLinkClass}>
                <Home className="w-4 h-4" />
                <span>Home</span>
              </NavLink>
              <NavLink to="/browse" className={navLinkClass}>
                <Compass className="w-4 h-4" />
                <span>Browse</span>
              </NavLink>
              <NavLink to="/songs" className={navLinkClass}>
                <Music className="w-4 h-4" />
                <span>Songs</span>
              </NavLink>
              <NavLink to="/albums" className={navLinkClass}>
                <Disc3 className="w-4 h-4" />
                <span>Albums</span>
              </NavLink>
              <NavLink to="/artists" className={navLinkClass}>
                <Users className="w-4 h-4" />
                <span>Artists</span>
              </NavLink>
            </nav>
          </div>

          {/* Library Section */}
          <div>
            <div className="flex items-center justify-between px-3 mb-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                My Library
              </p>
              <button
                onClick={() => setIsPlaylistModalOpen(true)}
                className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Create New Playlist"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            <nav className="space-y-1">
              <NavLink to="/playlists" className={navLinkClass}>
                <ListMusic className="w-4 h-4" />
                <span>Playlists</span>
              </NavLink>
              <NavLink to="/favourites" className={navLinkClass}>
                <Heart className="w-4 h-4" />
                <span>Favourites</span>
              </NavLink>
              <NavLink to="/recently-played" className={navLinkClass}>
                <History className="w-4 h-4" />
                <span>Recently Played</span>
              </NavLink>
            </nav>

            {/* Custom User Playlists Quick Links */}
            {userPlaylists.length > 0 && (
              <div className="mt-3 pt-2 border-t border-white/5 space-y-0.5">
                {userPlaylists.slice(0, 5).map((pl) => (
                  <NavLink
                    key={pl.id}
                    to={`/playlist/${pl.id}`}
                    className={({ isActive }) =>
                      `block px-3.5 py-1.5 text-xs truncate rounded-lg transition-colors ${
                        isActive
                          ? 'text-[var(--accent-primary)] font-semibold bg-white/5'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`
                    }
                  >
                    {pl.name}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Status & Settings */}
        <div className="p-4 border-t border-white/5 space-y-2">
          <NavLink
            to="/songs"
            className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-colors group"
          >
            <div className="flex items-center gap-2">
              <Music className="w-4 h-4 text-[var(--accent-primary)]" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">Manual Music Catalog</p>
                <p className="text-[10px] text-gray-400">src/data/music.json</p>
              </div>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono font-semibold">
              Ready
            </span>
          </NavLink>

          <NavLink to="/settings" className={navLinkClass}>
            <Settings className="w-4 h-4" />
            <span>Settings & Diagnostics</span>
          </NavLink>
        </div>
      </aside>

      {/* Main App Content Viewport */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
        {/* Top Header Bar */}
        <header className="h-16 px-4 md:px-8 border-b border-white/5 bg-[#0a0a0c]/80 backdrop-blur-xl flex items-center justify-between gap-4 z-20">
          {/* Search Bar Form */}
          <form
            onSubmit={handleSearchSubmit}
            className="relative flex-1 max-w-md"
          >
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search songs, artists, albums, or genres..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 focus:border-[var(--accent-primary)] focus:bg-white/10 focus:ring-1 focus:ring-[var(--accent-primary)] outline-none text-xs md:text-sm text-white placeholder-gray-500 transition-all"
            />
          </form>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2">
            {/* Theme Accent Quick Selector */}
            <div className="hidden sm:flex items-center gap-1.5 p-1 rounded-xl bg-white/5 border border-white/5">
              {(['coral', 'purple', 'cyan', 'amber'] as const).map((accent) => (
                <button
                  key={accent}
                  onClick={() => setActiveAccent(accent)}
                  className={`w-4 h-4 rounded-full transition-transform ${
                    activeAccent === accent ? 'scale-125 ring-2 ring-white/60' : 'opacity-60 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor:
                      accent === 'coral'
                        ? '#fa2d48'
                        : accent === 'purple'
                        ? '#a855f7'
                        : accent === 'cyan'
                        ? '#06b6d4'
                        : '#f59e0b',
                  }}
                  title={`Switch theme: ${accent}`}
                />
              ))}
            </div>

            {/* Keyboard Shortcuts Trigger */}
            <button
              onClick={() => setIsShortcutsOpen(true)}
              className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Keyboard Shortcuts"
            >
              <Keyboard className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto px-4 md:px-8 py-6 pb-36 md:pb-32 focus:outline-none">
          <Outlet context={{ onOpenPlaylistModal: (track: Track) => setAddToPlaylistTrack(track) }} />
        </main>
      </div>

      {/* Mobile Bottom Navigation (Visible only on small screens) */}
      <nav className="md:hidden fixed bottom-16 left-0 right-0 z-30 bg-[#121217]/95 backdrop-blur-xl border-t border-white/10 px-2 py-1.5 flex items-center justify-around text-[10px]">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 py-1 px-3 rounded-lg ${
              isActive ? 'text-[var(--accent-primary)] font-bold' : 'text-gray-400'
            }`
          }
        >
          <Home className="w-4 h-4" />
          <span>Home</span>
        </NavLink>

        <NavLink
          to="/browse"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 py-1 px-3 rounded-lg ${
              isActive ? 'text-[var(--accent-primary)] font-bold' : 'text-gray-400'
            }`
          }
        >
          <Compass className="w-4 h-4" />
          <span>Browse</span>
        </NavLink>

        <NavLink
          to="/songs"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 py-1 px-3 rounded-lg ${
              isActive ? 'text-[var(--accent-primary)] font-bold' : 'text-gray-400'
            }`
          }
        >
          <Music className="w-4 h-4" />
          <span>Songs</span>
        </NavLink>

        <NavLink
          to="/playlists"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 py-1 px-3 rounded-lg ${
              isActive ? 'text-[var(--accent-primary)] font-bold' : 'text-gray-400'
            }`
          }
        >
          <ListMusic className="w-4 h-4" />
          <span>Library</span>
        </NavLink>

        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 py-1 px-3 rounded-lg ${
              isActive ? 'text-[var(--accent-primary)] font-bold' : 'text-gray-400'
            }`
          }
        >
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </NavLink>
      </nav>

      {/* Persistent Audio Player Bar */}
      <PlayerBar
        onOpenQueue={() => setIsQueueOpen(true)}
        onOpenNowPlaying={() => setIsNowPlayingOpen(true)}
      />

      {/* Queue Side Drawer */}
      <QueueDrawer
        isOpen={isQueueOpen}
        onClose={() => setIsQueueOpen(false)}
      />

      {/* Now Playing Full-Screen Overlay */}
      <NowPlayingModal
        isOpen={isNowPlayingOpen}
        onClose={() => setIsNowPlayingOpen(false)}
      />

      {/* Playlist Creation / Rename Modal */}
      <PlaylistModal
        isOpen={isPlaylistModalOpen}
        onClose={() => setIsPlaylistModalOpen(false)}
      />

      {/* Add Track to Playlist Modal */}
      <AddToPlaylistModal
        track={addToPlaylistTrack}
        isOpen={Boolean(addToPlaylistTrack)}
        onClose={() => setAddToPlaylistTrack(null)}
        onOpenCreatePlaylist={() => setIsPlaylistModalOpen(true)}
      />

      {/* Keyboard Shortcuts Reference Modal */}
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
};
