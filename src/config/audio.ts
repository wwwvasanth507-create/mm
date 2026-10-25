/**
 * Central Audio Streaming Configuration
 *
 * NOTE:
 * - Songs and audio URLs are dynamically loaded from remote/local manifest.
 * - Default remote catalogue points to GitHub raw repository:
 *   https://raw.githubusercontent.com/wwwvasanth507-create/mm/main/src/data/music.json
 * - Song updates in the remote manifest appear automatically in the app WITHOUT rebuilding!
 */

export interface AudioConfig {
  siteName: string;
  preload: 'auto' | 'metadata' | 'none';
  defaultVolume: number;
  supportedFormats: readonly string[];
  maxHistoryItems: number;
  defaultCatalogueUrl: string;
}

export const AUDIO_CONFIG: AudioConfig = {
  // Website Brand Name (configurable via VITE_SITE_NAME or default)
  siteName: (import.meta.env.VITE_SITE_NAME as string) || 'WaveMusic Premium',

  // Stream progressively with metadata preloaded (never download entire audio file upfront)
  preload: 'metadata',

  // Default initial volume (0.0 to 1.0)
  defaultVolume: 0.85,

  // Recognized audio file extensions and containers
  supportedFormats: ['mp3', 'm4a', 'aac', 'flac', 'wav', 'ogg'] as const,

  // Maximum recently played tracks to remember in localStorage
  maxHistoryItems: 50,

  // Default remote catalogue manifest URL on GitHub
  defaultCatalogueUrl: 'https://raw.githubusercontent.com/wwwvasanth507-create/mm/main/src/data/music.json',
};

/**
 * Storage keys for persisting library state locally
 */
export const STORAGE_KEYS = {
  USER_TRACKS: 'wavemusic_user_tracks_v1',
  CACHED_CATALOGUE: 'wavemusic_cached_catalogue_v1',
  CATALOGUE_URL: 'wavemusic_catalogue_url_v1',
  CATALOGUE_ETAG: 'wavemusic_catalogue_etag_v1',
  CATALOGUE_LAST_SYNC: 'wavemusic_catalogue_last_sync_v1',
  CATALOGUE_VERSION: 'wavemusic_catalogue_version_v1',
  HIDDEN_TRACK_IDS: 'wavemusic_hidden_track_ids_v1',
  DOWNLOADED_TRACKS_META: 'wavemusic_downloaded_tracks_meta_v1',
  WIFI_ONLY_DOWNLOAD: 'wavemusic_wifi_only_download_v1',
  FAVOURITES: 'wavemusic_favourites_v1',
  PLAYLISTS: 'wavemusic_playlists_v1',
  HISTORY: 'wavemusic_history_v1',
  VOLUME: 'wavemusic_volume_v1',
  MUTED: 'wavemusic_muted_v1',
  REPEAT: 'wavemusic_repeat_v1',
  SHUFFLE: 'wavemusic_shuffle_v1',
  THEME_ACCENT: 'wavemusic_accent_v1',
  DOLBY_ENABLED: 'wavemusic_dolby_v1',
  AUDIO_PRESET: 'wavemusic_audio_preset_v1',
  EQ_SETTINGS: 'wavemusic_eq_settings_v1',
  NON_STOP_24H: 'wavemusic_non_stop_24h_v1',
};

import { AudioPresetId, EqualizerSettings } from '@/types/music';

export const AUDIO_PRESETS: Record<
  AudioPresetId,
  { name: string; description: string; settings: EqualizerSettings }
> = {
  'dolby-atmos': {
    name: 'Dolby Atmos Spatial 3D',
    description: 'Immersive 3D surround soundstage with cinema depth & vocal separation',
    settings: {
      subBass: 4.5,
      bassPunch: 3.0,
      mid: 0.5,
      vocal: 4.0,
      treble: 4.5,
      spatialWidth: 0.85,
    },
  },
  'apple-lossless': {
    name: 'Apple Lossless Hi-Fi',
    description: 'Studio mastering curve with crystal clear voice & sparkling air',
    settings: {
      subBass: 3.5,
      bassPunch: 2.0,
      mid: 0.8,
      vocal: 5.0,
      treble: 5.5,
      spatialWidth: 0.55,
    },
  },
  'bass-boost': {
    name: 'Deep Bass & Sub-Woofer',
    description: 'Massive sub-bass resonance and punchy kick for dance and power tracks',
    settings: {
      subBass: 8.5,
      bassPunch: 5.5,
      mid: -0.5,
      vocal: 2.0,
      treble: 3.0,
      spatialWidth: 0.4,
    },
  },
  'vocal-pure': {
    name: 'Pure Vocal Clarity',
    description: 'Intimate breath and vocal presence separation without harshness',
    settings: {
      subBass: 1.5,
      bassPunch: 0.5,
      mid: 2.5,
      vocal: 7.0,
      treble: 4.5,
      spatialWidth: 0.35,
    },
  },
  'concert-hall': {
    name: 'Live Concert Surround',
    description: 'Expansive stadium acoustic field with wide dynamic stage',
    settings: {
      subBass: 5.0,
      bassPunch: 3.5,
      mid: 1.0,
      vocal: 3.5,
      treble: 5.0,
      spatialWidth: 1.0,
    },
  },
  'flat': {
    name: 'Studio Reference (Flat)',
    description: 'Uncolored raw studio reference monitor tuning',
    settings: {
      subBass: 0,
      bassPunch: 0,
      mid: 0,
      vocal: 0,
      treble: 0,
      spatialWidth: 0,
    },
  },
  'custom': {
    name: 'Custom User EQ',
    description: 'Personalized equalizer and spatial width settings',
    settings: {
      subBass: 4.0,
      bassPunch: 2.5,
      mid: 0.5,
      vocal: 4.0,
      treble: 4.0,
      spatialWidth: 0.75,
    },
  },
};

/**
 * Validates whether a given string is a valid HTTPS or HTTP URL
 */
export function isValidUrl(url?: string): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' || url.startsWith('data:') || url.startsWith('/') || url.startsWith('blob:');
  } catch {
    return false;
  }
}
