export type RepeatMode = 'off' | 'all' | 'one';

export type ThemeAccent = 'coral' | 'purple' | 'cyan' | 'amber';

export interface LyricsLine {
  time: number; // in seconds
  text: string;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  genre: string;
  year: number;
  duration: number; // in seconds
  audioUrl: string; // Direct HTTPS URL from any host
  thumbnailUrl: string; // Cover image URL
  description?: string;
  language?: string; // e.g. "Tamil", "English", "Instrumental"
  isExplicit?: boolean;
  lyrics?: LyricsLine[] | string;

  // Optional convenience / legacy aliases
  artworkUrl?: string; // Fallback alias for thumbnailUrl
  releaseDate?: string;
  bitrate?: string;
  format?: string;
  isDemo?: boolean;
  plays?: number;
}

export type Song = Track;

export interface Album {
  id: string;
  title: string;
  artist: string;
  artworkUrl: string;
  releaseYear: number;
  genre: string;
  trackCount: number;
  trackIds: string[];
  description?: string;
}

export interface Artist {
  id: string;
  name: string;
  avatarUrl: string;
  bannerUrl: string;
  genre: string;
  monthlyListeners: string;
  bio: string;
  topTrackIds: string[];
  albumIds: string[];
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  coverUrl?: string;
  trackIds: string[];
  isUserCreated?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface PlaybackHistoryItem {
  track: Track;
  playedAt: number; // timestamp ms
}

export type AudioPresetId =
  | 'dolby-atmos'
  | 'apple-lossless'
  | 'bass-boost'
  | 'vocal-pure'
  | 'concert-hall'
  | 'flat'
  | 'custom';

export interface EqualizerSettings {
  subBass: number; // 60 Hz (-12 to +12 dB)
  bassPunch: number; // 150 Hz (-12 to +12 dB)
  mid: number; // 1000 Hz (-12 to +12 dB)
  vocal: number; // 3200 Hz (-12 to +12 dB)
  treble: number; // 10000 Hz (-12 to +12 dB)
  spatialWidth: number; // 0.0 to 1.0 (Dolby 3D spatial surround width)
}

export interface AudioContextType {
  // Playback state
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isBuffering: boolean;
  repeatMode: RepeatMode;
  shuffle: boolean;
  playbackRate: number;
  error: string | null;

  // Dolby Atmos & Studio Audio DSP
  isDolbyEnabled: boolean;
  audioPreset: AudioPresetId;
  eqSettings: EqualizerSettings;
  setAudioPreset: (preset: AudioPresetId) => void;
  toggleDolby: () => void;
  setEqBand: (band: keyof EqualizerSettings, value: number) => void;
  resetEq: () => void;
  getFrequencyData: () => Uint8Array | null;

  // Queue
  queue: Track[];
  queueIndex: number;

  // Actions
  playTrack: (track: Track, newQueue?: Track[]) => void;
  togglePlay: () => void;
  pause: () => void;
  resume: () => void;
  nextTrack: () => void;
  previousTrack: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeatMode: () => void;
  setPlaybackRate: (rate: number) => void;

  // Queue manipulation
  addToQueue: (track: Track) => void;
  addNextInQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  reorderQueue: (startIndex: number, endIndex: number) => void;

  // User Library & History
  favourites: string[];
  toggleFavourite: (trackId: string) => void;
  isFavourite: (trackId: string) => boolean;
  history: PlaybackHistoryItem[];
  clearHistory: () => void;

  // Playlists
  userPlaylists: Playlist[];
  createPlaylist: (name: string, description?: string) => Playlist;
  updatePlaylist: (id: string, updates: Partial<Playlist>) => void;
  deletePlaylist: (id: string) => void;
  addTrackToPlaylist: (playlistId: string, trackId: string) => void;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;

  // 24/7 Unlimited Non-Stop Mode (No Sleep, Continuous Autoplay)
  is24HourNonStop: boolean;
  toggle24HourNonStop: () => void;

  // Diagnostics & Config
  activeAccent: ThemeAccent;
  setActiveAccent: (accent: ThemeAccent) => void;
}
