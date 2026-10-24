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
  Keyboard,
  Smartphone,
} from 'lucide-react';
import { useAudio } from '@/context/AudioContext';
import { Track } from '@/types/music';
import { PlayerBar } from '@/components/player/PlayerBar';
import { QueueDrawer } from '@/components/player/QueueDrawer';
import { NowPlayingModal } from '@/components/player/NowPlayingModal';
import { PlaylistModal } from '@/components/modals/PlaylistModal';
import { AddToPlaylistModal } from '@/components/modals/AddToPlaylistModal';
import { ShortcutsModal } from '@/components/modals/ShortcutsModal';
import { AddSongModal } from '@/components/modals/AddSongModal';
import { WaveMusicLogo } from '@/components/common/WaveMusicLogo';
import { PwaInstallModal } from '@/components/modals/PwaInstallModal';

export const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const { userPlaylists, activeAccent, setActiveAccent, currentTrack } = useAudio();

  const [searchQuery, setSearchQuery] = useState('');
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isNowPlayingOpen, setIsNowPlayingOpen] = useState(false);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [addToPlaylistTrack, setAddToPlaylistTrack] = useState<Track | null>(null);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isAddSongOpen, setIsAddSongOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

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

  const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center justify-center gap-1 py-1.5 px-3 rounded-xl transition-all ${
      isActive
        ? 'text-[var(--accent-primary)] font-bold scale-105'
        : 'text-gray-400 hover:text-gray-200'
    }`;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0a0a0c] text-white">
      {/* Desktop Sidebar (>= 768px) */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 h-full bg-[#101015] border-r border-white/5 flex-shrink-0 select-none">
        {/* Brand Header */}
        <div className="p-5 flex items-center justify-between border-b border-white/5">
          <NavLink to="/" className="flex items-center gap-3 group">
            <WaveMusicLogo size="md" />
          </NavLink>

          <button
            onClick={() => setIsAddSongOpen(true)}
            className="p-1.5 rounded-lg bg-[var(--accent-primary)]/20 hover:bg-[var(--accent-primary)]/30 text-[var(--accent-primary)] transition-colors"
            title="Add Song Manually"
          >
            <Plus className="w-4 h-4" />
          </button>
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
          <button
            onClick={() => setIsAddSongOpen(true)}
            className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[var(--accent-primary)]/10 hover:bg-[var(--accent-primary)]/20 border border-[var(--accent-primary)]/20 transition-colors group text-left"
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-[var(--accent-primary)]" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">Add Song Manually</p>
                <p className="text-[10px] text-gray-400">Stream any audio URL</p>
              </div>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] font-mono font-semibold">
              + New
            </span>
          </button>

          <NavLink to="/settings" className={navLinkClass}>
            <Settings className="w-4 h-4" />
            <span>Settings & Diagnostics</span>
          </NavLink>
        </div>
      </aside>

      {/* Main App Content Viewport */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative z-10">
        {/* Top Header Bar */}
        <header className="h-16 px-4 md:px-8 border-b border-white/5 bg-[#0a0a0c]/85 backdrop-blur-xl flex items-center justify-between gap-3 z-20">
          {/* Mobile Header: Logo & Title (visible on < md) */}
          <div className="md:hidden flex items-center gap-2">
            <NavLink to="/" className="flex items-center gap-2">
              <WaveMusicLogo size="sm" />
            </NavLink>
          </div>

          {/* Desktop Search Bar Form */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:block relative flex-1 max-w-md"
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

          {/* Header Actions */}
          <div className="flex items-center gap-2">
            {/* 24/7 Non-Stop Indicator */}
            <div
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold select-none"
              title="24/7 Non-Stop Continuous Mode Active (Screen Sleep Prevented)"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>24/7 NON-STOP</span>
            </div>

            {/* Install Native App / Get APK Button (Spotify/Apple Music lock screen player) */}
            <button
              onClick={() => setIsInstallModalOpen(true)}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 font-semibold text-xs flex items-center gap-1.5 active:scale-95 transition-all shadow-sm"
              title="Install Native App (Removes Chrome badge on Lock Screen)"
            >
              <Smartphone className="w-3.5 h-3.5 text-purple-400" />
              <span>Get App</span>
            </button>

            {/* Add Song Shortcut Button */}
            <button
              onClick={() => setIsAddSongOpen(true)}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-[var(--accent-primary)]/15 hover:bg-[var(--accent-primary)]/25 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 font-semibold text-xs flex items-center gap-1.5 active:scale-95 transition-all shadow-sm"
              title="Add Song Manually"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add Song</span>
            </button>

            {/* Theme Accent Quick Selector */}
            <div className="flex items-center gap-1 sm:gap-1.5 p-1 rounded-xl bg-white/5 border border-white/5">
              {(['coral', 'purple', 'cyan', 'amber'] as const).map((accent) => (
                <button
                  key={accent}
                  onClick={() => setActiveAccent(accent)}
                  className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full transition-transform ${
                    activeAccent === accent ? 'scale-125 ring-2 ring-white/70' : 'opacity-40 hover:opacity-100'
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

            {/* Keyboard Shortcuts Trigger (Desktop only) */}
            <button
              onClick={() => setIsShortcutsOpen(true)}
              className="hidden md:flex p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Keyboard Shortcuts"
            >
              <Keyboard className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Scrollable Page Body with Dynamic Mobile Safe Area Padding */}
        <main
          className={`flex-1 overflow-y-auto px-4 md:px-8 py-6 focus:outline-none transition-all duration-300 ${
            currentTrack ? 'pb-44 md:pb-32' : 'pb-24 md:pb-12'
          }`}
        >
          <Outlet
            context={{
              onOpenPlaylistModal: (track: Track) => setAddToPlaylistTrack(track),
              onOpenAddSongModal: () => setIsAddSongOpen(true),
            }}
          />
        </main>
      </div>

      {/* ============================================================== */}
      {/* MOBILE BOTTOM NAVIGATION BAR (Screens < 768px)                 */}
      {/* Docked cleanly at bottom-0 with safe-area home indicator       */}
      {/* ============================================================== */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#101016]/95 backdrop-blur-2xl border-t border-white/10 px-2 pt-1.5 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] flex items-center justify-around text-[10px] select-none">
        <NavLink to="/" className={mobileNavLinkClass}>
          <Home className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>Home</span>
        </NavLink>

        <NavLink to="/search" className={mobileNavLinkClass}>
          <Search className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>Search</span>
        </NavLink>

        <NavLink to="/songs" className={mobileNavLinkClass}>
          <Music className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>Songs</span>
        </NavLink>

        <NavLink to="/playlists" className={mobileNavLinkClass}>
          <ListMusic className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>Library</span>
        </NavLink>

        <NavLink to="/settings" className={mobileNavLinkClass}>
          <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>Settings</span>
        </NavLink>
      </nav>

      {/* Persistent Audio Player Bar (Mobile mini + Desktop) */}
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

      {/* Add Song Manually Modal */}
      <AddSongModal
        isOpen={isAddSongOpen}
        onClose={() => setIsAddSongOpen(false)}
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

      {/* PWA WebAPK & Native App Modal */}
      <PwaInstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />
    </div>
  );
};
